# First-party-only candidate — 25 November 2026

Implementation commit e2cac2e0b380ca4a30dfa8b0b9c01a4d3a589e1b. Source release lock remains false. No merge, deployment or production mutation authorised.

## Design decisions
- Remove GA4, Clarity, Meta and TikTok browser loaders and vendor event execution regardless of consent, environment or route. Historical compatibility stubs remain inert; existing product call sites and calculations are not rewritten.
- Global CSP permits first-party scripts, styles/fonts/images and same-origin connections, with Next.js inline hydration compatibility and a narrowly scoped owner Auth connection exception. Stripe checkout remains an external top-level payment navigation, not an analytics exception.
- Keep saved audit answers and paid product functionality. Removing vendor JS eliminates the identified intentional vendor execution path in newly loaded documents; does not revoke old running documents, guarantee against XSS/extensions, or establish a separate storage origin.
- Keep existing consented audit/report counters within their old scope. New basic events are independent subject to explicit earlier-choice transition and separate opt-out. All-off disables both. No new legacy all-granted cookie value created; explicit optional restrictions downgrade an old grant. No vendor-enabled rollback approved.
- No GA4 or pixel conversion measurement, remarketing or Clarity recordings in this version. Owner-entered aggregate historical reporting is separate. Meta reported LPV can differ from our arrivals; actual campaign data availability may change.
- The proposed Privacy Policy/Cookie Policy pages and review schedules have been revised and marked draft/not effective. No legal approval or publication. OAIC data minimisation and tracking-pixel guidance informs the risk decision; genuine anonymity and legal applicability remain subject to review.

## Verification
Prior green suite: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45599229253
New suite: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45600860233
Corrected browser test: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45601265076
Final combined rerun: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45601391618
See TEST-STATUS.md for precise test evidence. Tests must pass against exact candidate code. Local test authentication is synthetic only; real owner sign-in/MFA remains a separate isolated provider verification.
Production approval, WAF, actual provider configuration/logging, retention, privacy notices, legacy document cutover, payment/marketing reconciliation and real-device verification remain release gates.
