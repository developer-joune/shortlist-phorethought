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

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

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
    // secure:true requires HTTPS -- off for local http://localhost dev,
    // must be turned on before this ever runs in production.
    secure: false,
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

// Serves index.html at "/" and the other static prototype/reference pages
// directly. Deliberately NOT a single express.static(__dirname) -- that
// would also serve prisma/dev.db (now holding real bcrypt hashes), .env,
// server.js, and node_modules over plain HTTP. Explicitly allowlisting the
// same top-level paths index.html already links to, nothing more.
const PUBLIC_DIRS = ['assets', 'design', 'engine', 'fixtures', 'legal', 'marketing', 'operator', 'reports', 'resume', 'schemas'];
PUBLIC_DIRS.forEach((dir) => {
  app.use(`/${dir}`, express.static(path.join(__dirname, dir)));
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
  console.log(`Shortlist backend listening on http://localhost:${PORT}`);
});
