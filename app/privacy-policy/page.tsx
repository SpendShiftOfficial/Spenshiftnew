import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how SpendShift collects, uses, stores, discloses and protects personal information.",
};

export default function PrivacyPolicy() {
  return (
    <div>
      <Header />

      <div className="privacy-policy-content">
        <div className="container">
          <h1>Privacy Policy</h1>

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

              <h3>1. Introduction</h3>

              <p>
                This Privacy Policy explains how SpendShift Enterprises Pty Ltd ACN 689 089 610 (“SpendShift”, “we”, “us” or “our”) collects, holds, uses, discloses and protects personal information in connection with the website, the free savings check, optional personalised savings plans, payments, delivery and related services.
              </p>

              <p>
                We are committed to handling personal information responsibly
                and transparently. Where the Privacy Act 1988 (Cth) (“Privacy
                Act”) and the Australian Privacy Principles apply to us, we
                will handle personal information in accordance with those
                requirements. We may also choose to follow comparable privacy
                practices where the Privacy Act does not strictly apply.
              </p>

              <p>
                By using the website or providing personal information to us,
                you acknowledge that your information will be handled as
                described in this Privacy Policy. Where consent is required by
                law, we will seek it separately.
              </p>

              <p>
                We may update this Privacy Policy from time to time by
                publishing a revised version on the website. The date at the
                end of the policy shows when it was last updated.
              </p>

              <h3>2. Scope and age restriction</h3>

              <p>
                This Privacy Policy applies to visitors to the website, users
                who complete the free audit, customers who purchase a report,
                and anyone who contacts us.
              </p>

              <p>
                SpendShift is intended for people aged 18 years or older. If
                you believe a person under 18 has provided personal information
                to us, contact us so we can assess and, where appropriate,
                delete it.
              </p>

              <h3>3. Personal information we collect</h3>

              <p>Depending on how you use SpendShift, we may collect:</p>

              <ul>
                <li>
                  audit answers, including information about takeaway and delivery habits,
                  subscriptions, insurance comparison habits, convenience spending,
                  internet or mobile plan review habits, electricity or gas plan comparison
                  habits, unplanned purchases and your stated savings goal;
                </li>
                <li>
                  optional paid-report details you choose to provide, such as
                  approximate electricity, gas, internet and mobile bills,
                  subscription and takeaway costs, insurance types and premiums,
                  insurer names, short cover descriptions and other spending
                  categories you ask us to review;
                </li>

                <li>
                  your email address, including the email address collected
                  through Stripe Checkout (our point of sale provider) which is
                  used to deliver or associate your report;
                </li>

                <li>
                  purchase and transaction information, such as the amount
                  paid, currency, payment status, Stripe customer or checkout
                  session identifiers, timestamps, refunds and related
                  transaction metadata;
                </li>

                <li>
                the generated savings plan, any conditional savings figures, checklist and savings tracker records, private report URL and report access information;
              </li>

                <li>
                  communications you send to us, including support, refund,
                  privacy or complaint requests;
                </li>

                <li>
                technical and usage information such as IP address, device, browser, approximate location, referral source, pages viewed and timestamps. On eligible public pages, optional Google Analytics, Microsoft Clarity, Meta Pixel and TikTok Pixel may also collect usage and event information if you accept optional cookies;
              </li>

                <li>
                  cookie and similar technology information described in our
                  Cookie Policy; and
                </li>

                <li>any other information you voluntarily provide to us.</li>
              </ul>

              <p>
                SpendShift does not receive or store your payment card number or security code. Stripe and, where applicable, other payment providers handle those details. Free-check answers are stored in your browser to show results. If you buy a plan, the answers and any additional details you provide are stored by our systems to create and save the plan.
              </p>

              <h3>4. How we collect personal information</h3>

              <p>We may collect personal information:</p>

              <ul>
                <li>
                  directly from you when you complete the audit, purchase a
                  report, enter an email address, contact us or request support;
                </li>

                <li>
                  automatically when you browse or interact with the website,
                  through cookies, analytics, server logs and similar
                  technologies;
                </li>

                <li>
                  from Stripe in connection with checkout, payment confirmation,
                  fraud prevention, chargebacks and refunds;
                </li>

                <li>
                  from our third-party service providers when they process
                  information on our behalf, including Anthropic, Supabase,
                  Resend, Vercel and Google (see cl 7 of the Privacy Policy);
                  and
                </li>

                <li>
                  from other lawful sources where reasonably necessary for our
                  business activities.
                </li>
              </ul>

              <h3>5. Why we collect, use and disclose personal information</h3>

              <p>
                We may collect, use and disclose personal information to:
              </p>

              <ul>
                <li>operate the website and provide the free audit;</li>

                <li>
                produce personalised savings plans using automated rules, calculations and the answers and optional details you choose to provide;
              </li>

                <li>
                  calculate, present and explain estimated savings opportunities
                  and recommended next steps;
                </li>

                <li>
                  process payments, verify transactions, manage refunds,
                  prevent fraud and maintain financial records;
                </li>

                <li>
                  generate, store, retrieve and deliver reports, including by
                  email and saved report URL;
                </li>

                <li>
                  provide customer support and respond to enquiries, complaints,
                  privacy requests and legal claims;
                </li>

                <li>
                  monitor, secure, troubleshoot, maintain and improve the
                  website, reports, user experience and business operations;
                </li>

                <li>
                  perform analytics and understand website usage and conversion
                  performance;
                </li>

                <li>
                  comply with legal, regulatory, taxation, accounting,
                  insurance and record-keeping obligations;
                </li>

                <li>protect our rights, property, systems and customers; and</li>

                <li>
                  carry out another purpose disclosed to you, with your consent
                  where required.
                </li>
              </ul>

              <p>
                We do not currently use customer email addresses for promotional
                marketing unless the person separately opts in or we otherwise
                have a lawful basis to do so. Transactional emails, such as
                payment confirmations, report links, service notices and
                responses to requests, are not promotional marketing.
              </p>

              <h3>6. AI and automated report generation</h3>

              <p>
                The current A$29 personalised plan is generated using server-side rules and calculations based on your answers and optional details. It does not call the Anthropic Claude API for new plans, and the current generation process does not send your answers to Claude. Earlier versions may have used Claude to help write report explanations.
              </p>

              <p>
                The plan is prepared using automated technology and may contain errors, omissions or conditional estimates. Check important figures, contract terms and provider information independently before acting on it.
              </p>

              <p>
                We do not train a SpendShift machine-learning model on customer answers. Any data processed by Anthropic for earlier reports may have been retained under its applicable terms and privacy practices.
              </p>

              <h3>7. Third-party service providers</h3>

              <p>
                We may disclose or make personal information available to
                service providers that help us operate SpendShift, including:
              </p>

              <ul>
                <li>
                Anthropic PBC (“Anthropic”), where relevant to earlier AI-assisted reports;
              </li>
                <li>
                  Supabase Inc. (“Supabase”), for database and report storage;
                </li>
                <li>
                  Stripe Inc. (“Stripe”), for hosted checkout, payment
                  processing, fraud prevention, refunds and transaction
                  administration;
                </li>
                <li>
                  Apple Pay and participating financial institutions, when
                  Apple Pay is used through Stripe;
                </li>
                <li>
                  Plus Five Five Inc. (“Resend”), for sending transactional
                  emails and report links;
                </li>
                <li>
                  Vercel Inc. (“Vercel”), for website hosting, infrastructure,
                  security and performance;
                </li>
                <li>
                Google Analytics and related Google LLC services, and Microsoft Clarity, for optional public-page analytics;
              </li>
              <li>
                Meta Pixel and TikTok Pixel, for optional marketing measurement on eligible public pages, after consent;
              </li>
                <li>
                  professional advisers, insurers, accountants, auditors and
                  lawyers; and
                </li>
                <li>
                  a purchaser, investor or successor in connection with a
                  proposed or completed sale, merger, restructure or transfer
                  of all or part of the business, subject to appropriate
                  confidentiality and legal safeguards.
                </li>
              </ul>

              <p>
                These providers may collect information directly from you or
                receive it from us. Their handling of information is also
                governed by their own terms and privacy policies.
              </p>

              <p>
                We may also be required to disclose information to regulators,
                courts, law-enforcement agencies and government bodies where
                compelled to do so by law.
              </p>

              <h3>8. Overseas processing and disclosure</h3>

              <p>
                Some of our service providers operate or use infrastructure outside Australia. Personal information may be processed, accessed or stored in the United States and other countries where Stripe, Supabase, Vercel, Resend, Google, Microsoft, Meta, TikTok or, for earlier reports where applicable, Anthropic and their subprocessors operate.
              </p>

              <p>
                The exact locations may change over time and may depend on
                provider infrastructure and the selected hosting region. Where
                required by law, we will take reasonable steps in the
                circumstances to protect sensitive information before making
                disclosures to an overseas recipient.
              </p>

              <h3>9. Storage and retention</h3>

              <p>
                Generated reports, audit answers, optional paid-report details,
                report calculation summaries, associated email addresses
                and relevant purchase identifiers are stored in Supabase.
                Paid orders may also be held in a processing queue so a report
                can be delivered if a customer closes the website after payment.
                Each saved report can be accessed again through its report URL.
              </p>

              <p>
                Our current retention practice is to retain these records
                indefinitely unless they are manually deleted, deletion is
                requested and accepted, or deletion is otherwise required by
                law. We may also retain records for legal, security,
                fraud-prevention, accounting, taxation, insurance,
                dispute-resolution and business-continuity purposes.
              </p>

              <p>
                Because indefinite retention creates additional privacy and
                security risk, this retention policy should be reviewed
                periodically. Where the Privacy Act requires us to destroy or
                de-identify personal information that is no longer needed for
                a permitted purpose, we will take reasonable steps to do so.
              </p>

              <h3>10. Report links and access security</h3>

              <p>
                A saved report URL may allow access to the report without a user
                account or password. You are responsible for keeping that URL
                confidential and for not sharing it with anyone you do not want
                to access the report.
              </p>

              <p>
                If you believe a report link has been disclosed, accessed
                without permission or otherwise compromised, contact us
                promptly. We may disable, replace or delete a report link where
                reasonably necessary, but we cannot guarantee that a report
                accessed or copied by another person can be retrieved or
                erased.
              </p>

              <h3>11. Security</h3>

              <p>
                We take reasonable administrative, technical and organisational
                steps to protect personal information from misuse,
                interference, loss and unauthorised access, modification or
                disclosure. Measures may include access controls,
                service-provider security features, encryption in transit,
                environment separation, logging, monitoring and restricted
                administrative access.
              </p>

              <p>
                No website, database, transmission or storage system is
                completely secure. We cannot guarantee absolute security. You
                should use a secure device and network and protect any email
                account or report URL used to access your report.
              </p>

              <h3>12. Cookies and analytics</h3>

              <p>
                We and our providers use browser storage, cookies, pixels, logs and similar technologies. On eligible public marketing pages, optional Google Analytics, Microsoft Clarity, Meta Pixel and TikTok Pixel scripts load only after you accept optional cookies. They do not load on the free check, free results, paid questionnaire or private report pages. Stripe and infrastructure providers may use necessary technologies for payment, security and fraud prevention.
              </p>

              <p>
                More information is available in our{" "}
                <a href="/cookies">Cookie Policy</a>.
              </p>

              <h3>13. Access, correction and deletion requests</h3>

              <p>
                You may contact us to request access to personal information we
                hold about you, correction of inaccurate information, or
                deletion of a report and associated personal information.
              </p>

              <p>
                We may need to verify your identity before acting on a request.
                We may refuse or limit a request where permitted or required by
                law, including where information must be retained for legal,
                accounting, security, fraud-prevention or dispute-resolution
                purposes. If we refuse a request, we will explain the reason
                where required.
              </p>

              <p>
                Because reports may be linked to an email address and saved
                report URL, please provide the purchasing email address and
                report URL when making a request. Do not send us payment-card
                details.
              </p>

              <h3>14. Complaints</h3>

              <p>
                If you have a complaint about how we handle personal
                information, contact us using the details below. Please include
                enough information for us to understand and investigate the
                issue. We will acknowledge receipt of your complaint within 5
                business days and provide a response within a reasonable period
                thereafter.
              </p>

              <p>
                If you are not satisfied with our response and the Privacy Act
                applies, you may escalate your complaint to the Office of the
                Australian Information Commissioner.
              </p>

              <h3>15. Third-party links</h3>

              <p>
                The website and reports may contain links to third-party
                websites or services. We are not responsible for the privacy,
                security, content or practices of those third parties. You
                should review their privacy policies before providing
                information or using their services.
              </p>

              <h3>16. Contact us</h3>

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
