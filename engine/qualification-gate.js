'use strict';

// Implements subcon_qualgate's rubric v1.1
// (_a_a_notes/note_000/deep_dive/qualification_gate_rubric_v1.md):
//   Stage 1 -- 8 hard gates (Family A: client deal-breakers, Family B: job
//   requirements). Any failure -> reject, no score computed.
//   Stage 2 -- 100-pt weighted score across 6 components, only if all hard
//   gates passed. Bands: >=75 qualified, 55-74 borderline, <55 reject.
//   Reason strings are split: pass_reason from the highest-%-of-max
//   components (>=80% filter), reject/borderline reason from the two lowest.

const { categoryFor, displayNameFor, seniorityOrdinal, computeTotalYears } = require('./skill-taxonomy');

const RUBRIC_VERSION = 'qualgate-v1.1';

const PASS_THRESHOLD = 75;
const BORDERLINE_THRESHOLD = 55;
const YEARS_TOLERANCE_MULTIPLIER = 0.6; // rubric sec1, open param pending operator confirmation

function clientHasSkill(clientProfile, skillId) {
  return (clientProfile.skills || []).find((s) => s.skill_id === skillId) || null;
}

function findDealbreaker(clientProfile, category) {
  return (clientProfile.exclusions?.dealbreakers || []).find((d) => d.category === category) || null;
}

function findRedFlag(jobPosting, category) {
  return (jobPosting.red_flags || []).find((f) => f.category === category) || null;
}

// ---------------------------------------------------------------------------
// Stage 1 -- hard gates
// ---------------------------------------------------------------------------

