import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./savings-offer.module.css";

type Page = "home" | "pricing" | "included" | "how";
const copy: Record<Page, { label: string; heading: string; intro: string }> = {
  home: {
    label: "MADE FOR AUSTRALIANS",
    heading: "See where you could spend less.",
    intro: "Answer eight free questions about your spending. See what to check first. Want help taking action? Your own savings plan costs A$29 once.",
  },
  how: {
    label: "HOW IT WORKS",
    heading: "A few questions. A clear place to start.",
    intro: "Start with a free savings check. See your results. Only buy the A$29 plan if you want help with the next steps.",
  },
  included: {
    label: "WHAT'S INCLUDED",
    heading: "Know what your savings plan gives you.",
    intro: "Your answers shape your plan. Get three priority actions, help checking your costs, and a way to record what you really save.",
  },
  pricing: {
    label: "SIMPLE PRICING",
    heading: "Start free. Get the full plan for A$29 once.",
    intro: "The first eight questions and your results cost nothing. Pay only if you want your own step-by-step savings plan. No subscription.",
  },
};
const steps = [
  ["1", "Answer eight free questions", "Tell us about your bills and everyday spending. No bank login or payment."],
  ["2", "See your free results", "Find areas worth checking and a first step for each one."],
  ["3", "Choose if you want more help", "The full savings plan costs A$29 once. You can stop after the free results."],
  ["4", "Add the details you know", "After payment, answer questions about your spending areas. Skip costs you don't know."],
  ["5", "Follow your personal plan", "Start with three priority actions. Check your options and record any real savings."],
];
const included = [
  "A plan based on the answers you give",
  "Three priority actions, plus help with other areas worth checking",
  "Clear steps and useful links to compare bills and plans",
  "Possible savings figures only when there's enough information",
  "An action checklist and a way to record money you really save",
];
const faqs = [
  ["Are the first results free?", "Yes. The eight-question check, areas worth checking and first steps are free."],
  ["Do you find the best prices for me?", "No. SpendShift doesn't compare live prices or switch providers. We show you what to check and how to compare your options."],
  ["What if I don't know my bill costs?", "Skip the amount. We can still give you a useful next step, but can't work out a saving without enough details."],
  ["Will I definitely save money?", "No. Your costs, available options and the changes you choose will affect the result."],
  ["Is A$29 a monthly charge?", "No. It's one payment for the full personalised plan. There is no subscription."],
  ["What happens after I pay?", "Answer a few more questions about your relevant spending areas. Your progress is saved. Then view your plan, which you can return to with your private link."],
];
function Start() {
  return <a className={styles.primary} href="/audit">Start my free savings check</a>;
}
function Tiles({ items }: { items: string[][] }) {
  return <div className={styles.tileGrid}>
    {items.map(([n, title, description]) => <article className={styles.tile} key={n}>
      <span className={styles.number}>{n}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>)}
  </div>;
}
export default function SavingsOffer({page="home"}:{page?:Page}) {
  const {label,heading,intro}=copy[page];
  return <div className={styles.page}><Header/><main className={styles.wrap}>
    <section className={styles.hero}>
      <span className={styles.eyebrow}>{label}</span><h1>{heading}</h1>
      <p>{intro}</p><Start/><p className={styles.small}>8 free questions · No bank login · No card for free results</p>
    </section>
    {page==="home"&&<>
      <section aria-labelledby="benefits-heading">
        <h2 className={styles.sectionHeading} id="benefits-heading">Less guessing. More doing.</h2>
        <Tiles items={[
          ["1","See where to start","Your free results show which spending areas may be worth a closer look."],
          ["2","Get steps that fit","The A$29 plan gives you clear actions based on your answers."],
          ["3","Check what you save","Use a checklist and savings tracker to record real changes."],
        ]}/>
      </section>
      <section className={styles.offer}>
        <div><span className={styles.eyebrow}>OPTIONAL PERSONAL PLAN</span>
          <h2>Your next three steps, made for you.</h2>
          <p>Free results show where to look. The paid plan shows what to do and how to check the result.</p>
          <ul>{included.slice(0,4).map(x=><li key={x}>{x}</li>)}</ul>
          <a className={styles.textLink} href="/whats-included">See what's included</a>
        </div>
        <div className={styles.priceBox}><strong>A$29</strong><span>One payment · No subscription</span>
          <p>Start free. Choose the full plan only if you want more help.</p>
          <Start/><small>No live price searches. No guaranteed savings.</small>
        </div>
      </section>
      <section className={styles.example}><span className={styles.eyebrow}>FOR EXAMPLE</span>
        <h2>Haven't checked your phone bill in a while?</h2>
        <p>Your plan can show you what to compare, like data, fees and coverage. You can then check real offers and decide whether a change suits you.</p>
        <p>We don't assume you've overpaid or count a saving before it happens.</p>
      </section>
    </>}
    {page==="how"&&<>
      <section aria-labelledby="steps-heading"><h2 className={styles.sectionHeading} id="steps-heading">Five simple steps</h2><Tiles items={steps}/></section>
      <section className={styles.example}><h2>Don't know an amount? Skip it.</h2>
        <p>After payment, we ask about the spending areas that match your free answers. Fill in what you know. Your progress is saved if you need to come back to it.</p>
        <p>We show possible savings amounts only when there are enough figures. Otherwise, you still get clear checks to follow.</p>
      </section>
    </>}
    {page==="included"&&<>
      <section className={styles.offer}><div><span className={styles.eyebrow}>YOUR PERSONALISED A$29 PLAN</span>
        <h2>Here's what you get.</h2><p>We use your free answers and any extra details you choose to share.</p>
        <ul>{included.map(x=><li key={x}>{x}</li>)}</ul></div>
        <div className={styles.priceBox}><strong>A$29</strong><span>One-time payment</span>
          <p>Your free results come first. After payment, answer a few more questions before getting your plan.</p><Start/>
        </div></section>
      <section className={styles.example}><span className={styles.eyebrow}>AN EXAMPLE, NOT A PROMISE</span>
        <h2>More helpful than a list of tips.</h2>
        <p>A tip says, “Compare your power bill.” Your SpendShift plan helps you find the details to check, use comparison tools and compare the same type of service.</p>
        <p>If you know enough about your costs, it may show a possible saving. Record what you actually save when you make a change.</p>
      </section>
    </>}
    {page==="pricing"&&<>
      <section className={styles.priceGrid} aria-label="Compare free and paid options">
        <article className={styles.priceCard}><span className={styles.eyebrow}>FREE</span><h2>Free savings check</h2>
          <strong className={styles.bigPrice}>A$0</strong><p>No payment or bank login.</p>
          <ul><li>Eight short questions</li><li>Free results showing areas worth checking</li><li>A first step for each area</li><li>No need to buy anything</li></ul><Start/>
        </article>
        <article className={styles.priceCard}><span className={styles.eyebrow}>OPTIONAL</span><h2>Personalised savings plan</h2>
          <strong className={styles.bigPrice}>A$29 <span>once</span></strong><p>No subscription or recurring fee.</p>
          <ul><li>Extra questions you can skip if unsure</li><li>Three priority actions and clear steps</li><li>Help comparing costs and plans</li><li>A checklist and a savings tracker</li></ul><p className={styles.small}>Choose this after seeing your free results.</p>
        </article>
      </section>
      <section className={styles.example}><h2>What happens after payment?</h2>
        <p>Tell us a little more about the spending areas that apply to you. Skip amounts you don't know. Then get your plan with clear actions and a place to record what you actually save.</p>
        <p>We don't compare live prices or promise a saving. Read our <a className={styles.textLink} href="/terms-and-conditions">terms</a> and <a className={styles.textLink} href="/refund-policy">refund policy</a> before buying.</p>
      </section>
    </>}
    <section className={styles.faq} id={page==="home"?"faq":undefined}>
      <h2>Questions before you start</h2>
      {faqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      <p>Need help? <a href="mailto:info@spendshift.com.au">Email SpendShift</a>.</p>
    </section>
    <section className={styles.last}><h2>See where to start.</h2><Start/>
      <p>Free results first. General information, not personal financial product advice.</p>
    </section>
  </main><Footer/></div>;
}
