# SpendShift Cookie Policy — proposed revisions for solicitor review

**DRAFT ONLY.** Review schedule for the existing policy dated 16 November 2026. The full proposed page is app/cookies/page.tsx, marked draft/not in effect. Retain sections 1–2, 5, 7–9 and other unchanged provisions, subject to counsel review. Do not publish before verified release.

## Section 3 — Replace technology categories

| Category | Purpose and scope | Choice |
|---|---|---|
| Necessary operation and privacy preferences | Hosting, session and browser storage needed for the free-check draft, checkout, security, fraud prevention and remembering your privacy choices. | Some are needed for the service to function. |
| Basic first-party statistics | Limited approved event categories and coarse labels, aggregated into daily totals on SpendShift's own servers. No new persistent visitor ID, tracking cookie, full URL, answer or report ID is collected in these totals. | Separate basic-statistics control; newly informed visitors can turn these off. Previous choices continue to be respected. |
| Optional first-party activity counts | Existing consent-based audit and paid-report action counts. | Off unless permitted; previous valid permission remains within its original first-party scope. |
| Third-party analytics and advertising | Google Analytics, Microsoft Clarity, Meta Pixel and TikTok Pixel were used in previous versions. | Disabled in this release for every choice; no visitor control enables them. |
| Payment and fraud prevention | Stripe checkout and associated payment providers. | Necessary for payment or related safeguards. |
| Hosting, email delivery and operational logs | Vercel, Supabase, Resend and other service infrastructure may handle technical metadata to operate and protect the service. | Separate from optional tracking. |

## Section 4 — Replace analytics and advertising measurement

Basic statistics do not require optional advertising or analytics cookies. We use limited event types and coarse categories, aggregate them by day and do not create a visitor profile. New basic measurement starts only under the revised notice and is disabled if your preferences cannot be read. You may turn it off separately in Privacy settings. We honour earlier choices: basic statistics remain off for a browser with a prior preference unless you expressly enable them under the revised notice. Optional choices do not override a basic-statistics opt-out. No raw financial answers or private links are sent in the new measurement requests.

Existing consented first-party audit and report activity counters continue only when applicable permission exists. Third-party browser analytics and advertising scripts are not loaded on any SpendShift page in this release, even if previously permitted. No cookieless vendor pings or server-side forwarding are introduced. Historical cookies and information may remain under applicable browser and provider arrangements.

We use versioned browser storage to remember privacy preferences; it contains choices and a policy version, not a visitor identifier. An explicit new optional choice uses the versioned preference, not a new legacy vendor grant; restrictions conservatively downgrade an old all-granted marker. A rollback to a vendor-enabled build is not an approved recovery method. The new basic-statistics choice is independent. We retain basic and previously consented aggregate totals and the separate aggregate reporting cache for up to 180 days. Separate hosting/security logs may process technical information such as IP addresses.

## Section 6 — Replace your choices

Use Privacy settings, available from the footer and eligible product pages, to accept or reject optional first-party activity counts, disable basic statistics separately, or turn off all statistics. For an older consent choice, you may voluntarily enable the new basic statistics after reading the revised notice. Changing optional settings does not change your separate basic-statistics choice. Withdrawing optional permission stops future optional first-party count requests. Vendor scripts are disabled regardless. Existing cookies and previously transmitted information may be controlled by your browser or the provider; removal is not guaranteed by changing a preference. You may change your browser settings or use provider opt-out tools where available. Disabling optional tracking or basic statistics does not remove access to SpendShift; necessary storage or payment services may be needed for particular features.

## Release review

Verify site-wide absence of third-party script/network requests, saved browser-answer protection in newly loaded documents, legacy preference behavior, cross-tab opt-out and the residual risk from previously open tabs and historical cookies. Confirm the effective date, cross-border details and 180-day retention. This draft is not the current published Cookie Policy.

## Refined traffic-source classification (26 November 2026)
Approved static UTM source labels (including Instagram/IG, Facebook/FB, TikTok/TT and selected other public platform labels) are mapped to existing broad categories. On an external or unknown-referrer entry, a single valid allowlisted UTM source takes precedence over the referrer classification; otherwise use the broad referrer category or direct/unknown. Same-origin referrers are never converted into new external arrivals by a tag. Duplicate, oversized or unapproved labels are ignored. Only the fixed category is transmitted; no raw tag, full URL, click ID or visitor identifier is recorded. Source labels are declared marketing hints, not verified referral or causal attribution. Campaign labels remain the existing finite catalogue; no new stored field or database migration.

## Australian audience measurement — requested 26 November 2026, pending legal approval
Purpose: assess whether recorded website arrivals reach the Australian market. For validated site_entry events only, the production ingestion route uses Vercel's x-vercel-ip-country header (provider estimates country from public IP), reduces an assigned ISO code to australia, outside_australia or unknown, and passes only that bucket to the aggregate RPC. Missing, malformed, reserved/unassigned or ambiguous values become unknown. No client geo field, precise location permission, external lookup, new identifier, raw IP, original country code, city, region, postcode, coordinates or cross-event linkage. Necessary hosting/security infrastructure may separately process request metadata. Browser payload and consent gate remain unchanged. The daily market marginal is separate from source/device/campaign and other dimensions and follows the 180-day retention. Dashboard shares include unknown in the denominator; incomplete coverage or positive cells below ten suppress the distribution. Not proof of Australian citizenship, residence or qualified unique people; VPNs, proxies and spoofable/incorrect metadata can affect classification. Verify actual Vercel production header behavior and legal basis before activation. No country-based access restrictions or individual targeting.
