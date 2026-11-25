# Production preparation — no execution authorised

Candidate only. Do not merge, apply migrations, configure Vercel/Supabase, set flags, publish policy or activate collection until explicit separate owner approval and solicitor sign-off.

## Proposed firewall change

Existing production rule (audit/report POSTs) remains untouched. New separate rule: path equals /api/analytics-v2 AND method equals POST AND environment equals production; rate-limit fixed window, 60 requests per IP per 60 seconds, 429 on excess. Apply in approved staging first; measure shared NAT/mobile legitimate bursts and errors. IP processing is for abuse mitigation only; never copy IP to measurement tables. Review actual Vercel plan/limit availability and costs. Do not use a blanket site-level block. The candidate database wrapper also caps accepted events at 50,000 per Sydney calendar day. Cap is a service protection, not proof of human traffic. Tune before release; exhaustion can undercount real users.

## Source lock and gates

lib/analytics-v2/release-config.mjs has RELEASE_AUTHORIZED=false. Even if flags are set, hosted production paths remain off. Separate reviewed release commit must remove that lock only after implementation, privacy review, tests and approvals. Ingestion additionally needs production Vercel, canonical URL, schema readiness, notice version, WAF review and collection flag. A database control row starts false and only an authorised DB administrator can enable it. Service role may read but not update the control. Dashboard and retention have independent flags. Existing optional providers and published policies are unchanged in this branch. Do not remove source lock until the production notice and granular provider/withdrawal behavior are actually implemented and tested.

## Order of operations after approvals

1. Confirm actual latest main, review diff and CI, backup, rollback and cost plan. Keep ads paused.
2. Apply additive candidate-migration.sql and candidate-release.sql using reviewed migration workflow on approved target with collection off. Test RLS/effective grants/RPC roles, private auth helper schema not exposed via Data API, active false. Do not copy real data into test.
3. Provision one owner account through approved Supabase Auth administration. Disable public self-enrolment for the owner flow; enforce MFA and allowlisted UUID, test revoked/expired/wrong-user/AAL1 tokens. The prepared server route accepts only a verified bearer session with AAL2, recent JWT and active auth.sessions record. Interactive production owner sign-in/MFA UI is not yet connected. Use MFA-protected Supabase dashboard SQL aggregate reporting until provisioned and tested; never paste tokens into chat, URL or logs.
4. Apply WAF rule after review and confirm 429 only at intended path. Activate independent retention and verify 180-day cutoff and recovery; capacity security totals prune after two days. Monitor safe 5xx/429 counts and failed payments.
5. Approve exact policy/notice effective date and code; preserve legacy consent. Publish matching disclosures atomically with any separate collection activation. Test no optional requests for rejected/ignored, separate categories, private CSP, basic opt-out and cross-tab withdrawal. No live data until separately authorised.
6. Verify new data with controlled clean browser and independent Instagram/mobile visit, exact counters, bot/test annotations, and payment/fulfilment reconciliation. Stripe/GA4/Meta authoritative report feeds remain unconnected; dashboard shows N/A instead of fabricated figures. Real-device verification and provider contract review required before ads restart.
7. Rollback: DB control false and collection flag false; verify no new events; disable client path with accurate notices and preserve all rejection/withdrawal decisions. Keep retention on. Do not destroy old or new tables or customer records. Any redeploy/rollback requires approval. Re-enable only after investigation.

## Owner dashboard and SQL

Only the server service role may call read RPC. No browser public read permission, raw operational rows, report URLs or tokens in outputs. Date range limited to 180 Sydney calendar days. Owner authorization validates remotely through Supabase Auth, then checks JWT claims and live MFA session. Verify real provider settings before relying on it. Synthetic Basic Auth is only local fixture code. Production access remains locked.

Docs: https://supabase.com/docs/reference/javascript/auth-mfa-getauthenticatorassurancelevel and https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration.
