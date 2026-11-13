"use client";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  EyeOff,
  MapPin,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

const benefits = [
  {
    icon: WalletCards,
    title: "Simple by design",
    text: "Start with a few answers instead of tracking every purchase or building a full budget.",
    points: [
      "No spreadsheets",
      "No detailed budgeting",
      "No bank connection required",
      "Practical ways to save more",
    ],
  },
  {
    icon: MapPin,
    title: "Built for Australians",
    text: "Made for Australians, with useful checks for everyday household costs.",
    points: [
      "Australian spending topics",
      "Useful comparison links",
      "Relevant spending categories",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Private",
    text: "You never need to connect your bank account or provide access to your financial accounts.",
    points: [
      "No bank login required",
      "No transaction syncing",
      "Secure payment through Stripe",
    ],
  },
  {
    icon: Clock3,
    title: "Fast",
    text: "Answer eight free questions about your spending.",
    points: [
      "Eight simple questions",
      "Immediate free results",
      "No complicated setup",
    ],
  },
  {
    icon: ClipboardCheck,
    title: "Actionable",
    text: "The paid plan helps you check costs and follow clear next steps.",
    points: [
      "Clear quick wins",
      "Practical next steps",
      "A checklist to follow",
    ],
  },
  {
    icon: ClipboardCheck,
    title: "Based on your answers",
    text: "The paid plan uses your answers and any extra costs you choose to share.",
    points: ["Three priority actions", "Help for relevant spending areas", "A way to record real savings"],

  },
];

const differences = [
  {
    traditional: "Detailed spreadsheets",
    spendshift: "Eight simple questions",
  },
  {
    traditional: "Bank account connections",
    spendshift: "No bank access required",
  },
  {
    traditional: "Manual transaction categorisation",
    spendshift: "Steps based on your answers",
  },
  {
    traditional: "Complex monthly budgeting",
    spendshift: "Clear savings opportunities",
  },
  {
    traditional: "Generic savings tips",
    spendshift: "Checks based on your answers",
  },
];

export default function WhySpendShiftPage() {

  return (
    <div className="innerPage">
      <Header />

      <main>
        {/* HERO */}
        <section className="whyPageHero">
          <div className="container whyPageHeroGrid">
            <div className="whyPageHeroContent">
              <span className="innerEyebrow">
                <Sparkles size={17} />
                Why SpendShift
              </span>

              <h1>
                A simpler way to find money that could be{" "}
                <span>quietly disappearing.</span>
              </h1>

              <p>
                You don't need to track every purchase to find a place to start.
                Answer eight free questions, see what costs may be worth checking,
                and choose an A$29 plan if you want more help.
                For more ideas, explore our{" "}
<Link
href="/save-money-australia"
style={{
color: "inherit",
fontWeight: 700,
textDecoration: "underline",
textUnderlineOffset: "3px",
}}
>
Australian money-saving guide
</Link>.
              </p>

              <div className="whyHeroChecks">
                <span>
                  <CheckCircle2 size={19} fill="#059625" stroke="white" />
                  No spreadsheets
                </span>

                <span>
                  <CheckCircle2 size={19} fill="#059625" stroke="white" />
                  No bank connection
                </span>

                <span>
                  <CheckCircle2 size={19} fill="#059625" stroke="white" />
                  Practical next steps
                </span>
              </div>

              <Link href="/audit" className="btn">
                Start my free savings check
                <ArrowRight size={18} />
              </Link>
            </div>

            <aside className="whyHeroPanel">
              <span className="whyHeroPanelLabel">
                SpendShift is designed to be
              </span>

              <div className="whyHeroPanelItems">
                <div>
                  <EyeOff size={26} />
                  <span>
                    <strong>Private</strong>
                    No bank access required
                  </span>
                </div>

                <div>
                  <Clock3 size={26} />
                  <span>
                    <strong>Fast</strong>
                    Eight free questions
                  </span>
                </div>

                <div>
                  <MapPin size={26} />
                  <span>
                    <strong>Australian</strong>
                    Relevant to local spending habits
                  </span>
                </div>

                <div>
                  <ClipboardCheck size={26} />
                  <span>
                    <strong>Actionable</strong>
                    Clear recommendations and next steps
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="whyBenefitsSection">
          <div className="container">
            <div className="sectionIntro">
              <span className="sectionEyebrow">Designed Differently</span>

              <h2 className="sectionTitle">
                Less complexity.
                <br />
                <span>More practical clarity.</span>
              </h2>

              <p>
                SpendShift is designed for people who want to understand where
                they could save without managing another complicated financial
                tool.
              </p>
            </div>

            <div className="whyBenefitsGrid">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <article className="whyBenefitCard" key={benefit.title}>
                    <div className="whyBenefitIcon">
                      <Icon size={32} strokeWidth={1.5} />
                    </div>

                    <h3>{benefit.title}</h3>
                    <p>{benefit.text}</p>

                    <div className="whyBenefitPoints">
                      {benefit.points.map((point) => (
                        <span key={point}>
                          <CheckCircle2
                            size={17}
                            fill="#059625"
                            stroke="white"
                          />
                          {point}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* COMPARISON */}
        <section className="whyComparisonSection">
          <div className="container">
            <div className="sectionIntro">
              <span className="sectionEyebrow">
                A simple way to start
              </span>

              <h2 className="sectionTitle">
                You do not need another
                <br />
                <span>complicated finance app.</span>
              </h2>

              <p>
                SpendShift starts with answers, not your bank account or a record
                of every purchase.
              </p>
            </div>

            <div className="whyComparisonTable">
              <div className="whyComparisonHeader">
                <span className="">Tracking every expense</span>
                <span className="">SpendShift</span>
              </div>

              {differences.map((item) => (
                <div className="whyComparisonRow" key={item.traditional}>
                  <div className="whyComparisonTraditional">
                    <span className="comparisonMinus">−</span>
                    {item.traditional}
                  </div>

                  <div className="whyComparisonSpendShift">
                    <CheckCircle2 size={19} fill="#059625" stroke="white" />
                    {item.spendshift}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AUSTRALIAN SECTION */}
        <section className="whyAustralianSection">
          <div className="container whyAustralianGrid">
            <div className="whyAustralianContent">
              <span className="sectionEyebrow">Built for Australians</span>

              <h2>
                Recommendations that feel relevant to everyday Australian life.
              </h2>

              <p>
                SpendShift is made for Australian households. It helps you check
                your own bills. We don't search live prices or compare offers for you.
              </p>

              <div className="whyAustralianPoints">
                <span>
                  <CheckCircle2 size={18} fill="#059625" stroke="white" />
                  Australian dollars
                </span>

                <span>
                  <CheckCircle2 size={18} fill="#059625" stroke="white" />
                  Useful comparison links
                </span>

                <span>
                  <CheckCircle2 size={18} fill="#059625" stroke="white" />
                  Australian English throughout
                </span>

                <span>
                  <CheckCircle2 size={18} fill="#059625" stroke="white" />
                  Practical everyday comparisons
                </span>
              </div>
            </div>

            <div className="whyAustralianCard">
              <MapPin size={40} />

              <span>Australian focused</span>

              <strong>
                Practical checks for Australian costs.
              </strong>

              <p>
                Your plan gives general savings information based on your answers.
                Always check real costs and terms yourself.
              </p>
            </div>
          </div>
        </section>

        {/* PRIVACY */}
        <section className="whyPrivacySection">
          <div className="container whyPrivacyGrid">
            <div className="whyPrivacyCard">
              <ShieldCheck size={44} />

              <h3>No bank connection required</h3>

              <p>
                SpendShift generates your results from the answers you provide.
                We do not need access to your bank account or transaction
                history.
              </p>
            </div>

            <div className="whyPrivacyContent">
              <span className="sectionEyebrow">Privacy First</span>

              <h2>
                Understand your spending without handing over your financial
                accounts.
              </h2>

              <p>
                Your free results use your eight answers. Your paid plan can use the
                extra details you choose to share. Stripe handles card payments.
                SpendShift doesn't store full card details.
              </p>

              <Link href="/privacy-policy">
                Read Our Privacy Policy
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="finalCtaSection">
          <div className="container">
            <div className="cta">
              <div className="">
                <h2>See what may be worth checking.</h2>

                <p>
                  Start with eight free questions. See your results before deciding
                  whether to pay A$29 for the full plan.
                </p>
              </div>

              <div className="">
                <Link href="/audit" className="btn white">
                  Start my free savings check
                  <ArrowRight size={18} />
                </Link>

                <p className="noCard">No bank login. No card for free results.</p>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}
