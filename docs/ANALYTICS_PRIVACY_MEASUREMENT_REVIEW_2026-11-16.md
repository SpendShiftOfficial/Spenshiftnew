# SpendShift Analytics — Privacy & Measurement Review

**Review date:** 16 November 2026 (Australia/Sydney)
**Scope:** GitHub `phase-1-analytics-refinement-2026-11-15`, draft PR #28.
**Status:** Technical review completed against draft implementation; production release NOT approved. This is not independent legal advice or solicitor sign-off.

## 1. Product measurements and sources of truth

| Stage | Source | Metric | Limit |
| --- | --- | --- | --- |
| Website discovery | Consent-based GA4 and Microsoft Clarity | Page visits, traffic, click on public free-audit CTA | Only users accepting optional tracking; not all traffic |
| Free-audit activity | First-party `/api/audit-metric` | `audit_start`, `audit_complete` | Aggregate approximate actions, once per tab/session; no unique user ID; consent required |
| Paid orders | Stripe and Supabase `report_orders` | Confirmed paid sessions/orders | Financial system source of truth, not GA4 `purchase` |
| Additional questions | Supabase protected `report_orders.refinements` | Draft/details saved and `completed` | A saved draft is not proof a user started reading |
| Report creation | Supabase paid orders | `status=ready`, report ID created | Generation is not proof of viewing |
| Report email | Provider processing flags | Report email processed | Not inbox delivery/open confirmation |
| Paid-report use | First-party `/api/report-metric` | `report_open`, `checklist_interaction`, `tracker_saved`, `feedback_sent` | Consent-based approximate interactions, not unique people or proven savings |

**Do not create a single exact visitor → purchaser conversion rate by dividing Stripe paid orders by GA4 consented visits.** Those two datasets have different coverage and are not linked person-by-person. Use separate, correctly labelled charts and directional trends.

## 2. Personal information and data flow

- **GA4, Clarity, Meta and TikTok:** Load only on approved *public* marketing pages, and only after optional consent. These scripts are not loaded on `/audit`, `/results`, `/success`, `/personalise` or private `/report/...` routes.
- **First-party audit requests:** With saved consent `granted`, browser sends only `{ "event": "audit_start" }` or `{ "event": "audit_complete" }` to SpendShift. No form answers, amounts, URLs, email addresses or client identifiers are included.
- **First-party paid-report requests:** With saved consent `granted`, browser sends only a recognised event and private `reportId` to SpendShift's own `/api/report-metric` endpoint. Server checks that `report_orders` has a matching **ready** report and then increments an aggregate daily count. It does not write the token or underlying financial data into analytics tables.
- **Aggregate database storage:** Exactly three fields in each of `spendshift_audit_daily` and `spendshift_report_daily`: Sydney-local `event_date`, allowlisted `event_name`, `event_count`. No individual-event rows, user IDs, emails, report references, IP addresses, amounts or free text.
- **Separate operational logging:** Hosting, firewall, security and payment systems may process request metadata such as IP addresses and timestamps. This is separate from the optional analytics tables and is not stopped by rejecting optional analytics. Never claim that *no* system handles a report reference or IP address.

## 3. Security controls reviewed

1. Both API handlers return **204 with empty body** when outside Production or while `SPENDSHIFT_AGGREGATE_METRICS_ENABLED` is not `true`.
2. When enabled, only allowlisted events, strict JSON shapes and small request bodies are accepted. Extra spending fields are rejected. Browser origin and Fetch Metadata checks reject cross-site attempts. Invalid bodies return 400/403/413/415; internal failures return sanitised 503.
3. `/api/report-metric` validates a report token format and verifies a matching `status=ready` in the protected order table before counting.
4. Both aggregate tables have RLS on; `anon` and `authenticated` have no read access; only service role can insert/update/read or execute the `SECURITY INVOKER` counter functions.
5. Both database functions validate their event allowlists and write counters atomically. Schema columns were checked directly on the isolated Supabase test branch.
6. Vercel has an active production-only, POST-only WAF rule matching only these two paths with **120 requests per IP per 60 seconds, action LOG**. It does not block requests. Its purpose is observation, not active abuse prevention.

### Remaining security / accuracy risks

