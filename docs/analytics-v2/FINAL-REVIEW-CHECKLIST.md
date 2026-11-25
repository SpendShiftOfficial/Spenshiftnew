# Final candidate — solicitor and owner review, 25 November 2026

The development candidate is source-locked. No production changes or data collection are authorised. The live published policy remains unchanged; the branch now contains complete proposed policy pages marked draft/not effective. Counsel must approve the final wording before any separately authorised release. This document records engineering decisions, not a compliance certificate.

## First-party-only consent and protection
- Separate new basic-statistics choice and existing optional first-party audit/report counts. Existing cookie choices block new basic collection unless explicitly transitioned. Valid older first-party consent may be honoured within its original scope; new optional choices never create a legacy vendor grant. All-statistics opt-out withdraws both categories. No visitor option or environment flag re-enables Google Analytics, Clarity, Meta or TikTok.
- Basic opt-out and independent privacy mode preserved. Vendor loader components are inert, event-forwarding functions are no-ops and global CSP denies remote scripts/frames/connect requests. Owner authentication retains a narrowly scoped Supabase connection exception. No third-party forwarding or server-side conversion pings introduced.
- No expanded financial-answer measurement, unique IDs, private paid-stage/report expansion or opt-choice counts. Basic requests omit credentials and referrer; hosting/security may process metadata. Counts are observations, not unique people or matched conversions.

## Browser storage isolation — mitigated in candidate, cutover review required
- Existing free drafts and completed answers use origin-shared localStorage or sessionStorage. Previously loaded third-party JS could potentially access these stores on the same origin. There is no established evidence of disclosure.
- Removal of all vendor execution paths and site-wide CSP address this risk in newly loaded candidate documents without deleting drafts or changing how the product works. Previously opened old pages, browser extensions, XSS and other same-origin code are not eliminated by this design. No claims of full storage isolation or retrospective deletion.
- Plan an authorised tracker-free cutover and first-party-only rollback. Do not return to vendor-enabled builds or add providers unless separate origin isolation and legal/security review are complete. Review old vendor data/cookies and account terms separately.

## Owner access
- Source lock false; hosted owner path unavailable until separately reviewed release. The production page requires an exact project URL and a dedicated Supabase publishable key, never the service-role key.
- Pre-provision an allowlisted owner account and verified TOTP factor. Browser auth state memory-only, no auto-refresh, twelve-minute UI expiry; server checks authenticated user, MFA assurance, recent token and live session. No customer account changes or signup flow.
- Real Supabase Auth provisioning, MFA enrollment, session expiry/revocation, provider security configuration and owner access must be verified on approved isolated infrastructure before activation. Unit/server authorization tests do not substitute for provider login. No production account created.

## Financial reporting
- Read-only operational order aggregates are independent from Stripe financial truth. Imported daily sources: Stripe confirmed paid orders, gross AUD cents, refund cents, failed payment attempts; Meta spend cents, reported LPV and outbound clicks; historical GA4 consented sessions (no new GA4 site tracking in this candidate).
- Owner must verify product scope, currency, Sydney date boundaries, refunds by refund date, and payment counts before entry. No raw exports or identifiers. Missing dates are N/A; explicit zero only if verified. Replacing a source/date is idempotent. Current day can be partial. Gross less refunds is not profit; spend/all orders is not attributed CAC.
- Only an authenticated owner with the separately enabled import flag may save. Source-specific SQL tables, RLS, fixed numeric fields, strict request validation, service-role RPC, aggregate read and 180-day prune. The reporting cache does not replace accounting source records.
- No automated provider feeds or real figures were connected. Real reconciliation and provider report timezone definitions remain outstanding.

## Release hold
1. Review the exact candidate CI results and fix all failures.
2. Complete an approved isolated Auth review and tracker-free deployment checks, WAF/capacity tests, source alignment and operational reconciliation.
3. Obtain Australian legal approval for the actual notice, policy, legacy treatment, provider contracts and overseas/log retention. Publish approved legal wording only with matching functionality.
4. Obtain separate explicit owner approval for migration, configuration, deployment and activation. Keep current production untouched until then.

References: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations ; https://developers.google.com/tag-platform/security/guides/privacy ; https://learn.microsoft.com/en-gb/clarity/setup-and-installation/clarity-consent-api-v2 ; https://supabase.com/docs/guides/auth/auth-mfa.
