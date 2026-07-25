# Shortlist — Tone & Voice Guide (v1 draft)

**From:** subcon_brand
**For:** Window 2 (main builder) — implementing the client-facing feed
**Grounded in:** shortlist-spec.md §2.8 + §6, Shortlist-Business-Brief.pdf

---

## 1. The brief, restated as a design constraint

The client asked for the *feel* of Instagram/LinkedIn — card-based, feed-like,
personal, lightly gamified, something people want to check. Not a skin of either
platform (named IP-risk concern), and not the "Assembly" agency-portal direction
(rejected — that's dashboard genre, we're feed genre). We're building an original
feed aesthetic that *behaves* like a social feed without *looking like* one.

Two things have to be true simultaneously in every piece of copy:
1. It reads like a person telling you something good happened, not a system
   logging a state change.
2. It never says or implies "you'll get an interview" — only "we did the work."

That second constraint isn't a nice-to-have. It's the whole legal safety of the
core promise. Every notification, card, and digest should survive the question:
*"Could a client screenshot this and reasonably believe we guaranteed them an
interview?"* If yes, rewrite it.

---

## 2. Voice pillars

**Personal, not clinical.**
Write like a person who is rooting for this specific client, not a system
reporting on a queue. Say "we found you a match," not "Job Listing #4 — Status:
Matched."

- Use "we" (the operator) and "you" (the client) — direct address, always.
- Use plain verbs: found, sent, applied, heard back. Avoid system verbs:
  processed, generated, executed, updated.
- First name where available. "Hey Maria — new match." beats "Notification: 1
  new match available."

