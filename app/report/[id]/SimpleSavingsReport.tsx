import type { SavingsAnalysis, SavingsOpportunity } from "@/lib/savings-engine";
import type { ReportRefinements, InsuranceRefinement } from "@/lib/report-refinements";
import { reasonForArea } from "@/lib/personalisation-questions";
import PlanChecklist from "./PlanChecklist";
import SavingsTracker from "./SavingsTracker";
import QuoteCheck from "./QuoteCheck";
import {takeawayMath} from "@/lib/savings-math";
import {goalIntro,priorityReason,rankOpportunities} from "@/lib/plan-priority";
import CopyMessage from "./CopyMessage";
import styles from "./simple-report.module.css";

type Props = {
  reportId: string;
  answers: string[];
  analysis: SavingsAnalysis;
  refinements: ReportRefinements;
};

function money(amount: number): string {
  return "$" + amount.toLocaleString("en-AU", { maximumFractionDigits: 2 });
}

function insuranceAnnual(policy: InsuranceRefinement): number {
  return (policy.premium ?? 0) * (policy.paymentPeriod === "month" ? 12 : 1);
}

function insuranceTip(type: string): string {
  if (type === "Car") return "Check the car's value, who can drive it, and what you pay if you claim.";
  if (type === "Home or contents") return "Check what your home and things are covered for. Look closely at flood and storm cover.";
  if (type === "Health") return "Check hospital cover, waiting times, and extras you use. Don't drop cover just to pay less.";
  if (type === "Life or income protection") return "Check when the cover pays, what it leaves out, and any waiting time. Get advice before dropping cover.";
  if (type === "Pet") return "Check yearly limits, what care is not covered, and what you pay for a claim.";
  if (type === "Travel") return "Check your trip dates, medical cover, and activities that are not covered.";
  return "Check what is covered, what is not, and what you pay for a claim.";
}

