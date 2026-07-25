# Qualification Gate — Rubric Design v1 (first-pass, for review)

Author: subcon_qualgate | Status: draft, not final — reacting material for Window 2 + operator.

Sources: shortlist-spec.md §2.2–2.4 + Open Question #6; Shortlist-Business-Brief.pdf
(the risk-reversal promise, "qualify the client too," and the niche-first framing all
directly constrain this design — see "Business constraints that shape the thresholds"
below).

---

## 0. Two separate gates — don't conflate them

The spec's "must-have vs nice-to-have" language actually points in two different
directions, and the rubric needs to keep them structurally separate or the scoring
logic gets muddled:

- **Family A — Client's deal-breakers about the job** (from client intake §2.2
  "Exclusions/preferences"): excluded companies/industries, remote/location
  deal-breakers, schedule deal-breakers, salary floor. The *client* sets these; a job
  either violates them or doesn't.
- **Family B — Job's requirements about the candidate** (from job posting §2.3
  "Required skills / years of experience"): work authorization, required
  certifications, required hard skills, minimum years. The *job posting* sets these;
  the client either meets them or doesn't.

Every hard gate and every weighted score component below is one or the other. This
distinction is what makes the rubric auditable — a rejection reason is always "job
violated your exclusion X" or "you don't meet the posting's requirement Y," never a
vague blended judgment.

---

## 1. Stage 1 — Hard Gates (binary, checked first, before any scoring)

If **any** hard gate fails, the job is auto-rejected. No score is computed. The reason
is logged verbatim (which gate, which field) — this is the cheapest, most defensible
kind of rejection to explain to a client later.

### Family A (client deal-breakers)
1. **Excluded company / industry** — job's company or industry is on the client's
   exclusion list. FAIL.
2. **Absolute location/remote violation** — client marked a deal-breaker (e.g.
   "remote-only, no exceptions" or "will not relocate") and the job's location/remote
   policy violates it outright. FAIL.
3. **Schedule deal-breaker** — job posting explicitly states a condition the client
   flagged as a deal-breaker (e.g. "must work weekends" when client excluded weekend
   work). FAIL.
4. **Salary floor, only when the posting lists a range** — posting's stated max is
   below the client's salary floor. FAIL. *(If the posting doesn't list salary, this is
   NOT a hard gate — see weighted component 5 below. Don't punish silence as if it
   were a violation.)*

### Family B (job requirements)
5. **Work authorization** — posting requires a status/sponsorship the client doesn't
   have (e.g. "no sponsorship" + client needs sponsorship). FAIL.
6. **Required license/certification client entirely lacks** — only for
   legally-gating credentials (RN license, PE stamp, bar admission, active security
   clearance, CPA, etc.) where the job is literally not performable without it. FAIL.
7. **Required hard skill totally absent** — a skill the posting lists as required
   (not nice-to-have) has zero evidence anywhere in the client's skills inventory, AND
   the skill is foundational to the role (e.g. "Python" for a Python-engineer role, not
   a tangentially-mentioned tool). FAIL.
8. **Minimum years of experience, with a tolerance band** — only fails if the client
   is *egregiously* short, not just under the stated number. Job postings routinely
   overstate ("5+ years" roles regularly hire 3-year candidates), so a strict
   `client_years < posted_minimum` gate would reject too much of the pool the business
   depends on. Proposed tolerance: fail only if `client_years < posted_minimum × 0.6`
   (e.g. posting wants 5+, client has under 3). Anything inside the tolerance band
   flows through to weighted scoring instead (component 3 below), where being under
   the floor costs points but doesn't auto-kill the application.

**Open parameter for Window 2 / operator to confirm:** the 0.6 tolerance multiplier on
gate 8, and the exact list of "legally-gating" credentials for gate 6 (this will vary a
lot by the chosen niche — see §9 of the brief, "niche first").

---

## 2. Stage 2 — Weighted Score (only runs if all hard gates passed)

