#!/usr/bin/env node
'use strict';

// Usage: node run-application.js <client-profile.json> <job-posting.json>
//
// Runs one (client, job) pair through the qualification gate, then -- if the
// job isn't hard-gate rejected -- tailors a resume and drafts screening
// answers. Prints the real output; nothing here is a stub.

const fs = require('fs');
const path = require('path');
const { scoreApplication } = require('./engine/qualification-gate');
const { tailorResume } = require('./engine/resume-tailoring');

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

function line(char = '=') {
  return char.repeat(72);
}

function main() {
  const [, , clientPath, jobPath] = process.argv;
  if (!clientPath || !jobPath) {
    console.error('Usage: node run-application.js <client-profile.json> <job-posting.json>');
    process.exit(1);
  }

  const clientProfile = loadJSON(clientPath);
  const jobPosting = loadJSON(jobPath);
  const qualification = scoreApplication(clientProfile, jobPosting);

  console.log(line());
  console.log('Shortlist — Qualification Gate Result');
  console.log(line());
  console.log(`Client:  ${clientProfile.basics.name}`);
  console.log(`Job:     ${jobPosting.title} — ${jobPosting.company.name}`);
  console.log(`Band:    ${qualification.band.toUpperCase()}`);
  if (qualification.total_score != null) console.log(`Score:   ${qualification.total_score} / 100`);
  console.log('');
  console.log('Hard gates:');
  for (const g of qualification.hard_gates) {
    console.log(`  [${g.passed ? 'PASS' : 'FAIL'}] (Family ${g.family}) ${g.gate_name}${g.detail ? ' — ' + g.detail : ''}`);
  }

  if (qualification.sub_scores.length) {
    console.log('');
    console.log('Sub-scores:');
    for (const s of qualification.sub_scores) {
      console.log(`  ${s.name.padEnd(24)} ${String(s.score).padStart(5)} / ${String(s.weight).padEnd(3)}  (${s.pct_of_max}%)`);
    }
  }

  console.log('');
  if (qualification.reason.pass_reason) console.log(`Pass reason:   ${qualification.reason.pass_reason}`);
  if (qualification.reason.reject_reason) console.log(`Reject reason: ${qualification.reason.reject_reason}`);

  if (qualification.band === 'reject') {
    console.log('');
    console.log('(Job was rejected -- no resume tailored.)');
    return;
  }

  const resume = tailorResume(clientProfile, jobPosting);

  console.log('');
  console.log(line());
  console.log('Tailored Resume');
  console.log(line());
  console.log(`${resume.header.name}`);
  console.log(`${resume.header.email} | ${resume.header.phone} | ${resume.header.location}`);
  for (const l of resume.header.links) console.log(`${l.label}: ${l.url}`);
  console.log('');
  console.log('SUMMARY');
  console.log(resume.summary);
  console.log('');
  console.log('SKILLS');
  console.log(`Core Match: ${resume.skills.top_3_matched_skills.join(', ')}`);
  console.log([...resume.skills.matched_skills_full, ...resume.skills.additional_skills].join(', '));
  console.log('');
  console.log('PROFESSIONAL EXPERIENCE');
  for (const role of resume.experience) {
    console.log(`${role.title} — ${role.company} (${role.start_date} to ${role.end_date})`);
    for (const b of role.bullets) {
      console.log(`  • [Tier ${b.tier}] ${b.text}`);
    }
    console.log('');
  }
  console.log('EDUCATION');
  for (const e of resume.education) {
    console.log(`${e.degree}, ${e.field_of_study} — ${e.institution}`);
  }

  console.log('');
  console.log(line());
  console.log('Drafted Screening Answers');
  console.log(line());
  for (const a of resume.screening_answers) {
    console.log(`Q: ${a.question_text}`);
    console.log(`A: ${a.answer_text || '[NEEDS OPERATOR INPUT -- no stored answer for this category]'}`);
    console.log('');
  }

  console.log(`Suggested filename: ${resume.file_name}`);
  if (qualification.band === 'borderline') {
    console.log('');
    console.log(`NOTE: this job is BORDERLINE (${qualification.total_score}/100, band cutoffs 55-74). Drafted for operator review, not auto-applied.`);
  }
}

main();