function firstSteps(op: SavingsOpportunity, r: ReportRefinements): string[] {
  const d = r.details;
  if (op.area === "subscriptions") {
    if (d.unusedSubscriptionChoice === "no") return [
      "Keep the services you use. Write down what each one costs.",
      "Check if the same service has a cheaper plan that still meets your needs.",
      "Change only if the total price is lower. Check next month's bill.",
    ];
    if (d.unusedSubscriptionChoice === "yes") return [
      "Find the charge for " + (d.unusedSubscriptionName || "the unused service") + " in your bank app.",
      "Open that service's account page and check how to cancel it.",
      "Cancel only if you don't use it. Save the email and check your next bill.",
    ];
    return [
      "Open your bank app and look at the last two months.",
      "Write down each app, streaming bill, and membership you pay for.",
      "Mark the ones you use. Check for old charges or cheaper plans.",
    ];
  }
  if (op.area === "takeaway") {
    if (d.takeawaySwapPerWeek === 0) return ["Keep your meal routine for now.", "Check the full cost, including delivery, before your next order.", "Only change something if it fits your needs and costs less."];
    if (d.takeawayOrdersPerWeek !== null && d.takeawaySwapPerWeek !== null &&
        d.takeawaySwapPerWeek > 0 && d.takeawaySwapPerWeek <= d.takeawayOrdersPerWeek) {
      const n = d.takeawaySwapPerWeek;
      return [
        "Mark " + n + " orders next week that you could replace with food from home.",
        "Pick " + n + " easy " + (n === 1 ? "meal" : "meals") + " to make at home. Buy the food in one shop.",
        "Keep the takeaway receipts and food-shop costs. Compare the price for the same people.",
      ];
    }
    return [
      "Look back over the last 7 days. Count your takeaway orders and the full price of each.",
      "Choose how many orders you could replace each week and still enjoy your food.",
      "Price a meal at home for the same people. Compare the two totals.",
    ];
  }
  if (op.area === "convenience") {
    if (d.convenienceWeekly !== null && d.convenienceGoalWeekly !== null &&
        d.convenienceGoalWeekly <= d.convenienceWeekly) {
      return [
        "Set a weekly limit of " + money(d.convenienceGoalWeekly) + " for coffee, snacks and quick buys.",
        "Choose which days you'll buy them. Bring a drink or snack on the other days.",
        "Check the total after 7 days. Change your goal if it feels too hard.",
      ];
    }
    return [
      "Check last week's coffee, snack and quick-buy costs.",
      "Choose a weekly limit that still lets you enjoy some treats.",
      "Bring a drink or snack on the days you'd rather not spend.",
    ];
  }
  if (op.area === "insurance") {
    const policies = [...r.insurancePolicies];
    const first = policies.filter(p => p.renewal === "soon")
      .sort((a,b) => insuranceAnnual(b) - insuranceAnnual(a))[0]
      || policies.filter(p => p.premium !== null)
        .sort((a,b) => insuranceAnnual(b) - insuranceAnnual(a))[0]
      || policies[0];
    const firstName = first?.type || "one insurance policy";
    return [
      "Start with " + firstName + (first?.renewal === "soon" ? " because it renews soon." : "."),
      "Get two quotes for the same cover. Ask for the full yearly price.",
      "Check what is not covered and what you'd pay for a claim. Keep the cover you need.",
    ];
  }
  if (op.area === "phone") return [
    "Find your latest phone or internet bill. Note what you pay and the data or speed you use.",
    "Ask your provider for a cheaper plan. Check two other plans with the same coverage.",
    "Check fees, when a sale price ends, and what your new bill would be.",
  ];
  if (op.area === "energy") return [
    "Find your latest power or gas bill. Keep it next to you.",
    "Use a free government comparison site if one serves your state.",
    "Compare total yearly costs for your own energy use, not just the headline rate.",
  ];
  if (d.shoppingTrigger === "Sales or deals") return [
    "Turn off sale emails and shopping alerts for 7 days.",
    "Put any item you want on a list. Wait one day before buying.",
    "Check the list next week. Only buy what you still need.",
  ];
  if (d.shoppingTrigger === "Boredom") return [
    "Write down three free things you enjoy doing.",
    "When you're bored, try one of them before opening a shop app.",
    "Wait a day before buying something you did not plan to buy.",
  ];
  if (d.shoppingTrigger === "Social media") return [
    "Hide shopping ads and unfollow deal pages for 7 days.",
    "Keep items you want on a list, not in a shopping basket.",
    "Check your list after one day. Only buy what you still need.",
  ];
  if (d.unplannedArea === "Online shopping") return [
    "Remove saved card details from shopping sites.",
    "Put the next item you want on a list and wait a day.",
    "Buy it only if you still need it and can afford it.",
  ];
  if (d.unplannedArea === "Clothes or accessories") return [
    "Check what clothes and shoes you already own.",
    "Make a list of what you need before opening a shop.",
    "Wait a day before buying anything not on the list.",
  ];
  return [
    "Write down what you want before you go shopping.",
    "If something extra catches your eye, wait a day.",
    "Only count money saved if you chose not to buy it.",
  ];
}

const messages = {
  insurance: "Hi, I'm checking my insurance price. Can you give me a quote for the same cover I have now? Please show the full yearly cost, any fees, and what isn't covered. Thanks.",
  phone: "Hi, I'm checking my phone or internet plan. Do you have a cheaper plan with the same data, speed and coverage? Please show the full price after any deal ends, and any fees. Thanks.",
};

