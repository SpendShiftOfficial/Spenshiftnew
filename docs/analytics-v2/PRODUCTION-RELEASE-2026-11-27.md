# SpendShift first-party-only release — 27 November 2026

**HOLD: final owner approval and exact release-commit CI still required.** This packet supersedes older draft-status statements only regarding the owner's reported legal review and the verified CI results below. All technical gates, privacy restrictions and approvals remain in force. No production mutations authorised or performed by this preparation.

## Verified preparation

- Repository: SpendShiftOfficial/Spenshiftnew; candidate branch: internal-analytics-v2-2026-11-25; tested parent: f9d00f8616d0b906ab6eff93927960f02ad8fff8. Main and live custom-domain deployment remain 214650f8830780bbeb20741d945058de7d8c3275. Live deployment dpl_57NFEZApD7fxVzTCyvS4UtCrC2Fr. Existing protected preview is older (cb95c89d40789211974e47a0be22bb6ceac4baa3) and does NOT certify the new release.
- [All four isolated application jobs passed](https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45912023618). [20 local Auth/MFA/security checks passed](https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45911861050) on prior application commit b7c3f23dc1f6928b5dc37031083f011eca01aa01; subsequent fixture fixes leave authentication unchanged.
- Owner reports solicitor approval of prior policies and latest homepage changes; no independent legal certification is claimed. Publication-ready pages use the approved version date, 27 November 2026, with effect upon actual live publication. Only publication labels and test expectations changed. Keep conditional descriptions of basic collection; the fallback notice explicitly states that basic statistics are off.
- Added 18 aggregate homepage codes; no change to preference, 180-day retention, identifiers, or data collection gates.
- Read-only checks of Vercel and Supabase confirm no new production analytics-v2 environment variables; no v2 public tables; existing reports, report_orders, spendshift_audit_daily and spendshift_report_daily remain present. Source RELEASE_AUTHORIZED=false. Existing consented v1 optional counts remain distinct; no new v2 collection.
- Active firewall: existing production POST audit-metric and report-metric rate limit, 120 requests/IP/60s. Preserve it. No v2 rule yet.
- Project-wide production-and-preview credential scopes exist for Supabase URL/service role, Stripe and AI provider; candidate branch has scoped overrides. Values were not retrieved. Do not infer safe isolation or reuse live credentials in a new preview. Verify privately before building another hosted preview; scope changes require approval. No plan/backup entitlement inferred from connector metadata. Owner reports Vercel upgrade; verify billing allowance and backup availability privately before infrastructure changes.

## Stage 1 — tracker-free cutover (requires final owner approval)

1. Recheck candidate head, main SHA and exact commit CI. Stop on any failed or missing required result. Do not claim a prior deployment is current.
2. Verify approved policy version and intended release window. Review recovery/backups, budget and ads pause. Confirm no v2 flags set true and no source lock change. Keep original payment, email, report recovery and consented v1 settings unchanged.
3. Prepare a protected, tracker-free production build with basic collection disabled, without assigning public domains, where supported. Verify matching Git commit, build success, policy pages, fallback disclosure, CSP and no vendor tags. Do not use a preview with unverified production credentials. If the existing Git integration automatically publishes main, explicit merge approval must cover that consequence; do not assume merge alone leaves the live domain unchanged. Stop if safe staging cannot be confirmed.
4. After owner approves merge/deployment, verify main and production alias point to intended release. Confirm homepage, audit, saved draft restoration, results, legal pages, checkout initiation (no real purchase), and all-off settings on desktop and independent mobile/in-app browser. Check no v2 collection or external tracking requests; no old browser document assumed revoked. Dashboard remains locked. Check error logs without exposing customer records. Keep ads paused until verified.

## Stage 2 — backend preparation (separate approval before production changes)

- Follow PRE-PRODUCTION-APPROVAL-PACKET.md and WAF-AND-RELEASE-RUNBOOK.md: verified backups, three additive reviewed SQL scripts in order, DB control false; validate RLS, RPC permissions and legacy tables; no customer-data copying.
- Privately provision the dedicated owner account and authenticator; no password, OTP, secret, customer data or token in chat/repository. Verify actual hosted MFA and denied wrong-user/password-only/revoked access. Confirm provider contracts/logs/backup retention and actual plan/WAF availability.
- Review separate release commit for source lock transition and production-only flags. Keep collection flag false and DB gate false; privacy mode and approved notice version must match. Verify retention (180 days) independently. New v2 WAF rule should be scoped to exact POST /api/analytics-v2; test on approved isolated infrastructure. Maintain existing rules. No additional paid resources without approval.
- Capacity: existing 50,000 accepted events/day and proposed 60 requests/IP/60s are initial protections, not a guaranteed visitor capacity. Homepage adds up to 18 events per page view; at 500 views the incremental theoretical ceiling is 9,000 events (before old events and repeats). Measure actual total events per view/audit and shared mobile-IP bursts. Alert at 80% cap (40,000 accepted events/day); inspect 429/5xx and costs. Do not silently increase limits.

## Stage 3 — analytics activation and pilot (separate approval)

- Only after tracker-free cutover and production configuration verification, enable collection flag and database control via authorised sequence. Confirm consent gates and real devices, exact aggregate counters, no vendor events, owner reporting access and kill switches. A failed check requires stopping collection, not bypassing a privacy control.
- Stripe and Meta daily aggregate imports require verified AUD/Sydney source definitions and actual reconciliation. No automated feeds, exact attribution or unique-user journeys promised.
- Before paid acquisition resumes, confirm tracking trade-off (no ad pixel remarketing/optimisation) and campaign/source reporting. Review first 500 observed arrivals and funnel ratios; not necessarily 500 people.
- Rollback: turn DB gate and collection flag off, leave approved privacy settings intact and keep retention active if already configured. Never revert to old vendor-enabled build automatically. Retain verified tracker-free disabled release as rollback target after it is live and tested. If not yet available, stop and obtain approval for safe recovery. Do not drop customer data.

## Status

Prepared: exact policy publication labels, regression evidence, read-only environment inventory, migration order, release gates, capacity review, smoke-test and rollback plan. Pending: exact new CI, owner merge/deploy approval, hosting/backup/credential confirmations, hosted verification, separately authorised backend work and activation. No main merge, production config/SQL writes, new deployment, new collection, purchases or owner account creation.
