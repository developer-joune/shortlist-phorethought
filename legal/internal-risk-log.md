> **INTERNAL ONLY — NOT CLIENT-FACING.** Do not include this file, or its contents, in
> anything sent to a client or published publicly. This is a running log of risk decisions
> the operator has knowingly made, kept so they're tracked and revisited rather than
> silently absorbed. Not legal advice; drafted by an AI consultant, not an attorney.

---

## Log entries

### 2026-07-25 — Security review deferred to run in parallel with client onboarding

**Decision:** the operator will begin serving the 3 currently-ready clients now, including
creating and managing platform-account credentials on their behalf (see
`consent-authorization-agreement.md` Section 4a), rather than waiting for security
hardening — MFA on the password manager and a written incident-response plan — to be
completed first. That hardening work happens in parallel with onboarding, not before it.

**The gap this creates:** for some period between first client onboarding and the security
work actually landing, real client credentials (platform accounts created under the
Operator-controlled alias, holding client names, emails, application history, and possibly
uploaded resumes on those platforms) will exist in the password manager without confirmed
MFA and without a documented incident-response plan in place. If the password manager or
the Operator's own device/account were compromised during that window, there is currently
no tested process for containing or responding to it, and no confirmed answer on what
state-law breach-notification obligations would be triggered.

**Why the operator made this call anyway:** the alternative — gating client onboarding on
completed security work — would delay revenue-generating service to the 3 clients who are
ready to start now. This is an explicit, acknowledged trade-off (speed of launch vs. a
real, if likely small-probability, security exposure window), not an oversight.

**What closes this entry out:** this entry should be marked resolved once (a) MFA is
confirmed enabled on the password manager, and (b) a written incident-response plan exists
(even a short one — who does what if a credential is suspected compromised, how/whether
affected clients are notified, what the actual legal notification obligations are per the
relevant state law). Until both are true, treat this as a live, open risk — not a completed
item.

**Status:** OPEN as of this entry's date. `[Update this line when closed, with the date and
what specifically was completed.]`

---

## How to use this file going forward

Add a new dated entry whenever the operator knowingly accepts a risk trade-off rather than
fully closing it before proceeding (timing gaps, scope compromises, "we'll fix this after
launch" calls) — particularly ones touching client data, credentials, legal representations,
or the refund/consent commitments. The point isn't to block the operator from making these
calls; it's to make sure each one is a decision that was actually made, with its
consequences named, rather than something that just happened.