function AreaNumbers({ op, refinements: r }: { op: SavingsOpportunity; refinements: ReportRefinements }) {
  const d = r.details;
  if (op.area === "subscriptions") return (
    <>
      {d.subscriptionsMonthly !== null && <div className={styles.costLine}>
        <strong>{money(d.subscriptionsMonthly)} <small>/ month</small></strong>
        <span>What you pay for subscriptions now</span>
      </div>}
      {op.scenarioSaving !== null && d.unusedSubscriptionChoice === "yes" && (
        <div className={styles.possible}>
          <strong>Possible yearly saving: {money(op.scenarioSaving)}</strong>
          <p>If you cancel {d.unusedSubscriptionName || "the unused service"} at {money(d.unusedSubscriptionMonthly ?? 0)}/month and do not replace it.</p>
          <small>You haven't saved this money yet.</small>
        </div>
      )}
    </>
  );
  if (op.area === "takeaway") {
    const m=takeawayMath(r);
    return <>
      {d.takeawayOrder!==null&&<div className={styles.costLine}><strong>{money(d.takeawayOrder)} <small>/ {d.takeawayAmountPeriod==='week'?'week':'order'}</small></strong><span>Your usual takeaway spending</span></div>}
      {m.weeklyCost!==null&&<p className={styles.costExplanation}>About {money(m.weeklyCost)} each week for {d.takeawayOrdersPerWeek??'your usual'} orders.</p>}
      {m.weeklySaving!==null&&<div className={styles.possible}><strong>Your goal: {money(m.weeklySaving)} less a week</strong><p>Replace {d.takeawaySwapPerWeek} orders. Each meal at home costs {money(d.takeawayReplacementCost??0)} for the same people.</p><p>Your new weekly food cost for these meals would be about {money((m.weeklyCost??0)-m.weeklySaving)}.</p><details><summary>See the yearly example</summary><p>Keeping this change for 52 weeks could save {money(m.annualExample??0)}. Holidays, prices and extra costs may change the result.</p></details><small>This is a goal, not money saved yet.</small></div>}
      {m.weeklySaving===null&&<p className={styles.smallNote}>{d.takeawaySwapPerWeek===0?'You chose not to replace any orders. We have not added a saving.':d.takeawayReplacementCost!==null&&m.orderCost!==null&&d.takeawayReplacementCost>=m.orderCost?'Your home meal costs as much or more than the order. There is no saving from that swap.':'Check both costs for the same people before counting a saving.'}</p>}
    </>;
  }
  if (op.area === "convenience") return (
    <>
      {d.convenienceWeekly !== null && <div className={styles.costLine}>
        <strong>{money(d.convenienceWeekly)} <small>/ week</small></strong>
        <span>What you spend on small buys now</span>
      </div>}
      {op.scenarioSaving !== null && d.convenienceGoalWeekly !== null &&
        d.convenienceWeekly !== null && (
        <div className={styles.possible}>
          <strong>Your goal: {money(d.convenienceGoalWeekly)} a week</strong>
          <p>That is {money(d.convenienceWeekly - d.convenienceGoalWeekly)} less each week.</p><details><summary>See the yearly example</summary><p>That could be {money(op.scenarioSaving)} over 52 weeks if you keep to your goal.</p></details>
          <small>This is a goal, not money saved yet. Don't count takeaway here too.</small>
        </div>
      )}
    </>
  );
  if (op.area === "insurance") {
    const policies = [...r.insurancePolicies].sort((a,b) => {
      const byRenewal = (a.renewal === "soon" ? 1 : 0) - (b.renewal === "soon" ? 1 : 0);
      return byRenewal !== 0 ? -byRenewal : insuranceAnnual(b) - insuranceAnnual(a);
    });
    return policies.length ? (
      <div className={styles.policies}>
        {policies.map((p,i) => (
          <div className={styles.policy} key={i}>
            <div>
              <strong>{p.type || "Policy " + (i+1)}</strong>
              {p.renewal === "soon" && <small>Renews in the next 3 months</small>}
              {p.insurer && <small>{p.insurer}</small>}
              {p.coverDescription && <small>{p.coverDescription}</small>}
              <small>{insuranceTip(p.type)}</small>
            </div>
            <span>{p.premium === null ? "Price not given" : money(p.premium) + " / " + (p.paymentPeriod === "month" ? "month" : "year")}</span>
          </div>
        ))}
        {policies.every(p => p.premium !== null) && (
          <p className={styles.costSummary}>Your total insurance cost:
            <strong>{money(policies.reduce((sum,p) => sum + insuranceAnnual(p),0))} / year</strong>
          </p>
        )}
      </div>
    ) : <p className={styles.unknown}>You didn't add any policy prices. Your plan will show how to check them.</p>;
  }
  if (op.area === "energy") return (
    <div className={styles.costDetails}>
      {d.state && <p><span>State</span><strong>{d.state}</strong></p>}
      {d.electricityBill !== null && <p><span>Power bill</span><strong>{money(d.electricityBill)} / {d.electricityPeriod === "month" ? "month" : "3 months"}</strong></p>}
      {d.gasMonthly !== null && <p><span>Gas</span><strong>{money(d.gasMonthly)} / month</strong></p>}
    </div>
  );
  if (op.area === "phone") return (
    <div className={styles.costDetails}>
      {d.mobileMonthly !== null && <p><span>Mobile</span><strong>{money(d.mobileMonthly)} / month</strong></p>}
      {d.internetMonthly !== null && <p><span>Internet</span><strong>{money(d.internetMonthly)} / month</strong></p>}
    </div>
  );
  return (
    <div className={styles.costDetails}>
      {d.unplannedArea && <p><span>What you buy</span><strong>{d.unplannedArea}</strong></p>}
      {d.shoppingTrigger && <p><span>What makes you shop</span><strong>{d.shoppingTrigger}</strong></p>}
    </div>
  );
}

