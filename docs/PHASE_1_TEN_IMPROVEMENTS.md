# Phase 1: ten-improvement package — preview only

## Implemented scope
- Truthful shared offer across home, pricing, what is included and how it works. No unsupported dollar examples, old 30-day report promise or AI-generation claim.
- Strict shared eight-answer validation before checkout, versioned terms, server-fixed AUD39 price, idempotent session creation and safe error responses.
- Third-party measurement restricted to consented public brochure pages. Private audit, results, payment, personalisation and report documents do not load measurement scripts. Private CSP blocks external script/network execution. No access IDs in events or console logs.
- Paid plan uses guided questions, not a second upgrade. Unknown amounts can be skipped.
- Autosaved server-side drafts with optimistic revision checks and a visible saved state. Original answers can be corrected before generation. Only relevant, visible data is included in the final plan.
- Meal cost can be per order or per week, and home meals must feed the same people. Overlapping takeaway/small-buy scenarios are not added without a separate-cost answer.
- The main customer goal and upcoming insurance renewals affect ranking. All meaningful areas remain in the plan.
- Weekly targets appear first. Yearly scenarios are behind a clear optional explanation.
- Quote-price tools and a local, self-reported savings tracker separate possible savings from checked differences. Tracker records do not sync across devices and are not independently verified.
- Automated regression and browser tests cover desktop and mobile, privacy, all seven areas, saved draft recovery, editing, mistakes and the report tools.

## 10 November pre-review product polish — still preview only
- Removed the duplicate `Never / not sure` insurance choice from new audit and edit forms. Older paid answers using the combined choice remain valid.
- An unused subscription now needs a specific service name and monthly charge before the report calculates a conditional cancellation saving; missing details still allow a useful plan.
- Equal-price comparisons and equal spending targets are described as no change, never as savings.
- Customers who use every subscription still see subscription checks, but clearer household bill reviews now rank ahead for a bills-focused goal.
- Moved the three-action checklist to the top of the paid report so customers can act before reading long details.
- Adjusted paid onboarding and calculation copy to explain what customers provide and what has not been verified.
- Regression checks added for savings edge cases. All existing production release gates below remain open until explicitly verified.

## 10 November final five corrections — preview only
- Hidden phone and internet amounts are discarded when the paid answer changes to `Not sure`, `Neither`, or a single service; both the browser and server sanitise these values while preserving older reports without this choice.
- Paid plan finalisation now requires at least one relevant area. If changes to the eight answers remove all suggested areas, the customer is clearly asked to select a topic instead of receiving an empty paid report.
- One shared action-step module produces exactly three meaningful first actions in both the rendered report and saved text, including single-area reports.
- Stored takeaway text now preserves whether the customer entered a weekly total or per-order price.
- Electricity quote comparisons label annualisation from a single monthly/quarterly bill as a rough estimate, explain seasonal variation, and only remove the approximation warning after the customer confirms checking 12 months of bills.
- Added regression and desktop/mobile browser checks. Launch price remains A$39 in code pending separately agreed A$29 implementation. Production remains unchanged.

