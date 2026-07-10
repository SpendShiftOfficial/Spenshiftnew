"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

import {
  ShieldCheck,
  WalletCards,
  ChartNoAxesCombined,
  Search,
  Clock,
  FileText,
  Sparkles,
  Smartphone,
  PieChart,
  CheckCircle2,
  MoveRight,
  MessageSquareLock,
  ClipboardCheck,
  MapPin,
  EyeOff,
  CircleDollarSign,
  ListChecks,
  CalendarDays,
  Save,
  Bot,
  Target,
  Route,
} from "lucide-react";

import { FaFacebook, FaInstagram } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa";

const faqs = [
  {
    question: "What is SpendShift?",
    answer:
      "SpendShift is a personalised savings report that helps identify where you could be overspending and highlights practical ways to reduce everyday expenses. It provides tailored suggestions based on the answers you submit.",
  },
  {
    question: "How does it work?",
    answer:
      "Answer a series of questions about your spending habits, complete your purchase, and you’ll receive your personalised SpendShift report by email shortly afterwards.",
  },
  {
    question: "How much does it cost?",
    answer:
      "The SpendShift audit is free. The full personalised savings report costs A$39 as a one-time payment, with no subscription or ongoing fees.",
  },
  {
    question: "Is this a subscription?",
    answer:
      "No. You only pay once for the full personalised report. There are no recurring charges.",
  },
  {
    question: "When will I receive my report?",
    answer:
      "Most reports are generated and delivered within minutes after your payment is successfully processed.",
  },
  {
    question: "Is my report personalised?",
    answer:
      "Yes. Your report is generated using the information you provide during the questionnaire, making the recommendations specific to your situation.",
  },
  {
    question: "Is my payment secure?",
    answer:
      "Yes. Payments are securely processed using Stripe, including support for Apple Pay where available. SpendShift never stores your payment details.",
  },
  {
    question: "What if I’m not satisfied?",
    answer:
      "If you don’t believe your report helped you identify meaningful savings, contact us within 30 days and we’ll review your refund request.",
  },
  {
    question: "Will this create a budget for me?",
    answer:
      "No. SpendShift focuses on identifying potential savings opportunities and practical actions rather than creating a detailed budget.",
  },
  {
    question: "Is this suitable for everyone?",
    answer:
      "SpendShift is designed for Australian adults who want to better understand their spending and discover practical ways to save money.",
  },
  {
    question: "Do I need to download anything?",
    answer:
      "No. Everything is delivered digitally and your saved report can be accessed through its secure report link.",
  },
  {
    question: "Can I use SpendShift more than once?",
    answer:
      "Yes. You can complete the audit again whenever your spending habits or financial situation changes.",
  },
];

const whyCards = [
  {
    icon: WalletCards,
    title: "Unlike Budgeting Apps",
    text: "SpendShift focuses on money quietly disappearing through everyday habits.",
    points: [
      "No spreadsheets",
      "No budgeting",
      "No bank connection required",
      "Practical ways to save more",
    ],
  },
  {
    icon: MapPin,
    title: "Built for Australians",
    text: "Recommendations are shaped around Australian pricing, providers and spending habits.",
  },
  {
    icon: EyeOff,
    title: "Private",
    text: "We never require access to your bank account or payment details.",
  },
  {
    icon: Clock,
    title: "Fast",
    text: "Complete your free savings audit in approximately two minutes.",
  },
  {
    icon: ClipboardCheck,
    title: "Actionable",
    text: "Every recommendation clearly explains what to do next.",
  },
  {
    icon: Bot,
    title: "AI Powered",
    text: "Every report is generated specifically from the answers you provide.",
  },
];

