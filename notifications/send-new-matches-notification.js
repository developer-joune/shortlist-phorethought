'use strict';

// Standalone sender -- not wired to any automatic/scheduled trigger yet
// (deliberately, per the task: "don't wire up a scheduled/automatic
// trigger yet, that's a separate decision"). Call manually:
//
//   node notifications/send-new-matches-notification.js <clientId>
//
// Reads SMTP creds from .env (SMTP_HOST/PORT/USER/PASS/FROM) -- never
// hardcoded, per the task's explicit instruction not to guess them.

require('dotenv').config();
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const { newMatchesEmail } = require('./email-templates');

const prisma = new PrismaClient();
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3001';

function buildTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'Missing SMTP credentials -- set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env (see .env.example).'
    );
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendNewMatchesNotification(clientId) {
  const client = await prisma.client.findUnique({
    where: { clientId },
    include: { applications: true },
  });

  if (!client) {
    throw new Error(`No client with clientId "${clientId}".`);
  }

  // Same "internally-rejected jobs never reach the client" rule as the
  // feed page (design/feed-prototype-v1.html) -- the notification count
  // has to match what the client will actually see when they log in.
  const matchCount = client.applications.filter((a) => a.band !== 'reject').length;
  const firstName = client.name.split(' ')[0];
  const email = newMatchesEmail({
    firstName,
    matchCount,
    loginUrl: `${APP_BASE_URL}/login`,
  });

  const transport = buildTransport();
  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: client.email,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  return { messageId: info.messageId, to: client.email, matchCount };
}

async function main() {
  const clientId = process.argv[2];
  if (!clientId) {
    console.error('Usage: node notifications/send-new-matches-notification.js <clientId>');
    process.exitCode = 1;
    return;
  }

  const result = await sendNewMatchesNotification(clientId);
  console.log(`Sent to ${result.to} (${result.matchCount} match(es)). Message ID: ${result.messageId}`);
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('Failed to send notification:', err.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { sendNewMatchesNotification };
