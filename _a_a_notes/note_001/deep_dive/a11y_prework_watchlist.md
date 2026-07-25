# A11y pre-work watchlist — Shortlist client-facing feed

Status: no drafts to review yet from subcon_ui or subcon_brand. This is groundwork only —
what I'll check once real drafts exist, and why. Re-review this note if the medium decision
(webpage vs. email) changes.

## Medium is still open (spec.md §3, §5.1)
Spec leans "styled feed-like email or lightweight webpage," not finalized. The two need
different accessibility playbooks entirely — this is the single biggest branch point for
my review, so I need to know which is actively being built before doing a real audit:

- **Webpage** → WCAG 2.2 applies in full: semantic HTML, ARIA where native semantics run out,
  keyboard operability, focus order/visible focus, color-contrast ratios (4.5:1 text /
  3:1 UI components), reflow at 400% zoom, name/role/value exposed to AT.
- **Email** → narrower, trickier surface. No reliable ARIA/JS support across clients (Outlook
  desktop, Gmail app, etc. strip or ignore much of it). Practical levers instead: real semantic
  markup where clients honor it (tables with proper roles as fallback, not just visual grids),
  meaningful alt text on every image (especially status/progress graphics — never empty alt on
  something conveying information), logical linear reading order (single-column, top-to-bottom;
  multi-column layouts break screen-reader order unpredictably), link text that makes sense out
  of context ("View your 3 new matches" not "click here"), no text-in-images for anything a
  screen reader needs (dollar amounts, counts, job titles), sufficient color contrast in the
  client's actual rendered palette (dark-mode email clients invert/recolor unpredictably).

**Action once drafts exist**: confirm with the builder which medium is live before reviewing —
flag immediately if a draft is being built as if it were the other medium (e.g. ARIA attributes
in an email template, or email-only patterns like text-as-image on a real webpage).

## Status/progress indicator — the spec's explicit ask (spec.md §6)
Spec calls for a visual step-tracker/ring for application status (applied → response →
interview) as part of the "social feed" feel. This is a known a11y failure pattern if built
as color/shape alone:

- Never let color be the only signal for status (WCAG 1.4.1, and just as true in email — color
  alone fails for colorblind users and anyone in a client that strips background colors/dark-mode
  remaps them).
- The status must have a **text equivalent** co-located with the visual: a word/phrase ("Applied,"
  "Awaiting response," "Interview scheduled"), not just represented via a ring fill percentage or
  icon. If it's an SVG/image-based ring on the webpage, it needs an accessible name (aria-label or
  visible adjacent text) conveying the same info the visual encodes — not just "status icon."
  If it's an image in an email, the alt text must state the actual status in words, not describe
  the graphic ("75% filled ring" is useless; "Applied — awaiting response" is correct).
- Watch for step-trackers implemented as a bare row of colored dots/icons with no labels — common
  pattern that looks clean but is meaningless non-visually. Each step needs a name and current/
  completed/upcoming state exposed as text, not just position/color in a sequence.

## Card-based feed layout (spec.md §6)
Cards are the requested pattern (company, title, one-line "why qualified," status). Things to
check once built:
- Webpage: each card should be a proper landmark/heading structure (e.g. job title as a heading,
  not just styled bold text) so screen-reader users can navigate card-to-card, not just top-to-
  bottom through undifferentiated text.
- Email: cards are usually table-based layouts — check reading order matches visual order, and
  that nested tables don't force screen readers through content in a confusing sequence (e.g.
  status before job title when visually status renders after).

## Copy tone (subcon_brand's territory, flagging for cross-check)
Spec wants personal/human copy ("We found you a match") over clinical language. No inherent
conflict with accessibility, but plain-language clarity still matters for cognitive accessibility
(WCAG 3.1.5-adjacent principle even outside strict AA) — flag if brand copy trends toward jargon,
idioms, or ambiguous phrasing that a screen-reader user or non-native-English reader would parse
differently than a sighted native-English reader skimming a styled card.

## Not yet actionable
- No real feed draft, no chosen medium, no finalized visual design (colors/contrast not set —
  spec.md §3 confirms no CSS theme/palette exists yet). Cannot check contrast ratios or actual
  markup until subcon_ui produces something concrete.
