import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Refund Policy | SpendShift",
  description:
    "Read SpendShift's refund policy, including our 30-day money-back guarantee and Australian Consumer Law rights.",
};

export default function RefundPolicy() {
  return (
    <div>
      <Header />

      <div className="privacy-policy-content">
        <div className="container">
          <h1>Refund Policy</h1>

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
                This Refund Policy forms part of the SpendShift Website Terms
                and Conditions.
              </p>

              <h3>1. Our 30-day money-back guarantee</h3>

              <p>
                SpendShift offers a voluntary 30-day money-back guarantee for
                paid personalised savings reports.
              </p>

              <p>
                If you do not believe your report helped you identify meaningful
                savings opportunities, you may contact us within 30 days of
                purchase and request a refund.
              </p>

              <h3>2. How to request a refund</h3>

              <p>
                To request a refund, email{" "}
                <a href="mailto:info@spendshift.com.au">
                  info@spendshift.com.au
                </a>{" "}
                within 30 days of the purchase date.
              </p>

              <p>Please include:</p>

              <ul>
                <li>the email address used for the purchase;</li>
                <li>your report URL, if available;</li>
                <li>the approximate date of purchase; and</li>
                <li>
                  enough information for us to identify the relevant
                  transaction.
                </li>
              </ul>

              <p>
                Do not send us your full payment-card number or card security
                code.
              </p>

              <h3>3. Processing refund requests</h3>

              <p>
                We may verify the purchase and request reasonable information
                needed to identify the transaction before processing a refund.
              </p>

              <p>
                Approved refunds will generally be returned to the original
                payment method through Stripe. The time taken for funds to
                appear in your account may depend on Stripe, your bank, card
                issuer or other payment provider.
              </p>

              <h3>4. Misuse of the guarantee</h3>

              <p>
                Our voluntary money-back guarantee is intended to give genuine
                customers confidence when purchasing SpendShift.
              </p>

              <p>
                We may refuse a request under the voluntary guarantee where we
                reasonably believe there has been fraud, abuse, repeated refund
                activity, manipulation of the Service or another misuse of the
                guarantee.
              </p>

              <p>
                Any such refusal does not affect rights or remedies that cannot
                lawfully be excluded.
              </p>

              <h3>5. Australian Consumer Law</h3>

              <p>
                Our goods and services come with guarantees that cannot be
                excluded under the Australian Consumer Law where those
                guarantees apply.
              </p>

              <p>
                Nothing in this Refund Policy excludes, restricts or modifies
                any consumer guarantee, right or remedy that cannot lawfully be
                excluded, restricted or modified.
              </p>

              <p>
                You may therefore have rights to a refund or another remedy
                independently of our voluntary 30-day money-back guarantee.
              </p>

              <h3>6. Digital reports</h3>

              <p>
                SpendShift reports are digital products generated and delivered
                electronically.
              </p>

              <p>
                Accessing, viewing or receiving your report does not by itself
                prevent you from making a valid request under our voluntary
                30-day money-back guarantee or exercising any rights available
                under applicable consumer law.
              </p>

              <h3>7. Chargebacks and payment disputes</h3>

              <p>
                If you believe a payment was unauthorised or there is another
                issue with a transaction, please contact us first where
                practical so we can investigate.
              </p>

              <p>
                Nothing in this policy prevents you from exercising any lawful
                rights you may have through your bank, card issuer, Stripe or
                another payment provider.
              </p>

              <h3>8. Changes to this Policy</h3>

              <p>
                We may update this Refund Policy from time to time. Any updated
                version will be published on the website.
              </p>

              <p>
                Changes will not remove consumer rights that cannot lawfully be
                excluded.
              </p>

              <h3>9. Contact</h3>

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
                <strong>Last updated: 14 July 2026</strong>
              </p>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}