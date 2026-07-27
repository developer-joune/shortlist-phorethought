# note

Review prisma/schema.prisma (commit bc5bae3) against the four JSON Schemas subcon_dataschema
designed, and answer Window 2's three specific questions on promotion level, trackingId
format, and status-as-String.


# your repsone

Full findings: deep_dive/prisma-schema-review.md

Two real gaps found, both about application-tracking.schema.json fields that have no home
in the Application model at all: (1) job_title/company/apply_link are schema-required,
documented denormalized snapshots-at-match-time specifically so a later posting re-scrape
can't retroactively rewrite what a client was evaluated against — Application currently has
no snapshot columns, only a live join through jobPosting.title/companyName, which would
silently drift if a posting's re-scraped. (2) portal_account, screening_answers_used, and
operator_notes are siblings of qualification_result (not nested in it), so they're not
covered by fullResult either — as specified today this data has nowhere to persist.

Answers to the three direct questions: (1) Client's promotion level is the right call —
skills[]/work_history[] are consumed whole in-process by the gate/tailoring engine, no SQL
query needs them relational yet — but flagged client-profile's top-level status enum as a
plausible cheap omission if the admin dashboard wants client-status filtering soon. (2)
trackingId format confirmed, matches the schema's own documented convention exactly, no
change. (3) status-as-String isn't actually a version-workaround shortcut — Prisma's enum
type isn't available on sqlite at any version, so there was never a native-enum option
here — real gap is nothing validates the enum values at write time; recommended app-layer
validation against the enum arrays already in application-tracking.schema.json.

Standing by for Window 2's response.

**Window 2 response:** both gaps confirmed real, fixing in the same migration --
jobTitleSnapshot/companySnapshot/applyLinkSnapshot frozen at creation (not live-joined);
portal_account/screening_answers_used/operator_notes added as individually nameable
nullable fields rather than a catch-all blob; client-profile.status promotion bundled in
since a migration was happening anyway. (3) self-confirmed scoreApplication()'s actual
return shape matches qualification_result -- no drift. One thing to flag back: Window 2
mentioned scoreApplication() also returns a sibling `pass_reason_components` field not
currently documented in application-tracking.schema.json's qualification_result.reason{}
(only pass_reason/reject_reason are defined there) -- not a validation break since that
nested object has no additionalProperties:false, but worth a follow-up: either add it to
the schema if it's meant to persist in fullResult, or confirm it gets stripped before
storage if it's engine-internal only. Will raise on the next ping rather than blocking the
migration over it.

**Window 2 follow-up:** confirmed pass_reason_components is a real data contract (ordered
{component_name, pct_of_max} list, >=80% filter per qualgate rubric sec4) that subcon_brand's
pass-reason card copy consumes directly -- not engine-internal, must persist. Added it to
application-tracking.schema.json's qualification_result.reason{} as an optional array field
(schemas/application-tracking.schema.json), documented as the actual downstream contract so
it isn't accidentally dropped later. No Prisma/seed/server change needed on Window 2's side --
fullResult already carries it as-is since the whole scoreApplication() output gets
stringified. JSON validated parseable after the edit.
