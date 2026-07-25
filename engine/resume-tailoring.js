'use strict';

// Implements subcon_resume's tailoring template (resume/tailoring-template.md)
// against the client-profile / job-posting schemas as revised by
// subcon_dataschema. Selection, reordering, and rewording only -- never
// fabrication. See the Tier A / Tier B split in buildExperienceSection below,
// which is the code-level enforcement of the template's ethical boundary.

const { displayNameFor, computeTotalYears, mostRecentRole } = require('./skill-taxonomy');

function clientSkillMap(clientProfile) {
  return new Map((clientProfile.skills || []).map((s) => [s.skill_id, s]));
}

function jobSkillRefs(jobPosting) {
  const required = (jobPosting.requirements?.must_have_skills || []).map((s) => ({ ...s, tier: 'required' }));
  const nice = (jobPosting.nice_to_have_skills || []).map((s) => ({ ...s, tier: 'nice_to_have' }));
  return [...required, ...nice];
}

function formatList(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

// --- Skills section (template sec3 "Skills") --------------------------------

function buildSkillsSection(clientProfile, jobPosting) {
  const skillMap = clientSkillMap(clientProfile);
  const jobSkills = jobSkillRefs(jobPosting);

  const matched = [];
  const seen = new Set();
  for (const js of jobSkills) {
    const clientSkill = skillMap.get(js.skill_id);
    if (!clientSkill || seen.has(js.skill_id)) continue;
    seen.add(js.skill_id);
    matched.push({
      skill_id: js.skill_id,
      display_name: displayNameFor(js.skill_id, js.display_name || clientSkill.display_name),
      tier: js.tier,
      years_experience: clientSkill.years_experience || 0,
    });
  }
  // required-skill matches first, then nice-to-have; within tier, years desc
  matched.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === 'required' ? -1 : 1;
    return (b.years_experience || 0) - (a.years_experience || 0);
  });

  const top3 = matched.slice(0, 3).map((m) => m.display_name);
  const matchedIds = new Set(matched.map((m) => m.skill_id));

  // Hard rule (template sec3): no skill may appear that isn't in the
  // client's own inventory -- extras are drawn only from clientProfile.skills.
  const extras = (clientProfile.skills || [])
    .filter((s) => !matchedIds.has(s.skill_id))
    .sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0))
    .slice(0, 4)
    .map((s) => displayNameFor(s.skill_id, s.display_name));

  return {
    top_3_matched_skills: top3,
    matched_skills_full: matched.map((m) => m.display_name),
    additional_skills: extras,
  };
}

// --- Experience section / bullet rendering (template sec3, the ethical envelope) --

// {{skill:skill_id}} placeholders inside a bullet's decomposed `task`/`method`
// fields resolve to the JOB posting's own term for that skill when the job
// requires/nice-to-haves it (truthful borrowing, licensed by skill_tags),
// falling back to the taxonomy's canonical display_name otherwise. This is
// the concrete mechanism behind "reword using the posting's terminology, if
// the bullet's own tagged facts already truthfully support that term."
function resolvePlaceholders(text, jobPosting) {
  if (!text) return text;
  const jobSkills = jobSkillRefs(jobPosting);
  return text.replace(/\{\{skill:([a-z0-9-]+)\}\}/g, (_, skillId) => {
    const jobSkill = jobSkills.find((s) => s.skill_id === skillId);
    if (jobSkill && jobSkill.display_name) return jobSkill.display_name;
    return displayNameFor(skillId);
  });
}

// Tier A: decomposed fields present -> template-substitution rewording.
// Tier B: text-only -> the verbatim source sentence, unchanged. No
// sentence-level regeneration off bare text in either tier.
function renderBullet(bullet, jobPosting) {
  const isTierA = Boolean(bullet.action_verb && bullet.task && bullet.metric_or_result);
  if (isTierA) {
    const task = resolvePlaceholders(bullet.task, jobPosting);
    const text = `${bullet.action_verb} ${task}, ${bullet.metric_or_result}.`;
    return { text, tier: 'A', source_bullet_id: bullet.bullet_id };
  }
  return { text: bullet.text, tier: 'B', source_bullet_id: bullet.bullet_id };
}

