import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Financial Information and AI Disclaimer",
  description:
    "Read SpendShift's financial information and AI disclaimer, including important limitations about savings estimates, AI-generated content and general information.",
};

export default function FinancialInformationAIDisclaimer() {
  return (
    <div>
      <Header />

      <div className="privacy-policy-content">
        <div className="container">
          <h1>Financial Information and AI Disclaimer</h1>

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

              <h3>1. General information only</h3>

              <p>
                SpendShift provides general educational information about
                spending habits, possible overpayments, budgeting friction,
                recurring charges and potential savings opportunities.
              </p>

              <p>
                SpendShift does not provide personal financial product advice,
                legal advice, tax advice, accounting advice, credit assistance,
                insurance advice or investment advice. SpendShift is not acting
                as your financial adviser, lawyer, accountant, tax agent, credit
                representative, insurance broker or fiduciary.
              </p>

              <h3>
                2. No consideration of your complete circumstances
              </h3>

              <p>
                The Service uses a short questionnaire and does not consider
                your complete financial position, objectives, needs, income,
                debts, assets, dependants, contracts, tax position, insurance
                needs, credit profile, health, risk tolerance or legal
                obligations.
              </p>

              <p>
                A plan is personalised because it uses your eight free-check answers and the optional details you choose to add. Unknown costs may be skipped. It does not mean SpendShift has considered all your circumstances or completed the suitability assessment that a licensed professional may be required to perform.
              </p>

              <h3>3. Estimates are not guarantees</h3>

              <p>
                Possible savings figures, where shown, are conditional calculations based on known costs and assumptions. When important figures are missing, SpendShift does not calculate a saving from those missing values.
              </p>

              <p>
                Actual results may be higher or lower, or no saving may be
                available. Results depend on your actual spending, eligibility,
                location, provider terms, market prices, behaviour, existing
                contracts, cancellation fees, taxes, fees and other
                circumstances.
              </p>

              <p>
                Words such as “money leak”, “possible saving” and “could save” refer to things worth reviewing or conditional estimates, not money already saved, money owed to you or guaranteed results.
              </p>

              <h3>4. Artificial intelligence (“AI”)</h3>

              <p>
                The current A$29 plan uses automated rules, calculations and prepared guidance. It does not call the Anthropic Claude API to generate new plans. Earlier versions may have included AI-assisted report text. Automated or earlier AI-generated content may be wrong, incomplete or outdated.
              </p>

              <p>
                You must independently verify important information. Do not rely
                solely on a report when making a decision that could materially
                affect your financial, legal, tax, insurance, credit or
                contractual position.
              </p>

              <h3>5. Provider, price and product information</h3>

              <p>
                SpendShift does not connect to bank accounts, independently check live prices, rank live offers or switch providers on your behalf. References to products, providers or prices are examples or sources for you to check independently unless clearly stated otherwise.
              </p>

              <p>
                Third-party products, prices, availability, eligibility
                criteria, coverage, fees and terms can change without notice.
                You should check the provider’s current terms and obtain
                appropriate professional advice before switching, cancelling,
                purchasing or entering a contract.
              </p>

              <p>
                SpendShift is not endorsed by, affiliated with or acting for a
                third party merely because that third party is mentioned or
                utilised.
              </p>

              <h3>6. Your decisions</h3>

              <p>
                You are responsible for deciding whether to act on a report.
                Before acting, consider:
              </p>

              <ul>
                <li>
                  whether a suggested cancellation or switch would trigger fees,
                  loss of benefits, reduced coverage, waiting periods or adverse
                  tax consequences;
                </li>

                <li>
                  whether a cheaper product remains suitable for your needs;
                </li>

                <li>
                  whether a provider comparison is current and complete;
                </li>

                <li>
                  whether you need advice from a licensed financial adviser,
                  accountant, tax professional, lawyer, insurance professional
                  or credit specialist; and
                </li>

                <li>
                  whether the action is safe and appropriate for your personal
                  circumstances.
                </li>
              </ul>

              <h3>7. No guarantee of completeness</h3>

              <p>
                The audit is deliberately short and does not identify every
                possible source of overspending or every saving opportunity. A
                report may omit relevant matters, duplicate categories or use
                assumptions that do not match your circumstances.
              </p>

              <h3>8. Emergency and hardship situations</h3>

              <p>
                SpendShift is not designed for emergency financial assistance,
                debt crisis management, insolvency, domestic or financial abuse,
                or urgent hardship support. Seek help from an appropriately
                qualified professional or recognised support service where
                required.
              </p>

              <h3>9. Acceptance</h3>

              <p>
                By using the Service, you acknowledge that you understand these
                limitations and accept responsibility for verifying information
                and making your own decisions.
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
