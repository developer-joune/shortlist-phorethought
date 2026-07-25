'use strict';

const fs = require('fs');
const path = require('path');

const SCHEMAS_DIR = path.join(__dirname, '..', 'schemas');

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, file), 'utf8'));
}

const taxonomy = loadJSON('skills-taxonomy.json');
const sharedDefs = loadJSON('shared-defs.schema.json');

const skillById = new Map(taxonomy.skills.map((s) => [s.skill_id, s]));

function getSkillMeta(skillId) {
  return skillById.get(skillId) || null;
}

function displayNameFor(skillId, fallback) {
  const meta = getSkillMeta(skillId);
  return (meta && meta.display_name) || fallback || skillId;
}

function categoryFor(skillId) {
  const meta = getSkillMeta(skillId);
  return meta ? meta.category : null;
}

const SENIORITY_ORDER = sharedDefs.$defs.seniorityLevel.enum;

function seniorityOrdinal(level) {
  const idx = SENIORITY_ORDER.indexOf(level);
  return idx === -1 ? null : idx;
}

// Approximate total professional experience from the earliest work_history
// start_date to now. A resume-convention proxy, not exact -- client-profile
// has no standalone "total years" field to read directly.
function computeTotalYears(workHistory, asOfDate = new Date()) {
  if (!workHistory || workHistory.length === 0) return 0;
  const starts = workHistory
    .map((w) => new Date(w.start_date))
    .filter((d) => !Number.isNaN(d.getTime()));
  if (starts.length === 0) return 0;
  const earliest = new Date(Math.min(...starts));
  const years = (asOfDate - earliest) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(years * 10) / 10;
}

function mostRecentRole(workHistory) {
  if (!workHistory || workHistory.length === 0) return null;
  return [...workHistory].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
}

module.exports = {
  taxonomy,
  sharedDefs,
  getSkillMeta,
  displayNameFor,
  categoryFor,
  SENIORITY_ORDER,
  seniorityOrdinal,
  computeTotalYears,
  mostRecentRole,
};
