> **DRAFT — NOT REVIEWED BY AN ATTORNEY.** This is a first-pass working draft prepared by
> an AI consultant for internal iteration only. It is not legal advice, and it must not be
> published or shown to a client until a licensed attorney has reviewed it — particularly
> the guarantee language in Section 2, which is the specific claim most likely to draw
> regulatory or customer-dispute scrutiny if it's honored loosely rather than precisely.
> Placeholders are marked `[BRACKETED]`.

---

# Refund Policy — Shortlist Done-for-You Service

Applies to: **Done-for-You Core ($99/mo)** and **Premium ($249/mo)** subscription tiers.
*(The self-serve Tool and the standalone Resume+CV rebuild are separate products with
separate refund terms — not covered here; flagging so this policy isn't silently stretched
to cover products it wasn't written for.)*

## 0. Why this document exists, precisely

The Shortlist offer is publicly described (per the product brief) as: *"if we can't find 25
jobs you're genuinely qualified for, you don't pay."* Under FTC truth-in-advertising
principles, a guarantee like this is treated as an enforceable representation to the
consumer — the terms have to be disclosed clearly and conspicuously **together with** the
guarantee (not buried in fine print that contradicts it), and the guarantee has to actually
be honored as reasonably understood by the customer, not as narrowly reinterpreted after
the fact. This policy exists to turn that one sentence into precise, operational terms the
Operator can actually deliver on every time — not to quietly narrow it.

## 1. Guarantee wording — resolved

The source material states the guarantee two slightly different ways: the "risk reversal"
line says *"if we can't find 25 jobs you're genuinely qualified for, you don't pay"*
(**found**), while the pricing table and offer section describe the same tier as *"25
qualified apps/mo"* / *"found · ... tailored + submitted"* (**found and applied to**).

**Operator decision (confirmed): the guarantee is 25 applications actually submitted on
the client's behalf, not merely 25 openings identified.** This is the stricter of the two
readings, it matches the ~20–25/application-per-day capacity math elsewhere in the brief,
and it's the safer promise to publish — a "found" standard would let a technically-honored
guarantee still leave a client with zero actual applications in market, which is a bad
outcome to have technically satisfied the fine print on. This is now the operative
definition throughout this policy and should be the version reflected in any marketing
copy referencing the guarantee (see `promise-language-review.md` Section 3 on keeping the
public-facing version aligned with this precise definition rather than a looser paraphrase).

## 2. The guarantee, stated precisely

If the Operator submits **fewer than 25 qualified applications** on your behalf within a
single **billing period** (defined below), you are not charged for that billing period.
Concretely:

- **"Qualified"** means the job opening was evaluated against the qualification criteria
  established for you at intake (the same must-have/nice-to-have/exclusion standard
  applied to every client — see the qualification-gate design, a separate work item) and
  passed. The Operator does not lower or loosen that standard in order to hit the count of
  25; the guarantee is about the Operator's search effort and pipeline, not about relaxing
  what counts as a match.
- **"Billing period"** means one full monthly cycle from your subscription start date (or
  renewal date), i.e. a rolling 30-day window tied to your own billing anniversary — not a
  calendar month, and not reset arbitrarily by the Operator.
- **"You don't pay"** means: **that billing period's charge is waived or refunded in full**
  if it has already been charged. It is a per-period guarantee, not a one-time or lifetime
  guarantee — each billing period is evaluated on its own against the 25-application
  threshold.
- The 25-application threshold is evaluated **per client, using that client's own
  qualification criteria** — it is not an average across the Operator's whole client base.

## 3. What this guarantee is *not*

Consistent with the core promise ("effort, not interviews" — see
`promise-language-review.md`), this guarantee is about the Operator's search-and-apply
effort, not about outcomes:

- It is **not** a guarantee of any interview, response, or job offer.
- It is **not** a guarantee that 25 qualifying openings exist in your specific job
  title/location/salary combination in a given month — see Section 5 on client
  eligibility, which exists specifically to keep this guarantee honest rather than
  aspirational.
- It does **not** extend indefinitely — see Section 4.

## 4. "Until you land" — what actually bounds it

The brief's framing — *"we don't stop until you land"* — is a commitment about persistence
within an active subscription, not an open-ended obligation. Precisely:

- The Operator continues applying on your behalf for as long as you remain an active,
  paying subscriber.
- Once you accept a job offer, you notify the Operator and **cancel your subscription** —
  service (and billing) ends at that point. The Operator does not continue applying after
  you've been hired, and you do not owe further payment beyond the period in which you were
  hired.
- This is not free/unbounded labor: "until you land" is bounded by "while you keep paying,"
  which is the same structure as the 25-application guarantee — a real, honored commitment,
  scoped to what's actually being sold.

## 5. Client eligibility screening (why this guarantee is safe to make)

The brief itself notes the operational discipline that makes this guarantee sustainable:
*"Qualify the client too — only take who you can win for; protects results + refunds."*
This refund policy assumes that discipline is actually followed:

- Before onboarding, the Operator should assess whether a prospective client's target
  titles, locations, salary floor, and background make 25 qualifying openings per month
  realistic. If not, the Operator should either adjust expectations with the client up
  front (different target scope) or decline to onboard them into a tier whose guarantee it
  can't reasonably back.
- This isn't a legal formality — it's what keeps Section 2's guarantee from being either
  (a) a routine refund drain if the Operator takes on unwinnable searches, or (b) an empty
  promise the Operator quietly can't deliver on, which is the exact pattern FTC
  enforcement has treated as deceptive in past "satisfaction guaranteed" cases: making a
  guarantee the business has no reasonable basis to expect it can honor.

## 6. Cancellation

*(Flag: this is a recurring subscription charge, which in the US brings it under the FTC's
Negative Option Rule / ROSCA (Restore Online Shoppers' Confidence Act) considerations —
plain-language disclosure of the recurring charge and its terms before payment is
collected, express informed consent to the recurring charge specifically, and a
cancellation mechanism that is **at least as easy** as the sign-up mechanism. This section
is a placeholder for attorney-reviewed language, not a substitute for it.)*

- You may cancel your subscription at any time via **[insert actual mechanism — must be at
  least as simple as how they signed up]**.
- Cancelling stops future billing; it does not retroactively refund already-completed
  billing periods **except** where Section 2's guarantee applies to that period.
- If you cancel because you've accepted a job (Section 4), no further charges apply from
  the cancellation date forward.

## 7. Requesting the Section 2 refund

If a billing period ends with fewer than 25 qualified applications submitted, **[insert
process — e.g., "the Operator will proactively identify this from the application tracker
and waive/refund the charge without requiring you to ask"]**. Recommend the Operator commit
to *proactively* honoring this rather than requiring the client to notice and request it —
a "guarantee" a customer has to catch and chase is a materially weaker (and more
FTC-exposed) version of the same claim.

## 8. Drafting notes for the main build chat (not client-facing — delete before sending)

- Section 1's ambiguity is now resolved (operator-confirmed: 25 applications *applied*).
  Any pricing-page or ad copy that still implies "found" alone should be updated to match —
  worth a pass by `subcon_brand` once this lands with them.
- The application tracker (spec section 3, "job title, company, link, ... date applied,
  status") is what makes Section 2 auditable — the refund guarantee should be checkable
  directly from that tracker (count of applications with status ≥ "submitted" per client
  per billing period), not a judgment call each time. Worth confirming with whoever owns
  that tracker's schema that "submitted" is unambiguously recorded per application.
- Sections 6 and 7 are intentionally left with process placeholders rather than invented
  procedures — I don't know the actual billing/notification tooling being used, and
  guessing at a specific mechanism here risks the draft asserting a process that doesn't
  exist yet.