100-point scale. Chosen so it's easy for the operator to hand-score in under two
minutes and easy to explain to a client as "82/100 match."

| # | Component | Points | What it measures |
|---|-----------|--------|-------------------|
| 1 | Required-skills coverage | 40 | % of posting's *required* skills (minus anything already hard-gated) that the client's inventory covers, credited by years-of-experience adequacy per skill |
| 2 | Nice-to-have coverage | 20 | % of posting's *nice-to-have* skills the client covers |
| 3 | Seniority/level fit | 15 | Client's total relevant years + most recent title level vs. the job's implied level — peaks at a good fit, tapers at both under- and over-qualified extremes |
| 4 | Location/remote soft fit | 10 | Full points for exact match (remote↔remote, in-market on-site); partial for commutable/hybrid-compatible when the client didn't flag it as absolute |
| 5 | Compensation fit | 10 | If range listed: points scaled by how far the range midpoint sits above the client's floor. If range NOT listed: neutral score (6/10, not 0) — silence isn't a strike, but flag "salary unconfirmed" downstream in the client-facing copy |
| 6 | Screening-question compatibility | 5 | Cross-check posting's screening questions against the client's answer bank/exclusions for soft friction (not already caught by a Family A hard gate) |

**Why required-skills coverage gets 40 of 100 points:** it's the single load-bearing
signal for "genuinely qualified" — the brief's entire moat claim ("a real 'are you
actually qualified' judgment") rests on this component more than any other. Giving it
less weight would let a job pass on the strength of nice-to-haves + good salary despite
missing what the posting actually requires, which is exactly the "keyword-match and
spray" failure mode the brief explicitly positions Shortlist against.

### Why over-qualification costs points (component 3)
Being wildly overqualified isn't free — employer ATS systems frequently
auto-filter/reject overqualified candidates, and every application spent on a job the
client won't hear back from burns one of the "25 qualified applications" the risk-
reversal promise is denominated in. The rubric should treat "too senior" as a real cost,
not just "too junior."

---

## 3. Score bands / pass-fail thresholds

- **≥ 75 → Qualified, apply.** Counts toward the "25 jobs" commitment.
- **55–74 → Borderline, operator review.** Flagged in the tracker with full sub-scores
  shown; not auto-applied, not auto-rejected. Operator's decision + a required
  free-text reason gets logged either way.
- **< 55 → Not qualified, auto-reject.** Logged with reason, no operator time spent.