function runHardGates(clientProfile, jobPosting) {
  const gates = [];
  const fail = (family, gate_name, detail) => gates.push({ family, gate_name, passed: false, detail });
  const pass = (family, gate_name) => gates.push({ family, gate_name, passed: true });

  // --- Family A: client's deal-breakers about the job ----------------------

  // 1. Excluded company / industry
  const excludedCompanies = (clientProfile.exclusions?.excluded_companies || []).map((c) => c.toLowerCase());
  const excludedIndustries = (clientProfile.exclusions?.excluded_industries || []).map((c) => c.toLowerCase());
  const companyName = (jobPosting.company?.name || '').toLowerCase();
  const industry = (jobPosting.company?.industry || '').toLowerCase();
  if (companyName && excludedCompanies.includes(companyName)) {
    fail('A', 'excluded_company_or_industry', `${jobPosting.company.name} is on the client's excluded-company list.`);
  } else if (industry && excludedIndustries.includes(industry)) {
    fail('A', 'excluded_company_or_industry', `${jobPosting.company.industry} is on the client's excluded-industry list.`);
  } else {
    pass('A', 'excluded_company_or_industry');
  }

  // 2. Absolute location/remote violation
  const requiredRemote = clientProfile.exclusions?.required_remote_policy;
  const jobRemote = jobPosting.location?.remote_policy;
  const remoteDealbreaker = findDealbreaker(clientProfile, 'remote_policy');
  const remoteRedFlag = findRedFlag(jobPosting, 'remote_policy');
  if (remoteDealbreaker && remoteRedFlag && remoteRedFlag.severity === 'hard_exclude') {
    fail('A', 'location_remote_violation', `Job's remote-policy red flag matches the client's dealbreaker: ${remoteDealbreaker.detail || remoteDealbreaker.category}.`);
  } else if (requiredRemote === 'remote' && jobRemote === 'onsite') {
    fail('A', 'location_remote_violation', 'Client requires remote; job is onsite with no remote option.');
  } else {
    pass('A', 'location_remote_violation');
  }

  // 3. Schedule dealbreaker (e.g. weekend/on-call work)
  const scheduleDealbreaker = findDealbreaker(clientProfile, 'weekend_or_oncall_work');
  const scheduleRedFlag = findRedFlag(jobPosting, 'weekend_or_oncall_work');
  if (scheduleDealbreaker && scheduleRedFlag && scheduleRedFlag.severity === 'hard_exclude') {
    fail('A', 'schedule_dealbreaker', `Job requires weekend/on-call work, which the client excluded: ${scheduleDealbreaker.detail || ''}`.trim());
  } else {
    pass('A', 'schedule_dealbreaker');
  }

  // 4. Salary floor -- only a gate when the posting actually lists a range
  const floor = clientProfile.basics?.salary_floor;
  const salary = jobPosting.salary;
  if (floor && salary && (salary.max != null || salary.min != null)) {
    const postingMax = salary.max != null ? salary.max : salary.min;
    const floorValue = floor.min != null ? floor.min : floor.max;
    if (floorValue != null && postingMax < floorValue) {
      fail('A', 'salary_below_floor', `Posting's max (${postingMax}) is below the client's floor (${floorValue}).`);
    } else {
      pass('A', 'salary_below_floor');
    }
  } else {
    pass('A', 'salary_below_floor'); // posting doesn't list salary -- silence isn't a violation
  }

  // --- Family B: job's requirements about the candidate --------------------

  // 5. Work authorization
  const sponsorshipNeeded = clientProfile.basics?.work_authorization?.sponsorship_needed;
  const sponsorshipRedFlag = findRedFlag(jobPosting, 'visa_sponsorship_unavailable');
  if (sponsorshipNeeded && sponsorshipRedFlag && sponsorshipRedFlag.severity === 'hard_exclude') {
    fail('B', 'work_authorization', 'Client needs sponsorship; posting states sponsorship is unavailable.');
  } else {
    pass('B', 'work_authorization');
  }

  const mustHave = jobPosting.requirements?.must_have_skills || [];

  // 6. Required certification the client entirely lacks
  const missingCert = mustHave.find((req) => categoryFor(req.skill_id) === 'certification' && !clientHasSkill(clientProfile, req.skill_id));
  if (missingCert) {
    fail('B', 'required_certification_missing', `Posting requires ${displayNameFor(missingCert.skill_id, missingCert.display_name)}, which the client's profile does not show.`);
  } else {
    pass('B', 'required_certification_missing');
  }

  // 7. Required foundational hard skill totally absent (non-certification)
  const missingFoundational = mustHave.find((req) => categoryFor(req.skill_id) !== 'certification' && !clientHasSkill(clientProfile, req.skill_id));
  if (missingFoundational) {
    fail('B', 'required_skill_missing', `Posting requires ${displayNameFor(missingFoundational.skill_id, missingFoundational.display_name)}, which the client's profile does not show at all.`);
  } else {
    pass('B', 'required_skill_missing');
  }

  // 8. Minimum years of total experience, with a 0.6x tolerance band
  const postedMin = jobPosting.requirements?.min_years_total_experience;
  if (postedMin != null) {
    const clientYears = computeTotalYears(clientProfile.work_history);
    const toleranceFloor = postedMin * YEARS_TOLERANCE_MULTIPLIER;
    if (clientYears < toleranceFloor) {
      fail('B', 'years_of_experience', `Posting wants ${postedMin}+ years; client has ~${clientYears}, below the ${toleranceFloor.toFixed(1)}-year tolerance floor.`);
    } else {
      pass('B', 'years_of_experience');
    }
  } else {
    pass('B', 'years_of_experience');
  }

  return gates;
}

// ---------------------------------------------------------------------------
// Stage 2 -- weighted score (6 components, 100 pts)
// ---------------------------------------------------------------------------

function scoreRequiredSkillsCoverage(clientProfile, jobPosting) {
  const mustHave = jobPosting.requirements?.must_have_skills || [];
  if (mustHave.length === 0) return { score: 40, max: 40 };
  let creditSum = 0;
  for (const req of mustHave) {
    const clientSkill = clientHasSkill(clientProfile, req.skill_id);
    if (!clientSkill) continue; // credit 0
    if (req.min_years != null && req.min_years > 0) {
      creditSum += Math.max(0, Math.min(1, (clientSkill.years_experience || 0) / req.min_years));
    } else {
      creditSum += 1;
    }
  }
  const fraction = creditSum / mustHave.length;
  return { score: Math.round(fraction * 40 * 10) / 10, max: 40 };
}

