# Shortlist Schema Design Notes (first pass)

Author: subcon_dataschema. Covers `client-profile.schema.json`, `job-posting.schema.json`,
`application-tracking.schema.json`, and the `shared-defs.schema.json` the first three `$ref`
into. Grounded in spec sections 2.2, 2.3, and 3's storage-format notes.

## What these are, and aren't

- `client-profile.schema.json` is the **abstracted intake layer** (spec 2.2) -- derived from
  the raw resume upload + intake form (spec 2.1). The raw upload itself is out of scope here;
  this schema is what gets produced *from* it.
- `job-posting.schema.json` is a **normalized snapshot** of one scraped posting (spec 2.3),
  immutable at scrape time.
- `application-tracking.schema.json` is that per-application **tracking record** (spec
  section 3: job title, company, link, qualification notes, resume version used, date applied,
  status) -- a separate, mutable file keyed by `(client_id, job_id)`, denormalizing a few
  display fields from the other two schemas (job title, company, apply link) as point-in-time
  snapshots rather than re-joining live, since a posting can be re-scraped/changed after a
  client was already evaluated and applied against it. `status_history` on this record is also
  the raw material spec 2.8's feed/status-tracker UI reads from, without needing a live
  dashboard backend.

## Prior art / conventions followed

- **JSON Resume** (jsonresume.org): `client-profile.basics` and `client-profile.work_history`
  follow its `basics`/`work` shape directly -- header fields separate from a reusable list of
  positions, each with an array of discrete highlight/bullet strings. Diverged from JSON Resume
  where the spec required something it doesn't have: per-bullet `skill_tags` (spec 2.2's "not
  locked to one resume layout" requirement) and a `strength` weight for tailoring priority.
- **JSON Schema** (2020-12): both schemas declare `$id`/`$schema`, use `$ref` for shared types,
  `$defs` (in `shared-defs.schema.json`) for the vocabulary both sides need, and
  `additionalProperties: false` at the top level to catch drift early during Phase 1 when the
  schema itself is still moving.
- **Normalization**: skill data lives once, in a skill taxonomy referenced by `skill_id`
  (see below) -- not duplicated inline in every bullet, every requirement, every nice-to-have.
  Enums that must match across the two schemas (remote policy, exclusion categories, screening
  question categories) live once in `shared-defs.schema.json`, not copy-pasted into both files.

## The cross-schema contract (read this if you're subcon_qualgate)

The gate's job is to compare a `client-profile` instance against a `job-posting` instance.
For that to be a value comparison instead of NLP/fuzzy matching, both schemas commit to:

1. **Shared skill taxonomy.** `client-profile.skills[].skill_id` and
   `job-posting.requirements.must_have_skills[].skill_id` /
   `nice_to_have_skills[].skill_id` all draw from the same controlled vocabulary of slugs
   (e.g. `react`, `project-management`). This is the single biggest lever on gate accuracy --
   if the operator writes `js` for one client and `javascript` for a job posting, the gate
   silently fails closed. **Deliberately not a JSON Schema `enum`** (would need hundreds of
   values embedded in two files and drift immediately) -- recommend a separate
   `skills-taxonomy.md`/`.json` data file the operator appends to, validated by a simple
   uniqueness lint, not schema-enforced in Phase 1. Flagging this as a decision, not settled --
   want your read on whether the gate needs stricter enforcement than that.
2. **`qualification_bar.must_have_skill_ids` / `nice_to_have_skill_ids`** on the client side
   are *references into* `skills[]` (not a duplicate skill list) -- they flag which of the
   client's already-declared skills are core vs. supplementary. Compare these sets against
   `job-posting.requirements.must_have_skills` / `nice_to_have_skills`.
3. **`exclusionCategory` enum** is shared by `client-profile.exclusions.dealbreakers[].category`
   and `job-posting.red_flags[].category` -- a red flag auto-fails the gate only when its
   category exact-matches one of the client's dealbreaker categories (plus `excluded_companies`
   / `excluded_industries` as separate direct string checks against `job-posting.company`).
4. **`questionCategory` enum** shared by `client-profile.screening_answers[]` and
   `job-posting.screening_questions[]` -- lets the resume-tailoring/application step
   auto-draft answers by category match rather than the operator hand-matching questions.
5. **`remotePolicy` enum** shared by `client-profile.basics.target_locations[].remote_ok` /
   `exclusions.required_remote_policy` and `job-posting.location.remote_policy`.
6. **`money`** shape shared for `client-profile.basics.salary_floor` and
   `job-posting.salary` -- same `currency`/`period` units required for the floor check to be
   valid. Note `job-posting.salary` is the whole object, optional/absent if not listed --
   don't default to `{amount: 0}`, that reads as a false "below floor" fail.
7. **`seniorityLevel` enum** shared by `client-profile.qualification_bar.target_seniority` and
   `job-posting.seniority_level`.

None of the actual scoring/threshold logic (must-match-all-must-haves? weighted score? how
strict) is designed here -- that's explicitly subcon_qualgate's territory per spec 2.4/5.6.
This design only guarantees the two schemas hand you comparable values to build that rubric on.

## For the resume-tailoring engine

- `work_history[].bullets[].skill_tags` + `strength` give a ranking signal: filter bullets by
  overlap with the job's `must_have_skills`/`nice_to_have_skills` skill_ids, break ties by
  `strength: primary` over `secondary`.
- `skills[].last_used` + `proficiency` support the `{top_3_matched_skills}` template variable
  (spec 2.5) -- rank by (skill overlap with job) then (recency, proficiency).
- `theme_tags` (free text, not taxonomy-bound) are for tone/narrative selection, not gate logic.

