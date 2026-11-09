# SpendShift Phase 1 — pre-launch checklist (NOT YET LIVE)

## Customer experience redesign — 9 November 2026

- Free results no longer show pre-set dollar ranges, category dollar tiles, or unverified "money leak" values.
- Free results use the same 0–4 ranking signals as optional paid questions, not invented annual savings. If no strong area appears, customers are told NOT to buy a report on those answers.
- Checkout now says "Step-by-Step Savings Plan" with the existing A$39 price and the same Stripe product metadata identifier.
- After payment, the customer sees clear options to add details or make a plan immediately.
- The personalisation screen has shorter wording. "Want to check another bill?" is optional and appears only at the final review, not before the first question.
- The main report now uses big, clear cards, customer-provided spending, three steps per area, optional copyable messages and a three-task checklist saved only in the customer's browser.
- The report DOES NOT lead with an annual savings estimate. No yearly saving is inferred from insurance premiums, recent review dates, a subscription count, takeaway order frequency, or assumed shopping reductions.
- The only current annual saving scenario is an exact price the customer voluntarily supplies for a specific unused subscription. It must still be cancelled before money is genuinely saved.
- The new report renders directly from the saved structured calculation data. Existing saved structured reports display the new layout without regenerating. Legacy reports without the structured summary retain their old renderer.
- Reports generated after this redesign store a shorter plain-language report string and v2 structured summary. There is no AI wording call in the new report generator.
- Preview-only fictional examples are available at \`/report-preview\` on the Phase 1 branch. This route returns 404 in Production and never charges money.
- Scripted checks cover the missing-dollar cases, three insurance premiums, no double counting, the short report, and no-opportunity cases.

### Manual design review still required
1. Open the Phase 1 preview's \`/results\` after a fresh eight-question audit. Confirm there are no dollar ranges or guaranteed-savings promises.
2. Open \`/personalise\` on the preview and test the sample customer. Confirm the missed-bill option appears ONLY on the last screen.
3. Open \`/report-preview\`. Test all four fictional profiles and mobile view, especially the three insurance policies and no-guarantee messaging.
4. Confirm saved older test reports still open (no data migration).
5. If we repeat test checkout, always use the Stripe sandbox. Do NOT use a real card.
6. Separate technical pass/fail from a real customer value test: a readable report alone does not prove customers will value it at A$39.

## Vercel preview isolation — 9 November 2026

- Vercel project: `business-solutions/spenshiftnew`, on Hobby.
- Only the `phase-1-personalisation-2026-11` Git branch received isolated Preview environment overrides. **Production variables were not edited.**
- `SUPABASE_URL` targets `https://pcjgzbaigtsnevhcjqyd.supabase.co`, the isolated development database.
- `NEXT_PUBLIC_SITE_URL` targets the stable branch preview hostname.
- `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY` and `CRON_SECRET` currently contain **non-working test placeholders** on this branch. No secret values are stored in Git.
- `SPENDSHIFT_ALLOW_PREVIEW_PAYMENTS=false`, `PHASE1_TEST_EMAILS=disabled`, and `PHASE1_TEST_AI=disabled` deliberately disable preview purchases, outgoing emails and AI usage.
- Code guards reject preview checkout and database access if the project points to Production credentials.
- The optional status endpoint `/api/phase1-status` exposes readiness booleans but never secrets; it returns 404 in Production.
- **Not yet configured:** an actual **Stripe test-mode secret key**, the development branch's **Supabase service-role/secret key**, signed Stripe test webhook with Preview protection bypass, and test email service.
- Test credentials must be entered in Vercel's branch-specific environment variables **directly by the account owner**; never paste credentials into chat or screenshots.
- After correct test credentials are entered, confirm readiness then enable `SPENDSHIFT_ALLOW_PREVIEW_PAYMENTS=true` **on the same branch only**. Do not enable the flag with placeholders.
- Vercel preview protection is enabled. Stripe's webhook cannot reach a protected preview without a securely configured bypass. Use only the test webhook endpoint and signing secret.

## Supabase staging status — 9 November 2026

- Isolated **Supabase development branch** `phase-1-personalisation-test` created. Its compute charge is US$0.01344/hour plus potential usage. **Delete it once testing is complete.**
- Branch started without production data or a saved schema migration history. A minimal test-only version of `public.reports` was created first using the verified production column definitions.
- The Phase 1 SQL migration was **successfully applied to the development branch**. It created `public.report_orders`, new report refinement and savings-summary columns, and a unique index on the paid session identifier.
- Read-only checks confirmed zero data rows in `reports` and `report_orders`, RLS enabled, no `anon` or `authenticated` read/write access to the order table, and `service_role` access.
- The production Supabase database has **not** been migrated. Do not copy production customer data into the test branch.
- The database security adviser reports an informational "RLS enabled, no policy" notice for the test tables. This is intentional while all reads/writes are restricted to server-side service role; reassess before introducing user-facing database access.
- Next: configure the Vercel preview with **test environment** Supabase and Stripe credentials, then perform end-to-end test payments. Never use production Stripe keys in the preview.

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
