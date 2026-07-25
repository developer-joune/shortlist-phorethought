# A11y review — feed-prototype-v1.html

Reviewer: subcon_a11y. Medium confirmed by feed-layout-spec-v1.md §"Medium decided 2026-07-25":
static per-client webpage, not email — so this review applies WCAG 2.2 in full (no email-client
markup constraints). Findings ranked by severity; each has a concrete fix.

## 1. Two color-contrast failures (WCAG 1.4.3, confirmed by computed ratio)

Both colors are used as **text** below the 18px/24px (or 14pt bold) "large text" threshold, so
they need ≥4.5:1 against their background. Computed via relative luminance:

- **`--text-muted: #9a9384`** on white card surface → **~3.05:1**. Fails. Used on
  `.card-timestamp` ("Today", "3d ago", "1w ago", 12px) and `.card-footer-meta` ("Applied Jul 25",
  12px). These are small, so the bar is the full 4.5:1, not 3:1.
- **`--accent: #c07830`** used as text color on white → **~3.52:1**. Fails. Used on
  `.card-action` link text ("See the full match card →", 13px semibold — still below the 14pt/
  18.66px bold "large text" cutoff) and `.stat-strip strong` (the "7" / "1" numerals, same size).

Fix: darken both until they clear 4.5:1 against `#ffffff`/`--surface` (e.g. text-muted needs
roughly the same luminance range as `--text-secondary #6b6455`, which already passes at ~5.86:1 —
consider reusing that tone at a lighter weight instead of a third gray; accent needs to drop
several steps in lightness before it still reads as "warm amber" — a check-as-you-go tool like a
contrast checker against the final chosen hex is worth running before locking the palette).
Note the *background* uses of accent (qual-line border/tint, filled step dots) aren't subject to
this text rule and are fine as-is — only accent-as-text needs to change.

Everything else checked passes comfortably: `--text-primary` on white (>15:1), `--text-secondary`
on white and on canvas (~5.86:1 / ~5.35:1), and the qual-line text `#4a3d29` on its tinted
background `#f5e8d8` (~8.75:1).

## 2. Missing heading hierarchy (WCAG 2.4.6 / 1.3.1)

Three `<h2 class="job-title">` elements exist with no parent `<h1>` anywhere on the page — the
feed greeting ("Hey Maria, here's your week") is a plain `<p>`. Screen-reader users navigating by
heading (a very common technique) land on three sibling h2s with no page-level heading above
them. Fix: make `.feed-greeting` an `<h1>`.

## 3. No landmark / feed structure (WCAG 1.3.1, and a good fit given the product's own metaphor)

`.feed` isn't wrapped in `<main>`, and `.card-stream` is a plain `<div>` of `<article>`s. `<article>`
per card is the right semantic choice already — no change needed there. But since this product
literally *is* a feed of independent items, this is a clean match for the WAI-ARIA **Feed pattern**:
`role="feed"` on the stream container, `aria-posinset`/`aria-setsize` (or just accessible article
names) on each article. Worth adopting now, before the card count grows to the $99-tier's ~25/month
volume, since that's exactly the scale where landmark/feed navigation stops being optional and
starts being the primary way a screen-reader user skims. Minimum fix regardless: wrap `.feed` in
`<main>`.

## 4. Identical link text across cards (WCAG 2.4.4)

All three cards use the exact link text "See the full match card →". A sighted user disambiguates
by which card the link sits in; a screen-reader user pulling up a flat links-list (a standard AT
feature) sees the same three words three times with nothing to tell them apart. Fix: give each
link an accessible name that includes the distinguishing info, e.g.
`aria-label="See full match card — Senior Data Analyst at Meridian Health"`, or point
`aria-labelledby` at the card's own `h2` plus the link text.

## 5. Avatar initial duplicates adjacent text (minor)

`<div class="avatar">M</div>` sits immediately before `<span class="company-name">Meridian
Health</span>` — a screen reader reads "M Meridian Health," and the initial adds no information
company-name doesn't already give. Fix: `aria-hidden="true"` on `.avatar`.

## 6. The thing subcon_ui flagged for review: `role="img"` + `aria-label` on the step-tracker

Verdict: **sound pattern, keep it** — and importantly, it already clears the bar my pre-work
watchlist flagged as the main risk for this component: status is *not* conveyed by color/shape
alone. There's a visible `.status-label` text sibling ("Applied" / "Under review" / "Interview")
plus the `aria-label` carries the same info *and* the "step X of 4" progress detail the visible
label doesn't include — visual users get that detail by counting filled dots, screen-reader users
get it as text. That's the correct equivalence, not just a decorative fallback.

One thing to watch once this wires to real data: the "step X of 4" count in the `aria-label` is
currently hand-typed per card rather than derived from the same source as the rendered dots.
Subcon_qualgate's actual status model isn't locked yet (per feed-layout-spec-v1.md) — when it
lands, make sure the stage count in the label is computed from the same array driving the dots,
not kept as a separately-maintained string, or the two will drift out of sync silently.

## Not flagged (checked, no issue)

- DOM order matches visual order in `.status-row` (label before tracker) — no reading-order
  mismatch.
- No CSS removes the default link focus outline — fine as-is; flagging only so it's remembered
  once real focus styling gets designed (a replacement must clear the 3:1 non-text contrast bar,
  not just be removed).
- Layout is single-column/flex with no fixed widths beyond the 36px avatar — no apparent reflow
  risk at narrow viewports or 400% zoom, though this wasn't tested in an actual browser.
