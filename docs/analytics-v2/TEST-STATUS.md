# Analytics v2 integration status — isolated only

25 November 2026. Code under verification: b90aae42d6af0ede0f06167f6d4a567c6ba2e9ce. Baseline: 214650f8830780bbeb20741d945058de7d8c3275.

## Completed and verified
- Earlier full synthetic CI run 45593830687: 135 core assertions, 48 simulated client checks, 17 handler checks, 8 report checks, HTTP concurrency, disposable PostgreSQL RLS/grants/allowlist/atomicity/180-day retention and 40/40 concurrent increments, 45 real Chromium fixture assertions passed. This is not product E2E.
- Current run 45595015023: pure logic (including dashboard and operational fixtures), disposable PostgreSQL and Chromium fixture steps passed. Full application baseline build and regression step still in progress at last inspection; real integrated application test pending. Do not infer success from scheduled tests.
- Earlier integrated runs 45594583102 and 45594797642 failed a source-level baseline assertion checking the original header logo markup. The change was reverted in b90aae42d6af0ede0f06167f6d4a567c6ba2e9ce without weakening that assertion. The rerun remains the authority.
- Independently tested 11 fail-closed fixture-mode combinations using an exact Git blob (98bb3ccdec3ca6f4e89fa03c759340384d0e1e8d).
- Verified main and live production still on baseline commit, Vercel lists zero deployments from this branch, production v2 tables absent, original counters present. No production mutation or hosted Supabase branch creation.

## Implemented, not yet fully verified
- Real Next.js public pages, audit and results have explicit hooks. New UI and ingestion are restricted to localhost CI with preview mode and exact placeholder keys. No hosted or production adapter. Legacy rejection preserved; explicit basic opt-out; optional providers remain unchanged and disabled in fixture. Optional choice collection and new paid-stage/private-report engagement remain disabled pending separate review.
- Local API validates finite, aggregate-only payloads and calls a localhost-only bridge into disposable PostgreSQL. No customer records or actual Stripe payments; checkout mocked in browser tests. No production credentials.
- Local dashboard requires fixture-only authentication, no-store/noindex; date ranges and separate traffic, question, performance, payment, fulfilment and marketing sources, sparse breakdown suppression, no linked visitor data. Operational/payment/marketing values are synthetic fixtures. No production owner auth or real external data connectors.
- Existing checkout API, paid-order/report logic, v1 counters, third-party scripts, privacy policy and cookie policy unchanged. Candidate SQL remains outside migrations. Automatic Vercel deployment disabled for this branch.

## Release blockers
Final application build, browser walkthrough and database-backed full journey must pass on exact code; actual mobile/in-app browsers and real payment workflow not verified; production adapter and owner authentication (MFA/access controls), independent v2 retention scheduling, WAF, provider contracts/logging, legally reviewed disclosures and legacy consent transition, operational/Stripe reconciliation, and explicit production approval are outstanding. Do not merge, deploy, activate tracking or restart ads on this evidence.

Test run: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45595015023
Earlier successful fixture run: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45593830687
