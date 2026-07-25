# Shortlist — Resume/CV Tailoring Template

Author: subcon_resume · Status: **v1 — schema reconciled and final, per Window 2**

Covers spec 2.5 (the fill-schema template) and 2.6 (what the tailored resume feeds into
as an application-output artifact).

## Dependency note

This template's Skills and Experience sections read from the client data abstraction
layer (skills inventory + tagged bullet bank) that subcon_dataschema owns. All field
names below are reconciled against their final schema:
- `years_experience` per `skill_id` — used as-is by the Skills-ordering step.
- Role foreign key is `work_history[].entry_id`, bullets nested inside — this document
  uses `entry_id` throughout.
- Each bullet has a **required authoritative `text` field**, plus **optional** decomposed
  fields (`action_verb`, `task`, `method`, `metric_or_result`) and a `skill_tags` list.
  Decomposition is opt-in per bullet, not guaranteed — the rewording rules in Section 3
  are written as a two-tier approach specifically to handle both cases without ever
  falling back to open-ended regeneration off bare text.

---

## 1. Design principles (what this is grounded in)

**ATS compatibility** — parseable, single-column, standard headings, no tables/graphics/
text boxes/columns/headers-footers carrying contact info, text-selectable output only.

**Bullet-writing practice** — impact/metric-first phrasing, one idea per bullet, active
verbs, no personal pronouns, consistent tense (past tense for past roles, present tense
for ongoing responsibilities in a current role).

**Ethical tailoring boundary** — this is the one that matters most given what Shortlist
sells. Tailoring = **selecting, reordering, and rewording truthful information the
client already provided** — the exact phrase already load-bearing in subcon_legal's
consent-doc draft, which this template should match, not drift from. It is never:
fabricating a metric, skill, tool, credential, or scope of responsibility the client
doesn't actually have. Section 3's bullet-rewording rules operationalize this as a hard
boundary, not a guideline.

---

## 2. Template structure (section order — ATS-safe, standard)

1. **Header** — static
2. **Summary** — generated per job (`{job_title}`, `{top_3_matched_skills}`)
3. **Skills** — filtered/reordered (`{top_3_matched_skills}` + full matched list)
4. **Professional Experience** — reverse-chronological roles, tailored bullets per role
   (`{relevant_experience_bullets}`)
5. **Education**
6. **Certifications** — separate section if the client has certs not already folded into
   Skills (some ATS parsers key on a distinct "Certifications" heading)

Reverse-chronological role order is standard and NOT itself tailored per job — only the
bullets *within* each role are selected/reordered. Changing role order per application
would look inconsistent across a client's application history and isn't necessary since
bullet selection already does the relevance work.

---

## 3. Field-by-field spec

### Header (static per client)

Full name, phone, email, city + state (no full street address — standard privacy/ATS
convention), LinkedIn URL, portfolio/site URL if present. Plain text, top of document,
single column. No photo, no graphic, no icons next to contact fields (icon glyphs
sometimes parse as garbage characters in ATS text extraction).

### Summary (generated per job)

2–3 lines, no personal pronouns, present tense. Template:

> `{years_experience}+ years {domain_identity} with proven strength in
> {top_3_matched_skills[0]}, {top_3_matched_skills[1]}, and {top_3_matched_skills[2]}.
> {one_truthful_theme_line}. Seeking to bring this to a {job_title} role.`

Rules:
- `domain_identity` and `one_truthful_theme_line` must be phrases already substantiated
  by the client's own data (skills inventory / bullet bank), not freely generated —
  same rewording envelope as bullets (Section 3 below applies to the summary too).
- Mirroring the job posting's own terminology is allowed ONLY where the client's
  underlying data truthfully supports that term (e.g., posting says "growth marketing,"
  client's tagged experience is literally growth-marketing work → fine; client's
  experience is brand marketing with no growth-metrics component → not fine, don't
  borrow the posting's vocabulary to imply a fit that isn't there).