function scoreNiceToHaveCoverage(clientProfile, jobPosting) {
  const niceToHave = jobPosting.nice_to_have_skills || [];
  if (niceToHave.length === 0) return { score: 20, max: 20 };
  const covered = niceToHave.filter((s) => clientHasSkill(clientProfile, s.skill_id)).length;
  return { score: Math.round((covered / niceToHave.length) * 20 * 10) / 10, max: 20 };
}

function scoreSeniorityFit(clientProfile, jobPosting) {
  const clientLevel = seniorityOrdinal(clientProfile.qualification_bar?.target_seniority);
  const jobLevel = seniorityOrdinal(jobPosting.seniority_level);
  if (clientLevel == null || jobLevel == null) return { score: 15, max: 15 }; // can't compare -- neutral
  const diff = Math.abs(clientLevel - jobLevel);
  const score = Math.max(0, 15 * (1 - 0.25 * diff));
  return { score: Math.round(score * 10) / 10, max: 15 };
}

function scoreLocationFit(clientProfile, jobPosting) {
  const jobRemote = jobPosting.location?.remote_policy;
  const targets = clientProfile.basics?.target_locations || [];
  const remoteMatch = targets.some((t) => (t.remote_ok === 'remote' || t.remote_ok === 'no_preference') && jobRemote === 'remote');
  const cityMatch = targets.some((t) => t.city && jobPosting.location?.city && t.city.toLowerCase() === jobPosting.location.city.toLowerCase());
  if (remoteMatch || cityMatch) return { score: 10, max: 10 };
  const remoteDealbreaker = findDealbreaker(clientProfile, 'remote_policy');
  if (jobRemote === 'hybrid' && !remoteDealbreaker) return { score: 6, max: 10 };
  return { score: 3, max: 10 };
}

function scoreCompensationFit(clientProfile, jobPosting) {
  const floor = clientProfile.basics?.salary_floor;
  const salary = jobPosting.salary;
  const floorValue = floor ? (floor.min != null ? floor.min : floor.max) : null;
  if (!salary || (salary.min == null && salary.max == null) || floorValue == null) {
    return { score: 6, max: 10 }; // unlisted salary -- neutral, not a strike
  }
  const midpoint = salary.min != null && salary.max != null ? (salary.min + salary.max) / 2 : (salary.max != null ? salary.max : salary.min);
  const ratio = midpoint / floorValue;
  let score;
  if (ratio >= 1.15) score = 10;
  else if (ratio >= 1.0) score = 7 + ((ratio - 1.0) / 0.15) * 3;
  else if (ratio >= 0.9) score = 4 + ((ratio - 0.9) / 0.1) * 3;
  else score = 4;
  return { score: Math.round(score * 10) / 10, max: 10 };
}

function scoreScreeningCompatibility(clientProfile, jobPosting) {
  const questions = jobPosting.screening_questions || [];
  if (questions.length === 0) return { score: 5, max: 5 };
  const answerCategories = new Set((clientProfile.screening_answers || []).map((a) => a.question_category));
  const matched = questions.filter((q) => answerCategories.has(q.question_category)).length;
  return { score: Math.round((matched / questions.length) * 5 * 10) / 10, max: 5 };
}

const SUB_SCORE_DEFINITIONS = [
  { name: 'required_skills_coverage', label: 'required-skills coverage', weight: 40, compute: scoreRequiredSkillsCoverage },
  { name: 'nice_to_have_coverage', label: 'nice-to-have skills', weight: 20, compute: scoreNiceToHaveCoverage },
  { name: 'seniority_fit', label: 'seniority fit', weight: 15, compute: scoreSeniorityFit },
  { name: 'location_remote_fit', label: 'location/remote fit', weight: 10, compute: scoreLocationFit },
  { name: 'compensation_fit', label: 'compensation', weight: 10, compute: scoreCompensationFit },
  { name: 'screening_compatibility', label: 'screening-question compatibility', weight: 5, compute: scoreScreeningCompatibility },
];

function labelFor(name) {
  return (SUB_SCORE_DEFINITIONS.find((d) => d.name === name) || {}).label || name;
}

