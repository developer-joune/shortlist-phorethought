'use strict';

// Shortlist backend — Express API over the Prisma/SQLite database seeded
// from prisma/seed.js. Serves pre-computed qualification-gate results to
// the client feed and operator review queue; never re-runs scoring logic
// itself (see prisma/seed.js for why).

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// GET /api/clients -- every client, with latest application status and
// average qualification score (across applications that were actually
// scored -- hard-gate rejects have no score to average in).
app.get('/api/clients', async (req, res) => {
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

// GET /api/clients/:id -- one client, looked up by the business clientId
// (e.g. "maria-torres-2026", matching client-profile.schema.json's
// client_id -- not Prisma's internal cuid), with full application history
// including job details and the stored qualification result.
app.get('/api/clients/:id', async (req, res) => {
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

    res.json({
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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load client.' });
  }
});

// GET /api/applications -- borderline applications only, for the operator
// review queue (operator/index.html). Oldest-flagged-first, matching the
// sort order already confirmed for that screen
// (design/operator-review-wireframe-v1.md).
app.get('/api/applications', async (req, res) => {
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

app.get('/', (req, res) => {
  res.json({ service: 'Shortlist backend', endpoints: ['/api/clients', '/api/clients/:id', '/api/applications'] });
});

app.listen(PORT, () => {
  console.log(`Shortlist backend listening on http://localhost:${PORT}`);
});
