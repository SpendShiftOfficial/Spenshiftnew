import type { SavingsAnalysis, SavingsOpportunity } from "@/lib/savings-engine";
import type { ReportRefinements, InsuranceRefinement } from "@/lib/report-refinements";
import { reasonForArea } from "@/lib/personalisation-questions";
import PlanChecklist from "./PlanChecklist";
import SavingsTracker, { type TrackerOption } from "./SavingsTracker";
import ReportEditLink from "./ReportEditLink";
import QuoteCheck from "./QuoteCheck";
import {takeawayMath} from "@/lib/savings-math";
import {goalIntro,priorityReason,rankOpportunities} from "@/lib/plan-priority";
import CopyMessage from "./CopyMessage";
import {firstSteps, checklistTasks} from "@/lib/report-steps";
import {annualisePayment,periodLabel} from "@/lib/payment-periods";
import styles from "./simple-report.module.css";

type Props = {
  reportId: string;
  answers: string[];
  analysis: SavingsAnalysis;
  refinements: ReportRefinements;
  revisionCount?: number;
};

function money(amount: number): string {
  return "$" + amount.toLocaleString("en-AU", { maximumFractionDigits: 2 });
}

function insuranceAnnual(policy: InsuranceRefinement): number {
  return annualisePayment(policy.premium ?? 0, policy.paymentPeriod);
}

function insuranceTip(type: string): string {
  if (type === "Car") return "Check the car's value, who can drive it, and what you pay if you claim.";
  if (type === "CTP / Green Slip") return "CTP generally covers injuries, not damage to your car. Check your state's requirements and the cover offered.";
  if (type === "Home or contents") return "Check what your home and things are covered for. Look closely at flood and storm cover.";
  if (type === "Health") return "Check hospital cover, waiting times, and extras you use. Don't drop cover just to pay less.";
  if (type === "Life or income protection") return "Check when the cover pays, what it leaves out, and any waiting time. Get advice before dropping cover.";
  if (type === "Pet") return "Check yearly limits, what care is not covered, and what you pay for a claim.";
  if (type === "Travel") return "Check your trip dates, medical cover, and activities that are not covered.";
  return "Check what is covered, what is not, and what you pay for a claim.";
}

const messages = {
  insurance: "Hi, I'm checking my insurance price. Can you give me a quote for the same cover I have now? Please show the full yearly cost, any fees, and what isn't covered. Thanks.",
  phone: "Hi, I'm checking my phone or internet plan. Do you have a cheaper plan with the same data, speed and coverage? Please show the full price after any deal ends, and any fees. Thanks.",
};