function UsefulHelp({ op, r }: { op: SavingsOpportunity; r: ReportRefinements }) {
  const area = op.area;
  const state = r.details.state;
  if (area === "energy") {
    const url = state === "VIC"
      ? "https://compare.energy.vic.gov.au/languages/english"
      : ["NSW","QLD","SA","TAS","ACT"].includes(state)
        ? "https://www.energymadeeasy.gov.au/offer-search"
        : null;
    return url ? (
      <p className={styles.guide}>
        <a href={url} target="_blank" rel="noopener noreferrer">Open the free government energy comparison site</a>
        <span>Use your own bill to compare plans. We have not checked prices for you.</span>
      </p>
    ) : (
      <p className={styles.smallNote}>Your state may use a different way to compare plans. Ask your energy retailer or local consumer agency for the right tool.</p>
    );
  }
  if (area === "subscriptions") return (
    <p className={styles.guide}>
      <a href="https://support.apple.com/en-au/118428" target="_blank" rel="noopener noreferrer">Find or cancel an Apple subscription</a>
      <a href="https://support.google.com/googleplay/answer/7018481?hl=en" target="_blank" rel="noopener noreferrer">Find or cancel a Google Play subscription</a>
      <span>For other services, open the company's account or billing page.</span>
    </p>
  );
  if (area === "insurance" || area === "phone") {
    const guides: Record<string, { label: string; url: string }> = {
      "Car": {
        label: "Check car insurance — MoneySmart",
        url: "https://moneysmart.gov.au/car-insurance/how-to-save-money-on-car-insurance",
      },
      "Home or contents": {
        label: "Check home and contents insurance — MoneySmart",
        url: "https://moneysmart.gov.au/home-insurance/choosing-home-insurance",
      },
      "Health": {
        label: "Compare health policies — Australian Government",
        url: "https://www.privatehealth.gov.au/dynamic/search/",
      },
      "Life or income protection": {
        label: "Read about life and income cover — MoneySmart",
        url: "https://moneysmart.gov.au/how-life-insurance-works",
      },
      "Travel": {
        label: "Check travel insurance — MoneySmart",
        url: "https://moneysmart.gov.au/other-types-of-insurance/travel-insurance",
      },
    };
    const types = [...new Set(r.insurancePolicies.map(p => p.type))];
    const specificGuides = types.map(type => guides[type]).filter(
      (entry): entry is { label: string; url: string } => Boolean(entry),
    );
    const generalGuide = {
      label: "How to check insurance — MoneySmart",
      url: "https://moneysmart.gov.au/insurance",
    };
    return (
      <>
        <details className={styles.helpDetails}>
          <summary>{area === "insurance" ? "Ask your insurer for a price to compare" : "Ask your phone company about a better plan"}</summary>
          <div className={styles.message}>
            <p>Send this to {area === "insurance" ? "your insurance company" : "your phone or internet company"}:</p>
            <blockquote>{messages[area]}</blockquote>
            <CopyMessage message={messages[area]} />
          </div>
        </details>
        <p className={styles.guide}>
          {(area === "phone"
            ? [{ label: "Free phone and internet switching guide — ACMA", url: "https://www.acma.gov.au/switch-your-phone-or-internet-provider" }]
            : specificGuides.length ? specificGuides : [generalGuide]).map(guide => (
            <a key={guide.url} href={guide.url} target="_blank" rel="noopener noreferrer">{guide.label}</a>
          ))}
          <span>These are free guides. We have not compared quotes for you.</span>
        </p>
      </>
    );
  }
  return null;
}

