'use strict';

// Seeds the local SQLite database from the real fixtures, running each
// (client, job) pair through the actual qualification engine -- not
// hand-typed scores. This is the same pattern run-application.js's CLI
// uses; the seed just persists the result instead of printing it, so the
// hard math (hard gates, weighted scoring, reason-string generation) runs
// once here and the API/UI never re-run it.

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { scoreApplication } = require('../engine/qualification-gate');

const prisma = new PrismaClient();
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

// Local-dev bootstrap credentials -- not production secrets, just enough to
// log in and test the auth flow end to end. Override via env if wanted;
// printed to the console below so nothing here is silently hidden.
const DEV_OPERATOR_EMAIL = process.env.SEED_OPERATOR_EMAIL || 'operator@shortlist.dev';
const DEV_OPERATOR_PASSWORD = process.env.SEED_OPERATOR_PASSWORD || 'operator-dev-pass';
const DEV_CLIENT_PASSWORD = process.env.SEED_CLIENT_PASSWORD || 'maria-dev-pass';

function loadFixture(file) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8'));
}

// Initial application-tracking.schema.json status per band -- matches the
// enum operator/index.html and operator/review.html already render against.
function initialStatusFor(band) {
  if (band === 'qualified') return 'gated_pass';
  if (band === 'borderline') return 'borderline_review';
  return 'gated_fail';
}

async function upsertClient(clientProfile, passwordHash) {
  return prisma.client.upsert({
    where: { clientId: clientProfile.client_id },
    update: {
      name: clientProfile.basics.name,
      email: clientProfile.basics.email,
      status: clientProfile.status,
      profile: JSON.stringify(clientProfile),
      passwordHash,
    },
    create: {
      clientId: clientProfile.client_id,
      name: clientProfile.basics.name,
      email: clientProfile.basics.email,
      status: clientProfile.status,
      profile: JSON.stringify(clientProfile),
      passwordHash,
    },
  });
}

async function upsertOperator(email, passwordHash) {
  return prisma.operator.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
}

async function upsertJobPosting(jobPosting) {
  return prisma.jobPosting.upsert({
    where: { jobId: jobPosting.job_id },
    update: {
      title: jobPosting.title,
      companyName: jobPosting.company.name,
      posting: JSON.stringify(jobPosting),
    },
    create: {
      jobId: jobPosting.job_id,
      title: jobPosting.title,
      companyName: jobPosting.company.name,
      posting: JSON.stringify(jobPosting),
    },
  });
}

async function seedApplication(clientProfile, jobPosting, clientRow, jobRow) {
  const result = scoreApplication(clientProfile, jobPosting);
  const trackingId = `${clientProfile.client_id}__${jobPosting.job_id}`;
  const now = new Date().toISOString();
  const status = initialStatusFor(result.band);

  const data = {
    clientId: clientRow.id,
    jobPostingId: jobRow.id,
    // Frozen at creation from the job posting as evaluated -- never
    // re-derived from the live JobPosting relation afterward (see
    // prisma/schema.prisma's comment on these three fields).
    jobTitleSnapshot: jobPosting.title,
    companySnapshot: jobPosting.company.name,
    applyLinkSnapshot: jobPosting.source_url,
    totalScore: result.total_score,
    band: result.band,
    passReason: result.reason.pass_reason,
    rejectReason: result.reason.reject_reason,
    status,
    statusHistory: JSON.stringify([{ status, changed_at: now, note: 'Seeded from qualification gate run.' }]),
    fullResult: JSON.stringify(result),
  };

  const application = await prisma.application.upsert({
    where: { trackingId },
    update: data,
    create: { trackingId, ...data },
  });

  console.log(`  ${clientProfile.basics.name} x ${jobPosting.title} @ ${jobPosting.company.name} -> ${result.band}${result.total_score != null ? ` (${result.total_score}/100)` : ''}`);
  return application;
}

async function main() {
  console.log('Seeding from fixtures, scoring each pair through the real engine...\n');

  const maria = loadFixture('client-profile-maria.json');
  const meridianHealth = loadFixture('job-posting-meridian-health.json');
  const northgateRetail = loadFixture('job-posting-northgate-retail.json');

  const [operatorPasswordHash, clientPasswordHash] = await Promise.all([
    bcrypt.hash(DEV_OPERATOR_PASSWORD, 10),
    bcrypt.hash(DEV_CLIENT_PASSWORD, 10),
  ]);

  const mariaRow = await upsertClient(maria, clientPasswordHash);
  const meridianRow = await upsertJobPosting(meridianHealth);
  const northgateRow = await upsertJobPosting(northgateRetail);
  await upsertOperator(DEV_OPERATOR_EMAIL, operatorPasswordHash);

  await seedApplication(maria, meridianHealth, mariaRow, meridianRow);
  await seedApplication(maria, northgateRetail, mariaRow, northgateRow);

  console.log('\nSeed complete.');
  console.log('\nDev login credentials (local only -- not production secrets):');
  console.log(`  Operator: ${DEV_OPERATOR_EMAIL} / ${DEV_OPERATOR_PASSWORD}`);
  console.log(`  Client:   ${maria.basics.email} / ${DEV_CLIENT_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
