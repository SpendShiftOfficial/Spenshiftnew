import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Review the terms and conditions governing use of SpendShift, including payments, reports, refunds and AI-generated content.",
};

export default function TermsAndConditions() {
  return (
    <div>
      <Header />
      <div className="privacy-policy-content">
        <div className="container">
          <h1>Terms and Conditions</h1>

          <div className="row">
            <div className="policy-content">

              <div className="policy-meta">
                <p>
                  <strong>Legal entity:</strong> SpendShift Enterprises Pty Ltd
                </p>
                <p>
                  <strong>ACN:</strong> 689 089 610
                </p>
                <p>
                  <strong>Website:</strong> www.spendshift.com.au
                </p>
                <p>
                  <strong>Contact:</strong> info@spendshift.com.au
                </p>
              </div>

              <p>
                These Terms and Conditions adopt the defined terms in the
                Privacy Policy.
              </p>

              <h3>1. Acceptance of these Terms</h3>

              <p>
                These Terms and Conditions (“Terms”) govern use of www.spendshift.com.au, the eight-question free savings check, free results, optional paid personalised savings plans, private plan links and related services (“Service”).
              </p>

              <p>
                The Service is operated by SpendShift Enterprises Pty Ltd ACN
                689 089 610 (“SpendShift”, “we”, “us” or “our”). By accessing
                or using the Service, you agree to these Terms and our Privacy
                Policy, Cookie Policy, Refund Policy and Financial Information
                and AI Disclaimer.
              </p>

              <p>
                If you do not agree, do not use the Service. If you purchase the
                Service on behalf of another person or organisation, you confirm
                that you are authorised to bind them to these Terms.
              </p>

              <h3>2. Eligibility</h3>

              <p>
                You must be at least 18 years old and legally capable of
                entering a binding contract to use or purchase the Service.
              </p>

              <p>
                The Service is designed primarily for Australian consumers. If
                you access it from outside Australia, you are responsible for
                complying with local law.
              </p>

              <h3>3. What SpendShift provides</h3>

              <p>
                SpendShift provides an eight-question free savings check showing areas worth reviewing and where to start. The optional paid plan uses your answers and further details you choose to add. It includes three priority actions, guidance for relevant spending areas, help comparing bills and plans, a checklist and a way to record savings you actually achieve. You may skip costs you do not know.
              </p>

              <p>
                The paid plan is a digital service. After payment, you can answer or skip additional questions about relevant spending areas. When those questions are completed or skipped, your plan is prepared and can be accessed through a private saved link, which may also be emailed to the checkout address.
              </p>

              <h3>4. Important limitations</h3>

              <p>
                SpendShift does not connect to bank accounts, independently check live provider prices, switch services for you or verify your transactions, income, bills, contracts, insurance, debts or personal circumstances.
              </p>

              <p>
                The usefulness of your plan depends on your answers. Possible savings figures are calculated only when enough relevant costs and details are known. They are conditional estimates, not guaranteed savings or money already saved. If important amounts are missing, the plan gives steps to check instead of guessing a saving.
              </p>

              <p>
                The Service provides general educational information and
                practical prompts. It is not personal financial product advice,
                legal advice, tax advice, accounting advice, credit assistance,
                insurance advice or a substitute for professional advice.
              </p>

              <h3>5. Your responsibilities</h3>

              <p>You agree that you will:</p>

              <ul>
                <li>
                  provide information that is accurate, current and not
                  misleading;
                </li>

                <li>use the Service only for lawful personal purposes;</li>

                <li>
                  review the report critically and verify any price, provider,
                  plan, contract term, cancellation consequence, fee, saving or
                  recommendation before acting;
                </li>

                <li>
                  obtain professional advice where your circumstances require it;
                </li>

                <li>
                  not provide information about another person unless you are
                  authorised to do so;
                </li>

                <li>
                  protect your email account and saved report URL from
                  unauthorised access;
                </li>

                <li>
                  not copy, scrape, reverse engineer, interfere with, overload,
                  probe, test or attempt to bypass the security of the Service;
                </li>

                <li>
                  not use bots, automated tools or bulk requests without our
                  written permission;
                </li>

                <li>
                  not upload or transmit malware, unlawful material or content
                  that infringes another person’s rights; and
                </li>

                <li>
                  not use SpendShift outputs to mislead, defraud, harass or
                  cause harm.
                </li>
              </ul>

              <h3>6. Automated and earlier AI-assisted content</h3>

              <p>
                The current personalised savings plan uses automated rules, calculations and prepared guidance. It does not call Anthropic’s Claude API to generate new plans. Earlier versions of SpendShift may have included AI-assisted text. Automated or earlier AI-generated material may be incomplete, inaccurate, outdated or unsuitable for your circumstances.
              </p>

              <p>
                Review your plan and verify important information independently. Do not rely only on automated or earlier AI-generated information when making decisions that could materially affect your financial, legal, insurance, credit, tax, health or safety position.
              </p>

              <p>
                We may update the rules, calculations, guidance and systems used for future services. This does not remove your rights relating to previous purchases under applicable law.
              </p>

              <h3>7. Price, GST and payment</h3>

              <p>
                The current price for the optional personalised savings plan is AUD $29 once. There is no subscription or recurring charge. This applies to new orders and does not change previous purchases or amounts paid. Prices for future purchases may change, but the applicable price is shown before checkout. Prices include GST where legally applicable unless stated otherwise.
              </p>

              <p>
                Payment is processed by Stripe through a hosted checkout.
                Available payment methods may include bank cards and Apple Pay.
                You authorise Stripe and the relevant payment provider to charge
                the amount shown at checkout (inclusive of GST).
              </p>

              <p>
                SpendShift does not receive or store full card details. Stripe
                may perform verification, fraud screening or other checks. A
                purchase is not complete until payment is confirmed.
              </p>

              <p>
                You are responsible for any bank, card issuer, foreign-exchange,
                internet or device fees and charges imposed by external third
                parties.
              </p>

              <h3>8. Digital delivery and report access</h3>

              <p>
                After payment is confirmed, you can answer or skip extra questions about relevant spending areas. Your plan is prepared after that step and available through a private link, which may also be emailed to the checkout address. Processing and delivery may be delayed by payment verification, connectivity, maintenance or third-party outages.
              </p>

              <p>
                A private report link may allow access without a separate login. Anyone with the link may be able to view the plan, so keep it confidential. Contact us if you think it has been disclosed or accessed without permission. Our privacy and legal obligations continue to apply to how we handle your information.
              </p>

              <p>
                We may suspend or disable report access where reasonably
                necessary for security, suspected fraud, unlawful use, system
                maintenance, legal compliance or protection of our rights.
              </p>

              <h3>9. Refunds and consumer guarantees</h3>

              <p>
                Our voluntary 30-day money-back guarantee and refund process are
                described in the Refund Policy, which forms part of these
                Terms.
              </p>

              <p>
                Nothing in these Terms excludes, restricts or modifies any
                consumer guarantee, right or remedy that cannot lawfully be
                excluded under the Australian Consumer Law or another
                applicable law.
              </p>

              <h3>10. Intellectual property</h3>

              <p>
                The website, software, branding, questionnaires, report
                structure, calculations, prompts, text, graphics, icons,
                layouts, databases and other materials supplied by SpendShift
                are owned by or licensed to us and are protected by
                intellectual-property laws.
              </p>

              <p>
                Subject to payment and compliance with these Terms, we grant you
                a limited, personal, non-exclusive, non-transferable and
                revocable licence to access and use your report for your own
                private, non-commercial purposes.
              </p>

              <p>You must not, without our prior written permission:</p>

              <ul>
                <li>
                  reproduce, republish, sell, sublicense, distribute or
                  commercially exploit the Service or a report;
                </li>

                <li>
                  create a competing product or service using our content,
                  structure, prompts, calculations or outputs;
                </li>

                <li>
                  remove copyright, trademark or proprietary notices;
                </li>

                <li>
                  frame, mirror or embed substantial parts of the Service on
                  another website; or
                </li>

                <li>
                  use SpendShift branding in a way that suggests sponsorship,
                  endorsement or affiliation.
                </li>
              </ul>

              <p>
                You retain ownership of information you submit. You grant us a
                non-exclusive licence to use, process, store and disclose that
                information as reasonably necessary to provide, secure, improve
                and administer the Service in accordance with our Privacy
                Policy.
              </p>

              <h3>11. Third-party services and links</h3>

              <p>
                The Service uses Stripe, Supabase, Resend and Vercel. Earlier versions may have used Anthropic for AI-assisted content. Subject to cookie consent, some public marketing pages may use Google Analytics, Microsoft Clarity, Meta Pixel and TikTok Pixel. We also link to external providers and comparison resources.
              </p>

              <p>
                We do not control and are not responsible for third-party
                availability, security, terms, prices, eligibility rules,
                products, advice, representations or conduct. A reference or
                link does not mean we endorse or guarantee the third party.
              </p>

              <h3>12. Availability, changes and discontinuation</h3>

              <p>
                We aim to provide a reliable Service but do not guarantee that
                it will always be available, uninterrupted, secure or
                error-free.
              </p>

              <p>
                We may update, suspend, withdraw, replace or discontinue any
                part of the Service, including features, pricing, providers,
                report format and storage arrangements. Where practical, changes
                that materially affect existing paid access will be
                communicated or managed reasonably.
              </p>

              <h3>13. Disclaimers</h3>

              <p>
                To the maximum extent permitted by law, the Service is provided
                on an “as available” basis. We do not warrant that every report
                will identify all possible savings, that an identified saving
                is achievable, or that a provider will offer, honour or
                maintain any price or discount.
              </p>

              <p>
                We do not warrant that the Service is suitable for any
                particular purpose unless you have expressly disclosed that
                purpose to us and we have accepted it in writing.
              </p>

              <h3>14. Limitation of liability</h3>

              <p>
                Nothing in this clause limits liability that cannot lawfully be
                limited, including liability under the Australian Consumer Law.
              </p>

              <p>
                To the maximum extent permitted by law, SpendShift is not liable
                for indirect, incidental, special or consequential loss, loss of
                profit, loss of opportunity, loss of data, reputational loss,
                or loss arising from a decision made in reliance on an
                estimate, AI-generated statement or third-party service.
              </p>

              <p>
                To the maximum extent permitted by law, our aggregate liability
                arising from a particular paid report will not exceed the
                amount you paid for that report. This cap does not apply where
                it would be unlawful or where loss results from fraud, wilful
                misconduct or another liability that cannot be excluded.
              </p>

              <h3>15. Indemnity</h3>

              <p>
                To the extent permitted by law, you indemnify us against loss,
                damage, liability and reasonable costs arising from your
                unlawful use of the Service, breach of these Terms,
                infringement of another person’s rights, or unauthorised
                disclosure of a report URL, except to the extent caused by our
                negligence, breach of law or misconduct.
              </p>

              <h3>16. Privacy and data</h3>

              <p>
                Our collection, use, storage and disclosure of personal
                information are described in the Privacy Policy. By using the
                Service, you acknowledge that audit answers may be sent to an
                overseas AI provider and that reports and associated information
                may be stored using third-party infrastructure.
              </p>

              <h3>17. Suspension and termination</h3>

              <p>
                We may suspend or terminate your access to the Service if we
                reasonably believe you have breached these Terms, engaged in
                fraud or misuse, created a security risk, infringed rights, or
                used the Service unlawfully.
              </p>

              <p>
                Termination does not affect accrued rights, payment obligations,
                intellectual-property rights, disclaimers, liability provisions
                or any clause intended to survive termination.
              </p>

              <h3>18. Electronic communications</h3>

              <p>
                You consent to receiving transactional communications
                electronically, including purchase confirmations, report links,
                service notices and responses to support or legal requests. You
                are responsible for providing a valid email address and checking
                spam or junk folders.
              </p>

              <h3>19. Changes to these Terms</h3>

              <p>
                We may update these Terms by publishing a revised version and its update date. Changes apply prospectively where permitted by law and do not remove mandatory consumer rights or retrospectively change the price or terms agreed for an earlier purchase without a lawful basis or required consent.
              </p>

              <h3>20. General</h3>

              <p>
                If part of these Terms is invalid or unenforceable, it will be
                read down to the minimum extent necessary or severed, and the
                remainder will continue.
              </p>

              <p>
                A failure or delay in enforcing a right is not a waiver. You may
                not assign your rights under these Terms without our consent. We
                may assign or transfer our rights and obligations as part of a
                business sale, restructure or service transfer.
              </p>

              <p>
                These Terms, together with the incorporated policies, form the
                entire agreement concerning the Service, except for rights that
                cannot be excluded by law.
              </p>

              <h3>21. Governing law and jurisdiction</h3>

              <p>
                These Terms shall be governed by, and construed in accordance
                with, the laws of New South Wales. Each party irrevocably agrees
                that the courts of New South Wales shall have exclusive
                jurisdiction to settle any dispute or claim (including
                non-contractual disputes or claims) arising out of or in
                connection with these Terms.
              </p>

              <h3>22. Contact</h3>

              <p>
                SpendShift Enterprises Pty Ltd
                <br />
                ACN 689 089 610
                <br />
                Address: 2 Blackwoods Road, Nobbys Creek NSW, Australia
                <br />
                Email:{" "}
                <a href="mailto:info@spendshift.com.au">
                  info@spendshift.com.au
                </a>
                <br />
                Website: www.spendshift.com.au
              </p>

              <p>
                <strong>Last updated: 14 November 2026</strong>
              </p>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
