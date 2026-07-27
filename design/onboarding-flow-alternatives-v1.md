# Onboarding flow — alternatives for the operator to choose from (v1)

Status: **consult, not a decision.** Three real alternatives with reasoning below, plus an
explicit answer on the "tier zero" shape question. Nothing here gets built until the operator
picks a direction. subcon_brand is getting the same consult in parallel for positioning/copy —
flow and copy need to agree before this goes back as a final set of options (see coordination
note at the end).

## Correction to the problem framing, before the options

The operator's framing was "Get started goes straight to the login wall." Checked the actual
current page (`marketing/index.html`) — this is true for *some* CTAs but not all, and the real
picture is more specific than "no pricing before login":

- Nav bar "Get started" (line 470) → straight to `/design/login.html`. Bypasses everything.
- Hero "See if I qualify" (line 484) and final-CTA "See if I qualify" (line 598) → already
  anchor to `#pricing` first. These two don't have the operator's complaint at all today.
- **Both pricing-card CTAs** — "Get my free peek" ($0 card) and "Get started" ($99 Core card) —
  → also go straight to `/design/login.html`, with no differentiation between them. The $0 card's
  own copy says "no commitment," but its button demands the exact same login step as the paid
  tier.

So the real gap is narrower than "pricing is skipped" — pricing already exists and two of four
CTAs already route through it. The actual problems are (a) the nav CTA still skips it, and (b)
**nothing downstream of pricing currently reflects free vs. paid at all** — every path converges
on the same login form.

**More load-bearing fact: `design/login.html` is sign-in only.** There is no self-serve
signup/account-creation UI anywhere in the product today (confirmed by reading the file — one
form, `email`/`password`, posts to `/api/auth/client/login`). The nav's own code comment says as
much: clients are currently onboarded by the operator; login is "the closest real, working
destination today," a stand-in until real signup exists. This means **every option below,
including doing nothing else, already has a hidden prerequisite**: a real signup path has to get
built regardless of which IA option is chosen, or all four CTAs are currently sending new
visitors to a form they cannot actually use. That's a Window 2/backend lift, not a flow decision
— flagging it because it changes the relative cost of the options below (option 2 turns out to
need it *least*, see below).

---

## Option 1 — Get started → pricing → then login/signup

Show value and cost before asking for commitment.

**Reasoning:** Lowest-effort of the three, because it's already half-built — the hero and final
CTA already do exactly this. Fixing this option is really just "make the nav CTA behave like the
other two already do" (point it at `#pricing` instead of straight to login), which is a
one-line-link fix, not a redesign. It also directly answers the operator's stated problem: a
visitor sees what they'd get and what it costs before hitting any account-creation step.

**Where it falls short:** it doesn't touch the actual complaint about "no lower-commitment step."
Pricing shows a $0 card, but clicking it still leads to the same login form as the $99 card — so
even after this fix, there's still no distinctly *lower-commitment* path, just an earlier look at
the price tag before the same wall. If the operator's real goal is "give people a taste before
asking for anything," Option 1 alone doesn't deliver that — it only delivers "don't ask for
anything without an explanation first."

---

## Option 2 — Get started → straight into a free/trial tier, no login wall for it at all

**Reasoning:** This is the most literal read of "no lower-commitment step exists" — genuinely
remove the wall for the lowest tier. It's also the option that best matches spec §6's "make
people want to come back" instinct: the least friction between curiosity and a felt result.

