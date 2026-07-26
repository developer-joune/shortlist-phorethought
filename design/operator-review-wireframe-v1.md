# Operator review interface — wireframe v1 (structure only, no visual polish)

Status: **for review before any HTML/CSS/JS** — per the new standing wireframe-first rule.
Scope: an **operator-facing** interface — distinct from the client feed and the marketing
landing page (both client/prospect-facing). Built directly from subcon_qualgate's workflow spec
(`_a_a_notes/note_000/deep_dive/qualification_gate_rubric_v1.md` §8), not guessed. Starting
scope is the borderline-review workflow only, per Window 2's instruction — client-roster
tracking is a likely-future extension of this same interface, not designed here yet.

Every piece of information and every decision option below is sourced from §8.1–8.3. Where this
wireframe adds something §8 didn't specify (the queue/list screen), it's called out explicitly.

---

## Screen 1: Borderline queue (not in §8, added because the operator needs a way to reach a
specific item — kept deliberately minimal, flagged for confirmation)

```
┌──────────────────────────────────────────────────────────┐
│ Borderline reviews                          [4 pending]     │
│──────────────────────────────────────────────────────────│
│ Job @ Company            Client        Score    Flagged     │
│──────────────────────────────────────────────────────────│
│ Senior DA @ Meridian     Maria T.       66/100   3d ago  →   │
│ BI Analyst @ Norwell     Maria T.       61/100   1d ago  →   │
│ PM @ Ferro Group         James K.       59/100   5d ago  →   │
│ Ops Lead @ Stackline     James K.       72/100   2h ago  →   │
└──────────────────────────────────────────────────────────┘

Empty state: "No borderline jobs waiting on you."
```

**Open question flagged for qualgate/Window 2, not assumed:** sort order. Oldest-flagged-first is
the working default here (keeps the backlog from silently aging — consistent with §8.2's "no
snooze state, must resolve" design intent), but this wasn't specified in §8 and should be
confirmed rather than treated as settled.

---

## Screen 2: Borderline review (detail) — the actual reviewed workflow, per §8.1–8.3

```
┌──────────────────────────────────────────────────────────┐
│ ← Back to queue                                              │
│                                                              │
│ Senior Data Analyst @ Meridian Health                        │
│ [68/100 — Borderline]   Remote · Chicago, IL preferred        │
│──────────────────────────────────────────────────────────│
│ WHY THIS IS BORDERLINE                        (§8.1.2 —      │
│ auto-generated, two lowest %-of-max components, surfaced      │
│ first — fastest answer to "why")                              │
│  [reason string, e.g. "Seniority fit (40%) and compensation   │
│   fit (50%) are the weakest components"]                      │
│──────────────────────────────────────────────────────────│
│ FULL SCORE BREAKDOWN                          (§8.1.3 — all   │
│ 6, not just the flagged two)                                   │
│  Required-skills coverage      28/40   70%   [————————·—]     │
│  Nice-to-have coverage         14/20   70%   [————————·—]     │
│  Seniority/level fit            6/15   40%   [————·——————]    │
│  Location/remote fit            9/10   90%   [—————————·]     │
│  Compensation fit                5/10   50%   [—————·—————]   │
│  Screening-question fit          4/5    80%   [————————·—]    │
│  TOTAL                         66/100                          │
│──────────────────────────────────────────────────────────│
│ HARD GATES — all passed                       (§8.1.4 —       │
│ compact strip, shown even though nothing failed, for trust/   │
│ audit)                                                          │
│  ✓ Excluded company/industry     ✓ Location deal-breaker       │
│  ✓ Schedule deal-breaker         ✓ Salary floor                │
│  ✓ Work authorization            ✓ Required certification      │
│  ✓ Required hard skill present   ✓ Years-of-experience (within │
│                                     0.6× tolerance band)         │
│──────────────────────────────────────────────────────────│
│ JOB POSTING                  │  CLIENT PROFILE (§8.1.6 —        │
│ (§8.1.5)                     │  matched skills + years, shown   │
│                               │  alongside for direct compare,  │
│                               │  not just referenced by score)  │
│  Required skills:             │  Matched skills:                │
│   SQL (4+ yrs)                │   SQL — 6 yrs ✓                 │
│   Healthcare analytics        │   Healthcare analytics — 5 yrs ✓│
│  Nice-to-have:                │  Seniority: Senior (target)     │
│   Tableau                     │  Salary floor: $100K             │
│  Salary: $95–115K              │  Remote pref: no_preference     │
│  Screening Qs: (3 listed)      │  Exclusions: none triggered     │
│──────────────────────────────────────────────────────────│
│ DECISION                                     (§8.2 — exactly   │
│                                                two outcomes,     │
│                                                no snooze/defer)  │
│                                                                  │
│  Reason (required for either outcome — submit blocked until     │
│  filled): [___________________________________________]         │
│                                                                  │
│  [ Promote to Qualified ]        [ Confirm Reject ]              │
└──────────────────────────────────────────────────────────┘
```

## What happens on submit (not UI, but shapes what the decision bar must enforce — §8.3)

- Submit is **disabled until the reason field is non-empty**, regardless of which button is
  pressed — §8.3 is explicit that `operator_reason` is required on both outcomes, not just
  promotions.
- On submit, the interface needs to write: `operator_decision` (`promoted_qualified` /
  `confirmed_reject`), `operator_reason`, `decided_at`, `decided_by`, and a frozen
  `score_snapshot` of the total + all 6 sub-scores at decision time (§8.3 — so the decision stays
  explainable even if rubric weights change later). This wireframe doesn't design the write
  path/storage — that's an engine/schema concern, not a UI one — but the decision bar's fields
  map directly to what needs to be captured.
- Promoting regenerates a client-facing pass-style reason at that moment (§8.2) — not shown to
  the operator as a separate step here, since §8 frames it as something that happens as a result
  of promotion, not a thing the operator authors.

## Hierarchy notes

- Order matches §8.1's explicit priority ranking exactly: borderline reason → full breakdown →
  hard-gate confirmation → posting → client profile → decision. That ranking was given, not
  inferred, so the wireframe doesn't reorder it for visual-hierarchy reasons.
- Job posting and client profile are placed **side by side**, not stacked, per §8.1.6's own
  framing ("shown alongside the posting for direct comparison, not just referenced by score") —
  this is the one layout call this wireframe makes beyond what §8 stated outright, since §8 didn't
  specify side-by-side vs. stacked, only that they should be comparable at a glance.
- The decision bar is visually separated from the informational content above it (a clear
  divider, not just the last item in a scrolling list) — this is a real decision the operator is
  making, not another fact to skim past.

## Explicitly out of scope for this pass

- **Client-roster tracking** (Window 2 flagged this as a likely next extension of this same
  interface) — not designed here. This screen is purely the borderline-review workflow.
- Any visual/color/type decisions, and whether this reuses the internal-docs shell
  (`assets/shell.css`) or needs its own — worth deciding once this structure is approved, since
  this is neither client-facing nor quite the same "reference material" genre as schemas/legal.
- The v2 idea §8.1 flagged and explicitly deferred (surfacing the operator's past decisions on
  similar borderline jobs) — correctly out of scope per qualgate's own note.