const includedCards = [
  {
    icon: CircleDollarSign,
    title: "Estimated Annual Savings",
    text: "See approximately how much you could recover each year.",
  },
  {
    icon: Target,
    title: "Priority Money Leaks",
    text: "Understand which spending areas deserve your attention first.",
  },
  {
    icon: Search,
    title: "Hidden Opportunities",
    text: "Discover savings that are easy to overlook in everyday life.",
  },
  {
    icon: MessageSquareLock,
    title: "Negotiation Scripts",
    text: "Use ready-to-send wording when asking providers for a better deal.",
  },
  {
    icon: FileText,
    title: "Cancellation Scripts",
    text: "Cancel unwanted services without getting stuck in retention conversations.",
  },
  {
    icon: CalendarDays,
    title: "30-Day Action Plan",
    text: "Follow a practical weekly roadmap without feeling overwhelmed.",
  },
  {
    icon: ListChecks,
    title: "Savings Checklist",
    text: "Tick off recommended actions as you complete them.",
  },
  {
    icon: Save,
    title: "Saved Report",
    text: "Return to your personalised report whenever you need it.",
  },
];

const services = [
  {
    icon: Search,
    title: "Free Savings Audit",
    text: "A short assessment that identifies your biggest opportunities to save money.",
    href: "/audit",
    linkText: "Start free audit",
  },
  {
    icon: Sparkles,
    title: "Personalised Savings Report",
    text: "A detailed AI-generated report tailored to your answers and spending habits.",
    href: "/audit",
    linkText: "Create my report",
  },
  {
    icon: Route,
    title: "30-Day Savings Action Plan",
    text: "A practical step-by-step roadmap to help you implement your recommendations.",
    href: "/audit",
    linkText: "See how it works",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <>
      <Header />

      <main>
        {/* HERO */}
        <section className="heroShell" id="home">
          <div className="container hero">
            <div className="heroCopy">
              <span className="badge">
                <CheckCircle2
                  className="text-[#059625]"
                  fill="currentColor"
                  stroke="white"
                  size={20}
                />
                100% data-driven, 100% about you
              </span>

              <h1>
                Find your biggest money leaks in under <span>2 minutes.</span>
              </h1>

              <p>
                We analyse your answers to identify likely money leaks and show
                you where practical savings opportunities may exist.
              </p>

              <div className="checks">
                <span>
                  <CheckCircle2
                    className="text-[#059625]"
                    fill="currentColor"
                    stroke="white"
                    size={20}
                  />
                  Takes 2 minutes
                </span>

                <span>
                  <CheckCircle2
                    className="text-[#059625]"
                    fill="currentColor"
                    stroke="white"
                    size={20}
                  />
                  No signup required
                </span>

                <span>
                  <CheckCircle2
                    className="text-[#059625]"
                    fill="currentColor"
                    stroke="white"
                    size={20}
                  />
                  Private and secure
                </span>
              </div>

              <Link className="btn" href="/audit">
                Start Your Free Audit
                <MoveRight size={18} strokeWidth={2.5} />
              </Link>

              <div className="spacer50" />

              <div className="hero-bottom-text reveal">
                <p className="margin-zero">
                  Free results in under 2 minutes. No credit card required.
                </p>

                <p className="margin-zero">
                  <span>Built for Australians. Private and secure.</span>
                </p>
              </div>
            </div>

            <div
              className="heroVisual"
              aria-label="SpendShift mobile results preview"
            >
              <div className="floatCard leftCard">
                <ShieldCheck size={34} />
                <b>Your data is private and secure</b>
                <p>No bank connection or payment details required.</p>
              </div>

              <div className="phoneFrame1">
                <Image
                  src="/home/Device.svg"
                  alt="SpendShift mobile results preview"
                  width={408}
                  height={800}
                  priority
                />
              </div>

              <div className="floatCard rightCard">
                <ChartNoAxesCombined size={38} />
                <b>Real insights. Real savings.</b>
                <p>Practical recommendations based on your answers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STATS */}
        <section className="stats-section">
          <div className="container">
            <div className="stats">
              <div className="stat">
                <div>
                  <Clock size={50} />
                </div>
                <div>
                  <strong>2 Minutes</strong>
                  <span>
                    Complete the audit
                    <br />
                    in approximately 2 minutes
                  </span>
                </div>
              </div>

              <div className="stat">
                <div>
                  <ShieldCheck size={50} />
                </div>
                <div>
                  <strong>Private</strong>
                  <span>
                    No bank access
                    <br />
                    required
                  </span>
                </div>
              </div>

              <div className="stat">
                <div>
                  <WalletCards size={50} />
                </div>
                <div>
                  <strong>No Signup</strong>
                  <span>
                    Start instantly
                    <br />
                    with no account
                  </span>
                </div>
              </div>

              <div className="stat">
                <div>
                  <MapPin size={50} />
                </div>
                <div>
                  <strong>Australia</strong>
                  <span>
                    Built around Australian
                    <br />
                    spending habits
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY SPENDSHIFT */}
        <section className="whySpendshiftSection" id="why">
          <div className="container">
            <div className="sectionIntro">
              <span className="sectionEyebrow">Why SpendShift</span>

              <h2 className="sectionTitle">
                Save more without building
                <br />
                <span>another complicated budget.</span>
              </h2>

              <p>
                Unlike budgeting apps, SpendShift focuses on identifying money
                that quietly disappears through everyday habits.
              </p>
            </div>

            <div className="whySpendshiftGrid">
              {whyCards.map((item) => {
                const Icon = item.icon;

                return (
                  <article className="whySpendshiftCard" key={item.title}>
                    <div className="icon">
                      <Icon size={34} strokeWidth={1.5} />
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.text}</p>

                    {item.points && (
                      <div className="whyPoints">
                        {item.points.map((point) => (
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
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="container stepsSection" id="works">
          <h2 className="sectionTitle">
            From quick audit to
            <br />
            <span>clear next steps.</span>
          </h2>

          <div className="steps">
            <div>
              <div className="stepNum">01</div>
              <div className="stepIconWrapper">
                <Smartphone className="stepIcon" strokeWidth={1} size={67} />
              </div>
              <h3>Answer 8 simple questions</h3>
              <p>Tell us about your everyday spending habits.</p>
            </div>

            <div>
              <div className="stepNum">02</div>
              <div className="stepIconWrapper">
                <Search className="stepIcon" strokeWidth={1} size={67} />
              </div>
              <h3>We analyse your answers</h3>
              <p>
                Your responses are compared with relevant spending patterns.
              </p>
            </div>

            <div>
              <div className="stepNum">03</div>
              <div className="stepIconWrapper">
                <PieChart className="stepIcon" strokeWidth={1} size={67} />
              </div>
              <h3>See your top money leaks</h3>
              <p>Get immediate insight into your strongest opportunities.</p>
            </div>

            <div>
              <div className="stepNum">04</div>
              <div className="stepIconWrapper">
                <MessageSquareLock
                  className="stepIcon"
                  strokeWidth={1}
                  size={67}
                />
              </div>
              <h3>Unlock your full plan</h3>
              <p>Receive detailed actions, scripts and a 30-day roadmap.</p>
            </div>
          </div>
        </section>

        {/* WHAT'S INCLUDED */}
        <section className="includedSection" id="included">
          <div className="container">
            <div className="sectionIntro">
              <span className="sectionEyebrow">What’s Included</span>

              <h2 className="sectionTitle">
                Everything you need to
                <br />
                <span>turn insight into action.</span>
              </h2>

              <p>
                Your personalised report gives you practical recommendations,
                clear priorities and simple actions you can start immediately.
              </p>
            </div>

            <div className="includedGrid">
              {includedCards.map((item) => {
                const Icon = item.icon;

                return (
                  <article className="includedCard" key={item.title}>
                    <div className="includedIcon">
                      <Icon size={30} strokeWidth={1.5} />
                    </div>

                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="pricingSection" id="pricing">
          <div className="container">
            <div className="sectionIntro">
              <span className="sectionEyebrow">Simple Pricing</span>

              <h2 className="sectionTitle">
                Start free.
                <br />
                <span>Unlock more when you’re ready.</span>
              </h2>

              <p>
                No subscription, no recurring fees and no unexpected charges.
              </p>
            </div>

            <div className="pricingGrid">
              <article className="pricingCard">
                <div className="pricingCardTop">
                  <span className="pricingLabel">Free Audit</span>

                  <div className="pricingAmount">
                    <strong>A$0</strong>
                  </div>

                  <p>
                    Discover your biggest money leaks before paying anything.
                  </p>
                </div>

                <div className="pricingList">
                  {[
                    "Complete savings audit",
                    "Biggest money leaks",
                    "Estimated savings range",
                    "Top three opportunities",
                  ].map((item) => (
                    <span key={item}>
                      <CheckCircle2 size={19} fill="#059625" stroke="white" />
                      {item}
                    </span>
                  ))}
                </div>

                <Link href="/audit" className="btn pricingButton">
                  Start Free Audit
                  <MoveRight size={18} />
                </Link>

                <p className="pricingFinePrint">No credit card required.</p>
              </article>

              <article className="pricingCard featuredPricingCard">
                <span className="popularBadge">Full Experience</span>

                <div className="pricingCardTop">
                  <span className="pricingLabel">
                    Full Personalised Savings Report
                  </span>

                  <div className="pricingAmount">
                    <strong>A$39</strong>
                    <small>one-time payment</small>
                  </div>

                  <p>
                    Get your complete savings breakdown and practical action
                    plan.
                  </p>
                </div>

                <div className="pricingList">
                  {[
                    "Everything in the free audit",
                    "Full personalised report",
                    "Estimated annual savings",
                    "Priority money leaks",
                    "Hidden savings opportunities",
                    "Negotiation scripts",
                    "Cancellation scripts",
                    "30-day action plan",
                    "Savings checklist",
                    "Saved report access",
                  ].map((item) => (
                    <span key={item}>
                      <CheckCircle2 size={19} fill="#059625" stroke="white" />
                      {item}
                    </span>
                  ))}
                </div>

                <Link href="/audit" className="btn pricingButton">
                  Start My Free Audit
                  <MoveRight size={18} />
                </Link>

                <div className="pricingTrust">
                  <span>One-time payment</span>
                  <span>No subscription</span>
                  <span>Instant access</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="servicesSection" id="services">
          <div className="container">
            <div className="sectionIntro">
              <span className="sectionEyebrow">Services</span>

              <h2 className="sectionTitle">
                Practical savings support,
                <br />
                <span>from insight to implementation.</span>
              </h2>
            </div>

            <div className="servicesGrid">
              {services.map((service) => {
                const Icon = service.icon;

                return (
                  <article className="serviceCard" key={service.title}>
                    <div className="serviceIcon">
                      <Icon size={34} strokeWidth={1.5} />
                    </div>

                    <h3>{service.title}</h3>
                    <p>{service.text}</p>

                    <Link href={service.href}>
                      {service.linkText}
                      <MoveRight size={17} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="faqSection">
          <div className="container">
            <h2 className="sectionTitle">
              Frequently Asked
              <br />
              <span>Questions</span>
            </h2>

            <div className="faqWrapper">
              {faqs.map((faq, index) => (
                <div
                  key={faq.question}
                  className={`faqItem ${openFaq === index ? "active" : ""}`}
                >
                  <button
                    type="button"
                    className="faqQuestion"
                    onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  >
                    <span>{faq.question}</span>

                    <span className="faqIcon">
                      {openFaq === index ? "−" : "+"}
                    </span>
                  </button>

                  <div
                    className={`faqAnswer ${openFaq === index ? "show" : ""}`}
                  >
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="finalCtaSection">
          <div className="container">
            <div className="cta">
              <div>
                <h2>Stop overpaying. Start saving.</h2>
                <p>Your free savings audit takes approximately two minutes.</p>
              </div>

              <div>
                <Link className="btn white" href="/audit">
                  Start Your Free Audit
                  <MoveRight size={18} />
                </Link>

                <p className="noCard">No credit card required.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