function computeSubScores(clientProfile, jobPosting) {
  return SUB_SCORE_DEFINITIONS.map((def) => {
    const { score, max } = def.compute(clientProfile, jobPosting);
    return { name: def.name, weight: def.weight, score, pct_of_max: Math.round((score / max) * 1000) / 10 };
  });
}

function bandFor(total) {
  if (total >= PASS_THRESHOLD) return 'qualified';
  if (total >= BORDERLINE_THRESHOLD) return 'borderline';
  return 'reject';
}

// ---------------------------------------------------------------------------
// Reason-string generation (rubric v1.1 correction, sec4)
// ---------------------------------------------------------------------------

function buildReasonFromGateFailure(failedGate) {
  return {
    pass_reason: null,
    reject_reason: `Hard gate failed: ${failedGate.gate_name} — ${failedGate.detail}`,
    pass_reason_components: [],
  };
}

function buildReasonFromSubScores(subScores, band) {
  const byPctDesc = [...subScores].sort((a, b) => b.pct_of_max - a.pct_of_max);
  const byPctAsc = [...subScores].sort((a, b) => a.pct_of_max - b.pct_of_max);

  const lowestTwo = byPctAsc.slice(0, 2);
  const rejectReason = `Weakest fit on ${lowestTwo.map((s) => `${labelFor(s.name)} (${s.pct_of_max}%)`).join(' and ')}.`;

  let passComponents = byPctDesc.filter((s) => s.pct_of_max >= 80).slice(0, 2);
  if (passComponents.length === 0) passComponents = [byPctDesc[0]];
  const passReason = `Strong match on ${passComponents.map((s) => `${labelFor(s.name)} (${s.pct_of_max}%)`).join(' and ')}.`;

  return {
    pass_reason: band === 'qualified' ? passReason : null,
    reject_reason: band !== 'qualified' ? rejectReason : null,
    pass_reason_components: band === 'qualified' ? passComponents.map((s) => ({ component_name: s.name, pct_of_max: s.pct_of_max })) : [],
  };
}

// ---------------------------------------------------------------------------
// Top-level
// ---------------------------------------------------------------------------

// Returns an object shaped like application-tracking.schema.json's
// qualification_result, PLUS a sibling `pass_reason_components` field
// (subcon_brand's data contract, rubric sec4) that is NOT part of the
// strict schema shape -- strip it before persisting to a real
// application-tracking record if validating against that schema exactly.
function scoreApplication(clientProfile, jobPosting, options = {}) {
  const evaluatedAt = (options.now || new Date()).toISOString();
  const hardGates = runHardGates(clientProfile, jobPosting);
  const failedGate = hardGates.find((g) => !g.passed);

  if (failedGate) {
    const reason = buildReasonFromGateFailure(failedGate);
    return {
      band: 'reject',
      hard_gates: hardGates,
      sub_scores: [],
      total_score: null,
      reason: { pass_reason: reason.pass_reason, reject_reason: reason.reject_reason },
      pass_reason_components: reason.pass_reason_components,
      operator_override: { overridden: false },
      rubric_version: RUBRIC_VERSION,
      notes: '',
      evaluated_at: evaluatedAt,
    };
  }

  const subScores = computeSubScores(clientProfile, jobPosting);
  const total = Math.round(subScores.reduce((sum, s) => sum + s.score, 0) * 10) / 10;
  const band = bandFor(total);
  const reason = buildReasonFromSubScores(subScores, band);

  return {
    band,
    hard_gates: hardGates,
    sub_scores: subScores,
    total_score: total,
    reason: { pass_reason: reason.pass_reason, reject_reason: reason.reject_reason },
    pass_reason_components: reason.pass_reason_components,
    operator_override: { overridden: false },
    rubric_version: RUBRIC_VERSION,
    notes: '',
    evaluated_at: evaluatedAt,
  };
}

module.exports = {
  scoreApplication,
  runHardGates,
  computeSubScores,
  bandFor,
  PASS_THRESHOLD,
  BORDERLINE_THRESHOLD,
};
