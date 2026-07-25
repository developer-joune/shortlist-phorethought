> **DRAFT — NOT REVIEWED BY AN ATTORNEY.** Working notes from an AI consultant, not legal
> advice. Scope: reviewing existing source-material promise language for consistency with
> the "effort, not interviews" framing the brief itself calls out as intentional. This is
> not a review of finished client-facing copy — none exists yet (see Section 3).

---

# Promise-Language Consistency Review

## 1. The anchor claim — holds up

> "You'll never fill out another job application — we find the ones you're qualified for
> and apply for you." *(Effort promised, never interviews — honest + legal.)*

This is a clean effort-based claim: it promises an action the Operator takes (finding,
applying), not an outcome the client receives (interview, offer, hire). It's specific and
falsifiable, which is the right shape for a claim under FTC principles — vague aspirational
claims ("we'll transform your career") are actually *harder* to defend than precise,
checkable ones, because precise claims are either true or not, while vague ones invite
whatever interpretation makes them sound like more than they are. Keep this language as the
anchor; it's doing real legal work, not just marketing work.

## 2. A phrase that needs a guardrail, not a rewrite

> "we don't stop until you land"

This phrase is fine **in context** — the refund policy draft (`refund-policy.md`, Section
4) grounds it precisely: persistence is bounded by an active paying subscription, not
unconditional. The risk isn't the phrase itself, it's **the phrase in isolation**. Pulled
out of the full offer paragraph and used as a standalone headline (an ad, a social post, a
callout on the pricing page), "we don't stop until you land" reads much closer to an
outcome guarantee — "you *will* land, because we don't stop" — than the effort-only claim
it's meant to be. Stacked with the adjacent brief line *"you do nothing but check your
inbox,"* the combined effect (zero effort from you + we don't stop until success) drifts
toward implying inevitability, even though neither line alone is technically false.

**Recommendation:** treat "we don't stop until you land" as a phrase that always needs its
subscription-bound qualifier nearby (even briefly — "for as long as you're subscribed") in
any client-facing surface, rather than a standalone tagline. Flagging this specifically for
`subcon_brand` to carry into copy decisions, per the playbook's own note that brand should
coordinate with legal when copy touches promises/guarantees.

## 3. Nothing else to review yet

The only client-facing promise language that currently exists is what's in the source brief
and spec themselves (reviewed above). `subcon_brand` has not yet produced tone/voice
drafts, sample notifications, or feed copy — those don't exist in the project directory as
of this review. **This review should be re-run once brand copy exists**, specifically
checking for:

- Any phrasing that turns "we find jobs you're qualified for" into something that reads as
  "we'll get you hired" or "you will get interviews."
- Any use of the 25-application guarantee (Section 2 of the refund policy) in marketing
  copy that doesn't carry its precise terms (qualified/billing-period/per-client scoping) —
  the guarantee is only as safe as its terms travel with it. A stripped-down version like
  "guaranteed 25 jobs or it's free!" on a landing page, disconnected from the refund
  policy's actual definitions, is exactly the kind of drift that turns a defensible claim
  into an exposed one.
- The live-dashboard language in the brief ("they watch a live dashboard") — the spec has
  since overridden this with a no-dashboard, feed-style decision (playbook flags this
  tension explicitly). Any copy that promises real-time transparency should describe what's
  actually being built (recurring feed/update cadence), not the dashboard framing from the
  earlier brief draft.

## 4. Summary for Window 2 / the operator

No contradictions found in the *existing* promise language — the core promise is sound and
should be kept as-is. One phrase ("we don't stop until you land") needs to always appear
with its scoping context rather than standalone. The real consistency risk is downstream,
once actual marketing/feed copy gets written — this review has nothing to check yet on that
front and should be repeated against `subcon_brand`'s output once it exists.
