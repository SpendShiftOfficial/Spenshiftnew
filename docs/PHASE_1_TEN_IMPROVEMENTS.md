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
