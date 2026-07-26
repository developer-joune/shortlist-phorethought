# Shortlist client feed — layout spec v1 (first pass)

Owner: subcon_ui (visual/layout only — copy/tone owned by subcon_brand, coordinate before finalizing
any client-facing strings shown below; they're placeholders to convey structure, not approved copy).

**Medium decided 2026-07-25**: static, per-client **webpage** — regenerated and reuploaded by the
operator each update cycle, not a live app/dashboard (still honors the no-GUI-dashboard constraint,
spec §2.8/§4). No email fallback needed. This unblocks full visual richness below: real shadows/radius,
an actual SVG step-tracker, no Outlook table-CSS constraints.

---

## 1. Card anatomy — "one job = one card"

```
┌─────────────────────────────────────────────────┐
│  [Logo/initial]  Company Name           2d ago   │  ← header row
│                                                   │
│  Senior Product Designer                         │  ← job title (largest text in card)
│                                                   │
│  ┃ Matches on 4/5 must-haves — Figma, design      │  ← qualification line (accent-tinted
│  ┃ systems, 5+ yrs B2B                            │    strip, left border in accent color)
│                                                   │
│  [Remote] [$140–170k] [San Francisco]             │  ← meta chips row
│                                                   │
│  ● ─── ● ─── ○ ─── ○     Applied → Interview      │  ← status step-tracker
│                                                   │
│  ─────────────────────────────────────────────   │
│  View tailored resume →           Applied Jul 22  │  ← footer / action row
└─────────────────────────────────────────────────┘
```

Elements, top to bottom:

- **Header row**: 32–40px company avatar (logo if available, else initial-on-tint fallback like
  Slack/Linear use) + company name (medium weight) + relative timestamp, right-aligned, muted.
- **Job title**: the single largest/heaviest text in the card — this is what the eye should land on
  first, same way a post's headline or a person's name anchors a feed item.
- **Qualification line**: this is the differentiator and deserves its own visual treatment, not just
  another line of body text — it's the surfaced output of the qualification gate (spec §2.4), the one
  piece of information competitors' keyword-match tools can't produce. Rendered as a distinct block
  (accent-colored left border + faint accent-tinted background), not plain paragraph text.
- **Meta chips**: location, salary, remote policy as small pill-shaped tags — scannable, not prose.
- **Status indicator**: see §3 below.
- **Footer**: single primary action + a secondary date/meta detail, quiet styling (not another CTA-style
  button) — keeps one clear action per card.

Card container: rounded corners, generous internal padding, subtle elevation (border or 1-level shadow,
not both) so it reads as a distinct object sitting on the page background — this is what makes a feed
feel like a feed instead of a list. Cards stack vertically, single column even on desktop — resist the
temptation to grid them 2–3 across; a single-column stream is what makes it feel like a feed rather than
a dashboard/table, which is the thing we're explicitly steering away from (spec §4).

## 2. Spacing & type scale

**Spacing** — 4px base unit, constrained scale so nothing gets arbitrary:
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`

- Card internal padding: 20 (mobile) / 24 (wider viewport)
- Gap between elements inside a card: 8–12
- Gap between cards: 16 (mobile/email-safe) / 20–24 (webpage, wider canvas)
- Page/container margins: 16–24

**Type scale** — small fixed set, not a fluid/continuous scale (this is a feed of compact cards, not a
long-form reading surface, so we don't need many steps):

| Role | Size | Weight |
|---|---|---|
| Feed greeting/header ("3 new matches this week") | 22–24px | Semibold |
| Job title (per card) | 17px | Semibold |
| Company name | 14–15px | Medium |
| Qualification line | 14px | Regular |
| Meta chips / labels | 12–13px | Regular, muted color |
| Timestamps, counts | 11–12px | Regular, muted color |

One font family, sans-serif, system-stack for reliability (`-apple-system, "Segoe UI", Roboto, Helvetica,
Arial, sans-serif` or similar) — matches the "clean sans-serif" direction in spec §6 and avoids webfont
loading issues in email.

## 3. Color

Per spec §6's own suggested starting point — one neutral background, one accent, don't overdesign:

- **Page background**: warm off-white/neutral (not stark white — stark white against white cards is
  what makes clinical dashboards feel clinical; a slightly warm neutral canvas is what lets white/near-
  white cards read as "lifted" objects).
- **Card surface**: white or barely-off-white, sitting on the warm neutral canvas.
- **One accent color**: warm (amber/gold or terracotta range reads as "personal warmth" without
  reaching for Instagram's pink/orange gradient or LinkedIn's blue — both are cited IP-risk colors to
  stay clearly away from). Used *sparingly and consistently*: qualification-line accent, primary CTA
  text/underline, filled steps in the status tracker, and gamification numerals. If it shows up
  everywhere, it stops functioning as an accent.
  - **Two shades of the accent, not one** (added after subcon_a11y's contrast review): the accent as a
    *background/border* (qual-line tint, filled step dots) and the accent as *text* (CTA link, stat
    numerals) need different lightness values — the background-safe shade fails WCAG contrast at
    text sizes. Keep one hue, ship a darker `--accent-text` variant for anything rendered as text.
- **Text**: near-black for primary content, mid-gray for secondary/meta — two tones is enough. (Muted/
  timestamp text uses the same secondary tone rather than a third, lighter gray — a third tone was the
  one that failed contrast; reuse over introducing more grays.)

## 4. Status indicator — step-tracker (recommended) vs. ring

Spec §6 names both a step-tracker and a ring as options. Recommending **step-tracker** as the primary
direction, for a reason worth flagging explicitly:

A circular progress ring wrapped around an avatar is *extremely* recognizable as Instagram's story ring
— that's precisely the literal-clone risk the spec calls out by name (§4, §6). A horizontal segmented
step-tracker (the pattern shipping/order-tracking UIs use — "Ordered → Shipped → Out for delivery →
Delivered") gets us the same "visual progress, not a text label" goal without borrowing recognizable IP,
and it's a more original fit for a job-application lifecycle anyway (linear stages, not a single
percentage).

Proposed stages: `Applied → Under review → Interview → Offer` (4 nodes; exact stage names/count belong to
subcon_qualgate/subcon_dataschema's status model, not to this layout spec — this is a placeholder set to
size the component).

Rendering: small filled/outlined circles connected by a line, current+past stages filled in accent color,
future stages outlined/muted. Optionally add a one-word label under the *current* stage only (not all
four, to avoid clutter). Compact enough to sit inside the card footer area without dominating it.

If a literal ring is still wanted somewhere in the product (e.g. as a small profile-level "applications
this month" completion ring rather than per-card status), that's a safer place for it — a ring showing
progress toward a personal goal reads as a fitness-app/goal-tracker pattern, not a stories pattern,
because it's not wrapped around a face/avatar.

## 5. Light gamification

Per spec §6, a feed-level stat strip above the card stream (not per-card, so it doesn't compete with the
job title for attention): e.g. "12 applications sent this month · 2 responses this week." Same type
scale as the feed greeting, accent color used only on the numerals.

## 6. Medium — resolved

Webpage (static, per-client, operator-regenerated). See decision note at top. Implementation now
proceeds in real CSS/SVG — see `feed-prototype-v1.html` alongside this file for a coded version of the
card + step-tracker.

## 7. Coded prototype + copy coordination

`feed-prototype-v1.html` (same folder) — self-contained, open directly in a browser. Three cards showing
the step-tracker at stages 1/2/3 of 4. Copy in the prototype is pulled from subcon_brand's v1 tone/voice
guide (`mindmaking/chat_shortlist_phorethought_subcon_brand/_a_a_notes/note_000/deep_dive/tone-voice-guide.md`,
their worked "Maria / Meridian Health" example) rather than hand-written here — per the brief, copy stays
brand's call, this file only supplies structure/visual treatment for it to sit in.

One thing not yet locked: status stage names (`Applied / Under review / Interview / Offer`) are
placeholders pending subcon_qualgate's actual status model.

## 8. A11y pass v1 (applied)

subcon_a11y reviewed the prototype (`design/a11y-review-feed-prototype-v1.md`) — verdict on the
step-tracker's `role="img" aria-label="…"` pattern was **sound, keep it** (status isn't conveyed by
color/shape alone; the label carries the same info plus the "step X of 4" detail). Five fixes applied
directly to `feed-prototype-v1.html`:

1. Contrast — see §3's new "two shades of accent" note; `--text-muted` merged into `--text-secondary`'s
   tone, added `--accent-text` as a darker text-safe variant of the accent.
2. `.feed-greeting` is now an `<h1>` (was a bare `<p>` with no page heading above the three job-title
   h2s).
3. `.feed` wrapped in `<main>`; `.card-stream` has `role="feed"`; each card has `aria-posinset`/
   `aria-setsize` (WAI-ARIA Feed pattern — worth having in place before card volume scales to the
   $99-tier's ~25/month).
4. Each "See the full match card →" link now has a distinguishing `aria-label` (job + company).
5. `.avatar` initials are `aria-hidden="true"` (redundant with the adjacent company name).

Two drift risks flagged by the reviewer for whoever wires this to real data, noted inline in the
prototype: the step-tracker's "step X of 4" and the cards' `aria-posinset`/`aria-setsize` are all
currently hand-typed to match this static 3-card demo — both need to be computed from the same array
that drives the rendered cards/dots once real qualgate/data-schema output exists, not maintained as
separate strings.
