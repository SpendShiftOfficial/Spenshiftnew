# Final candidate — solicitor and owner review, 25 November 2026

The development candidate is source-locked. No production changes or data collection are authorised. The published policy remains unchanged; the revised replacement schedules must be reviewed and then incorporated into the actual legal pages in a separately authorised release. This document records engineering decisions, not a compliance certificate.

## Consent
- Separate basic-statistics choice, optional website analytics (GA4/Clarity and existing consented v1 counts), optional advertising (Meta/TikTok). Old grants are limited to their original scope; prior choices block new basic measurement until an explicit legacy transition.
- Basic opt-out is independent. The privacy mode is independent of the collection flag and schema availability. A restricting split or rejection conservatively downgrades an old all-granted marker for rollback. Known first-party cookies are expired on withdrawal; full document refresh removes active scripts. A third-party script already loaded may still emit an in-flight or unload request. Real provider cookies, network behavior, cross-tab/browser differences and product-specific account terms must be checked.
- GA4 advertising flags denied, Google Signals and ad personalization disabled; Clarity consentv2 analytics granted only on analytics opt-in and ad storage denied. The fixture uses inert same-origin scripts, not vendor requests. Confirm actual account settings, destinations, automatic events, sensitive data restrictions and Clarity consent mode before production.
- No expanded financial-answer measurement, unique identifiers, private report event expansion, or opt-choice counts. Basic event requests omit credentials and referrer; hosting/security may still process metadata. Referrer gaps, reloads, duplicate documents, bots and lost events limit counts. No unique-person or matched CAC claims.

## Browser storage isolation — release gate
- Existing audit drafts and completed free answers are saved in localStorage by app/audit/page.tsx, and completed answers may fall back to sessionStorage. These are website-origin stores. Third-party scripts executing on that origin have the browser privileges of the page; a public-page-only loading rule or private-route CSP does not by itself deny access to answers stored earlier, including across tabs. No evidence of actual access or disclosure was found in the inert fixtures, which do not execute real vendor code.
- Before enabling optional vendor scripts in a release, verify a genuine storage/origin isolation design or approve a first-party-only release with vendor loaders disabled. Review the existing production tracking configuration separately; do not change it without explicit approval. Do not claim the current loader scope guarantees financial answer isolation.

## Owner access
- Source lock false; hosted owner path unavailable until separately reviewed release. The production page requires an exact project URL and a dedicated Supabase publishable key, never the service-role key.
- Pre-provision an allowlisted owner account and verified TOTP factor. Browser auth state memory-only, no auto-refresh, twelve-minute UI expiry; server checks authenticated user, MFA assurance, recent token and live session. No customer account changes or signup flow.
- Real Supabase Auth provisioning, MFA enrollment, session expiry/revocation, provider security configuration and owner access must be verified on approved isolated infrastructure before activation. Unit/server authorization tests do not substitute for provider login. No production account created.

## Financial reporting
- Read-only operational order aggregates are independent from Stripe financial truth. Imported daily sources: Stripe confirmed paid orders, gross AUD cents, refund cents, failed payment attempts; Meta spend cents, reported LPV and outbound clicks; GA4 consented sessions.
- Owner must verify product scope, currency, Sydney date boundaries, refunds by refund date, and payment counts before entry. No raw exports or identifiers. Missing dates are N/A; explicit zero only if verified. Replacing a source/date is idempotent. Current day can be partial. Gross less refunds is not profit; spend/all orders is not attributed CAC.
- Only an authenticated owner with the separately enabled import flag may save. Source-specific SQL tables, RLS, fixed numeric fields, strict request validation, service-role RPC, aggregate read and 180-day prune. The reporting cache does not replace accounting source records.
- No automated provider feeds or real figures were connected. Real reconciliation and provider report timezone definitions remain outstanding.

## Release hold
1. Review the exact candidate CI results and fix all failures.
2. Complete an approved isolated Auth and real-provider review, WAF/capacity tests, source alignment and operational reconciliation.
3. Obtain Australian legal approval for the actual notice, policy, legacy treatment, provider contracts and overseas/log retention. Publish approved legal wording only with matching functionality.
4. Obtain separate explicit owner approval for migration, configuration, deployment and activation. Keep current production untouched until then.

References: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations ; https://developers.google.com/tag-platform/security/guides/privacy ; https://learn.microsoft.com/en-gb/clarity/setup-and-installation/clarity-consent-api-v2 ; https://supabase.com/docs/guides/auth/auth-mfa.
