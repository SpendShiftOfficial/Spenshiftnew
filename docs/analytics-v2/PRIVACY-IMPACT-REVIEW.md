# Privacy impact review — release decision sheet

**25 November 2026 | No legal sign-off or authority to activate.**

## Scope and legal basis

Privacy Act 1988 (Cth) compilation effective 4 June 2026; APP 1, 3, 5, 6, 7, 8 and 11 as applicable. Whether SpendShift is an APP entity (turnover, related bodies, trading information for a benefit and other exceptions) remains a solicitor determination. Apply APP-standard controls regardless. Australian Consumer Law s 18 means the current promise that rejection disables first-party counts cannot silently be reversed. OAIC guidance stresses fair collection, transparency, reasonable expectations, de-identification risk and overseas disclosures. An aggregate final table does not establish that all in-transit data is anonymous.

## Approved design versus excluded collection

Proposed basic first-party events: public arrivals/page views, finite source/campaign/device/browser categories, visible engagement thresholds, scroll, approved clicks and FAQs, Web Vitals ranges and safe errors, audit progression, valid results and offer/checkout observations. No person-level journey, tracking identifiers or financial answers. Store each dimension as a separate marginal count. Do not publish or infer exact unique visitors, linked conversion, actual savings or campaign purchase attribution. Direct/unknown referrer and reloads/fast exits/bots limit accuracy.

Payment/fulfilment aggregates use existing necessary operational records under a reviewed reporting purpose. Stripe confirmed amounts/refunds are distinct from order status and must be reconciled separately; source unavailable is not zero. No third-party private tracking. No expanded answer statistics, geo, unique IDs, optional-choice counting, private paid-stage or private report tracking without separate approval. Existing consented audit/report counts retain original scope.

## Risk and control review

| Risk | Mitigation / release gate |
|---|---|
| Contradict earlier rejection promise | Preserve all prior choices; old consent does not authorise new basic collection; explicit legacy transition; accurate updated policy and notice before activation. |
| Personal information in request metadata | No event-body/URL/ID logging; review Vercel/Supabase security logs, hosting regions, provider agreements, subprocessors, overseas disclosure and backup retention. Network requests may contain IP metadata. |
| Inadvertent answer/payment/report exposure | Finite event catalogue, no arbitrary strings, exact request/SQL checks, no third-party scripts on private pages. Existing checkout answer metadata/indefinite paid records separate review. |
| Abuse/inflated totals | Proposed 60 POSTs/IP/min WAF plus 50,000 accepted events/day global safety cap. No visitor fingerprint. Load test and evaluate shared carrier NAT, distributed bots and costs. |
| Owner dashboard exposure | Server-verified identity allowlist, verified MFA, live session check and short token age; no self-registration or public data route. Production owner login/provisioning/rotation/revocation test remains outstanding. |
| Small counts and differencing | Suppress sparse breakdowns; owner-only, no raw export. Overlapping dates may still permit inference; do not treat threshold 10 as anonymity guarantee. |
| Retention or outage | 180-day prune, separate flag from collection, daily security capacity rows pruned at two days, alert failures. Keep checkout and recovery independent. Verify backups/log retention. |
| Incorrect optional permissions | Separate analytics and ad choices, provider opt-out and script cleanup; no advanced consent mode or server-side pings; actual production split/withdrawal tests required. |
| Regression or inaccurate notice | Exact final diff, build and full browser/customer test; real mobile/Instagram test only after separately approved activation; rollback preserves opt-out and accurate notice. |

## Sign-off checklist (all pending)

- Australian solicitor: applicable legislation/exemption; purposes; data flow incl. network metadata and providers; legacy transition; notices and withdrawal; retention; incidental sensitive information; direct marketing; overseas processing; automated decision rules where applicable.
- Owner: explicit approved event scope, legal text and date, costs, retention, access controls, WAF cap/limits, rollback plan, staged deployment and separate activation authorisation.
- Engineer: final CI success, actual provider permission tests, real owner session provisioning, isolated migration/rollback test, real provider contracts/configuration, monitoring, no production changes until approval.

## Primary sources for review

- https://www.legislation.gov.au/C2004A03712/latest/text
- https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/more-guidance/guide-to-data-analytics-and-the-australian-privacy-principles
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/de-identification-and-the-privacy-act
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/privacy-impact-assessments/guide-to-undertaking-privacy-impact-assessments
- https://www.accc.gov.au/media-release/google-llc-to-pay-60-million-for-misleading-representations

The source lock remains false. This document is not a compliance certificate.
