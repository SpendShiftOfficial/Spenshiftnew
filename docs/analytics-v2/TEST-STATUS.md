# Analytics v2 integration status — isolated only

25 November 2026. Baseline: 214650f8830780bbeb20741d945058de7d8c3275. Implementation under verification: b1f985c36342921146403924d204e10a7c57e6a7; docs and granular test-only correction through a7bc0a90d4959c4433fdbcd6ea73b7f66c55674b.

## Verified
- Prior run 45596636675 on 97279dd89c33aab12a36c863d95d0d7d47ef3861: all three jobs passed, including real local application journeys, baseline build/regression and disposable PostgreSQL.
- Run 45598613557: synthetic job passed 377 explicitly numbered checks (including 45 Chromium fixture assertions), plus PostgreSQL concurrency (40/40), role/grant checks, release gates, MFA-session authorization, financial source constraints and retention. Integrated job passed six real local product journeys using disposable DB and mocked payment. Baseline job was still running at this inspection.
- Granular job failed at a Playwright checkbox action after the intentional document reload. Logs show click performed and navigation completed; Playwright retried the checked-state operation with the details panel collapsed. No full granular pass claimed. Test-only correction now waits for navigation, verifies all expected inert script nodes, verifies persisted choices, and reopens details to assert both checkboxes. Full rerun 45599229253 launched; no final result at this inspection.
- Previous production verification: main and live deployment unchanged at baseline; zero Vercel deployments for development branch; production v2 metrics, gate and financial source tables absent; original counters present. No production mutations, real tracking, accounts or transactions.

## Candidate implementation
- Separate basic opt-out, analytics consent and advertising consent; conservative legacy rollback behavior; independent privacy mode; private-route loading restriction; known cookie withdrawal cleanup and full reload. Vendor tests use inert scripts, not live provider SDKs.
- Source lock remains false (release not authorized). Owner interface uses memory-only auth, password and TOTP UI, server identity allowlist, AAL2 and session checks. Actual hosted authentication/enrollment has not been performed. Finance source import is manual, fixed-schema, owner-only aggregate entry; not an automated live feed.
- Revised solicitor drafts, privacy impact review and runbook are in this directory; published policy pages remain unchanged.

## Outstanding
Final corrected test run results; actual isolated Auth and vendor permission/withdrawal tests; existing origin-shared browser-storage exposure (see privacy review/checklist); real financial source alignment and reconciliation; WAF/capacity and production retention configuration; provider terms, actual logs/overseas handling; legal approval and publication of matching notices; owner approval. No merge, deployment, production mutation or activation authorized. Keep source lock false.

Previous full green run: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45596636675
New implementation run: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45598613557
Corrected test rerun: https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45599229253