**Effort-forward, never outcome-promising.**
Every sentence describing what we did should center *our labor*, not the
client's future. "We applied for you" is safe. "This one's a strong fit" is
safe (it's our qualification judgment, stated as our opinion). "You're going
to love this role" drifts toward outcome-promising — avoid speculating on how
the client's search *will* go.

- Safe: "We found 3 roles you're qualified for and applied to all of them."
- Safe: "Strong match on your React + 5 years experience bar."
- Unsafe: "This could be the one." / "You're a shoo-in for this." / "Get ready
  for that interview."
- If copy touches guarantees, timelines-to-hire, or anything that reads like a
  prediction about outcomes — flag it to subcon_legal before shipping.

**Warm, not hype-y.**
Gamification here should feel like *momentum*, not like a slot machine. Counts
and streaks are used to show real work accumulating, not to manufacture
urgency. No countdown timers, no "don't miss out," no exclamation-point
stacking.

- Good: "12 applications sent this month. 2 responses this week."
- Avoid: "🔥 Don't lose your streak!" or "Only 2 spots left today!!"

**Specific, not generic.**
Every card should be able to answer "why this job, why me" in one line. Vague
praise ("Great opportunity!") reads as filler and undercuts the qualification
gate, which is the actual product. Specificity *is* the brand — it's what
proves we didn't spray-and-pray.

---

## 3. Vocabulary — use / avoid

| Use | Avoid | Why |
|---|---|---|
| match, found you a match | lead, result, listing | "match" implies judgment was applied (the gate); "listing" is inventory language |
| applied for you | submitted | "submitted" is system/form language |
| qualified for, strong fit on | perfect for, ideal candidate | "perfect/ideal" edges toward outcome promise |
| heard back, they responded | status: response received | plain vs. clinical |
| this week's matches | new notifications | "matches" ties back to the gate; "notifications" is generic-app language |
| we're on it | processing, in queue | ownership vs. system state |

---

## 4. Card anatomy (content, not visual spec — Window 2 owns layout)

Per spec §6, each job = a card with: company, title, one-line "why you're
qualified," and status. Suggested copy shape:

```
[Company logo/initial]  {Company Name}
{Job Title}
"{one-line qualification reason — specific, tied to their actual background}"
[status indicator — visual, not a text label like "Status: Applied"]
```

The qualification line is the single highest-leverage sentence on the card —
it's the proof the gate worked. Keep it concrete: reference an actual skill,
years of experience, or credential from the client's profile, not a generic
compliment.

- Good: "Your 6 years in supply-chain analytics + Tableau cert line up
  directly with what they're asking for."
- Weak: "This looks like a great match for your background!"

### Data source: `pass_reason_components` (subcon_qualgate contract)

This line now has a real data source instead of being hand-written: qualgate's
rubric emits `pass_reason_components`, an ordered list of
`{component_name, pct_of_max}`, already filtered to components ≥80% of max —
i.e. only the client's genuinely strong matches, pre-sorted strongest first.

Copy-generation rule for turning that into the qualification line:

1. **Take the top 1–2 components**, not the whole list. One or two strong,
   named reasons reads as a clean match (the actual voice goal); stacking
   every qualifying component reads as padding and dilutes the "this wasn't
   a stretch, it was a clean fit" tone this guide is going for.
   - If only one component clears the 80% bar, that's fine — a single
     strong reason beats a padded sentence. Don't force a second.
2. **Never surface `component_name` or `pct_of_max` verbatim in client-facing
   copy.** `component_name` is a schema key (e.g. `skill_match_sql`,
   `years_experience_healthcare_analytics`), not a sentence — it needs a
   human-readable phrase mapping layer before it reaches copy. And don't
   display the percentage itself ("92% match") — a quantified score reads
   as clinical/system language (violates the personal-not-clinical pillar)
   and risks implying a precision/confidence level about *outcomes* that
   the brand promise deliberately avoids. Use `pct_of_max` only to pick and
   order which components to mention, never as displayed text.
3. **Template the mapped component(s) into the existing sentence pattern**:
   "Your {component phrase(s)} line up directly with what they're asking
   for" / "line up directly with what they listed as must-haves."

Example: `pass_reason_components` = `[{years_experience_healthcare_analytics, 100%}, {skill_match_sql_tableau, 95%}, {location_remote_match, 82%}]`
→ take top 2 → "Your 5 years in healthcare analytics and the SQL + Tableau
combo line up directly with what they listed as must-haves." (This is the
§6 worked example — it's exactly this contract applied.)

Edge case: if a job clears the overall gate but `pass_reason_components`
comes back empty (no component individually ≥80%, gate passed on aggregate
instead), don't leave the line blank or fall back to a generic compliment —
flag that case back to subcon_qualgate, since the voice rule in §2 (specific,
not generic) depends on there being at least one strong component to name.

---

## 5. The "return trigger" — light gamification, done honestly

Spec names this explicitly: something analogous to a social notification hook
("3 new matches this week"). Keep these strictly factual and effort/volume
based — never invent urgency that isn't real.

Legitimate return triggers (all real, all effort/volume-based):
- New match count: "3 new matches this week"
- Cumulative application count: "18 applications sent so far"
- Response activity: "1 company responded — see what they said"
- Weekly digest framing: "Your week in review"

Illegitimate (don't use — manufactures false urgency or implies outcome):
- Countdown/scarcity language about the client's own results
- "Your chances are improving" style unverifiable claims
- Streak-shaming ("You haven't checked in 3 days!")

---

## 6. Worked example — "new match" notification

This is the artifact the spec asks for: a sample notification in the target
voice, usable as a reference pattern for any similar card (new match, new
response, weekly digest). **Delivery format is a static per-client webpage**
(confirmed by Window 2 — not email), so this is written as what the client
sees when they open their page: a personalized greeting/return-trigger banner
at the top (this is the abstracted-from-"Assembly" pattern the spec flags as
reusable — personalized greeting + a prioritized "your actions" style module),
followed by the match card itself in the feed below it.

### Page banner (top of page, on load)

> **Hey Maria — 1 new match this week.**
> That brings you to 7 applications sent this month. We'll keep going.

### Match card (in the feed)

> **Meridian Health** — Senior Data Analyst
>
> "Your 5 years in healthcare analytics and the SQL + Tableau combo line up
> directly with what they listed as must-haves — this wasn't a stretch
> match, it was a clean one."
>
> ✓ Applied — resume tailored to lead with your healthcare analytics work,
> screening questions answered from your standard bank. Nothing left for
> you to do here.

### Why this version works (annotations for Window 2 / QA)

- Banner opens with the person's name and leads with the return-trigger
  count ("1 new match this week") — this is the module that gives the
  client a reason to come back, sitting at the top of the page like the
  "your actions" pattern flagged as reusable from the Assembly reference.
- The qualification reason on the card is specific and sourced from real
  client data (years, tools), which is the actual product working, shown.
- "Applied" + what we did is stated as completed effort, not a predicted
  outcome. No language implies the interview or hire is likely.
- The count ("7 applications sent this month") is the light-gamification
  return trigger — factual, effort-based, not manufactured urgency.
- No CTA button on the card ("Apply now," "Take action") — the whole point
  of this product is the client does nothing. A CTA here would contradict
  the core promise. The only actionable state on a card should be things
  like "they responded" — genuinely new information, not a nudge.

### A version that would fail review (for contrast — do not use)

> 🎉 BIG NEWS Maria! We found you the PERFECT job and you're basically a
> shoo-in. Apply now before it's gone — this could be your last chance this
> month!

Fails on: outcome-promising ("perfect," "shoo-in"), manufactured urgency
(platform already applied — "apply now" is nonsensical and also implies the
client needs to act), hype-stacking (emoji + caps + exclamation), and it
reads like ad copy, not a person updating a client.

---

## 7. Open items / handoff notes

- **Delivery format decided: static per-client webpage** (not email) — §6's
  worked example above reflects this. Voice pillars hold regardless of
  medium; this just fixes the artifact shape (no subject line, banner +
  feed instead).
- Any copy that touches timelines, response likelihood, or "how long this
  takes" should route through subcon_legal before shipping — flagging per
  brief instruction to coordinate on promise-adjacent language.
- Visual system (color, type, card chrome) is Window 2 / a design pass, not
  covered here — this doc is voice/copy only, per spec §6's explicit note
  that visual direction is a suggested starting point, not finalized.
- **Resolved:** subcon_qualgate's pass-side reason fix landed —
  `pass_reason_components` now returns an ordered, ≥80%-filtered list of
  strong-match components instead of the lowest-scoring ones. §4 has been
  updated with the copy-generation rule for consuming that contract
  (top 1–2 components, mapped to human-readable phrases, never displaying
  raw keys or percentages). The qualification line now has a real data
  source instead of being hand-written per case.
