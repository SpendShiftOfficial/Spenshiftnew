# SpendShift privacy policy — proposed revisions for solicitor review

**DRAFT — NOT PUBLISHED OR APPROVED.** Prepared 25 November 2026. Based on the existing Privacy Policy dated 16 November 2026 and Technical Design v1.0. This is a targeted replacement schedule; retain other sections verbatim unless the solicitor directs otherwise. Insert the actual effective date only on an approved release. The production site still uses the original policy and consent rules. Expanded basic statistics are not currently collected.

## Section 3 — Information we collect (replace the two technical/analytics list items)

- Technical information needed to operate and protect the service, which may include IP addresses, device and browser information, request paths and timestamps processed by our hosting, payment and security providers.
- Limited first-party website and product statistics as described in section 12: page and arrival categories, broad referral and device/browser categories, approved campaign labels, predefined button and navigation actions, FAQ interactions, engagement and performance ranges, reviewed error categories, and progress through the free savings check and purchase offer. We do not send your questionnaire answers, precise financial amounts, report reference, email address, advertising click identifier or full URL in these new analytics events.
- If you allow optional website analytics or advertising measurement, the relevant third-party providers may process usage, device, browser, referral, approximate location and event information on eligible public marketing pages. We also retain the existing separately consented first-party audit and report engagement counts. We do not use these optional scripts on private questionnaire, results, checkout-related or report pages.

## Section 4 — How we collect information (add)

Basic statistics use predefined events sent by your browser to SpendShift's own website. Where approved and disclosed, these operate separately from optional analytics and advertising technologies. We convert accepted observations into daily totals by approved category; we do not create individual browsing histories. The hosting infrastructure receives network requests and may process technical information for service delivery, diagnostics and security. See section 12 for your choices.

## Section 5 — Why we collect, use and disclose information (replace analytics purpose sentence)

We use basic statistics to understand website traffic, improve the free savings check, identify technical problems and assess how our service performs. We use necessary payment and fulfilment records for transactions, delivery and aggregate business reporting. We do not link basic analytics to individual customer payment, report or financial records or sell individual browsing profiles. Where we seek to use personal information for a different purpose, we will assess the applicable legal requirements and obtain consent where required. Optional marketing measurement is a separate choice. For internal reporting, authorised staff may enter verified daily aggregate totals from Stripe, Meta Ads and Google Analytics. These reporting entries are not individual customer records and are not joined to visitor activity. The internal owner account uses Supabase Auth for password verification, multi-factor authentication and session security; this account is separate from customer access to savings plans.

## Section 7 — Service providers (amend analytics and hosting entries)

Supabase and Vercel provide the database, website hosting and infrastructure used for basic first-party statistics and operational security. They process data in accordance with their applicable service arrangements. Google Analytics and Microsoft Clarity provide optional website analytics; Meta Pixel and TikTok Pixel provide optional advertising measurement on eligible public marketing pages. These services are separate from basic statistics. We do not send non-consenting users' new basic event data to these optional providers or use server-side conversion forwarding to bypass their choices.

## Section 8 — Overseas processing (add / replace as applicable)

Some service providers and subprocessors operate outside Australia, including in the United States. The processing locations and safeguards depend on each service and its configuration. Hosting may process request metadata outside Australia even when database storage is located in Australia. Where required by the Privacy Act, we take reasonable steps to ensure overseas recipients handle personal information consistently with applicable obligations, unless an exception applies. Contact us for current information about our providers and locations.

Reviewer: confirm actual countries, contractual processing/disclosure status, subprocessors and log/backup retention before publication; do not represent all processing as Australian.

## Section 9 — Storage and retention (replace analytics paragraph only)

Basic analytics totals and previously consented first-party activity totals are stored separately from individual payment and report records. Our new analytics tables hold dates, fixed event categories, coarse category labels and counts. They do not hold individual visitor identifiers, financial answers or private report links. We retain these daily totals and the imported aggregate reporting cache for up to 180 days and automatically remove expired totals. This does not delete or replace original financial and taxation records. Separate short-lived aggregate capacity counters may be used to protect the collection service. Operational security logs, provider copies and backups have their own retention arrangements. Customer payment, taxation and saved-report records are subject to separate requirements and retention practices described above.

Reviewer: verify retention activation, provider backup lifecycle and delete testing before making the 180-day assurance. Existing indefinite paid-report retention needs a separate assessment; this amendment does not extend it.

## Section 12 — Cookies, basic statistics and optional tracking (replace entire section)

### Basic website statistics

We use limited first-party statistics to understand and improve SpendShift. We count approved website and product actions, such as public page arrivals, general referral categories, clicks, page performance, progress through the free savings check and whether a checkout link was returned. We record totals by day and approved category. We do not record individual browsing profiles, form answers, report or payment identifiers, email addresses or advertising click identifiers in this new analytics system. Broad device/browser categories and campaign labels are not used to identify you or follow you across websites.

For newly informed visitors, basic statistics are separate from optional website analytics and advertising choices. You can turn them off in Privacy settings without losing access to the free savings check or a purchased plan. Where you made a choice under our earlier cookie notice, we preserve that choice. New basic statistics remain off for that browser unless you explicitly enable them after the revised notice is presented. Changing optional tracking choices does not change a separate basic-statistics opt-out. If your privacy preferences cannot be read reliably, new basic statistics remain off.

Hosting and security services still need to handle network requests and may process technical metadata, including IP addresses, separately from the analytics totals. These processes support operation, security and fraud prevention.

### Optional website analytics and advertising

Google Analytics and Microsoft Clarity operate only within the reviewed public-page scope and according to your optional website analytics choice. Meta Pixel and TikTok Pixel operate only within that scope and according to your optional advertising choice. You can accept, reject or manage these categories separately. No third-party tracking scripts are loaded in the free check, free results, paid questionnaire or private report. Rejecting optional tracking does not prevent the service from functioning. Google Analytics and Microsoft Clarity are configured in the proposed implementation for website analytics without granting Google's advertising permissions or Microsoft advertising storage permission. If a category is withdrawn, we stop loading its scripts and refresh the page where needed. We attempt to expire known first-party cookies belonging to the withdrawn category; browser and provider settings may be needed to remove other cookies. Data sent before withdrawal is subject to the provider's retention and deletion arrangements.

Our existing consented audit/report activity counters are separate from the new basic statistics. Where you allow optional analytics, they may count basic audit actions and use a report reference only on SpendShift's server to verify access to a valid report; the reference is not retained in the daily totals or passed to advertising providers. Rejecting optional analytics disables these existing optional activity counts. We do not expand private report engagement or collect distributions of your financial answers through the new system.

See the Cookie Policy for details of browser storage and preferences. You may change your choices at any time. Withdrawal applies to future optional collection; already aggregated non-identifying totals cannot be matched back to individual visitors.

**Publication conditions:** the candidate contains separate controls, script gates, known-cookie cleanup, and a fail-closed owner/reporting path. The isolated test uses inert provider scripts. Review actual provider configurations, withdrawal network behavior, legacy transition, separately authorised collection, notice effective date, and the live data flow before publication. The current v2 release is locked and the published policy remains unchanged.

## Sections 13–16

Retain existing access, correction, deletion, complaints and contact provisions. Check they meet applicable APP 12/13, complaint and data breach obligations. Keep the company's existing contact details. Update the effective date only after solicitor and owner approval.