function AreaCard({ op, index, answers, refinements }: {
  op: SavingsOpportunity;
  index: number;
  answers: string[];
  refinements: ReportRefinements;
}) {
  const steps = firstSteps(op, refinements);
  return (
    <article className={styles.card} id={"area-" + op.area}>
      <div className={styles.cardTitle}>
        <span className={styles.number}>{index + 1}</span>
        <div>
          <h2>{op.title}</h2>
          <p>{reasonForArea(op.area, answers)}</p>
        </div>
      </div>
      <p className={styles.smallNote}>{priorityReason(op, answers, refinements)}</p>
      <AreaNumbers op={op} refinements={refinements} />
      <div className={styles.steps}>
        <h3>What to do</h3>
        <ol>{steps.map((step,i) => <li key={i}>{step}</li>)}</ol>
      </div>
      <UsefulHelp op={op} r={refinements} />
      {op.area==='insurance'&&refinements.insurancePolicies.map((p,i)=><QuoteCheck key={i} label={p.type||'this policy'} currentAnnual={p.premium===null?null:insuranceAnnual(p)}/>)}
      {op.area==='phone'&&refinements.details.mobileMonthly!==null&&<QuoteCheck label='your mobile plan' currentAnnual={refinements.details.mobileMonthly*12}/>}
      {op.area==='phone'&&refinements.details.internetMonthly!==null&&<QuoteCheck label='your internet plan' currentAnnual={refinements.details.internetMonthly*12}/>}
      {op.area==='energy'&&<QuoteCheck label='your energy plan' currentAnnual={null}/>}

    </article>
  );
}

function firstTask(op: SavingsOpportunity, r: ReportRefinements): string {
  return firstSteps(op,r)[0];
}

export default function SimpleSavingsReport({ reportId, answers, analysis, refinements }: Props) {
  const ops = rankOpportunities(analysis.opportunities, answers, refinements);
  const first = ops.slice(0, 3);
  const more = ops.slice(3);
  const tasks = first.length
    ? [...first.slice(0, 2).map(op => firstTask(op, refinements)), "Check what you actually spent after making changes."]
    : ["Find a bill you pay each month.", "See if the plan still suits you.", "Compare the full price before you change."];

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.hero}>
          <span className={styles.kicker}>YOUR SPENDSHIFT SAVINGS PLAN</span>
          <h1>{ops.length
            ? "Your " + ops.length + " " + (ops.length === 1 ? "area" : "areas") + " to check"
            : "Your simple money plan"}</h1>
          <p>{ops.length
            ? "We checked all your answers. Start with the first " + Math.min(3,ops.length) +
              (Math.min(3,ops.length) === 1 ? " area." : " areas.") +
              " You can do the rest when you're ready."
            : "Your answers did not show a clear problem. We won't make one up."}</p>
          <p>{goalIntro(answers[7])}</p>
          <div className={styles.notice}>
            <strong>Numbers you can trust.</strong> What you pay now is not money saved. We only show possible savings when you gave us the costs to work them out.
          </div>
        </header>

        {first.length > 0 && <section className={styles.areas} aria-label="Start here">
          {first.map((op,i) => <AreaCard key={op.area} op={op} index={i} answers={answers} refinements={refinements} />)}
        </section>}

        {more.length > 0 && <section className={styles.moreAreas} aria-label="More places to check">
          <h2>Your other {more.length} {more.length === 1 ? "area" : "areas"}</h2>
          <p>These matter too. Open each one when you're ready.</p>
          <div className={styles.moreList}>
            {more.map((op,i) => (
              <details className={styles.moreItem} key={op.area}>
                <summary><span>{i + 4}. {op.title}</span><span className={styles.moreCue}>Show steps</span></summary>
                <AreaCard op={op} index={i+3} answers={answers} refinements={refinements} />
              </details>
            ))}
          </div>
        </section>}

        <section className={styles.lastCard}>
          <h2>Your 3 things to do first</h2>
          <p>Tick each one when you're done.</p>
          <PlanChecklist reportId={reportId} items={tasks} />
        </section>

        <SavingsTracker reportId={reportId} areas={ops.map(op=>({area:op.area,title:op.title}))} />
        <footer className={styles.footer}>
          <p><strong>How to check real savings:</strong> Compare what you paid before and after. Take away any fees or extra costs. Don't count the same money twice.</p>
          <p>We have not checked live prices for you. This plan gives general money tips, not personal financial advice.</p>
        </footer>
      </div>
    </main>
  );
}