function AreaNumbers({ op, refinements: r }: { op: SavingsOpportunity; refinements: ReportRefinements }) {
  const d = r.details;
  if (op.area === "subscriptions") {
    const priced=r.unusedSubscriptions.filter(s=>s.name&&s.monthly!==null&&s.monthly>0);
    const incomplete=r.unusedSubscriptions.length>priced.length;
    return <>
      {d.subscriptionsMonthly!==null&&<div className={styles.costLine}>
        <strong>{money(d.subscriptionsMonthly)} <small>/ month</small></strong>
        <span>What you pay for subscriptions now</span>
      </div>}
      {op.scenarioSaving!==null&&d.unusedSubscriptionChoice==="yes"&&
        <div className={styles.possible}>
          <strong>Possible yearly saving: {money(op.scenarioSaving)}</strong>
          {priced.length===1
            ? <p>If you cancel {priced[0].name} at {money(priced[0].monthly??0)}/month and do not replace it.</p>
            : <>
                <p>If you cancel these unused services and do not replace them:</p>
                {priced.map(s=><p key={s.name}>{s.name}: {money(s.monthly??0)} / month</p>)}
              </>}
          {incomplete&&<p>Services without a name or monthly price are not included in this possible saving.</p>}
          <small>You haven't saved this money yet. Check that each charge stops.</small>
        </div>}
    </>;
  }
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
            <span>{p.premium === null ? "Price not given" : money(p.premium) + " / " + periodLabel(p.paymentPeriod)}</span>
          </div>
        ))}
        {policies.some(p => p.premium !== null) && (
          <p className={styles.costSummary}>
            {policies.every(p => p.premium !== null) ? "Your total insurance cost:" : "Yearly cost of policies with prices:"}
            <strong>{money(policies.reduce((sum,p) => sum + (p.premium === null ? 0 : insuranceAnnual(p)),0))} / year</strong>
          </p>
        )}
      </div>
    ) : <p className={styles.unknown}>You didn't add any policy prices. Your plan will show how to check them.</p>;
  }
  if (op.area === "energy") return (
    <div className={styles.costDetails}>
      {d.state && <p><span>State</span><strong>{d.state}</strong></p>}
      {d.electricityBill !== null && <p><span>Power bill</span><strong>{money(d.electricityBill)} / {d.electricityPeriod === "month" ? "month" : "3 months"}</strong></p>}
      {d.gasMonthly !== null && <p><span>Gas</span><strong>{money(d.gasMonthly)} / {periodLabel(d.gasPeriod)}</strong></p>}
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

function AreaCard({ op, index, answers, refinements, nested = false }: {
  op: SavingsOpportunity;
  index: number;
  answers: string[];
  refinements: ReportRefinements;
  nested?: boolean;
}) {
  const steps = firstSteps(op, refinements);
  return (
    <article className={styles.card} id={"area-" + op.area}>
      {nested ? (
        <p className={styles.smallNote}>{reasonForArea(op.area, answers)}</p>
      ) : (
        <div className={styles.cardTitle}>
          <span className={styles.number}>{index + 1}</span>
          <div>
            <h2>{op.title}</h2>
            <p>{reasonForArea(op.area, answers)}</p>
          </div>
        </div>
      )}
      <p className={styles.smallNote}>{priorityReason(op, answers, refinements)}</p>
      <AreaNumbers op={op} refinements={refinements} />
      <div className={styles.steps}>
        <h3>What to do</h3>
        <ol>{steps.map((step,i) => <li key={i}>{step}</li>)}</ol>
      </div>
      <UsefulHelp op={op} r={refinements} />
      {op.area==='insurance'&&refinements.insurancePolicies.map((p,i)=><QuoteCheck
        key={i} kind="insurance" label={p.type||'this policy'}
        currentAnnual={p.premium===null?null:insuranceAnnual(p)} />)}
      {op.area==='phone'&&refinements.details.mobileMonthly!==null&&<QuoteCheck
        kind="mobile" label="your mobile plan" currentAnnual={refinements.details.mobileMonthly*12}/>}
      {op.area==='phone'&&refinements.details.internetMonthly!==null&&<QuoteCheck
        kind="internet" label="your home internet plan" currentAnnual={refinements.details.internetMonthly*12}/>}
      {op.area==='energy'&&refinements.details.electricityBill!==null&&<QuoteCheck
        kind="electricity" label="your electricity plan"
        electricityBillPeriod={refinements.details.electricityPeriod}
        currentAnnual={refinements.details.electricityBill*(refinements.details.electricityPeriod==='month'?12:4)}/>}
      {op.area==='energy'&&refinements.details.gasMonthly!==null&&<QuoteCheck
        kind="gas" label="your gas plan" currentAnnual={annualisePayment(refinements.details.gasMonthly, refinements.details.gasPeriod)}/>}

    </article>
  );
}

export default function SimpleSavingsReport({ reportId, answers, analysis, refinements, revisionCount = 0 }: Props) {
  const ops = rankOpportunities(analysis.opportunities, answers, refinements);
  const first = ops.slice(0, 3);
  const more = ops.slice(3);
  const tasks = checklistTasks(first, refinements);
  const trackerOptions: TrackerOption[] = ops.flatMap(op => {
    if (op.area === "insurance") {
      return refinements.insurancePolicies.length > 0
        ? refinements.insurancePolicies.map((policy, index) => ({
            key: "insurance-" + index + "-" + (policy.type || "other").toLowerCase().replace(/[^a-z0-9]+/g,"-") + "-" + (policy.insurer || "").toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,24),
            title: (policy.type || "Policy " + (index + 1)) + " insurance",
          }))
        : [{ key: "insurance", title: "Insurance" }];
    }
    if (op.area === "phone") return [
      { key: "mobile", title: "Mobile phone" },
      { key: "internet", title: "Home internet" },
    ];
    if (op.area === "energy") return [
      { key: "electricity", title: "Electricity" },
      { key: "gas", title: "Gas" },
    ];
    return [{ key: op.area, title: op.title }];
  });


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
            <strong>How we use your numbers.</strong> A bill is a cost, not a saving. We show a possible saving only when your answers give us enough information to calculate it.
          </div>
        </header>

        <section className={styles.lastCard}>
          <h2>Your 3 things to do first</h2>
          <p>Tick each one when you're done.</p>
          <PlanChecklist reportId={reportId} items={tasks} />
        </section>

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
                <AreaCard op={op} index={i+3} answers={answers} refinements={refinements} nested />
              </details>
            ))}
          </div>
        </section>}

        <SavingsTracker reportId={reportId} options={trackerOptions} />
        {!reportId.startsWith("demo-") && <ReportEditLink reportId={reportId} revisionCount={revisionCount} />}
        <footer className={styles.footer}>
          <p><strong>How to check real savings:</strong> Compare what you paid before and after. Take away any fees or extra costs. Don't count the same money twice.</p>
          <p>We have not checked live prices for you. This plan gives general money tips, not personal financial advice.</p>
        </footer>
      </div>
    </main>
  );
}
