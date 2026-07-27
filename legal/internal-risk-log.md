> **INTERNAL ONLY — NOT CLIENT-FACING.** Do not include this file, or its contents, in
> anything sent to a client or published publicly. This is a running log of risk decisions
> the operator has knowingly made, kept so they're tracked and revisited rather than
> silently absorbed. Not legal advice; drafted by an AI consultant, not an attorney.

---

## Log entries

### 2026-07-27 — Client-facing login credentials introduced as a new stored-data category

**Decision:** the operator is adding a real client-facing login (email + bcrypt-hashed
password, stored on the Client table) so clients can view their live match feed directly,
replacing the earlier hardcoded demo page. This is new: up to now the client relationship
was profile/intake data (resume, preferences, screening answers) collected via intake — not
an authenticated account secured by its own password credential.

**What's different from the 2026-07-25 entry below:** that entry covers job-platform account
credentials held in a segregated password manager. This is a different system — the
Shortlist application's own primary database now stores authentication credentials for real
client accounts. That's a materially different risk surface: it's the core app
database (broader code/read/write surface than an isolated password manager) rather than a
segregated vault, and a breach here exposes the ability to log into a client's own Shortlist
account (their job-search activity and profile) rather than a third-party job-platform
account. See `consent-authorization-agreement.md` Section 4b for the corresponding
client-facing language.

**Open items to resolve before/alongside this shipping** (status TBD — to be confirmed by
whoever implements this, e.g. `subcon_dataschema`, as the build lands):
- Rate limiting / lockout on login attempts (brute-force and credential-stuffing
  protection).
- Secure password-reset flow (single-use, time-limited token; no plaintext password ever
  emailed or logged).
- Whether storing hashed password + email in combination brings this data store within
  state breach-notification trigger definitions — most states define "personal information"
  for breach-notice purposes to include name + username/email + password in combination.
  This is the same category already flagged for job-platform credentials in the 2026-07-25
  entry below, now also applying to the Operator's own first-party system.
- Whether the 2026-07-25 entry's security-review timeline (MFA, incident-response plan)
  should be explicitly scoped to cover this new credential store too, or whether it needs
  its own timeline — recommend the former (one incident-response plan covering all stored
  credentials, not two parallel tracks) unless there's a reason to split them.

**Status:** OPEN as of this entry's date. `[Update this line when closed, with what
specifically was completed — e.g., rate limiting live, reset flow implemented,
breach-notification scope determination made.]`

---

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