function scoreBulletRelevance(bullet, requiredIds, niceIds) {
  let score = 0;
  for (const id of bullet.skill_tags || []) {
    if (requiredIds.has(id)) score += 2;
    else if (niceIds.has(id)) score += 1;
  }
  if (bullet.strength === 'primary') score += 0.5;
  return score;
}

function buildExperienceSection(clientProfile, jobPosting) {
  const requiredIds = new Set((jobPosting.requirements?.must_have_skills || []).map((s) => s.skill_id));
  const niceIds = new Set((jobPosting.nice_to_have_skills || []).map((s) => s.skill_id));
  const roles = [...(clientProfile.work_history || [])].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

  return roles.map((role, idx) => {
    const cap = idx === 0 ? 6 : idx === 1 ? 4 : 3;
    const selected = (role.bullets || [])
      .map((bullet) => ({ bullet, score: scoreBulletRelevance(bullet, requiredIds, niceIds) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, cap)
      .map(({ bullet }) => renderBullet(bullet, jobPosting));

    return {
      entry_id: role.entry_id,
      company: role.company,
      title: role.title,
      location: role.location,
      start_date: role.start_date,
      end_date: role.end_date,
      bullets: selected,
    };
  });
}

// --- Summary (template sec3 "Summary") --------------------------------------

function buildSummary(clientProfile, jobPosting, top3, experienceSection) {
  const years = computeTotalYears(clientProfile.work_history);
  const recent = mostRecentRole(clientProfile.work_history);

  // Theme line drawn only from the theme_tags of bullets actually selected
  // for THIS application -- grounded in real client data, not invented.
  const usedBulletIds = new Set(experienceSection.flatMap((r) => r.bullets.map((b) => b.source_bullet_id)));
  const themeCounts = new Map();
  for (const role of clientProfile.work_history || []) {
    for (const bullet of role.bullets || []) {
      if (!usedBulletIds.has(bullet.bullet_id)) continue;
      for (const theme of bullet.theme_tags || []) themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
    }
  }
  const topThemes = [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t.replace(/-/g, ' '));
  const themeLine = topThemes.length ? `Background centered on ${topThemes.join(' and ')}.` : '';

  const skillsList = formatList(top3);
  const skillsPhrase = skillsList ? ` with proven strength in ${skillsList}` : '';

  return `${years}+ years as a ${recent ? recent.title : 'professional'}${skillsPhrase}. ${themeLine} Seeking to bring this to a ${jobPosting.title} role.`
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Screening answers (spec 2.6) -------------------------------------------

function draftScreeningAnswers(clientProfile, jobPosting) {
  const answers = new Map((clientProfile.screening_answers || []).map((a) => [a.question_category, a]));
  return (jobPosting.screening_questions || []).map((q) => {
    const stored = answers.get(q.question_category);
    return {
      question_text: q.question_text,
      question_category: q.question_category,
      answer_text: stored ? stored.answer : null,
      source: stored ? (stored.adaptable ? 'answer_bank_adaptable' : 'answer_bank_verbatim') : 'NEEDS_OPERATOR_INPUT',
    };
  });
}

// --- Top-level ---------------------------------------------------------------

function tailorResume(clientProfile, jobPosting) {
  const skills = buildSkillsSection(clientProfile, jobPosting);
  const experience = buildExperienceSection(clientProfile, jobPosting);
  const summary = buildSummary(clientProfile, jobPosting, skills.top_3_matched_skills, experience);
  const screeningAnswers = draftScreeningAnswers(clientProfile, jobPosting);

  return {
    header: {
      name: clientProfile.basics.name,
      email: clientProfile.basics.email,
      phone: clientProfile.basics.phone,
      location: clientProfile.basics.location ? `${clientProfile.basics.location.city}, ${clientProfile.basics.location.region}` : '',
      links: clientProfile.basics.links || [],
    },
    summary,
    skills,
    experience,
    education: clientProfile.education || [],
    screening_answers: screeningAnswers,
    file_name: `${clientProfile.basics.name.replace(/\s+/g, '_')}_${jobPosting.title.replace(/\s+/g, '_')}_Resume.pdf`,
  };
}

module.exports = { tailorResume, buildSkillsSection, buildExperienceSection, buildSummary, draftScreeningAnswers };
