# Privacy impact review — release decision sheet

**25 November 2026 | No legal sign-off or authority to activate.**

## Scope and legal basis

Privacy Act 1988 (Cth) compilation effective 4 June 2026; APP 1, 3, 5, 6, 7, 8 and 11 as applicable. Whether SpendShift is an APP entity (turnover, related bodies, trading information for a benefit and other exceptions) remains a solicitor determination. Apply APP-standard controls regardless. Australian Consumer Law s 18 means the current promise that rejection disables first-party counts cannot silently be reversed. OAIC guidance stresses fair collection, transparency, reasonable expectations, de-identification risk and overseas disclosures. An aggregate final table does not establish that all in-transit data is anonymous.

## Approved design versus excluded collection

Proposed basic first-party events: public arrivals/page views, finite source/campaign/device/browser categories, visible engagement thresholds, scroll, approved clicks and FAQs, Web Vitals ranges and safe errors, audit progression, valid results and offer/checkout observations. No person-level journey, tracking identifiers or financial answers. Store each dimension as a separate marginal count. Do not publish or infer exact unique visitors, linked conversion, actual savings or campaign purchase attribution. Direct/unknown referrer and reloads/fast exits/bots limit accuracy.

Payment/fulfilment aggregates use existing necessary operational records under a reviewed reporting purpose. Stripe confirmed amounts/refunds are distinct from order status and must be reconciled separately; source unavailable is not zero. Owner-entered aggregate Stripe/Meta/GA4 daily totals are an explicit manual reporting cache, not automated or independently verified provider feeds. Only complete covered periods return a source total. Source/date replacement is idempotent; explicit zero must be verified. No third-party browser tracking anywhere in the candidate. No expanded answer statistics, geo, unique IDs, optional-choice counting, private paid-stage or private report tracking without separate approval. Existing consented audit/report counts retain original scope.

## Risk and control review

| Risk | Mitigation / release gate |
|---|---|
| Contradict earlier rejection promise | Preserve all prior choices; old consent does not authorise new basic collection; explicit legacy transition; accurate updated policy and notice before activation. |
| Personal information in request metadata | No event-body/URL/ID logging; review Vercel/Supabase security logs, hosting regions, provider agreements, subprocessors, overseas disclosure and backup retention. Network requests may contain IP metadata. |
| Inadvertent answer/payment/report exposure | Finite event catalogue, no arbitrary strings, exact request/SQL checks, vendor loaders removed on all pages and site-wide CSP restricting scripts and network requests; owner Auth uses a narrow connection exception. Existing checkout answer metadata/indefinite paid records separate review. |
| Origin-shared browser storage | Existing free-audit drafts and completed answers reside in localStorage (sessionStorage fallback). Vendor JS executing on the same origin could potentially read stored answers even on a public page. Private-page script restrictions alone are not an isolation boundary. No actual disclosure verified. First-party-only candidate removes vendor loaders and event calls and uses site-wide self-only script/connect CSP (owner Auth connection exception). This addresses the identified intentional vendor-execution path for newly loaded pages. Old already-loaded documents, other same-origin code, XSS and browser extensions remain residual risks; no reintroduction or vendor-enabled rollback without genuine storage/origin isolation review. |
| Abuse/inflated totals | Proposed 60 POSTs/IP/min WAF plus 50,000 accepted events/day global safety cap. No visitor fingerprint. Load test and evaluate shared carrier NAT, distributed bots and costs. |
| Owner dashboard exposure | Server-verified identity allowlist, verified MFA, live session check and short token age; no self-registration or public data route. A memory-only Supabase login and pre-enrolled TOTP challenge UI has been implemented. Production owner provisioning and real authentication/rotation/revocation tests remain outstanding. |
| Small counts and differencing | Suppress sparse breakdowns; owner-only, no raw export. Overlapping dates may still permit inference; do not treat threshold 10 as anonymity guarantee. |
| Retention or outage | 180-day prune including imported reporting cache, separate flag from collection, daily security capacity rows pruned at two days, alert failures. Original financial records unaffected. Keep checkout and recovery independent. Verify backups/log retention. |
| Incorrect optional permissions | Separate basic and existing optional first-party count choices; all-statistics opt-out; conservative legacy rollback markers; no vendor loaders or event forwarding in any candidate consent state. Historical cookies/data may remain, and an already-loaded older vendor document cannot be remotely revoked. Verify controlled cutover and remaining historical-provider arrangements. |
| Regression or inaccurate notice | Exact final diff, build and full browser/customer test; real mobile/Instagram test only after separately approved activation; rollback preserves opt-out and accurate notice. |

## Sign-off checklist (all pending)

- Australian solicitor: applicable legislation/exemption; purposes; data flow incl. network metadata and providers; legacy transition; notices and withdrawal; retention; incidental sensitive information; direct marketing; overseas processing; automated decision rules where applicable.
- Owner: explicit approved event scope, legal text and date, costs, retention, access controls, WAF cap/limits, rollback plan, staged deployment and separate activation authorisation.
- Engineer: final CI success, real tracker-free deployment/header checks, real owner session provisioning, isolated migration/rollback test, real provider contracts/configuration, monitoring, no production changes until approval.

## Primary sources for review

- https://www.legislation.gov.au/C2004A03712/latest/text
- https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/more-guidance/guide-to-data-analytics-and-the-australian-privacy-principles
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/de-identification-and-the-privacy-act
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/privacy-impact-assessments/guide-to-undertaking-privacy-impact-assessments
- https://www.accc.gov.au/media-release/google-llc-to-pay-60-million-for-misleading-representations

The source lock remains false. This document is not a compliance certificate.
