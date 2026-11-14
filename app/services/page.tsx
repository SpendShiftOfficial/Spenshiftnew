import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  ListChecks,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

const services = [
  {
    icon: Search,
    title: "Free savings check",
    text: "Answer eight free questions. See what may be worth checking and a first step for each area.",
    features: ["Eight free questions", "Free results", "No bank login", "No payment for free results"],
    cta: "Start my free savings check",
    href: "/audit",
  },
  {
    icon: ListChecks,
    title: "Personalised savings plan",
    text: "Get clear steps based on your answers. A$29 once, with no subscription.",
    features: ["Three priority actions", "Help comparing your own costs", "Possible savings only when enough costs are known", "A checklist and savings tracker"],
    cta: "See what's included",
    href: "/whats-included",
  },
];
const process = [
  {number: "01", title: "Start free", text: "Answer eight questions. No bank details needed."},
  {number: "02", title: "See your results", text: "Find the spending areas worth checking and where to start."},
  {number: "03", title: "Choose your full plan", text: "Pay A$29 once if you want more help. Add costs you know, skip the rest, then follow your plan."},
];

export default function ServicesPage() {
  return (
    <div className="innerPage">
      <Header />

      <main>
        {/* HERO */}
        <section className="servicesPageHero">
          <div className="container servicesPageHeroContent">
            <span className="innerEyebrow">
              <Sparkles size={17} />
              SpendShift Services
            </span>

            <h1>
              Practical savings support from <span>insight to action.</span>
            </h1>

            <p>
              Start with a free check of your spending. If you want more
              help, choose a personalised savings plan for A$29 once.
            </p>

            <div className="servicesHeroChecks">
              <span>
                <CheckCircle2 size={19} fill="#059625" stroke="white" />
                Built for Australians
              </span>

              <span>
                <CheckCircle2 size={19} fill="#059625" stroke="white" />
                No bank connection required
              </span>

              <span>
                <CheckCircle2 size={19} fill="#059625" stroke="white" />
                Clear practical actions
              </span>
            </div>

            <Link href="/audit" className="btn">
              Start my free savings check
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* SERVICES */}
        <section className="servicesPageSection">
          <div className="container">
            <div className="sectionIntro">
              <span className="sectionEyebrow">What We Offer</span>

              <h2 className="sectionTitle">
                Two simple ways to
                <br />
                <span>check your spending.</span>
              </h2>

              <p>
                The free check comes first. The full savings plan is optional.
              </p>
            </div>

            <div className="servicesPageGrid" style={{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 330px), 1fr))",maxWidth:900,marginInline:"auto"}}>
              {services.map((service) => {
                const Icon = service.icon;

                return (
                  <article className="servicesPageCard" key={service.title}>
                    <div className="servicesPageIcon">
                      <Icon size={34} strokeWidth={1.5} />
                    </div>

                    <h3>{service.title}</h3>
                    <p>{service.text}</p>

                    <div className="servicesPageList">
                      {service.features.map((feature) => (
                        <span key={feature}>
                          <CheckCircle2
                            size={18}
                            fill="#059625"
                            stroke="white"
                          />
                          {feature}
                        </span>
                      ))}
                    </div>

                    <Link href={service.href}>
                      {service.cta}
                      <ArrowRight size={17} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* WHAT USERS RECEIVE */}
        <section className="servicesOutcomeSection">
          <div className="container servicesOutcomeGrid">
            <div className="servicesOutcomeContent">
              <span className="sectionEyebrow">What You Receive</span>

              <h2>Know what to check and what to do next.</h2>

              <p>
                Start with free results. The paid plan adds step-by-step help.
We don't check live offers or promise a saving. For more ideas, explore our{" "}
<Link
href="/save-money-australia"
style={{
color: "inherit",
fontWeight: 700,
textDecoration: "underline",
textUnderlineOffset: "3px",
}}
>
guide to saving money in Australia
</Link>.
              </p>

              <div className="servicesOutcomePoints">
                <span>
                  <CircleDollarSign size={20} />
                  Possible savings when costs are known
                </span>

                <span>
                  <Target size={20} />
                  Three priority actions
                </span>

                <span>
                  <FileText size={20} />
                  Useful comparison links
                </span>

                <span>
                  <ListChecks size={20} />
                  Interactive savings checklist
                </span>
              </div>
            </div>

            <div className="servicesOutcomePanel">
              <span className="servicesOutcomeLabel">
                Personalised savings plan
              </span>

              <strong>A$29</strong>

              <p>One-time payment with no subscription or recurring fees.</p>

              <div className="servicesOutcomeMiniList">
                <span>
                  <ClipboardCheck size={19} />
                  Personalised recommendations
                </span>

                <span>
                  <CalendarDays size={19} />
                  Three priority actions
                </span>

                <span>
                  <ListChecks size={19} />
                  Completion checklist
                </span>
              </div>

              <Link href="/audit" className="btn white">
                Start my free savings check
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="servicesProcessSection">
          <div className="container">
            <div className="sectionIntro">
              <span className="sectionEyebrow">Simple Process</span>

              <h2 className="sectionTitle">
                Start free.
                <br />
                <span>Upgrade only when you are ready.</span>
              </h2>
            </div>

            <div className="servicesProcessGrid">
              {process.map((item) => (
                <article className="servicesProcessCard" key={item.number}>
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="finalCtaSection">
          <div className="container">
            <div className="cta">
              <div>
                <h2>See where to start, for free.</h2>
                <p>Answer eight free questions. No bank login needed.</p>
              </div>

              <div>
                <Link href="/audit" className="btn white">
                  Start my free savings check
                  <ArrowRight size={18} />
                </Link>

                <p className="noCard">No card needed for free results.</p>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}
