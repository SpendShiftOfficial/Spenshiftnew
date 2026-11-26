# Analytics v2 test status — first-party-only candidate

25 November 2026. Production baseline 214650f8830780bbeb20741d945058de7d8c3275. First-party-only implementation e2cac2e0b380ca4a30dfa8b0b9c01a4d3a589e1b; docs-only and test-only corrections through 7aec879409f6e3f25bb3ca38444628b694607679. Source release lock remains false.

## Verified results
- Previous granular-provider implementation run 45599229253: all four jobs green. This is historical evidence, not the first-party-only release.
- First-party-only implementation run 45600860233: baseline passed (102 product test groups, 20 endpoint/privacy checks and full desktop/mobile regression). Synthetic job passed 377 numbered checks, 40/40 concurrent PostgreSQL increments, database permissions, retention, release gates, session checks and financial import constraints.
- Initial first-party-only browser job reached its successful external-script/connect CSP denial probe, but later failed because the intentionally blocked test script element remained in the DOM. Test-only correction removes that probe after verifying denial and additionally checks no v1 or v2 requests after all-off in a new tab.
- Corrected first-party-only browser job in 45601265076 passed all 12 real local browser cases: old consent, saved synthetic audit draft, enforced CSP denial, cross-tab opt-out, public/private pages and locked owner interface. Its synthetic job also passed. This is not a real Supabase owner login.
- Initial integrated test failed when its own init script wrote the legacy grant on every navigation and undid the tested rejection. Corrected fixture now seeds the old consent only when no stored value exists; the assertion that rejection persists is unchanged. No product/security control was weakened.
- Final combined rerun 45601391618 on 7aec879409f6e3f25bb3ca38444628b694607679: synthetic: success; baseline: in_progress; integrated: success; first_party_only: success. Check actual run conclusion before certifying all tests.

## Production verification
Read-only checks confirmed main and live deployment on baseline; no development Vercel deployments; no v2 analytics/gate/financial tables on production; original counters present. No production credentials, transactions, data collection or account provisioning. Only the live Supabase project/default branch exists. No additional hosted project or branch was purchased/created.

## Remaining release gates
- All latest CI jobs pass; actual hosted owner Auth + MFA enrolment/login/revocation and tracker-free deployment verification in separately authorised environment. WAF and retention config, source reconciliation, historical data and old already-running pages, contract/log/backup review, legal sign-off and explicit owner approval.
- Vendor scripts are absent in this candidate; this eliminates the identified intentional browser vendor-execution path in newly loaded pages, not all shared-origin exposure or historical tracking. No return to vendor-enabled builds absent separate storage isolation and approval.
- Actual production policy remains unchanged. Draft pages and review schedules are not effective.

Prior first-party baseline and synthetic: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45600860233
Passing first-party-only browser job: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45601265076
Final combined rerun: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45601391618

## 26 November 2026 — final pre-production verification
- Combined run 45601391618 ultimately succeeded in all four application jobs.
- Auth workflow 45763255267 started a real disposable local Supabase stack; verified source lock, missing bearer rejection and password-only owner rejection, then failed at TOTP enrolment. No successful MFA claimed from that run. The fixture correction explicitly enables TOTP enrolment and verification in the temporary local CLI configuration, adds sanitised error-code diagnostics and avoids reusing the enrolment TOTP interval. No application security code or production Auth settings changed.
- Corrected isolated Auth run 45763578103: in_progress.
- Local Auth test rerun: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45763578103 ; regression rerun: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45763578117 . A real hosted owner account and full hosted UI verification remain separate approval gates even if the local test passes.
- Production configuration/approval packet: PRE-PRODUCTION-APPROVAL-PACKET.md. Live deployment, main branch and database schema rechecked; new v2 tables absent, old counters present, development deployments zero. No hosted project or paid plan created. Billing plan and WAF entitlement must be verified in the dashboard before any commercial release/paid changes.
- Release remains HOLD. Confirm actual test results and all legal/operational/owner approvals before proceeding.

## 26 November — final two refinements
All four regression jobs in 45763578117 and all 20 real isolated Auth/MFA/permission/revocation checks in 45763578103 passed. Mobile notice and finite UTM source recognition are the only further application changes; test results for the refined commit must be checked before release. Real hosted owner provisioning, legal review, hosting configuration and separate deployment and collection approvals remain outstanding.

## 27 November — legal compliance correction candidate
Prior Australian audience candidate 7d7cdac3a991f02be0bea22bb0df481294d58ed3: all four application suites and all 20 real local Auth/MFA checks passed (45768164366 and 45768164354). The new candidate changes only notice, choice transitions, failure safeguards and corresponding policy/documentation and test fixtures. Verify actual new CI conclusions before independent sign-off. No source lock change, SQL change, or production permission. The 26 November Word review is the original findings; the revised private handoff records closure evidence and outstanding decisions.

## 27 November — limited banner layout revision
The preceding four-suite run 45904093509 passed on d46527dfe850e22674f574b7825a341217aa1c30. The requested layout-only follow-up moves the all-statistics button into one-step Privacy settings, keeps equal accept/reject actions, explicitly discloses the all-off path, and requires the settings control to be presented before initial basic collection. All consent semantics and failure safeguards are retained. Final legal review must consider the revised placement; the previous test result is not evidence for the new commit. Run existing isolated regressions; no release authorisation.

## Homepage measurement extension — 27 November 2026
Candidate-only: adds 60/120-second foreground milestones, six fixed homepage section exposure events, and five fixed CTA impression/click pairs. The previous 10/30-second milestones and first CTA event are unchanged. New automated tests cover allowlists, dwell, aggregate SQL, quota, dashboard suppression and the local product browser. Exact new CI results are pending; prior passing runs do not certify this change. Policy wording is draft and needs targeted legal approval. No production schema or gate changes.
