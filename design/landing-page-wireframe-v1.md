# Marketing landing page — wireframe v1 (structure only, no visual polish)

Status: **for review before any HTML/CSS/JS** — per the new standing wireframe-first rule.
Scope: `marketing/index.html`, the public-facing acquisition page. Separate product surface
from the client feed (`design/feed-prototype-v1.html`) — see root `index.html`'s "The Product"
section, where this plugs into the placeholder card once built.

This is sequencing/layout/hierarchy only. No copy is final (bracketed placeholders throughout —
real copy is subcon_brand's call), no color/type/animation decisions are made here (that's the
tech-choice doc + implementation pass, after this is reviewed).

---

## Section order (top to bottom) and why

```
┌──────────────────────────────────────────────────────────┐
│ NAV                                                        │
│ [Shortlist wordmark]                    [How it works] [CTA]│
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ HERO                                            (fold 1)  │
│                                                            │
│   [eyebrow: "Phorethought"]                                │
│   [H1 — the core promise, e.g. "You'll never fill out     │
│    another job application"]                               │
│   [subhead — one line, effort not outcome]                 │
│   [primary CTA button]   [secondary link: "See how it      │
│    works"]                                                  │
│                                                            │
│              [hero visual placeholder —                    │
│               abstracted feed-card preview, NOT a          │
│               screenshot of the real feed prototype]        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ THE PROBLEM (short, 2-3 lines, no box chrome —             │
│ just sets up why this matters before the pitch)            │
│   [one line naming the burned-out/mass-application pain]   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ HOW IT WORKS                              (scroll-reveal   │
│                                             candidate: steps│
│                                             stagger in as   │
│                                             the section     │
│                                             enters view)    │
│                                                            │
│  [step 1]      [step 2]      [step 3]      [step 4]         │
│  icon/box      icon/box      icon/box      icon/box         │
│  "Tell us      "We find +    "We tailor    "You check       │
│   about you"    qualify"      + apply"      your inbox"     │
│  1-line         1-line        1-line        1-line          │
│  caption        caption       caption       caption          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ THE QUALIFICATION GATE  (the moat — deserves its own        │
│ prominent section, not a bullet under "how it works")       │
│                                            (scroll-reveal    │
│                                             candidate:       │
│                                             comparison       │
│                                             reveals side-    │
│                                             by-side)         │
│                                                            │
│   [headline: "We don't spray. We snipe."]                   │
│                                                            │
│   ┌───────────────────┐   ┌───────────────────┐             │
│   │ OTHER SERVICES      │   │ SHORTLIST          │           │
│   │ [keyword-match,     │   │ [real qualification│           │
│   │  mass-apply,        │   │  judgment, fewer,  │           │
│   │  spray-and-pray]    │   │  better]           │           │
│   └───────────────────┘   └───────────────────┘             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ SOCIAL PROOF                    [CONTENT GAP — flagged     │
│                                  below, not designed as if  │
│                                  it exists yet]             │
│   [testimonial placeholder] [testimonial placeholder]        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ PRICING TEASER                  [promise-language-         │
│                                   sensitive — see note      │
│                                   below]                    │
│                                                            │
│   [Free peek]      [Done-for-you Core — highlighted]         │
│   $0                $99/mo                                  │
│   1-line             1-line + the guarantee, PRECISE         │
│   [CTA]              wording only (see note)                │
│                       [CTA]                                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ FINAL CTA (full-width, high-contrast band)                  │
│   [restated headline]                                        │
│   [primary CTA button]                                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ FOOTER                                                       │
│   [Shortlist / Phorethought byline]  [minimal legal/nav     │
│    links]  [copyright]                                       │
└──────────────────────────────────────────────────────────┘
```

## Hierarchy notes

- **Hero and "The qualification gate" are the two sections that carry the most visual weight.**
  Hero sells the promise; the gate section sells *why it's different* — that's the actual moat
  (per the business brief, §1), so it shouldn't be reduced to a bullet point inside "how it
  works." Everything else (problem framing, steps, pricing, proof) supports one of those two.
- **"How it works" is deliberately generic-process-shaped** (numbered steps, icon + short
  caption) — a well-established landing-page pattern, not something to reinvent. The scroll-
  reveal treatment here is a good, low-risk candidate: staggered step reveals are a common,
  tasteful use of scroll-triggered animation without tipping into gimmick territory.
- **The gate comparison (other services vs. Shortlist) is the one section where scroll/reveal
  treatment could do real narrative work** — e.g., the two columns entering separately, or the
  "other services" column visually receding while "Shortlist" holds — worth the extra
  engineering attention the operator asked for ("real hero + high-end scroll-driven feel")
  landing somewhere with actual narrative payoff, not just decoration.

## Flags — content gaps and coordination needed (not blocking the wireframe review, but before build)

1. **Social proof section has no real content yet** — no client testimonials exist (per
   `legal/promise-language-review.md`, no client-facing copy exists beyond the source brief).
   Options: launch without this section, launch with a placeholder ("early clients — check back
   soon"), or hold the whole page until at least one testimonial exists. Flagging for Window 2 /
   operator to decide — not assuming an answer.
2. **Pricing teaser touches the 25-application guarantee directly** — `legal/refund-policy.md`
   and `legal/promise-language-review.md` are explicit that any marketing use of that guarantee
   must carry its precise terms (qualified + billing-period + per-client scoping), not a
   stripped "guaranteed 25 jobs or it's free!" version. This section's copy needs a legal-aware
   pass, not just a brand-voice pass — flagging so it doesn't get drafted in isolation.
3. **Hero visual is a placeholder, not a screenshot of the real feed prototype** — the feed is a
   separate, already-approved product surface; reusing its actual screenshot here would visually
   merge two things Window 2 just had me structurally separate (see the recalibration that
   removed cross-navigation between the internal docs and the feed). An abstracted/illustrative
   visual, not a literal screenshot, keeps that separation intact.
4. Nav + footer are intentionally minimal in this pass — no attempt yet to decide what else
   might live in a real site nav (About? Contact?) since that's beyond what's been scoped.

## What this wireframe does NOT decide (comes after review)

- Visual system specifics beyond "reuse the same tokens as the feed" (exact hero imagery,
  spacing, type scale execution)
- Which scroll/animation library implements the reveals flagged above — that's
  `design/landing-page-tech-choice.md`, written after this structure is approved, since the
  choice should follow from what these sections actually need rather than the reverse
- Final copy anywhere — subcon_brand's territory, coordinated once structure is settled
