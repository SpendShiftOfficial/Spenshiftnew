# SpendShift — Phase 1 analytics refinement (15 November 2026)

## Goals and ground truth

Preserve the existing Google Analytics 4 property `G-MEHDG2Y7T2` and Microsoft Clarity project `ykimmnar80`. Their historical events are retained. This project does not add third-party scripts to audit answers, free results, Stripe return URLs, personalisation or private reports.

**Public discovery / website traffic:** GA4 page and session statistics for visitors who accept optional cookies on eligible public marketing pages. Clarity captures consented public-page experience only. Visitors declining optional cookies will not appear in these tools, so GA4 totals are not all visits.

**Potential customers:** `audit_cta_click` now fires for consented clicks on any public marketing page's "Start my free savings check" link. This measures intent to begin, not proof that all eight questions were completed. Do not mislabel it `audit_start`.

**Paying customers / product fulfilment:** Stripe remains the payment authority. The server-side Supabase `report_orders` table contains one row per paid Stripe checkout session and is the source of truth for paid orders, submitted additional details, successful report generation and confirmation/report emails. Do not infer purchases from `purchase` in GA4 or Clarity; the new private payment journey intentionally does not fire those client-side events.

**Report use:** Opening a paid report, ticking tasks or recording actual savings are not yet reliably measurable from the current GA4/Clarity implementation; the checklist and tracker are local to the browser. Do not report those old Clarity smart-event names as current product usage.

These sources have different denominators and are **not a stitched, user-level conversion funnel**. Do not divide an all-customer Stripe count by consented GA4 visits and label it an exact user conversion rate.

## Changes in this branch

1. The new electricity and subscription content pages, plus `/why-spendshift` and `/services`, are eligible for consented public tracking.
2. The public "Start my free savings check" link sends `audit_cta_click` to GA4 and Clarity when the corresponding browser libraries are available.
3. No private-page tracking is enabled; no financial answers, prices, email addresses, checkout session IDs, report links or query parameters are passed into the analytics events.
4. Added a regression test for the updated page allowlist and audit CTA instrumentation.

## Existing paid-funnel report (run inside the authorised production Supabase SQL editor)

The following read-only query uses no email addresses or customer spending values. It aggregates by Sydney calendar date, based on the paid-order time. Note that the email columns indicate send-processing completion, not proof of inbox delivery.

```sql
SELECT
  (paid_at AT TIME ZONE 'Australia/Sydney')::date AS purchase_date_sydney,
  COUNT(*) AS paid_orders,
  COUNT(*) FILTER (
    WHERE refinements IS NOT NULL
      AND (refinements ? 'draft' OR refinements ->> 'completed' = 'true')
  ) AS orders_with_post_payment_details_saved,
  COUNT(*) FILTER (
    WHERE refinements ->> 'completed' = 'true'
  ) AS post_payment_details_completed,
  COUNT(*) FILTER (WHERE status = 'ready') AS reports_ready,
  COUNT(*) FILTER (WHERE report_sent_at IS NOT NULL) AS report_emails_processed,
  COUNT(*) FILTER (WHERE confirmation_sent_at IS NOT NULL) AS confirmation_emails_processed,
  COUNT(*) FILTER (WHERE status = 'failed') AS report_failures
FROM public.report_orders
WHERE paid_at >= now() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;
```

## Next implementation gate: privacy-safe first-party funnel counters

To measure *actual* free-audit starts/completions and paid-report usage without loading GA4 or Clarity on private pages, a separate first-party **aggregate-only** design is needed. It would record an event category and date, without raw URLs, purchase IDs, report IDs, user identifiers, IP addresses, free answers, financial amounts or report contents. We must confirm privacy disclosures, collection reliability, abuse protections and retention before adding database tables or any new public collection endpoint.

Do not silently add Measurement Protocol purchase events: without confirmed consent, deduplication and identity/linkage decisions, they could create misleading conversion counts or privacy risk.

## Acceptance checks

- Production `main` must remain unchanged until reviewed and approved.
- On Vercel Preview, GA4 and Clarity must remain disabled regardless of consent: the existing root layout explicitly enables public analytics only in Production. The preview can verify page rendering, safe code paths and automated regression tests but cannot send real GA4/Clarity events.
- After an explicitly approved Production deployment, accepting optional cookies on `/reduce-electricity-bill-australia` and `/cancel-unused-subscriptions-australia` should load the existing GA4 and Clarity installations. Rejecting optional cookies should not load either tracker.
- After an approved Production deployment, clicking "Start my free savings check" on a public page with consent granted should record `audit_cta_click` in GA4 Realtime / DebugView and Clarity smart events. Clarity loads lazily, so an extremely fast click may be missed by Clarity.
- `/audit`, `/results`, `/success`, `/personalise`, `/report/...` and `/api/...` must not load third-party analytics scripts.
- No private page URLs, query strings, financial answers, checkout IDs or report IDs should appear in GA4 / Clarity parameters.
- Browser tests and TypeScript/build checks must pass. The newly created Git branch needs its own isolated Vercel Preview environment overrides before testing any paid flows; it must not inherit production payment/database credentials into Preview.