**Cost, weighed honestly against what's already built:** every other real feature in this product
(the feed, the operator roster, the qualification engine's output) is now reached through the
authenticated session model added in commit 83ac6fd. A truly wall-free tier means one of two
paths, and they have very different costs:
- **(a)** Build a second, parallel anonymous-intake → qualification-engine-run → results-preview
  path that never touches login at all. This duplicates real product surface (a lighter intake
  form, a preview renderer) that isn't a small addition.
- **(b)** Show something illustrative/canned instead of a live personalized result, so no backend
  run is needed. Cheap, but risks a truth-in-advertising problem: the marketing page already
  distinguishes real content from illustrative content carefully (the hero visual is explicitly
  captioned "Illustrative — not a screenshot of the real client feed"). A "free preview" that
  implies personalized qualification but is actually canned would blur that line at exactly the
  moment a visitor is deciding whether to trust the product. Worth a real look from subcon_legal
  given FTC-truth-in-advertising is already one of this project's named domains.

Ironically, option 2 is the one option that does **not** strictly require the missing signup flow
(a fully anonymous free tier needs no account at all) — but it requires either duplicate product
surface or a copy/trust risk instead. It trades one prerequisite for a different, larger one.

---

## Option 3 — Hybrid: free tier is one listed option on the pricing page, not a gate before it

**Reasoning:** This is closest to what's *already partially built*. The pricing section already
has a "Free peek" card sitting directly next to the "$99 Core" card — that layout is already the
hybrid shape the operator is describing in this option. The gap isn't structural, it's that both
cards currently funnel into the identical next step. Finishing this option means: (a) the nav fix
from Option 1 (route through `#pricing`, not around it), and (b) making the two pricing-card CTAs
actually diverge after signup exists — free-tier signup lands in a capped/free-flagged account,
paid signup lands in a full one, rather than both being indistinguishable "Get started" buttons
pointing at the same login form.

**Why this is my recommendation:** it satisfies the operator's actual complaint (value and cost
shown first, per Option 1's reasoning) *and* gives a genuinely lower-commitment path (per Option
2's goal) without Option 2's heavier build cost or trust risk — because it reuses the real,
already-working feed/login infrastructure instead of building a parallel anonymous path or
resorting to canned data. The IA here is nearly free; the remaining cost is entirely in "what does
a free-tier account actually get," which is a product/backend policy question, not a layout one.

---

## The tier-zero shape question — answered directly, not skipped

Asked explicitly whether the original "5 best-fit jobs this week" lead-magnet concept fits as
tier zero now that a real login/feed exists, or whether something else fits better. Checked
`schemas/client-profile.schema.json` to ground this rather than guessing: the full client profile
the qualification engine runs against requires `basics`, `skills`, `work_history`,
`qualification_bar`, `screening_answers`, `exclusions`, and `consent` — all required fields. That
matters directly: **a real "5 best-fit jobs" result requires nearly the same intake as the paid
service.** The original brief's lead-magnet framing implicitly assumed this would feel
low-commitment, but if it's built as a real qualification run, it isn't actually low-friction —
it's the full intake questionnaire, just without a payment step at the end. That's worth the
operator knowing explicitly, since it changes what "free" is actually buying a visitor.

Three concrete shapes, in order of increasing build cost and increasing personalization:

1. **Pre-login sample card on the marketing page itself, using illustrative content already on
   hand** (the hero visual's "Senior Data Analyst — Meridian Health" example, or a new one like
   it). Zero backend, zero intake friction, ships today. Weakest hook — it's a demo, not a result
   about the visitor, and it must stay clearly labeled illustrative (as the hero already does) to
   avoid the same truth-in-advertising concern raised in Option 2.
2. **A real, capped free tier inside the actual product** — visitor signs up (once signup exists),
   submits a real, possibly-trimmed intake, and the real qualification engine runs for them, capped
   at "5 matches" or a time window rather than ongoing service. This is my recommended shape: it
   reuses 100% of the feed/login/engine work already built, needs no parallel system, and is
   honestly personalized rather than illustrative — it just needs a policy flag (free vs. paid) on
   an account, not new product surface.
3. **A full anonymous preview path with no account at all** — the "purest" reading of the original
   lead-magnet idea, but as covered in Option 2, this means either duplicating intake+engine
   surface for anonymous users or faking the result. Highest cost, and the one most likely to
   need subcon_legal's sign-off on the wording before it ships.

Recommended pairing: **shape 1 today** (already-available assets, zero cost, closes the "no
lower-commitment step" gap immediately) evolving into **shape 2** once signup exists, rather than
building shape 3 at all.

---

## What has to happen before any of this is real

1. A self-serve signup form needs to exist — currently doesn't, for either tier. This is true
   regardless of which option above gets picked.
2. Whatever "free" ends up meaning needs an actual policy on the backend (a cap, a flag, an
   expiry) — not a UI decision, but the UI can't diverge until that exists.
3. Copy needs to agree with structure — see coordination note below.

## Coordination note for subcon_brand (per Window 2's instruction to loop in)

Flow and copy need to land together before this goes back to the operator as a finished set of
options. Specifically want brand's read on: whether "Free peek" should be renamed/reframed if it
ends up meaning "a real, capped account" rather than "a one-time preview" (shape 2 above changes
what that word is promising); and how the pricing card's existing placeholder guarantee copy
should acknowledge a free tier once one is real, without touching the guarantee wording itself
(that's still routed through legal, unchanged by this consult).

## Reconciliation with subcon_brand's positioning answer (2026-07-27)

subcon_brand's answer (`relay/window_06_subcon_brand/q_and_a/question_answer-onboarding-flow-positioning.md`)
agrees tier-zero should render as real feed cards, not a static list — no conflict there; that's
exactly shape 2 above, and it's already reinforced, not contradicted, by having a real card
component to reuse. Two things worth resolving together rather than each of us picking silently:

1. **Sequencing preference differs, and brand's reasoning changes my cost estimate.** I leaned
   toward shape 1 (illustrative, ships today) evolving into shape 2 (real, once signup exists),
   reasoning from build cost. Brand leans toward reaching a real card as fast as possible (option
   2, or a free-tier-forward option 3), reasoning from reciprocity/persuasion — "the gate sells
   itself," so the flow that gets a visitor to a real card fastest carries the most weight. That's
   a legitimate consideration outside pure engineering cost, and it changes the calculus: a
   **single-use, non-persisted engine run** (public intake → one qualification-engine call → show
   1–3 real cards ephemerally → CTA to create a real account to keep them / get more) is cheaper
   than the "duplicate parallel system" I described in Option 2 above, because it needs no
   account/session infrastructure at all, just one ungated engine call. This sits between my
   original shape 1 and shape 2 and is worth the operator seeing as its own concrete option.

2. **Open tension that needs both flow and copy sign-off, not either of us alone**: brand's copy
   instinct is "tier-zero should be literally the same mechanism at smaller scale, not a
   simulated/lesser preview" — but `client-profile.schema.json` requires `exclusions` and
   `screening_answers` (among others) for the real qualification bar/hard-gates to run in full. A
   fast anonymous intake almost certainly has to skip some of those fields to stay low-friction,
   which means the free-tier result would be a **partial-gate pass**, not literally the same
   mechanism the paid tier runs. Either (a) collect the full required intake for tier-zero too
   (matches brand's "same mechanism" framing, but reintroduces the friction this whole consult is
   trying to remove), or (b) trim the intake and be explicit in copy that this is a fast first
   pass rather than the full gate. Flagging this as the one real unresolved point between us —
   not deciding it unilaterally, since (b) is a copy/trust call as much as a flow one.

**Resolved (2026-07-27):** subcon_brand's call is (b) — trimmed intake, framed honestly as a fast
first pass rather than the full gate, with one amendment: still collect a lightweight exclusions
prompt even though `screening_answers` gets skipped. Agreed — exclusions/dealbreakers are a
handful of short toggles/selects (remote policy, excluded industries, hard dealbreakers), a small
addition to intake friction, whereas skipping them risks a false-positive "qualified" result
against a real dealbreaker — worse for trust than one extra prompt. So the trimmed-intake shape
for tier-zero is: resume/skills, target titles, location, salary floor, and exclusions; screening
answers are the one thing actually deferred to signup. Both flow and copy agree — no open items
left; ready to go back to Window 2/the operator.
