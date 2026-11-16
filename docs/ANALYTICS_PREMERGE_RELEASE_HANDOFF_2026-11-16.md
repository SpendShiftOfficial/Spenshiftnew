# SpendShift Phase 1 Analytics — Pre-merge Release Handoff

**Date:** 16 November 2026 (Sydney)  
**Repository:** `SpendShiftOfficial/Spenshiftnew`  
**Branch:** `phase-1-analytics-refinement-2026-11-15`  
**PR:** https://github.com/SpendShiftOfficial/Spenshiftnew/pull/28  
**GO/NO-GO:** Prepared; **WAIT for explicit owner authorisation before merging or deploying this branch to Production**.

## Already completed (pre-merge)

1. **Engineering checks.** GitHub quality and desktop/mobile customer journeys passed on the prior release-head `d005538ea015267a4f7b18bf5f0108f12661a1fc`. This handoff document creates a new commit; re-check all required checks on the final head before merging. No actual live Stripe purchase is represented by the mocked test.
2. **Isolated Vercel preview.** Deployment `dpl_481vHJcoZVqcDPknPLBEqyQ8cxFz` was built **READY** from that head commit. Its homepage, audit, electricity guide, privacy notice and cookie notice responded HTTP 200. The preview report-metric GET returned 405, as expected for a POST-only endpoint. The local Next.js HTTP smoke tests proved both endpoints return 204 with no body when disabled.
3. **Preview account isolation.** The analytics Git branch has its own Preview overrides. `SUPABASE_URL` points only to `pcjgzbaigtsnevhcjqyd.supabase.co`; all other preview payment, email, AI and database credential values are nonworking placeholders. Neither preview analytics flag is enabled. Do not place production credentials in the analytics branch's preview environment.
4. **Production Supabase schema:** An approved **additive-only** migration `20261116070355_spendshift_aggregate_audit_and_retention` was applied to `isbmbayaorsfujexejku`. It creates `spendshift_audit_daily`, `spendshift_report_daily`, two increment functions and one 180-day retention function. Existing reports and orders were not modified. Both new tables are initially empty.
5. **Production SQL security:** The tables have RLS; `anon`/`authenticated` cannot SELECT; only `service_role` can run the three `SECURITY INVOKER` functions. A real `SET LOCAL ROLE service_role` transaction invoked both increments and retention, then **ROLLED BACK**; final row counts remained zero. Advisor notices for RLS-without-policy are informational and intentional for this server-only design.
6. **Vercel enforced firewall:** Active rule `rule_spend_shift_analytics_endpoints_monitor_only_U5D0jj` (historical identifier) matches **production POST** to only `/api/audit-metric` and `/api/report-metric`. Over 120 requests per IP in a 60-second fixed window receive HTTP 429. No checkout, audit page, report page or other route is matched. A live 429 burst test is not performed; Vercel configuration was verified.
7. **Production feature switches for NEXT deployment:** `SPENDSHIFT_AGGREGATE_METRICS_ENABLED=true` and `SPENDSHIFT_AGGREGATE_RETENTION_ENABLED=true` are scoped to **Production only**. These values will apply when the analytics application code is deployed in a **new** production build. The current production deployment was not replaced.
8. **Privacy and retention:** The owner approved retention of anonymous daily counters for 180 days and confirmed that a lawyer reviewed the updated privacy/cookie materials. This is owner-reported review, not an independently obtained formal opinion.
9. **Current website:** Production deployment `dpl_AcwZ3zhfFuXNjF5LtroAWmiyKejr` still serves `main` commit `167f341190f63383afad5762c23a1fd1e0436c8d`. No PR #28 commits have been merged into `main`.

## Remaining steps ONLY after owner gives explicit merge approval

1. Re-check PR #28 against `main`, latest head SHA and both GitHub Actions; make sure no unrelated changes occurred.
2. **Squash merge PR #28 to main only after explicit instruction.** If Git automatic production deployment fails to start, create a Production deployment from the **exact resulting merged commit** using the approved Vercel project/team, not from the unmerged branch.
3. Inspect the deployment is `READY`, has the intended commit, and the production domains `www.spendshift.com.au` / `spendshift.com.au` point to it. Confirm no checkout, audit, reporting or maintenance errors. Retain the previous production deployment for rollback.
4. Verify real live analytics after an opted-in public browser visit: GA4 page views, `audit_cta_click`, and Clarity public interactions. Ensure no third-party trackers load on private paths.
5. Run a controlled, **genuine** customer journey, ideally with a separate paid test purchase of A$29. Confirm Stripe success, order row, personalisation completion, report readiness and email delivery processing. Avoid presenting test records as real customers; mark/refund the test purchase according to policy.
6. Test authorised, opted-in interactions and compare Supabase `spendshift_audit_daily`, `spendshift_report_daily` with the actual action types and Australia/Sydney dates. Do not send financial answers or report tokens to third-party analytics. Consent-declined visits should not increment counters.
7. Confirm Cron retention runs on its normal daily schedule. It removes only daily aggregate rows whose Sydney dates are at least 180 days old; purchase, report and customer records are unaffected.
8. Review Vercel firewall traffic for unexpected 429s, especially shared network/NAT users. This is a controlled rollout; thresholds can be changed if genuine analytics actions are being missed.
9. Report separate source-labeled totals for consented website visits, anonymous audit actions, verified Stripe orders, completed report generation and consented report interactions. These are not a fully stitched person-level conversion funnel and must not be described as exact unique-customer conversion rates.

## Rollback

- **App:** Vercel can roll back/restore the previous READY production deployment `dpl_AcwZ3zhfFuXNjF5LtroAWmiyKejr` if the new deployment has errors.
- **Telemetry:** Disable the Production `SPENDSHIFT_AGGREGATE_METRICS_ENABLED` switch for subsequent deployments if collection must stop; the code also has an environment guard. Do not delete customer data as a rollback shortcut. If essential, deploy the prior build to immediately remove the new routes.
- **Database:** The new additive aggregate tables/functions may remain unused with RLS enabled. Do not drop or truncate them as part of an application rollback.
- **Retention:** The separate 180-day retention switch can be turned off for subsequent deployments if necessary; pausing retention requires privacy review.
- **Firewall:** Rule may be returned to `log` if genuine customers are affected, but do not disable protections or relax scope without reviewing traffic.

## Important qualifications

- We have **not merged** PR #28, promoted/deployed its code to production, verified real GA4/Clarity event delivery from this version, executed a real A$29 payment as part of this analytics release, or tested a live 429 rate-limit threshold with a load burst.
- Vercel and Supabase production settings are prepared **ahead of the merge** with the owner's broad permission. The existing live code lacks the new analytics endpoints, so counters are not recording yet.
- All Production environment variable changes require an applicable **new deployment** to take effect. Never assume a saved environment switch changes an already-running deployment.
