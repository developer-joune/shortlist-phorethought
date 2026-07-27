# Prisma schema review vs. the four JSON Schemas (commit bc5bae3)

File reviewed: `prisma/schema.prisma`
Against: `schemas/client-profile.schema.json`, `schemas/job-posting.schema.json`,
`schemas/application-tracking.schema.json`, `schemas/shared-defs.schema.json`

## Real gaps

### 1. Three schema-required tracking fields have no Prisma home
`application-tracking.schema.json`'s top-level `required` array is
`["tracking_id", "client_id", "job_id", "job_title", "company", "apply_link",
"qualification_result", "status", "status_history"]`. Of those, `job_title`, `company`,
and `apply_link` have no corresponding column on `Application`, and they're not folded
into `fullResult` either — Window 2's own description scopes `fullResult` to "the entire
qualification-gate.js output," which is `qualification_result` alone, not the sibling
fields.

This isn't just a missed promotion — the schema explicitly designed these three as
**denormalized snapshots at match time**, specifically so a later re-scrape of the
posting (title/company/link changing) doesn't retroactively rewrite what a client was
actually evaluated and applied against (see the schema's own description field and
`job_title`'s comment). Right now `Application` has no way to freeze that snapshot; the
only path to a title/company/link is live-joining through `jobPosting.title` /
`jobPosting.companyName`, which reflect the *current* JobPosting row, not the value at
application time. If a posting ever gets re-scraped and edited, historical applications
would silently show the new title/company — exactly the failure mode the schema was
written to prevent.

Recommend: add `jobTitleSnapshot`, `companySnapshot`, `applyLinkSnapshot` (or similar)
columns to `Application`, populated at creation time from the JobPosting values then
frozen.

### 2. Three more top-level tracking fields have no home at all
`portal_account`, `screening_answers_used`, and `operator_notes` are siblings of
`qualification_result` in application-tracking.schema.json, not nested inside it — so
none of them are captured by `fullResult` (scoped to qualification_result) or
`statusHistory` (scoped to status_history). As specified today, this data has literally
nowhere to persist:
- `portal_account` — portal-account creation status/credential-reference (spec: operator
  creates platform accounts as needed; schema has a hard constraint that no raw
  credential is ever stored, only a `credential_reference` pointer)
- `screening_answers_used` — snapshot of the answers actually submitted, deliberately
  kept separate from the live `client-profile.screening_answers[]` bank so the record
  stays true even if the client's answer bank changes later
- `operator_notes` — free-text, operator-only, never client-facing

Recommend: either promote each to its own column, or add one more JSON-as-String field
(e.g. `trackingExtra`) to hold whichever of these Window 2 doesn't want as first-class
columns yet. Leaving them off silently means this data is generated and then discarded.

### 3. fullResult shape — confirm, don't just assume
`fullResult` is meant to equal `qualification_result` (band, hard_gates[], sub_scores[],
total_score, rubric_version, evaluated_at, optional reason{}/borderline_resolution/notes)
byte-for-byte, per the schema. Whether `engine/qualification-gate.js`'s `scoreApplication()`
actually returns exactly that shape is subcon_qualgate's domain, not something I verified
by reading the engine code — flagging as a cross-check item for whoever wires the
persistence call, not a confirmed defect.

## Answers to Window 2's three specific questions

**(1) Client promotion level (clientId/name/email + full profile JSON) — right call or
lossy?** The core call (don't relationalize `skills[]`/`work_history[]` yet) is right:
both the qualification gate and tailoring engine already consume those nested arrays
whole, in-process, off the JSON blob — there's no query pattern today that needs them as
SQL rows, and `shared-defs.schema.json`'s own rationale treats skill matching as an
app-layer set operation, not a DB join. `salary_floor` is the same story — it's compared
inside the gate's logic, not filtered on via SQL, fine to leave nested.

One plausible omission: client-profile's top-level `status` enum
(`intake_pending/active/paused/landed/cancelled`) is flat, cheap to promote, and is
exactly the kind of field `Application.status`/`Application.band` are already being
promoted *for* (dashboard filtering/sorting). Worth confirming with whoever's building
the admin dashboard whether "show me all active clients" is a near-term view — if so,
promote `status` now rather than adding a migration for it later.

**(2) trackingId = `{client_id}__{job_id}` — still the intended format?** Yes — matches
application-tracking.schema.json's own description for `tracking_id` verbatim. No change.

**(3) status as plain String, no CHECK constraint — real gap or acceptable?** Worth
noting this isn't actually a consequence of the Node/Prisma-version workaround: Prisma's
native `enum` type isn't available on the `sqlite` datasource provider *at all*, at any
Prisma version — only Postgres/MySQL/SQL Server support it — so there was never a
native-enum option here regardless of the Prisma 5 pin. That reframes it as "SQLite's
normal limitation," not a shortcut taken under pressure.

The actual gap: nothing currently enforces `status`'s 10-value enum or `band`'s 3-value
enum at write time — Prisma won't catch a typo'd status string, and neither will SQLite.
Recommend validating both against the enum arrays already defined in
application-tracking.schema.json at the Express API layer (single source of truth,
just import/mirror the list) rather than trusting the DB layer, since neither Prisma nor
SQLite will do it for you here. Acceptable to defer to the Postgres/RDS move for a real
enum type, as long as app-layer validation exists in the meantime.