## GA4/Clarity dashboard housekeeping (after deployment and evidence)

Keep the existing properties and event history. Do not mark `audit_cta_click` as a purchase or a lead completion. Retain the `purchase` key event for future, correctly implemented ecommerce measurement, but do not interpret its absence as an absence of orders. Older smart events such as `paid_report_ready` and `purchase` are definitions, not evidence of recent successful triggering.

## First-party audit counters — draft code, OFF by default

The branch now includes proposed migration `supabase/migrations/20261115054400_spendshift_aggregate_audit.sql`, endpoint `/api/audit-metric` and two client events. **The migration has NOT been applied to Production or Preview**, and the endpoint is disabled unless `SPENDSHIFT_AGGREGATE_METRICS_ENABLED=true` in Production.

- `audit_start`: recorded once per browser tab/session when a visitor chooses an answer on the first free-audit question.
- `audit_complete`: recorded once per browser tab/session after all eight choices pass existing validation and the answers have been saved locally.
- The browser sends only the event name to the same-origin backend; it does NOT transmit financial answers, private links or user identifiers. Third-party analytics remain disabled on `/audit`.
- The database stores only Sydney-local dates, two allowlisted event names and aggregate counts. Only the server's service role can access the table and increment function.
- These are **approximate interactions, not deduplicated people**. An open endpoint can be abused by automated requests; rate/abuse protections and privacy review must be completed before enabling it. SessionStorage failure or offline usage can cause undercounting.
- Read-only query after migration:

```sql
SELECT event_date,
  COALESCE(SUM(event_count) FILTER (WHERE event_name = 'audit_start'),0) AS audit_starts,
  COALESCE(SUM(event_count) FILTER (WHERE event_name = 'audit_complete'),0) AS audit_completions
FROM public.spendshift_audit_daily
GROUP BY event_date ORDER BY event_date DESC;
```

Before release: review privacy disclosures and abuse controls, apply the migration in an isolated test database, check RLS/advisors and regression/browser tests, and obtain explicit approval before any production SQL migration or enabling the Vercel environment flag.

The payment and fulfilment source of truth is still `report_orders`. This branch has **not** added report-engagement collection or modified payments or reports; opening a report and interacting with its checklist/tracker remain to be instrumented separately.

## Draft report engagement tracking — disabled pending approval

Added an opt-in, first-party-only report engagement design on the same analytics branch:

- `report_open`: the structured paid savings report loaded in a customer's browser.
- `checklist_interaction`: the customer checked/unchecked an action.
- `tracker_saved`: the customer saved or updated a local spending comparison.
- `feedback_sent`: a report feedback form succeeded (not what the feedback said).

These are approximate **per-browser-session event counts, not unique users or proof of achieved savings**. The browser helper requires the existing `spendshift_cookie_consent=granted` preference. The old audit counter helper now also respects that choice, so rejecting optional analytics means no first-party funnel events are sent.

The protected report's unguessable ID is transmitted ONLY to the same-origin `/api/report-metric` endpoint for a server-side check against a ready `report_orders` row. The ID is never stored in the analytics aggregate table or sent to GA4, Clarity or ad pixels. All the report and financial content remain local to the private workflow. Demo reports and legacy reports outside `report_orders` are not counted.

Proposed SQL (same unapplied aggregate-audit migration) creates `spendshift_report_daily`: only a date, four event categories and integer counts. Row-level security and service-role-only permissions prevent browser access. The endpoint rejects unknown event names, invalid tokens and cross-origin browser requests. However, a request with a leaked valid report token could be repeated; browser-only session deduplication is **not** server-side abuse prevention.

The feature is **OFF** unless `SPENDSHIFT_AGGREGATE_METRICS_ENABLED=true` is explicitly configured in Production, and the SQL migration is **not installed** in any connected production database. Before activation: complete privacy/legal review, confirm appropriate abuse controls and limited retention, validate the migration and row permissions in an isolated database, and verify that aggregate counts correspond to the intended actions. Never claim precise person-level conversion rates or deduplicated report-user counts from these counters.

Read-only aggregate report query after separately approving/applying the migration:

```sql
SELECT
  event_date,
  COALESCE(SUM(event_count) FILTER (WHERE event_name = 'report_open'),0) AS report_opens,
  COALESCE(SUM(event_count) FILTER (WHERE event_name = 'checklist_interaction'),0) AS checklist_users_actions,
  COALESCE(SUM(event_count) FILTER (WHERE event_name = 'tracker_saved'),0) AS tracker_save_actions,
  COALESCE(SUM(event_count) FILTER (WHERE event_name = 'feedback_sent'),0) AS feedback_submissions
FROM public.spendshift_report_daily
GROUP BY event_date
ORDER BY event_date DESC;
```

An approved end-to-end operational funnel should combine *separately labelled* sources: consented GA4 website visits, consented first-party audit actions, verified Stripe paid orders, Supabase fulfilment stages, and consented first-party report interactions. The events do **not** yet share a privacy-safe anonymous identifier, so do not divide counts with different denominators to claim an exact visitor-to-purchase conversion rate.