## Reconciliation with subcon_resume (resume/tailoring-template.md §6)

Resolved directly rather than routing through Window 2, since these were concrete and the
tradeoffs were clear:

- **Structured bullet decomposition** -- added optional `action_verb` / `task` / `method` /
  `metric_or_result` fields to each bullet, alongside the existing required `text`. `text`
  stays the canonical, required, truthful sentence (and the only thing that has to exist at
  intake time); the structured fields are opportunistic enrichment for when the tailoring
  engine needs true template-substitution rewording rather than open generation. Didn't make
  them required: decomposing every historical bullet at intake is real per-bullet labor, and
  forcing it up front conflicts with the 3-day build constraint. `metric_or_result` and the
  pre-existing `impact_metric` field are the same concept surfaced two ways -- decomposed
  template slot vs. display-only callout -- kept separate rather than collapsed into one field.
- **`years_experience` per skill_id** -- already present on `skills[]`, no change needed.
- **`entry_id` FK on bullets** -- added (named `entry_id`, per Window 2's call, matching the
  parent `work_history` entry's own key rather than introducing a second name -- `role_id` --
  for the same concept). Nesting under `work_history[].bullets[]` already encodes the
  relationship, but the tailoring engine flattens bullets client-wide to score against a job's
  requirements before it knows which role each one belongs to, so an explicit `entry_id`
  (required, must equal the parent entry's `entry_id`) avoids carrying nesting context through
  that pass. Denormalized on purpose for that access pattern.

## Reconciliation with subcon_qualgate rubric v1 sec4 (via Window 2)

`application-tracking.qualification_result` expanded from a bare `passed`/`score` to carry
the rubric's full audit trail: a 3-way `band` (`qualified`/`borderline`/`reject`, replacing the
boolean), `hard_gates[]` (per-gate pass/fail named by Family A/B), `sub_scores[]` (the 6
weighted rubric components + `total_score`), a `reason` object split into `pass_reason` /
`reject_reason`, and `operator_override` for resolving a borderline band -- with `override_reason`
schema-required whenever `overridden: true` (JSON Schema `if`/`then`), since an unexplained
override defeats the point of an audit trail. `status` gained `borderline_review` between the
two gate outcomes.

`hard_gates[].family` and `sub_scores[].name` are left as free strings rather than enums --
that vocabulary is subcon_qualgate's rubric, not this schema's, and hardcoding it here would
recouple this file to every future rubric revision. Same principle as keeping the skill
taxonomy out of `shared-defs.schema.json`.

## Employer-portal account creation (scope addition, 2026-07-25)

Operator now creates employer-specific portal accounts as needed while applying (previously
spec 2.5 open question #8, now resolved in-scope). Added `application-tracking.portal_account`:
a `status` enum (`not_required`/`pending`/`created`/`existing_reused` -- richer than a plain
boolean, since "not needed" and "needed but not done yet" are different states an operator
needs to see), `platform_name`, `account_email` (an identifier, not a secret), and
`credential_reference`.

**Hard constraint: no raw credential value is ever stored in these files.** Enforced
structurally, not just by convention -- `portal_account` has no field that could hold one, and
`additionalProperties: false` on that object rejects any ad-hoc field (e.g. a stray `password`
key) added later by mistake. `credential_reference` is a pointer to wherever the actual secret
lives externally (operator's password manager); a JSON Schema `if`/`then` makes it required
whenever `status` is `created` or `existing_reused`, so an account can't exist in the record
without also recording where its credential is kept. Exact reference-string phrasing left open
to coordinate with subcon_legal's consent-doc language, since they're writing the client-facing
description of this practice and the two should use consistent terms.

## Decisions from Window 2 (confirmed)

- **Skill taxonomy enforcement**: going with the recommendation above -- a separate
  `skills-taxonomy` data file + uniqueness lint, not a schema-enforced enum. Proportionate for
  Phase 1 scale. Delivered: `skills-taxonomy.json` (34-skill starter set spanning hard skills,
  tools/software, certifications, soft skills, languages -- deliberately not niche-specific
  since the beachhead niche, spec section 10, isn't picked yet) and
  `lint-skills-taxonomy.py` (checks skill_id pattern/uniqueness, alias collisions, and that
  every `category` is a valid value from `shared-defs.schema.json#/$defs/skillCategory` --
  reads that enum directly rather than duplicating it, so the lint can't drift from the
  schema). Run after any edit to the taxonomy: `python3 lint-skills-taxonomy.py`.
- **Tracking format**: per-client JSON files (already communicated to subcon_qualgate). See
  `application-tracking.schema.json`, added below to close spec section 3's open question.

## Open questions / not yet resolved

- `gate_strictness` on `qualification_bar` is a stub knob (`strict`/`standard`/`lenient`) --
  included so the gate has *somewhere* to read a per-client override, but the semantics are
  entirely subcon_qualgate's to define.
- Whether `job-posting.red_flags` and `screening_questions` get populated by a human (operator
  reading the posting) or a lightweight extraction script is a Phase 1 process question, not
  a schema question -- schema supports either.

## Status

All four schema files (`shared-defs`, `client-profile`, `job-posting`, `application-tracking`)
plus `skills-taxonomy.json` + `lint-skills-taxonomy.py` are complete and passing validation.
subcon_resume's §6 requests, subcon_qualgate's rubric v1 audit-trail requirements, and the
employer-portal-account scope addition (with its no-raw-credentials constraint) are all
reconciled. Standing by -- flag subcon_legal's `credential_reference` phrasing convention here
once it exists, and expect `gate_strictness` semantics to be the next thing worth
pressure-testing with subcon_qualgate if it comes up.