- `job_title` here should read as the *target* role framing ("seeking to bring this to a
  Senior PM role"), never phrased to imply the client already held that exact title
  unless their own work history says so.

### Skills (filtered/reordered)

Algorithm:
1. Intersect client's skill inventory (`skill_id`s) with the job posting's required +
   nice-to-have skill list.
2. Order matched skills: required-skill matches first, then nice-to-have matches; within
   each tier, sort by the client's years-of-experience on that skill (desc).
3. `{top_3_matched_skills}` = first 3 `display_name`s off that ordered list, with a light
   category-diversity nudge (avoid all 3 being variants of the same tool if a
   certification or distinct hard skill also matched near the top).
4. Below the matched set, append a capped number (e.g. 3–5) of the client's other strong
   skills relevant to the job's general domain, even if not literally matched — gives
   ATS keyword coverage breadth without diluting the top of the section.
5. **Hard rule**: no skill may appear anywhere in output that isn't present in the
   client's own skill inventory. This is the one full-stop fabrication boundary in this
   section — there is no "close enough" here.

Render as a plain comma-separated line or simple flat bullet list under a standard
"Skills" or "Core Competencies" heading — not a rated skill bar/graph/star icons (breaks
ATS parsing, and implies a precision — "4/5 stars in Python" — the underlying data
doesn't actually claim). Consider a bolded one-line "Core Match" callout using
`{top_3_matched_skills}` directly above the full list, as a human-reader emphasis device
— plain bold text, not a graphic, so it stays ATS-safe.

### Professional Experience (`{relevant_experience_bullets}`)

Per role: company, title, location, dates (Month YYYY – Month YYYY / "Present").

Bullet selection:
1. Filter the bullet bank to bullets tagged to this role.
2. Score each bullet by tag-overlap with the job's required/nice-to-have skills.
3. Select top N per role — more from the most recent/most relevant role (e.g. 4–6),
   fewer from older/less relevant roles (e.g. 2–3) — capped so the whole document stays
   1–2 pages (ATS and human-reader convention).
4. Order the selected bullets within a role by relevance-to-this-job, not necessarily
   their original importance order — lead with what this specific reader cares about.

**Bullet rewording rules — the ethical envelope** (this is the load-bearing part of the
whole template). Two tiers, selected per bullet at render time based on whether that
bullet has decomposed fields populated:

**Tier A — decomposed fields present** (`action_verb`/`task`/`method`/
`metric_or_result` populated). Preferred path — rewording is template substitution
against known structured facts:

| Allowed | Not allowed |
|---|---|
| Reword using the job posting's terminology, if the bullet's own `skill_tags` already truthfully support that term | Add a metric/number not present in `metric_or_result` |
| Reorder clauses to lead with impact/result ("Cut onboarding time 40% by redesigning X" vs. "Redesigned X, cutting onboarding time 40%") | Add a skill/tool/technology not already in `skill_tags` |
| Trim/omit true details irrelevant to this job | Escalate scope/scale language upward ("contributed to" → "led") unless the bullet's own fields already support that framing |
| Select which bullets appear and in what order | Synthesize a new claim by combining facts from two different source bullets into one |

**Tier B — text-only fallback** (bullet has only the required `text` field, no
decomposition). Conservative, text-level transforms only — explicitly **no
sentence-level regeneration off bare text**, per Window 2's design guidance:

| Allowed | Not allowed |
|---|---|
| Reorder existing clauses within the sentence (move an existing impact clause earlier) | Rewrite the sentence's wording beyond clause-reordering |
| Trim/omit an existing clause that's irrelevant to this job | Add or infer a metric, scope, or claim not literally present in `text` |
| Swap in the job posting's terminology for an existing term — **only** when that swap is licensed by a `skill_tags` entry on the bullet (the tag list still exists on every bullet regardless of decomposition status) | Swap terminology when no matching `skill_tags` entry licenses it, even if it "reads better" |
| Select which bullets appear and in what order | Any transform not explicitly listed here — Tier B defaults to leaving `text` untouched over risking drift |

Every rendered bullet must be traceable to exactly **one** bullet-bank source record —
this traceability is also what makes the operator's manual review fast (spec 2.7 keeps
application submission human-reviewed; the resume should be equally auditable before it
goes out). At render time, the tailoring engine should log which tier a bullet was
rendered under, so review can spot-check Tier B outputs more closely (less structural
guardrail = worth a slightly closer human look before it ships).

### Education / Certifications

Static, reverse-chronological, not tailored per job in v1. A `{relevant_certifications}`
reorder-by-relevance variable is a plausible v2 addition if a client has several certs
worth reordering, but not needed for a first pass.

---

## 4. ATS compatibility checklist (apply at render/export time)

- Single column, no tables, no text boxes, no header/footer contact info (many parsers
  drop header/footer content entirely)
- Standard headings only: Summary, Skills, Professional Experience, Education,
  Certifications — no renamed/cute headers
- Standard fonts (Arial, Calibri, Georgia, Times New Roman), 10–12pt body text
- No icons, images, logos, photo, charts
- Export as .docx or text-selectable PDF — never a flattened/image-based PDF
- Consistent date format throughout (Month YYYY, or MM/YYYY)
- Spell out acronyms at least once where the job posting uses one and the client's own
  data supports the underlying term (e.g. "Search Engine Optimization (SEO)") — helps
  both ATS keyword match and the human reader
- File naming: `FirstName_LastName_JobTitle_Resume.pdf` — also usable as the join key for
  the operator's per-client tracking file (spec section 3)

---

## 5. Templating variables — v1 spec

**`{job_title}`** — string, sourced from the normalized job-posting schema's title
field. Used in: Summary (target-role framing). Optional secondary use: a small line
under the name in the header ("Target: {job_title}") if the operator wants that — flagged
as optional, not required.

**`{top_3_matched_skills}`** — array of 3 `skillRef.display_name` values (per
subcon_dataschema's `shared-defs.schema.json`), from the skill-matching algorithm in
Section 3. Used in: Summary line, Skills-section "Core Match" callout.

**`{relevant_experience_bullets}`** — array of `{ entry_id, bullets: [...] }`, from the
bullet-selection algorithm in Section 3. Used in: Professional Experience, grouped under
each role (`entry_id` joins to `work_history[]`). Each item in `bullets` carries whichever
tier of source fields it has (decomposed or `text`-only) plus `skill_tags`, so the
renderer can select Tier A or Tier B logic per bullet independently — a single role's
selected bullets can be a mix of both tiers.

---

## 6. Reconciliation with subcon_dataschema (final, per Window 2)

- ✅ `years_experience` per `skill_id` exists in the client-profile schema; the
  Skills-ordering step in Section 3 uses it as-is.
- ✅ Role foreign key is `work_history[].entry_id`, with bullets nested inside. This
  document uses `entry_id` (not `role_id`) throughout.
- ✅ Bullets support optional `{action_verb, task, method, metric_or_result}` alongside a
  required authoritative `text` field, plus `skill_tags`. Rather than requiring full
  decomposition on every bullet (which would've meant re-authoring the client's entire
  bullet bank before this template could ship), the schema and this template settled on
  a **two-tier rendering approach** (Section 3): decomposed fields get full
  template-substitution rewording when present; `text`-only bullets get conservative
  clause-level transforms only, with terminology swaps gated on `skill_tags`, never
  sentence-level regeneration. This is the schema's final shape for v1 — no open items
  remain.

---

## 7. Worked examples

### Tier A — decomposed bullet

Source record:
```
{
  entry_id: "entry_002",
  action_verb: "Facilitated",
  task: "daily team coordination meetings",
  method: "structured agile ceremonies",
  metric_or_result: "6-person engineering team, reduced sprint slippage ~15%",
  skill_tags: ["scrum", "agile", "team-leadership"],
  text: "Facilitated daily team coordination meetings using structured agile ceremonies for a 6-person engineering team, reducing sprint slippage ~15%."
}
```

Job posting requires: `scrum`, `agile-facilitation`.

Rendered bullet: *"Facilitated daily Scrum ceremonies for a 6-person engineering team,
cutting sprint slippage ~15%."*

What changed: "daily team coordination meetings" → "daily Scrum ceremonies" (reworded
using the posting's own term, licensed by the `scrum` tag), impact clause moved earlier.
What did NOT change: no new metric, no new tool, no claim of ownership beyond what the
source record's fields already state.

### Tier B — text-only fallback

Source record:
```
{
  entry_id: "entry_005",
  skill_tags: ["python", "data-pipeline"],
  text: "Built and maintained internal data pipeline in Python, cutting manual reporting work for the analytics team."
}
```
(No `action_verb`/`task`/`method`/`metric_or_result` populated — text-only.)

Job posting requires: `python`, `automation`.

Rendered bullet: *"Cut manual reporting work for the analytics team by building and
maintaining an internal data pipeline in Python."*

What changed: only clause reorder (impact clause moved to lead) — no term substitution
was made because the posting's word "automation" has no matching `skill_tags` entry to
license swapping it in, even though "automation" arguably describes the same work. That
withheld swap is Tier B behaving correctly: conservative by default, not creative.

---

v1 complete and reconciled. Standing by for Window 2 to consult with a specific
job/client to test this against, or for further review requests.