- **Automated inflation:** Origin / Fetch Metadata headers are not proof of a genuine human; a scripted client can forge them. SessionStorage deduplication is client-side only. The WAF rule is LOG-only; no enforced limit is active. **Do not enable metrics in Production until the owner separately approves enforcement or other effective abuse controls.**
- **Bearer report references:** Any person with a valid private report link may be able to send engagement requests; do not describe report opens as unique users. Keep logs and error responses free of these identifiers.
- **Lost events:** A visit with consent denied, storage unavailable, intermittent network loss or repeated sessions can be missed or counted differently; saved-flag deduplication may undercount. Report use is currently measured on structured reports, not necessarily all historic report formats.
- **Retention:** Proposed **180-day** automatic deletion is now implemented in the draft SQL as a service-role-only function, called by the existing once-daily recovery Cron under its **separate disabled-by-default** `SPENDSHIFT_AGGREGATE_RETENTION_ENABLED` switch. This was tested successfully on isolated Supabase staging using both expired and recent test rows, with the changes rolled back. Before launch, the owner and solicitor must approve 180 days and explicitly enable the retention switch after production migration. The existing retention of paid customer records is separate and still needs solicitor review.

## 4. Privacy disclosure and consent review

Prepared **draft** text updates to:
- `app/privacy-policy/page.tsx` (first-party optional analytics, report-token verification, security logs, data categories and retention review);
- `app/cookies/page.tsx` (separate explanation of first-party counters, consent and hosting logs);
- `components/ConsentBanner.tsx` (one plain-language sentence on measuring optional private-area actions).

Users can accept or reject optional technologies using the existing controls. First-party audit/report helpers require `spendshift_cookie_consent=granted`. This does **not** add GA4, Clarity, Meta or TikTok to private pages.

**Legal items for an Australian solicitor:** confirm the notices and actual data flow satisfy applicable Privacy Act / APP 1, 3 and 5 requirements; whether combined analytics + advertising opt-in is sufficiently clear; third-party pixel terms; overseas processing; privacy-policy contact/access processes; appropriate retention/deletion; and whether any future use would change the purpose or require fresh consent. The current draft notices need solicitor approval and final publication/effective dates. This is a technical review, not a compliance certification.

Australian OAIC reference sources:
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/more-guidance/guide-to-data-analytics-and-the-australian-privacy-principles
- https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information

## 5. Evidence and test boundaries

- **Connected isolated Supabase:** Migration was applied to `pcjgzbaigtsnevhcjqyd` only. Positive event increments, negative invalid-event exceptions, RLS/permissions and exact table column schemas tested successfully. No production migration was run.
- **Behavioural unit tests:** `scripts/test-analytics-endpoints.mjs` executes the real TypeScript route handlers with an in-memory Supabase fake. Tests include enabled/disabled paths, same/cross origin, invalid events, unexpected data, unknown reports, malformed tokens, DB failures, consent declined/granted and deduplication. This does **not** simulate the real network, real Stripe or the real Supabase service role.
- **Isolated HTTP browser journey:** `scripts/check-phase1-browser.mjs` tests that the **actual HTTP** routes on a VERCEL_ENV=preview local Next.js app respond 204 without exposing data or requiring the database. It also checks pages on desktop and mobile. No real Stripe purchase is made.
- **Production:** Current deploy remains on `main`; the draft endpoints are not deployed or switched on. The enabled path cannot be tested in production until a separate approved migration/deployment/activation. The firewall monitoring rule is active but cannot see endpoint traffic until deployment.

## 6. Decision / release gate

**Technical privacy architecture:** acceptable for continued staging and review with the controls above.
**Production activation:** **NOT READY** until (a) enforceable, measurable abuse prevention is in place, (b) the proposed 180-day retention and separate retention environment switch are approved and enabled alongside the production migration, (c) Australian privacy wording and consent handling receive legal sign-off, (d) release tests pass on the exact final commit and (e) the owner explicitly approves both production SQL migration and application deployment. Verify GA4/Clarity and aggregate event counts after that approved deployment.

Never merge PR #28, deploy the new first-party endpoints, enable the Vercel metrics flag or apply the production migration as a side effect of this review.

## 7. Proposed retention verification (16 November 2026)

On the analytics draft branch, a `SECURITY INVOKER`, service-role-only SQL function `spendshift_prune_analytics_daily` removes rows whose Sydney-local event dates are **at least 180 days old**. It touches only the two first-party daily aggregate tables. No report orders, checkout data, paid-plan details or other customer tables are touched.

The SQL function was installed in isolated Supabase test project `pcjgzbaigtsnevhcjqyd`. An explicit transactional test inserted expired (181-day-old) and recent (179-day-old) aggregate rows, ran the deletion function, asserted expired records were deleted and recent records remained, and rolled the test changes back. **Test passed.**

The existing daily Vercel recovery Cron has a new *best-effort*, separately guarded RPC call; its error cannot prevent paid-report recovery. The daily job schedule has not changed. The production switch `SPENDSHIFT_AGGREGATE_RETENTION_ENABLED` has **not** been created or enabled and the migration is **not** applied to the production database. The proposed retention period and legal notices remain subject to the owner's and Australian solicitor's sign-off.