**Why 75, not something stricter or looser:** the risk-reversal promise ("if we can't
find 25 jobs you're genuinely qualified for, you don't pay") means the gate can't be so
strict that hitting 25/month becomes rare — that breaks the business model, not just the
client experience. But it also can't be loose enough to undercut "fewer, better," which
is the entire stated moat. With required-skills coverage alone worth 40 of the 100
points, a job mathematically cannot clear 75 without covering the large majority of what
the posting actually asks for — the threshold is only reachable by a genuinely
strong-fit job, even generously scored on the softer components.

**Why keep a borderline band at all, rather than a single hard cutoff:** Phase 1 is
explicitly manual (spec §1, §3) — the operator's judgment is a real asset that a
first-pass rubric shouldn't try to fully replace yet. The borderline band gives that
judgment a bounded, structured place to operate, instead of either ignoring the rubric
or treating it as absolute. It also becomes the training signal for Phase 2 (the
automated Tool) — every operator override, with its logged reason, is data about where
the v1 thresholds were wrong.

---

## 4. Auditability — what gets logged per scored job

**Correction (v1.1, flagged by Window 2 / subcon_brand):** the original draft used the
same "two lowest-scoring components" string for both the internal rejection reason and
the client-facing pass copy. That's backwards for passes — a client should see why a
job is a *strong* match, not which components happened to be weakest. Split into two
distinct outputs, generated from the same underlying sub-scores:

- **Reject / borderline reason** (internal, operator- and audit-facing): built from the
  **two lowest-scoring components**, or the specific hard-gate name if the job was
  hard-gated (a named hard-gate failure always takes priority over weighted sub-scores
  as the stated reason — it's the cleanest, most legible explanation). This is what
  answers "why wasn't this shown to me" or informs the operator reviewing a borderline
  job.
- **Pass reason** (client-facing, subcon_brand's card-copy data source): built from the
  **highest-scoring components**, generated only once a job clears the ≥75 threshold
  (or a borderline job is promoted to "apply" by operator override — regenerate the
  pass-style reason at that point, since it's now going in front of the client).

**Normalize before ranking, don't compare raw points.** The 6 components have different
point ceilings (40/20/15/10/10/5), so ranking by raw score would make required-skills
coverage dominate "highest" on almost every job regardless of how the job actually
performed there, making the card copy repetitive across jobs. Rank by **% of each
component's max** instead (e.g. 8/10 compensation = 80%, 30/40 required-skills = 75% —
compensation is the stronger relative performance despite fewer raw points).

**Pass reason selection logic:** take up to the top 2 components by %-of-max, but only
include a component if it scores ≥80% of its own max — a component that's merely the
"least bad" of a mediocre set shouldn't be presented to the client as a selling point.
In practice this rarely leaves fewer than 1 candidate, since required-skills coverage
alone is 40 of the 100 points and a passing job (≥75 total) is very likely to have
scored highly there. Fallback: if literally nothing clears 80%, use the single
highest-scoring component regardless (edge case, should be rare).

**Reject/borderline reason selection logic:** no filtering — always surface the actual
two lowest %-of-max components, since the point is diagnostic, not persuasive.

For every job that reaches scoring (pass, borderline, or hard-gate reject), record:

- Which hard gates were checked, and pass/fail for each (Family A / Family B, by name)
- The 6 sub-scores (raw and %-of-max) and the final total
- Band assigned (qualified / borderline / reject)
- The reason string appropriate to the band, per the split logic above
- For borderline jobs where the operator's action disagrees with the score-implied
  default: a required free-text override reason (and, if promoted to apply, a
  regenerated pass-style reason for card copy)

This is what makes a rejected job explainable rather than "the algorithm said no" — the
explicit design goal called out in the consulting brief. It also means the tracker
(spreadsheet or JSON/MD file, per spec §3, still undecided) needs at minimum these
columns/fields: hard-gate results, 6 sub-scores (raw + %-of-max), total, band, reject
reason string, pass reason string, operator override + reason.

**Data contract for subcon_brand:** card copy should consume `pass_reason_components`
— an ordered list of `{component_name, pct_of_max}` (length 1–2, ≥80% filter applied,
highest first) — rather than a pre-formatted sentence, so brand controls the actual copy
voice/template (e.g. "Strong match on required skills (92%) and comp (85%)" vs.
whatever tone subcon_brand lands on) instead of qualgate dictating client-facing prose.

---

## 5. Business constraints that shaped these numbers (so they're not arbitrary)

- **Risk-reversal promise** ("don't pay if we can't find 25 qualified jobs") is the
  reason the pass threshold (75) and the years-of-experience tolerance (0.6×) are
  deliberately *not* maximally strict — the gate has to be achievable at volume, not
  just defensible in principle.
- **"Qualify the client too... protects results + refunds"** (brief, §3) — this rubric
  covers job-side qualification only. A separate, smaller client-intake gate (can we
  realistically win for this person at all, before onboarding) is implied by the brief
  but out of scope for this draft — flagging it as a related but distinct piece Window
  2 may want to scope next.
- **"Fewer, better" as the moat** (brief, §1) — this is why required-skills coverage
  is weighted higher than every other component combined-ish (40 of 100), and why hard
  gates exist at all rather than pure weighted scoring — a job that fails work
  authorization or an absolute exclusion should never be rescued by a good salary
  score.
- **Niche-first** (brief, §9) — the exact hard-gate parameters (which credentials are
  "legally-gating," what counts as a foundational vs. peripheral skill) are
  niche-dependent and can't be fully finalized until the beachhead role/industry (brief
  §10, open decision) is picked. This draft's thresholds are meant to be a portable
  starting point, tuned once the niche is chosen.

---

## 6. Open items for Window 2 / operator to react to

1. Confirm or adjust the pass/borderline/reject cut points (75 / 55).
2. Confirm or adjust the years-of-experience tolerance multiplier (0.6×) on hard gate 8.
3. Confirm the list of "legally-gating" credentials once the beachhead niche is picked.
4. Decide whether unlisted-salary should be scored neutral (6/10, current proposal) or
   excluded from the denominator entirely (rescale the other 5 components to fill 100).
5. Decide whether the client-side "should we take this client" gate is in scope now or
   deferred — see §7 for a first-pass sketch, drafted proactively below.
6. Confirm the tracker fields needed to support the auditability log in §4, since the
   tracker format itself (spreadsheet vs. JSON/MD) is still an open spec question.

---

## 7. Client-intake gate — first-pass sketch

**Note:** Window 2 flagged having asked for this earlier; that message never reached
qualgate cleanly (a single stray, apparently-truncated character was the only thing
that landed on this end). Rather than block on a resend, here's a sketch built from the
brief's own language — flag anything below that doesn't match what was actually asked
for, and I'll revise.

This is a **one-time, pre-onboarding gate on the client**, separate from the per-job
gate above — it answers "should we take this person on as a subscriber at all," not
"is this specific job a match." Directly motivated by the brief: *"Qualify the client
too — only take who you can win for; protects results + refunds."*

**Why it matters mechanically:** the per-job gate (§1–3) can be perfectly well-designed
and still fail the business if it's run against a client who structurally can't clear
25 qualified jobs/month — wrong niche for their background, unrealistic floor, or an
exclusion list that guts the market. That failure mode isn't a per-job scoring problem;
it's a client that should never have been onboarded, and it's the direct driver of
refund exposure.

### Hard gates (fail → don't onboard, or onboard with an explicit expectation-reset conversation first)
1. **Structural work-authorization mismatch** — client's status is essentially
   unsupportable across the *entire* target niche (not just one posting), e.g. needs
   sponsorship in a market segment where sponsorship is rare-to-never offered.
2. **Salary floor unrealistic for profile** — floor sits meaningfully above what the
   client's actual skills/experience level commands in the target titles/market. This
   is the single biggest predicted driver of "can't find 25 qualified jobs" failures,
   so it's worth catching before charging, not after.
3. **Structurally thin market** — target titles/locations don't generate enough real
   posting volume in the niche to plausibly source 25 qualifying jobs/month at any
   reasonable per-job pass rate.
4. **Exclusion list too broad** — client's company/industry exclusions eliminate most
   of the realistic postings in their niche (e.g. excluding the handful of employers
   that make up most of the niche's volume).

### Soft signal: estimated qualified-volume check
Before onboarding, run a lightweight sample — pull a handful of real current postings
in the client's target titles/locations and run them through the Stage-1 Family B hard
gates only (skills, years, work auth) using the client's actual inventory. If the
projected pass rate can't plausibly reach ~25/month at the volume of postings that
exist in that niche, that's a flag to have an adjustment conversation with the client
(broaden locations, adjust floor, widen titles) *before* they're charged, rather than
discovering it three weeks into a subscription.

### Open questions this raises
- Does this run purely on operator judgment in Phase 1, or does it warrant its own
  lightweight scoring pass like the per-job gate? Given intake volume is just 3 clients
  right now, a checklist the operator eyeballs manually is probably sufficient for
  Phase 1 — codifying it as a scored rubric is more valuable once niche + Tool (Phase 2)
  are further along.
- Where does this live relative to intake (§2.1 of the spec)? Proposal: run it as the
  last step of intake, after the abstraction layer (§2.2) is built from the raw resume,
  since the volume-check sample needs the structured skills inventory to run against.
