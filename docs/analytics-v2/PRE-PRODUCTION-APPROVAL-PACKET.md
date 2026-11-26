# SpendShift final pre-production approval packet
**26 November 2026 (Australia/Sydney) — HOLD / NOT AUTHORISED FOR RELEASE**

This is a review and execution plan, not an instruction to apply any changes now. Use only the isolated branch and synthetic data until approvals are recorded. No merge, deployment, production DDL, provider account change, paid infrastructure purchase or tracking activation is authorised. No real owner credentials should enter this repository, a chat, CI, a URL or a log.

## Evidence and scope
- Last complete application run: [45601391618](https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45601391618) — all four jobs succeeded on application commit 7aec879409f6e3f25bb3ca38444628b694607679. Later review documents do not change the application.
- Local Auth verification added on b798fc93a9e5b416dba7513cfd01cbdef9a1afe4: [isolated Auth run 45763255267](https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45763255267), [regression rerun 45763255192](https://github.com/SpendShiftOfficial/Spenshiftnew/actions/runs/45763255192). Check their actual conclusions; scheduled jobs are not passes.
- Local test uses public standard Linux CI runners and a fresh disposable Supabase CLI project on loopback, official pinned CLI release/checksum, locked npm dependencies, no linked project, no live credentials. Real password/TOTP enrolment and verification, owner allowlist, session row, revoke, malformed/expired bearer, user/RPC denial and real local SQL adapter are checked. This does not provision or certify the actual hosted owner account or the hosted end-to-end login page.
- First-party-only scope: four vendor loaders removed; no vendor event forwarding. Existing audit/product logic unchanged. New counts are aggregate observations, not unique customers. Optional existing audit/report counters remain distinct and consent-based. Expanded paid engagement and preference-choice event counts remain disabled.
- Live baseline remains 214650f8830780bbeb20741d945058de7d8c3275 at last read-only check. Release source lock is false. New production DDL has not been applied. No deployment from this branch is authorised.

## 1. Required decisions before touching production
| Decision | Owner / reviewer | Evidence needed |
|---|---|---|
| APP applicability and fair/necessary collection; legacy consent and separate opt-out | Australian solicitor | Written conclusions on Privacy Act scope and proposed purposes; approval of actual policy/notice and version |
| International processing and retention | Solicitor + owner | Actual provider contracts, subprocessors, function/database regions, request/error/security logs, backup lifecycles, access and deletion arrangements |
| Existing paid records and Stripe checkout metadata | Solicitor + owner | Assess existing financial-answer metadata and paid record retention separately; do not silently expand purposes |
| Hosting eligibility, available WAF rules, included usage and cost | Owner | Confirm current plan in the billing dashboard; verify terms permit commercial use and approved budget. If Hobby, commercial use is restricted under Vercel's terms. No upgrade, trial or paid project is authorised by this packet. |
| Owner authentication | Owner + engineer | Actual isolated test success; privately provision a single approved owner and verified TOTP, then test hosted authentication/expiry/revocation. No real credentials or owner identity in source or CI. |
| Release commit and migration | Owner | Approve exact reviewed diff, migration scripts, rollback build, dated policy text and infrastructure changes |
| Activation and pilot | Owner | Separate activation approval after deployment checks and data gate, then separate ad-restart approval |

## 2. Production configuration — proposed values, not applied
Keep existing Stripe, transactional email, database and cron settings and existing v1 consent-based collection/retention scope. Inspect environment target metadata and verify existing values privately in their dashboards; do not dump secret values. Do not reuse production credentials in preview or CI. Existing server credential and database URL target scopes need a review so preview cannot receive live keys; make any scope correction only after authorisation and safe preview verification.

| Variable / gate | Before release | During approved preparation | After separate activation |
|---|---|---|---|
| RELEASE_AUTHORIZED (source constant) | false | true only in separately approved reviewed release commit; otherwise all capabilities off | true |
| VERCEL / VERCEL_ENV | System-provided | exact production runtime; no spoofed values | same |
| NEXT_PUBLIC_SITE_URL | Existing; verify exact canonical origin | https://www.spendshift.com.au | same |
| SPENDSHIFT_ANALYTICS_V2_SCHEMA_READY | absent / false | true only after all three SQL scripts and verified grants | true |
| SPENDSHIFT_ANALYTICS_V2_PRIVACY_ENABLED | absent / false | true with matching approved first-party-only disclosure | true; keep enabled on rollback |
| SPENDSHIFT_ANALYTICS_V2_NOTICE_VERSION | absent | 2026-11-v2 only after approved text is effective | same |
| SPENDSHIFT_ANALYTICS_V2_WAF_REVIEWED | absent / false | true only after staged WAF verification and cost review | true |
| SPENDSHIFT_ANALYTICS_V2_COLLECTION_ENABLED | false | false | true only after explicit collection approval |
| SPENDSHIFT_ANALYTICS_V2_DASHBOARD_ENABLED | false | true only after schema and owner provisioning | separately approved |
| SPENDSHIFT_ANALYTICS_V2_RETENTION_ENABLED | false | true after all DDL; independent of collection | true |
| SPENDSHIFT_ANALYTICS_V2_FINANCE_IMPORT_ENABLED | false | false until reviewed manual source definitions and owner access | separately approved if needed |
| SPENDSHIFT_ANALYTICS_OWNER_USER_ID | absent | private Vercel production-only configuration; approved Auth UUID | same |
| SPENDSHIFT_ANALYTICS_AUTH_PUBLIC_KEY | absent | dedicated Supabase publishable key; never service-role/secret key | same |
| public.spendshift_metrics_v2_release_control.enabled | absent | false (migration default) | true only at activation |

All v2 environment variables must be scoped to production only, with secrets handled privately. Do not override the source lock in tests by modifying the actual branch release code. For a real release, use the exact approved commit, re-run full CI including local Auth, and verify the build-time/runtime flags after deployment. In particular, statically rendered layouts may require a new build for changed environment values; the database gate is the authoritative immediate write stop.

## 3. Migration and validation sequence (only after approval)
1. Confirm live target, latest main, exact commit and backup/recovery options. Confirm plan and cost. Keep ads paused. Review the SQL scripts and existing order schema; apply no destructive migration or customer-data copy.
2. Apply in order, with collection disabled:
   - candidate-migration.sql — finite metric registry, aggregate table and v2 increment/prune.
   - candidate-release.sql — control row default false, daily safety cap, aggregate reporting RPC and restricted Auth session helper.
   - candidate-financial.sql — separate source daily caches, validation and complete coverage reads; updated prune.
3. Each script is transactional but the three together are not one transaction. If any fails, leave gate false and do not proceed. Inspect actual state; do not rerun blindly or drop tables.
4. Read-only schema verification: all new tables RLS on; no anon/authenticated grants or RPC execute, service_role only; session helper schema not exposed by PostgREST. Validate exact public function signatures and effective privileges; use metadata-only queries and check security advisor results. Service-role can read operational summaries; no browser may query raw report orders. Verify gate row false and v2 ingestion disabled before continuing.
5. Verify old order and report tables, v1 aggregate counters and recovery are intact. Confirm approved migration history and backup recovery plan.

## 4. Owner access and MFA
The app's owner UI has no public registration or factor-enrolment screen. A production user is not created by tests. After approval, owner uses a trusted admin-controlled setup: create the dedicated Auth account; privately sign in and enrol/verify a TOTP factor using official Supabase Auth tooling in a reviewed setup flow. Do not ask an agent to obtain or store password/TOTP seed. Set approved owner UUID and publishable key only; verify actual factor list, correct password plus TOTP, deny password-only/incorrect code/wrong user/expired and revoked sessions, log out and re-authenticate. Store backup recovery factor securely, not in repository. Browser auth memory-only; app token freshness 15 min, UI timeout 12 min; no automatically refreshed long-lived browser session. Confirm origin restrictions, no-store headers, endpoint denial and no raw customer records or export. Real hosted owner login is not approved simply because a local Auth test passes.

## 5. Firewall / limits / financial reporting
Existing production WAF: 120 POST requests per IP / 60 seconds on v1 audit/report endpoints. Preserve. Proposed v2 rule, subject to entitlement and cost: exact /api/analytics-v2, method POST, production; fixed 60-second window, 60 requests per IP, 429 excess. Stage log/monitor where supported; test only the intended endpoint on isolated approved infrastructure before production enforcement. WAF rate limits may be per region, and carrier NAT can combine legitimate users. Current production rule already consumes one rate-limit rule; if plan allows only one, do not assume another is available or silently alter existing limits. A combined rule would be a different design and needs approval and retesting. Vercel plan must be confirmed, including commercial-use eligibility and usage billing. Do not buy an upgrade.

SQL caps accepted v2 events at 50,000 per Sydney calendar day. It limits writes, not total function requests or cost; bots can exhaust capacity. Monitor 429/5xx, cap exhaustion, function and DB usage. Suggested early warning: 80% of daily accepted cap or unexpected 429/5xx; investigate promptly. Stop collection on sustained errors or unsafe data flows; no automatic deployment or cost change. Proposed thresholds are starting points, not verified live traffic limits.

Retain new aggregate data and imported daily caches for 180 days, capacity counters for 2 days; leave existing daily cron schedule unchanged. Independently check successful prune in the cron response, including v2Retention, legacy retention and paid recovery; investigate failed status without restarting or mutating paid orders. Verify provider logs/backup retention separately. Original tax/payment/report records are not deleted by the v2 prune. Dashboard missing sources stay N/A; manual daily aggregate Stripe and Meta inputs use verified AUD/Sydney dates. No live provider connection or attribution. GA4 history is historical only after cutover. Report net refunds are not profit, and spend divided by all orders is not attributed CAC.

## 6. Controlled release and activation (separate approval at each stage)
A. Obtain solicitor and owner sign-off of exact first-party-only privacy/cookie pages and notice wording, including draft-marker removal and effective date. Reconcile the older promised rejection semantics; no automatic permission expansion. Approve host plan and operational checks.
B. Apply additive SQL and configure gates OFF. Provision owner and verify restricted dashboard/retention. Stage a reviewed tracker-free build with collection disabled, accurate notice stating basic collection is off, and exact approved policies. No live ads. Test core flows and owner access; verify correct commit/domain and no vendor loaders/forwarding. No vendor-enabled fallback. Approval for deploying a disabled candidate is not approval for collection.
C. Confirm live headers and no vendor scripts/network on fresh Chrome/Safari and an independent iOS Instagram/Facebook in-app browser (and Android where available). Test saved drafts, legacy reject/grant, unset/new, accept/reject optional, basic opt-out and all-off. Checkout/test-mode and paid delivery tests must not charge a real customer; confirm any real payment tests separately. Existing tabs can retain old code; document this residual risk and advise refresh where appropriate. Do not claim historical provider cookies/data or running code have been revoked. 
D. Only after separate activation approval, confirm reviewed flags and DB control false, approved notice already accurate, retention and WAF working, then enable client/server collection and DB gate using approved sequence. New documents must show accurate notice and honour prior preferences. No recording before approval. Perform controlled smoke tests using synthetic answers; annotate test window and check aggregate counters, not raw customer data. No post-activation claim until observations are verified.
E. If pilot matches expected events and data boundaries, reconcile Meta LPV vs arrivals (different definitions), audit starts/completions, Stripe/fulfilment summaries. Document uncertainty about referrer gaps, repeat visits, blockers, bot traffic and unknown source; static campaign labels do not prove attribution. Only then ask for a separate limited ad restart decision and budget. Do not count 500 arrivals as 500 identified qualified people.

## 7. Rollback and incident response
Stop new writes first via authorised change to DB control=false; allow in-flight calls to drain and verify counters stop increasing. Then turn collection flag false and refresh/redeploy only the reviewed vendor-free build with privacy mode/accurate disclosure and retention maintained. Older tabs may continue attempting requests; no new accepted rows should result after drain. Do not revert to a vendor-enabled deployment. Prepare a rollback configuration of the same tracker-free application, with collection off, in advance; verify the exact artifact and flags. Disable dashboard or import flags and revoke owner sessions if access is suspect. Keep legacy consent choices, v1 records, new tables and customer orders/reports intact. Never drop data to roll back. Investigate privacy/security events, assess notifiable data breach obligations as applicable with counsel, preserve minimal appropriate evidence, then seek approval to reactivate.

## 8. Legal review — decisions to record
This is an engineering risk assessment, not a legal opinion or a certificate of anonymity.
- Privacy Act 1988 (Cth), APPs 1, 3, 5, 6, 7, 8, 11 as applicable, Australian Consumer Law s18, statutory privacy tort and other applicable obligations. Do not rely on small-business exemption without checking entity scope/exceptions; current turnover and legal applicability not determined here.
- Entire data flow including IP/network metadata, server logs, host regions and overseas recipients; justify each event category by necessity and purpose. Ensure fair collection/notice and confirm lawful basis of new limited counts without optional acceptance.
- Validate legacy choice handling; distinguish basic opt-out, optional first-party counters, all-off, historical vendor data and necessary product/storage services. No claim that rejecting optional activity counts necessarily turns off disclosed basic statistics for a newly informed visitor.
- Financial answers remain browser-stored; removing vendor JS and global CSP mitigate identified access path in newly loaded documents, not full origin isolation or all XSS. Previously loaded scripts, historical data, browser extensions and other same-origin code remain. Review historical provider data and any incident evidence; no actual disclosure established. Review operational Stripe metadata, saved report links, existing indefinite report retention and privacy requests separately.
- OAIC updated APP 1 guidance: from 10 December 2026, APP entities using personal information in computer programs making or substantially/directly informing decisions reasonably expected to significantly affect rights or interests must disclose required information. Counsel should assess the rule-based savings plan and the exact obligation before effective date; do not assume recommendation software is or is not covered.
- Approve the actual in-branch policy pages and notice, not just this checklist. Record counsel's determination, conditions, effective date, reviewer and owner decision privately outside this public repository.

### Review materials
- PRIVACY-POLICY-DRAFT.md; COOKIE-POLICY-DRAFT.md; NOTICE-DRAFT.md; PRIVACY-IMPACT-REVIEW.md; FIRST-PARTY-ONLY-RELEASE.md; WAF-AND-RELEASE-RUNBOOK.md.
- Actual draft pages: app/privacy-policy/page.tsx and app/cookies/page.tsx. Current production policies remain unchanged.
- Federal Register: https://www.legislation.gov.au/C2004A03712/latest/details
- OAIC small business: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business
- OAIC tracking: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations
- OAIC de-identification: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/de-identification-and-the-privacy-act
- OAIC APP 11: https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information
- OAIC ADM changes: https://www.oaic.gov.au/news/media-centre/new-resources-on-transparency-for-use-of-ai-and-automated-decision-making
- Supabase session and MFA docs: https://supabase.com/docs/guides/auth/sessions and https://supabase.com/docs/guides/auth/auth-mfa
- WAF rules/pricing: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting ; commercial use: https://vercel.com/legal/terms
- Local testing without hosted project: https://supabase.com/docs/guides/local-development ; CI cost: https://docs.github.com/en/actions/concepts/billing-and-usage

**Release decision: HOLD.** No production action until the specific approvals and actual verification listed above are complete.
