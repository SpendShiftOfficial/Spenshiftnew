# SpendShift Phase 1 — pre-launch checklist (NOT YET LIVE)

Branch: phase-1-personalisation-2026-11
Draft PR: https://github.com/SpendShiftOfficial/Spenshiftnew/pull/27

## Implemented
1. Optional questions based on eight audit answers, plus one additional area chosen by the customer.
2. Multiple insurance policies with separate premiums, payment periods, insurer names and short cover descriptions.
3. A post-payment choice to personalise or generate immediately; never a second charge.
4. Deterministic calculations that distinguish current costs from conditional scenarios and exclude unverified insurance/energy/phone savings.
5. Verified Stripe payment checks, signature-checked webhook, durable paid-order queue, resume email, report recovery and secure random report IDs.
6. An action-first report that highlights a realistic next step and how to verify actual savings.

## Release blockers — complete in order

### 1. Supabase migration and backup
- Make a recoverable backup first.
- Review existing public.reports table columns: id, report, answers, stripe_session_id, email.
- New rpt_ identifiers are 52 characters. Check reports.id supports these; text is suitable.
- Review and execute supabase/migrations/20261109_phase1_report_orders.sql in the correct project.
- Verify report_orders table is protected by RLS and cannot be read by anonymous or authenticated browser clients.
- Verify reports has JSONB columns named refinements and savings_summary.
- Review existing reports table access permissions separately; do not assume they are safe.

### 2. Isolated Stripe and Supabase test environment
- Vercel Preview should use Stripe test mode, isolated test Supabase data, and test email settings.
- Never purchase through Preview if it points at production Stripe keys.
- Keep all API keys and signing secrets in Vercel environment variables, never GitHub or ChatGPT.

### 3. Webhook and recovery configuration
- Create a Stripe webhook for https://www.spendshift.com.au/api/stripe/webhook in the appropriate environment.
- Listen for checkout.session.completed and checkout.session.async_payment_succeeded.
- Add that endpoint's matching STRIPE_WEBHOOK_SECRET to Vercel Production; test and live signing secrets are different.
- Set a strong random CRON_SECRET in Vercel Production. Vercel passes this in the scheduled request Authorization header.
- Confirm existing STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY and NEXT_PUBLIC_SITE_URL. ANTHROPIC_API_KEY is optional to keep the report service operational.
- Redeploy after updating environment variables.
- Do not enable the production webhook until the database migration is ready.

### 4. Scheduled-recovery limitation
- The current compatible Vercel schedule runs once daily, at 01:00 UTC.
- Abandoned paid orders become eligible for fallback generation 30 minutes after purchase, but are processed on the next scheduled cron, which could be much later.
- If the webhook and email service are configured, the customer should receive a resume link shortly after payment.
- For faster automatic recovery, use a Vercel plan supporting sub-daily crons or another supported scheduler and test it first.
- Cron processes up to four eligible orders per run and retries failed generation up to four times.

### 5. Tests before production
- Make a Stripe TEST purchase and choose Generate now; verify exactly one report, correct email and no duplicate charge.
- Repeat with optional refinements, three different insurance policies and monthly/yearly figures; verify what is saved and shown in the report.
- Test skipping all questions, no strong audit opportunities, one additional selected category and zero bills.
- Test browser refresh, closing the browser, email resume link and multiple simultaneous tabs.
- Replay a signed test webhook; make sure it does not reset the paid report.
- Test that unverified insurance, energy and mobile payments are NOT converted into invented savings.
- Test old report URLs and new secure report URLs.
- Confirm analytics events collect no personal financial figures.
- Check tablet, phone and desktop screens, and record free-audit and checkout regression results.
- Review the legal/privacy copy, payment provider settings and dependency security warnings.

### 6. Release
- GitHub draft PR stays unmerged until all tests and setup steps pass.
- Confirm GitHub automated checks and Vercel Preview both succeed.
- Prepare a rollback plan, then merge only after checking the production environment settings.

## Privacy and report links
Report URLs use long random bearer tokens, not a user login. Anyone with the URL can view that report. Customers must keep the link private. Phase 1 adds private caching, no-referrer and noindex headers for paid pages.

## Measures after launch
Monitor paid checkouts, optional-question completion and skipping, report success/failure, email delivery, refunds, user satisfaction and confirmed net savings. Do not send premiums, insurance details or other sensitive customer answers to GA4.
