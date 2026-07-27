'use strict';

// Seeds the local SQLite database from the real fixtures, running each
// (client, job) pair through the actual qualification engine -- not
// hand-typed scores. This is the same pattern run-application.js's CLI
// uses; the seed just persists the result instead of printing it, so the
// hard math (hard gates, weighted scoring, reason-string generation) runs
// once here and the API/UI never re-run it.

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { scoreApplication } = require('../engine/qualification-gate');

const prisma = new PrismaClient();
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

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

async function upsertClient(clientProfile) {
  return prisma.client.upsert({
    where: { clientId: clientProfile.client_id },
    update: {
      name: clientProfile.basics.name,
      email: clientProfile.basics.email,
      profile: JSON.stringify(clientProfile),
    },
    create: {
      clientId: clientProfile.client_id,
      name: clientProfile.basics.name,
      email: clientProfile.basics.email,
      profile: JSON.stringify(clientProfile),
    },
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

  const mariaRow = await upsertClient(maria);
  const meridianRow = await upsertJobPosting(meridianHealth);
  const northgateRow = await upsertJobPosting(northgateRetail);

  await seedApplication(maria, meridianHealth, mariaRow, meridianRow);
  await seedApplication(maria, northgateRetail, mariaRow, northgateRow);

  console.log('\nSeed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
