import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn how SpendShift uses cookies and similar technologies for website operation, analytics, payments and security.",
};

export default function CookiePolicy() {
  return (
    <div>
      <Header />

      <div className="privacy-policy-content">
        <div className="container">
          <h1>Cookie Policy</h1>
          <p><strong>Version dated 27 November 2026. Effective upon publication on the live SpendShift website.</strong></p>

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
                This Cookie Policy adopts the defined terms in the Privacy
                Policy.
              </p>

              <h3>1. About this Policy</h3>

              <p>
                This Cookie Policy explains how SpendShift Enterprises Pty Ltd
                uses cookies and similar technologies on
                www.spendshift.com.au and through related third-party services.
              </p>

              <p>
                It should be read with our Privacy Policy. The website and
                service providers may change, therefore the specific cookies
                and lifespans may also change.
              </p>

              <h3>2. What cookies and similar technologies are</h3>

              <p>
                <strong>Cookies and Similar Technologies</strong> means cookies
                and other technologies that store, access, collect or otherwise
                process information on or from a user's browser, device or
                application. These technologies include, without limitation,
                cookies, local storage, software development kits, pixels, tags,
                device identifiers, server logs and other similar technologies.
              </p>

              <p>
                Cookies and Similar Technologies may collect information
                relating to your use of the Service, your device, browser and
                interactions with the Service.
              </p>

              <h3>3. Technologies currently used</h3>

              <p>
                Based on the current implementation, SpendShift and its
                providers may use the following categories:
              </p>

              <div className="cookie-table-wrap">
                <table className="cookie-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Purpose</th>
                      <th>Examples / third party provider</th>
                      <th>Ability to be disabled</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>Strictly necessary</td>
                      <td>
                        Operate the website, route traffic, protect security,
                        process checkout and prevent fraud.
                      </td>
                      <td>
                        Vercel infrastructure; Stripe Checkout; security and
                        session technologies.
                      </td>
                      <td>
                        Some may be necessary for the website or payment flow to
                        function.
                      </td>
                    </tr>

                    <tr>
                      <td>Basic first-party statistics</td>
                      <td>Limited approved website and audit actions, aggregated into daily totals when enabled under the revised notice.</td>
                      <td>SpendShift's own website and Supabase database; no new visitor tracking identifier.</td>
                      <td>Separate basic-statistics control; earlier privacy choices are preserved.</td>
                    </tr>
                    <tr>
                      <td>Optional first-party activity counts</td>
                      <td>Count certain free-check and paid-report interactions in the existing consent-based system.</td>
                      <td>SpendShift's own servers and daily totals.</td>
                      <td>Accept or reject optional counts; separate from basic statistics.</td>
                    </tr>
                    <tr>
                      <td>Third-party advertising and analytics tracking</td>
                      <td>Not active in this version, regardless of previous preferences.</td>
                      <td>Google Analytics, Microsoft Clarity, Meta Pixel and TikTok Pixel were used in earlier versions.</td>
                      <td>Disabled; no control enables these scripts in this version.</td>
                    </tr>
                    <tr>
                      <td>Payment and fraud prevention</td>
                      <td>
                        Enable Stripe Checkout, card or Apple Pay processing,
                        authentication, risk analysis and fraud prevention.
                      </td>
                      <td>Stripe and associated payment providers.</td>
                      <td>Disabling may prevent checkout from working.</td>
                    </tr>

                    <tr>
                      <td>Email delivery and infrastructure logs</td>
                      <td>
                        Deliver report emails, maintain service reliability and
                        diagnose abuse or errors.
                      </td>
                      <td>Resend, Supabase and hosting/server logs.</td>
                      <td>
                        These are generally server-side and not controlled
                        through browser cookie settings.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>4. First-party statistics and historical tracking</h3>
              <p>
                This version does not load third-party website analytics or advertising scripts or send measurement events to those providers. Cookies and data from earlier versions may remain subject to browser and provider retention or deletion settings. We do not promise to erase previously transmitted information by switching off scripts.
              </p>
              <p>
                Basic first-party statistics, when enabled after the revised notice, use fixed event categories and broad labels, stored as daily counts. Homepage statistics include foreground time thresholds, visibility of predefined sections, and impressions and clicks of predefined calls to action. No screen recordings, coordinates or individual browsing histories are retained. They do not need optional tracking cookies or create a persistent visitor identifier. For approved website arrival observations, our server reduces the hosting provider's IP-derived country estimate to Australia, outside Australia or unknown. Only the category is counted in daily totals; no raw IP, original country code, detailed location or persistent identifier is stored in analytics. No GPS or extra browser location request is used. You may turn basic statistics off. An earlier cookie choice, or a choice saved while basic statistics are disabled, is respected: basic statistics stay off until you expressly enable them under the active revised notice. For new visitors, eligible basic events are enabled only after the primary notice and immediate choices have been presented on screen, if collection is enabled and preferences permit it. Silence is not consent. The optional-cookie buttons in our notice control optional first-party activity counts through browser-stored preferences. Accepting optional cookies permits only these optional counts; rejecting optional cookies does not by itself disable separate basic statistics or essential service storage. Open Privacy settings from the notice to manage basic statistics separately from optional counts.
              </p>
              <p>
                Optional first-party activity counts remain separate and record limited audit and paid-report interactions only with permission. A private report reference is sent to SpendShift's own server for verification and is not stored in the daily counts. Rejecting optional counts disables this existing measurement. The separate basic-statistics control can stop new basic collection.
              </p>
              <p>
                Browser storage remembers preferences and saves audit answers for the requested service. It may also keep a non-identifying, tab-scoped restriction marker when a privacy choice cannot be saved. An unsuccessful save stops both categories in the affected page; a marker, if it can be stored, also restricts that tab after reload. We display whether saving failed and ask you to retry. If storage does not allow the choice to persist, we cannot guarantee withdrawal in other tabs, other devices or later visits. Successful choices apply prospectively; previously sent requests and aggregate counts are not undone. A choice while basic collection is disabled will not enable it on a later release. Hosting and security services may process IP addresses and technical request details. We retain daily analytics totals and the separate aggregate reporting cache for up to 180 days under the approved maintenance process; other operational and financial records have separate retention requirements.
              </p>

              <h3>5. Stripe Checkout</h3>

              <p>
                Payment checkout is hosted by Stripe. When you enter Stripe
                Checkout, Stripe may set cookies or use similar technologies for
                payment functionality, authentication, security, fraud
                prevention and regulatory compliance.
              </p>

              <p>
                Stripe’s cookies and data handling are governed by Stripe’s own
                policies. SpendShift does not control cookies used on
                Stripe-hosted pages.
              </p>

              <h3>6. Your choices</h3>

              <p>You can manage cookies by:</p>

              <ul>
                <li>
                accepting or rejecting optional first-party activity counts and managing basic statistics separately through Privacy settings, which you can reopen from the footer on eligible pages;
              </li>

                <li>
                  changing browser settings to block, restrict or delete
                  cookies;
                </li>

                <li>using browser privacy or tracking-protection features;</li>

                <li>using browser or provider controls to manage cookies and data remaining from earlier versions; or</li>

                <li>
                  avoiding Stripe Checkout if you do not wish to accept
                  technologies required for payment, noting that this will
                  prevent purchase.
                </li>
              </ul>

              <p>
                Blocking cookies may affect website functionality, analytics
                accuracy, fraud prevention and checkout.
              </p>

              <h3>7. Do Not Track and similar signals</h3>

              <p>
                Some browsers send “Do Not Track” or similar signals. There is
                no universally accepted technical standard for responding to all
                such signals. We may not respond to every signal, but you may
                use the controls described above.
              </p>

              <h3>8. Updates</h3>

              <p>
                We may update this Cookie Policy when technologies, providers or
                legal requirements change. The updated version will be
                published on the website.
              </p>

              <h3>9. Contact</h3>

              <p>
                Email:{" "}
                <a href="mailto:info@spendshift.com.au">
                  info@spendshift.com.au
                </a>
              </p>

              <p>
                <strong>Version date: 27 November 2026</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
