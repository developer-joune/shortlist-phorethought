'use strict';

// Shortlist backend — Express API over the Prisma/SQLite database seeded
// from prisma/seed.js. Serves pre-computed qualification-gate results to
// the client feed and operator review queue; never re-runs scoring logic
// itself (see prisma/seed.js for why).
//
// Also serves the static prototype pages directly (express.static) so the
// whole app — API, session cookies, and the HTML/JS pages that consume it —
// runs on one origin/port. That's what makes the notification email's login
// link (notifications/email-templates.js) resolve to something real instead
// of a separate ad-hoc static server.

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const { scoreApplication } = require('./engine/qualification-gate');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Required for cookie.secure: 'auto' (below) to work correctly behind the
// Cloudflare tunnel: the tunnel terminates TLS at Cloudflare's edge and
// proxies to this process over plain HTTP, so without trusting the proxy,
// Express would see every request as HTTP and never set the Secure flag,
// even on the public HTTPS domain.
app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(session({
  // MemoryStore (express-session's default) is fine for this local-dev
  // prototype -- sessions reset on server restart, no persistent store
  // wired up yet. Swap for a real store (e.g. connect-pg-simple once on
  // Postgres/RDS) before this runs anywhere long-lived.
  secret: process.env.SESSION_SECRET || 'dev-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // 'auto' (not a hardcoded true/false): express-session checks
    // req.secure at set-time, which -- combined with trust proxy above --
    // correctly resolves to true over the HTTPS tunnel and false over
    // plain http://localhost, without branching on NODE_ENV ourselves.
    secure: 'auto',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

// Per subcon_legal's consult on the client-login credential work: bcrypt
// protects the stored hash but does nothing against someone hammering the
// login endpoint -- basic throttling is cheap insurance, not full
// account-lockout/backoff, but enough to blunt naive brute-forcing.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

function requireOperator(req, res, next) {
  if (!req.session.operatorId) {
    return res.status(401).json({ error: 'Not signed in.' });
  }
  next();
}

function requireClient(req, res, next) {
  if (!req.session.clientId) {
    return res.status(401).json({ error: 'Not signed in.' });
  }
  next();
}

// ---- Operator auth ----

app.post('/api/auth/operator/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const operator = await prisma.operator.findUnique({ where: { email } });
    const matches = operator && (await bcrypt.compare(password, operator.passwordHash));
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Session resolves to the DB id, never carries email forward as a
    // shadow identifier, per subcon_dataschema's review.
    req.session.operatorId = operator.id;
    res.json({ ok: true, email: operator.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.post('/api/auth/operator/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/operator/session', async (req, res) => {
  if (!req.session.operatorId) return res.json({ authenticated: false });
  const operator = await prisma.operator.findUnique({ where: { id: req.session.operatorId } });
  if (!operator) return res.json({ authenticated: false });
  res.json({ authenticated: true, email: operator.email });
});

// ---- Client auth ----

app.post('/api/auth/client/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const client = await prisma.client.findUnique({ where: { email } });
    const matches = client && client.passwordHash && (await bcrypt.compare(password, client.passwordHash));
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Session resolves to clientId (the business identifier used
    // everywhere else -- skills/work_history/application-tracking), never
    // email, per subcon_dataschema's review.
    req.session.clientId = client.clientId;
    res.json({ ok: true, name: client.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.post('/api/auth/client/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/client/session', async (req, res) => {
  if (!req.session.clientId) return res.json({ authenticated: false });
  const client = await prisma.client.findUnique({ where: { clientId: req.session.clientId } });
  if (!client) return res.json({ authenticated: false });
  res.json({ authenticated: true, name: client.name, clientId: client.clientId });
});

// Same throttling reasoning as loginRateLimiter -- this is a public,
// unauthenticated endpoint that runs real computation (the qualification
// engine, once per stored job posting), so it needs its own limit
// independent of the login endpoints.
const previewRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many preview requests. Try again later.' },
});

// POST /api/preview -- the "tier zero" ephemeral engine run (onboarding-flow
// consult, design/onboarding-flow-alternatives-v1.md's reconciled tier-zero
// shape). Public, no login wall, nothing persisted to the database -- runs
// the real qualification engine against the real stored job postings using
// a trimmed intake, and returns the results directly in the response.
//
// The trimmed intake deliberately omits screening_answers (deferred to a
// real signup, per the reconciliation) but does collect one field the
// consult doc didn't call out explicitly: "years of experience". Without
// it, computeTotalYears() reads an empty work_history as 0 years, which
// would hard-gate-reject almost every visitor on hard gate 8 regardless of
// real skill fit -- not a hypothetical, this was caught by actually reading
// engine/qualification-gate.js before building against it, not assumed.
app.post('/api/preview', previewRateLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const skills = Array.isArray(body.skills) ? body.skills : [];
    if (skills.length === 0) {
      return res.status(400).json({ error: 'At least one skill is required.' });
    }

    const yearsExperience = Number(body.yearsExperience) || 0;
    const now = new Date();
    const startDate = new Date(now.getTime());
    startDate.setFullYear(startDate.getFullYear() - Math.max(0, yearsExperience));

    const previewProfile = {
      basics: {
        target_job_titles: Array.isArray(body.targetJobTitles) ? body.targetJobTitles : [],
        target_locations: body.city || body.remoteOk
          ? [{ city: body.city || undefined, region: body.region || undefined, remote_ok: body.remoteOk || 'no_preference' }]
          : [],
        salary_floor: body.salaryFloor ? { min: Number(body.salaryFloor), currency: 'USD', period: 'year' } : undefined,
      },
      // Without this, scoreSeniorityFit() can't compare and falls back to a
      // full-max neutral score (15/15) for every preview call regardless of
      // actual fit -- an artificially HIGH score, not a conservative one.
      // Caught by subcon_qualgate's review: collecting this one real field
      // is the fix, not adjusting the engine's fallback (that's a separate,
      // broader question left to them). Left undefined (not 'unspecified',
      // a real enum value with its own ordinal position) if the visitor
      // skips the field, so the existing neutral-fallback path is an
      // honest "we don't know," not a mislabeled comparison.
      qualification_bar: body.targetSeniority ? { target_seniority: body.targetSeniority } : undefined,
      skills: skills
        .filter((s) => s && s.skill_id)
        .map((s) => ({ skill_id: s.skill_id, years_experience: Number(s.years_experience) || 0 })),
      work_history: yearsExperience > 0 ? [{ start_date: startDate.toISOString().slice(0, 10), end_date: 'present' }] : [],
      // screening_answers deliberately omitted -- deferred to a real
      // signup, per the reconciled tier-zero design. The engine's
      // screening-compatibility component degrades gracefully (partial
      // credit, not a hard fail) when this is empty.
      screening_answers: [],
      exclusions: {
        excluded_companies: [],
        excluded_industries: Array.isArray(body.excludedIndustries) ? body.excludedIndustries : [],
        required_remote_policy: body.remoteOk || 'no_preference',
        dealbreakers: body.noWeekends ? [{ category: 'weekend_or_oncall_work', detail: 'Not available for weekend or on-call rotations.' }] : [],
      },
    };

    const jobPostings = await prisma.jobPosting.findMany();
    const results = jobPostings.map((row) => {
      const posting = JSON.parse(row.posting);
      const result = scoreApplication(previewProfile, posting);
      return {
        jobTitle: posting.title,
        companyName: posting.company.name,
        band: result.band,
        totalScore: result.total_score,
        reason: result.reason.pass_reason || result.reason.reject_reason,
        location: posting.location,
        salary: posting.salary,
      };
    });

    const realMatches = results
      .filter((r) => r.band !== 'reject')
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);

    res.json({ matches: realMatches, totalPostingsEvaluated: results.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to run preview.' });
  }
});

// GET /api/clients -- every client, with latest application status and
// average qualification score (across applications that were actually
// scored -- hard-gate rejects have no score to average in). Operator-only.
app.get('/api/clients', requireOperator, async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { applications: { orderBy: { createdAt: 'desc' } } },
    });

    const result = clients.map((client) => {
      const scored = client.applications.filter((a) => a.totalScore != null);
      const averageScore = scored.length
        ? Math.round((scored.reduce((sum, a) => sum + a.totalScore, 0) / scored.length) * 10) / 10
        : null;
      const latest = client.applications[0] || null;

      return {
        clientId: client.clientId,
        name: client.name,
        email: client.email,
        status: client.status,
        applicationCount: client.applications.length,
        averageScore,
        latestApplicationStatus: latest ? latest.status : null,
        latestApplicationBand: latest ? latest.band : null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load clients.' });
  }
});

function serializeClientDetail(client) {
  return {
    clientId: client.clientId,
    name: client.name,
    email: client.email,
    status: client.status,
    profile: JSON.parse(client.profile),
    applications: client.applications.map((a) => ({
      trackingId: a.trackingId,
      status: a.status,
      band: a.band,
      totalScore: a.totalScore,
      passReason: a.passReason,
      rejectReason: a.rejectReason,
      resumeVersionUsed: a.resumeVersionUsed,
      dateApplied: a.dateApplied,
      // Frozen at match time -- may differ from jobPosting.title/companyName/
      // sourceUrl below if the posting was later re-scraped and edited.
      jobTitleSnapshot: a.jobTitleSnapshot,
      companySnapshot: a.companySnapshot,
      applyLinkSnapshot: a.applyLinkSnapshot,
      portalAccount: a.portalAccount ? JSON.parse(a.portalAccount) : null,
      screeningAnswersUsed: a.screeningAnswersUsed ? JSON.parse(a.screeningAnswersUsed) : null,
      operatorNotes: a.operatorNotes,
      statusHistory: JSON.parse(a.statusHistory),
      fullResult: JSON.parse(a.fullResult),
      jobPosting: {
        jobId: a.jobPosting.jobId,
        title: a.jobPosting.title,
        companyName: a.jobPosting.companyName,
        posting: JSON.parse(a.jobPosting.posting),
      },
    })),
  };
}

// GET /api/clients/:id -- one client, looked up by the business clientId
// (e.g. "maria-torres-2026", matching client-profile.schema.json's
// client_id -- not Prisma's internal cuid), with full application history
// including job details and the stored qualification result. Operator-only.
app.get('/api/clients/:id', requireOperator, async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { clientId: req.params.id },
      include: {
        applications: {
          orderBy: { createdAt: 'desc' },
          include: { jobPosting: true },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: `No client with clientId "${req.params.id}".` });
    }

    res.json(serializeClientDetail(client));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load client.' });
  }
});

// GET /api/me -- the logged-in client's own data, derived entirely from the
// session (never from a client-suppliable clientId param) -- this is what
// design/feed-prototype-v1.html uses now instead of a hardcoded/URL clientId.
app.get('/api/me', requireClient, async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { clientId: req.session.clientId },
      include: {
        applications: {
          orderBy: { createdAt: 'desc' },
          include: { jobPosting: true },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    res.json(serializeClientDetail(client));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load your data.' });
  }
});

// GET /api/applications -- borderline applications only, for the operator
// review queue. Oldest-flagged-first. Operator-only.
app.get('/api/applications', requireOperator, async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { band: 'borderline' },
      orderBy: { createdAt: 'asc' },
      include: { client: true, jobPosting: true },
    });

    res.json(applications.map((a) => ({
      trackingId: a.trackingId,
      status: a.status,
      totalScore: a.totalScore,
      client: { clientId: a.client.clientId, name: a.client.name },
      // Snapshot at match time -- what the operator queue should show, per
      // application-tracking.schema.json's own reasoning for these fields.
      jobTitleSnapshot: a.jobTitleSnapshot,
      companySnapshot: a.companySnapshot,
      applyLinkSnapshot: a.applyLinkSnapshot,
      fullResult: JSON.parse(a.fullResult),
      createdAt: a.createdAt,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load applications.' });
  }
});

// POST /api/applications/:trackingId/decision -- resolves a borderline
// application into qualified or rejected. Implements
// application-tracking.schema.json's borderline_resolution shape exactly
// (operator_decision/operator_reason/decided_at/decided_by/score_snapshot),
// per subcon_qualgate's rubric v1 sec8: operator_reason is unconditionally
// required for both outcomes, not just the ones that deviate from a
// default -- a borderline band has no default to override.
app.post('/api/applications/:trackingId/decision', requireOperator, async (req, res) => {
  try {
    const { decision, reason } = req.body || {};
    if (decision !== 'promote' && decision !== 'reject') {
      return res.status(400).json({ error: 'decision must be "promote" or "reject".' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'reason is required.' });
    }

    const application = await prisma.application.findUnique({ where: { trackingId: req.params.trackingId } });
    if (!application) {
      return res.status(404).json({ error: `No application with trackingId "${req.params.trackingId}".` });
    }
    if (application.band !== 'borderline') {
      return res.status(400).json({ error: `Application is band "${application.band}", not "borderline" -- nothing to resolve.` });
    }

    const operator = await prisma.operator.findUnique({ where: { id: req.session.operatorId } });
    const now = new Date().toISOString();
    const fullResult = JSON.parse(application.fullResult);

    const newBand = decision === 'promote' ? 'qualified' : 'reject';
    const newStatus = decision === 'promote' ? 'gated_pass' : 'gated_fail';

    fullResult.band = newBand;
    fullResult.borderline_resolution = {
      operator_decision: decision === 'promote' ? 'promoted_qualified' : 'confirmed_reject',
      operator_reason: reason.trim(),
      decided_at: now,
      decided_by: operator ? operator.email : undefined,
      score_snapshot: {
        total_score: application.totalScore,
        sub_scores: fullResult.sub_scores,
      },
    };

    const statusHistory = JSON.parse(application.statusHistory);
    statusHistory.push({ status: newStatus, changed_at: now, note: `Operator ${decision}d this borderline application: ${reason.trim()}` });

    const updated = await prisma.application.update({
      where: { trackingId: req.params.trackingId },
      data: {
        band: newBand,
        status: newStatus,
        passReason: decision === 'promote' ? reason.trim() : null,
        rejectReason: decision === 'reject' ? reason.trim() : null,
        statusHistory: JSON.stringify(statusHistory),
        fullResult: JSON.stringify(fullResult),
      },
    });

    res.json({
      trackingId: updated.trackingId,
      band: updated.band,
      status: updated.status,
      borderline_resolution: fullResult.borderline_resolution,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record decision.' });
  }
});

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'design', 'login.html')));
app.get('/operator/login', (req, res) => res.sendFile(path.join(__dirname, 'operator', 'login.html')));

app.get('/api', (req, res) => {
  res.json({
    service: 'Shortlist backend',
    endpoints: [
      '/api/auth/operator/login', '/api/auth/operator/logout', '/api/auth/operator/session',
      '/api/auth/client/login', '/api/auth/client/logout', '/api/auth/client/session',
      '/api/clients', '/api/clients/:id', '/api/applications', '/api/me',
    ],
  });
});

// Serves the static prototype/reference pages directly. Deliberately NOT a
// single express.static(__dirname) -- that would also serve prisma/dev.db
// (now holding real bcrypt hashes), .env, server.js, and node_modules over
// plain HTTP. Explicitly allowlisting the same top-level paths the site
// actually links to, nothing more.
const PUBLIC_DIRS = ['assets', 'design', 'engine', 'fixtures', 'legal', 'marketing', 'operator', 'reports', 'resume', 'schemas'];
PUBLIC_DIRS.forEach((dir) => {
  app.use(`/${dir}`, express.static(path.join(__dirname, dir)));
});

// "/" serves the real marketing landing page -- the actual entry point a
// real visitor uses (marketing -> Get started -> login -> app) -- not the
// old internal build-overview page, which moved to /overview.html (still
// reachable, just no longer what a bare visit to the site loads).
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'marketing', 'index.html')));
app.get('/overview.html', (req, res) => res.sendFile(path.join(__dirname, 'overview.html')));

app.listen(PORT, () => {
  console.log(`Shortlist backend listening on http://localhost:${PORT}`);
});
