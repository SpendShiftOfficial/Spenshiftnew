# SpendShift — solicitor review handover

**Draft updated:** 14 November 2026. **Status:** Draft for an Australian solicitor, not approved legal advice. Changes are on `phase-1-personalisation-2026-11`, draft PR #27, not in production.

## Product facts verified from Phase 1 code
- Eight free spending questions produce free results. An optional personalised savings plan costs **AUD $29 once**, with no subscription.
- After payment, extra questions about relevant spending areas can be skipped if costs are unknown. The plan includes three priority actions, comparison guidance, a checklist and a way to record actual savings.
- No bank login, live price comparison, provider switching or guaranteed savings. Possible saving figures require enough relevant information.
- Earlier purchases, including **A$39** orders, remain valid at the amounts actually paid.
- The current report-generation path uses deterministic rules and calculations, **not Anthropic Claude**; earlier versions may have used AI-assisted text.
- Public-page measurement tools include consent-controlled Google Analytics, Microsoft Clarity, Meta Pixel and TikTok Pixel. Private audit, results, paid questionnaire and report pages do not load the optional scripts.

## Document edits for review
1. **Terms:** A$29 one-time offer, discontinued 30-day action plan removed, paid delivery sequence, no live prices, current rules-based processing, confidential plan links.
2. **Refund:** current and earlier purchases described correctly; **existing voluntary 30-day money-back guarantee preserved**.
3. **Privacy:** free browser storage versus paid records, current/older AI processing, cookies/pixels, third parties, overseas processing.
4. **Financial Information and AI Disclaimer:** conditional calculations, no live comparisons and current/earlier AI distinction.
5. **Cookie Policy:** optional Google, Microsoft, Meta and TikTok technologies and consent choices.

All five show **Last updated: 14 November 2026**. Confirm the effective date when these are actually published.

## Solicitor sign-off items
- ASIC licensing and distinction between education/factual information and regulated personal/general **financial product advice**, particularly insurance, credit and savings recommendations. A disclaimer alone does not resolve classification.
- Australian Consumer Law **unfair contract terms**: price and service variations, liability cap, suspension and termination, indemnity, jurisdiction and IP restrictions.
- Statutory consumer guarantees versus the voluntary **30-day money-back guarantee**, evidence requirements, earlier purchases and refunds.
- Privacy Act/OAIC requirements for tracking pixels, consent, overseas disclosures, earlier AI processing, access-link security, retention/deletion and any automated decision requirements.
- Confirm legal entity, ACN, address, GST registration and GST-inclusive price wording.
- Check versioning of accepted Terms: checkout still uses `TERMS_VERSION='2026-11-phase1'`. Agree on permanent version history for previous purchases before production release.
- Verify current preview disclosures against eventual production configuration and timing.

## Official regulatory references
- https://www.accc.gov.au/consumers/buying-products-and-services/consumer-rights-and-guarantees
- https://www.accc.gov.au/consumers/buying-products-and-services/contracts
- https://www.asic.gov.au/regulatory-resources/financial-services/giving-financial-product-advice
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations
- https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-1-app-1-open-and-transparent-management-of-personal-information

**Change controls:** No audit, checkout, financial calculation, report generation, tracker, customer data, consent logic or production deployment changes were authorised in this legal draft.