## 10 November iPhone review polish — preview only
- Fixed money-entry prefixes overlapping placeholder text and entered values (the generic input rule was overriding the money field's left padding).
- Added spacing between the expandable free-answer editor and questionnaire progress, and improved field spacing.
- Fixed savings tracker notes sitting against the disclosure border by removing negative paragraph margins.
- Kept the SpendShift logo visible on private pages (no dependence on public-page reveal animation) and tightened the simple header for phone layouts.
- Added desktop/mobile browser assertions for prefix clearance, visible branding, progress spacing and tracker note separation. No pricing, payment or report logic changed.

## 10 November insurance and question-order finalisation — preview only
- Insurance now begins with a clear question; customers add each separate policy. Payment frequency precedes cost and supports weekly, fortnightly, monthly, quarterly, half-yearly and yearly payments.
- The questionnaire shows a running yearly insurance total using all entered premiums; missing prices are explicitly excluded rather than silently counted as zero. The same annualisation is used in ranking, report display, quote comparisons and saved text.
- Takeaway cost period is selected before cost; electricity bill period is selected before cost; and gas bill frequency is selected before its amount. Gas uses the existing stored amount key plus a frequency, defaulting to monthly for legacy saved answers.
- The overlapping-small-buys question no longer assumes the customer has already reached the takeaway detail screen.
- Added CTP / Green Slip as an insurance type without changing the report structure.
- This remains preview-only. Agreed A$29 pricing is still held for a separate release.

## 10 November customer clarity and multiple unused subscriptions — preview only
- Customers can enter up to six distinct unused subscriptions, including up to five optional extra entries. A report names each and totals only services with both a name and positive monthly price as conditional, not confirmed, savings.
- The server rejects duplicate names and subscription prices exceeding a stated monthly subscription total. Incomplete entries are shown but excluded from savings estimates; older paid drafts and reports remain readable.
- The questions now give short, practical prompts to check bank transactions, billing emails and provider apps when amounts are not known. Small everyday buys asks what it costs **you** each week.
- Existing report structure, official links and pricing remain unchanged.

## 10 November final wording and report-tracker clarity — preview only
- Replaced the unclear takeaway period question with a concrete choice between a usual order and a whole week's total, keeping the time period before the amount.
- Kept home-meal cost optional because it is necessary to estimate net takeaway savings rather than falsely counting all takeaway spending as saved. The question now explains what to estimate and the consequence of skipping it; saved report maths remain unchanged.
- Explained that insurance payment frequency and renewal timing are different; renewal still informs prioritisation, while payment frequency drives yearly spending.
- Renamed optional insurance cover details to distinguish coverage (for example comprehensive car) from the broader insurance category, and fixed the optional fields' desktop/mobile alignment.
- Reframed the existing local savings tracker as a tool for **after** taking action, with a worked cancellation example and simpler before-and-after language. No additional account, syncing, payment, or pricing features were added.

## 12 November first-time customer simplicity — preview only
- The eight-question audit covers both takeaway and eating out; smaller purchases exclude meals and eating out.
- Free results use the goal-aware ordering from the paid report with the details currently known. A compact area-relevant example replaces the lengthy fictional saving example.
- Previous question is available on every paid area. On the first paid area it opens one free-audit answer at a time without sending the customer back to payment. The initial accordion is removed.
- Paid takeaway starts with one simple cost question and has an optional link to enter a weekly total; switching unit clears the earlier number. Stored weekly amounts remain valid.
- Small buys exclude meal spending. Revising that amount marks it separately for calculations; old overlapping and unknown answers stay excluded until the user corrects them.
- Phone and internet uses simple visible options and reveals only the corresponding monthly bills, with server-side hidden value protection.
- All edits are on this preview branch. A$29 is still deferred; no production release.

## 13 November first-product meal accuracy and proof of value — preview only
- Improved free Question 1 to specify takeaway or going out for a meal and exclude standalone coffee or snacks. All eight questions and the three highlighted + remaining-four results layout remain.
- Added a practical first step to each prominent free result. Replaced the vague prepayment teaser with a worked, category-relevant fictional example, including explicit assumptions, real arithmetic where suitable and actions the customer could take. Examples are never presented as the customer's saving or as live provider quotes.
- Kept seven spending areas. In the paid "Takeaway and eating out" area, customers can select takeaway, café/restaurant meals or both. Prices, weekly visits, chosen replacements and optional home-meal costs are recorded separately for each type.
- The combined meal-savings illustration now deducts replacement-meal costs from the specific purchases chosen. It does not count the same meal twice or invent a combined saving when an active meal category lacks a replacement cost. Restaurant-only customers do not inherit hidden takeaway amounts.
- Earlier reports and drafts with a single blended meal price are preserved as "combined" for compatibility. Customers can revise old plans to use the new separate method, with old blended amounts cleared to avoid treating them as takeaway-only.
- Calculation, validation, written report, visual report and action steps are updated together. Production is untouched, and the agreed A$29 price is still for a future launch change.

## Operational limits / release gates
- No production merge, migration or production environment edits are part of this package.
- Tests with mocked Stripe/Supabase responses verify the interface and client recovery, NOT a real new Stripe charge or actual provider delivery.
- Email content and code are reviewed, but real sandbox receipt/resume/report inbox delivery remains to be verified with the owner's test email setup.
- A new end-to-end Stripe sandbox purchase on the deployed build is still required before release.
- The current recovery schedule is once per day. It retries completed/failed work, never finalises a customer's unfinished draft. Production needs an agreed support/recovery expectation.
- Five independent customer sessions and a financial-product-advice review are still human release gates. Do not describe them as completed.
- Store no credentials, bank logins or policy numbers in tests, artifacts, commits or public logs.

## Manual acceptance cases
1. All seven high-signal answers: every area is offered, urgent renewal is easy to find.
2. Two-area customer: no unrelated follow-ups.
3. All subscriptions used: no instruction to cancel a useful service.
4. Takeaway weekly total: never label it as an order price.
5. Zero swaps: no forced saving. Higher replacement cost: no claimed reduction.
6. Overlapping lunch/takeaway costs: no double-counted potential total.
7. Close and return after Saved: recover the same data and position.
8. Correct an original answer: stale amounts no longer appear in the plan.
9. Two tabs: stale revision fails safely instead of overwriting work.
10. Paid report: compare a quote, record a measured difference and revisit on the same device.
