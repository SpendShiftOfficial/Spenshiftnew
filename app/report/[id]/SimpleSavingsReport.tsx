import type { SavingsAnalysis, SavingsOpportunity } from "@/lib/savings-engine";
import type { ReportRefinements } from "@/lib/report-refinements";
import { reasonForArea } from "@/lib/personalisation-questions";
import PlanChecklist from "./PlanChecklist";
import CopyMessage from "./CopyMessage";
import styles from "./simple-report.module.css";

type Props = {
  reportId: string;
  answers: string[];
  analysis: SavingsAnalysis;
  refinements: ReportRefinements;
};

function money(amount: number): string {
  return "$" + amount.toLocaleString("en-AU", {
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  });
}

const steps: Record<SavingsOpportunity["area"], string[]> = {
  subscriptions: [
    "Open your bank app. Find your monthly subscriptions.",
    "Pick one you do not use.",
    "Cancel it with the company. Check your next bank statement.",
  ],
  insurance: [
    "Find the policy that renews next.",
    "Get two quotes for the same cover.",
    "Check the cover, total price and fees before you change.",
  ],
  takeaway: [
    "Choose one takeaway meal you buy often.",
    "Find an easy meal that costs less.",
    "Check both prices. Count only what you keep.",
  ],
  convenience: [
    "Think of one snack, coffee or quick lunch you could skip.",
    "Plan a cheaper choice for next time.",
    "See what you spend less on your next bank statement.",
  ],
  phone: [
    "Find your latest phone or internet bill.",
    "Compare two plans with the same speed, data and coverage.",
    "Check the price after discounts end before you switch.",
  ],
  energy: [
    "Find your latest power or gas bill.",
    "Compare plans using the amount of energy you use.",
    "Check all charges before you switch.",
  ],
  unplanned: [
    "The next time you want something extra, wait one day.",
    "Ask yourself if you still need it.",
    "If you skip it, note what you kept. Do not count it twice.",
  ],
};

const messages: Partial<Record<SavingsOpportunity["area"], string>> = {
  subscriptions: "Hi, I'm checking my subscriptions. What is my monthly price? When will you charge me next? How can I cancel, and will there be any fees? Thanks.",
  insurance: "Hi, I'm checking my insurance. Can you give me a quote with the same cover I have now? Please show the full price, fees and anything that is not covered. Thanks.",
  phone: "Hi, I'm checking my phone or internet bill. Do you have a cheaper plan with the same data, speed and coverage? What will it cost after any sale price ends? Thanks.",
  energy: "Hi, I'm checking my energy bill. Can you compare your plans using my real usage? Please show the full price and all fees. Thanks.",
};

function AreaCost({ opportunity, refinements }: {
  opportunity: SavingsOpportunity;
  refinements: ReportRefinements;
}) {
  const d = refinements.details;
  const area = opportunity.area;
  if (area === "subscriptions") {
    return d.subscriptionsMonthly === null ? <p className={styles.unknown}>You did not add a monthly price.</p> : (
      <div className={styles.costLine}>
        <strong>{money(d.subscriptionsMonthly)} <small>/ month</small></strong>
        <span>What you pay for subscriptions now</span>
      </div>
    );
  }
  if (area === "insurance") {
    return refinements.insurancePolicies.length ? (
      <div className={styles.policies}>
        {refinements.insurancePolicies.map((p, i) => (
          <div className={styles.policy} key={i}>
            <div>
              <strong>{p.type || "Insurance policy " + (i + 1)}</strong>
              {p.insurer ? <small>{p.insurer}</small> : null}
              {p.coverDescription ? <small>{p.coverDescription}</small> : null}
            </div>
            <span>{p.premium === null ? "No price given" : money(p.premium) + " / " + (p.paymentPeriod === "month" ? "month" : "year")}</span>
          </div>
        ))}
        {refinements.insurancePolicies.every(p => p.premium !== null) ? (
          <p className={styles.costSummary}>
            Total you pay now: <strong>{money(refinements.insurancePolicies.reduce((sum,p) => sum + (p.premium ?? 0) * (p.paymentPeriod === "month" ? 12 : 1), 0))} / year</strong>
          </p>
        ) : null}
      </div>
    ) : <p className={styles.unknown}>You did not add your insurance costs.</p>;
  }
  if (area === "phone") {
    return (
      <div className={styles.costDetails}>
        {d.mobileMonthly !== null && <p><span>Mobile</span><strong>{money(d.mobileMonthly)} / month</strong></p>}
        {d.internetMonthly !== null && <p><span>Internet</span><strong>{money(d.internetMonthly)} / month</strong></p>}
        {d.mobileMonthly === null && d.internetMonthly === null && <p className={styles.unknown}>You did not add a bill amount.</p>}
      </div>
    );
  }
  if (area === "energy") {
    return (
      <div className={styles.costDetails}>
        {d.state && <p><span>Your state</span><strong>{d.state}</strong></p>}
        {d.electricityBill !== null && <p><span>Power bill</span><strong>{money(d.electricityBill)} / {d.electricityPeriod === "month" ? "month" : "3 months"}</strong></p>}
        {d.gasMonthly !== null && <p><span>Gas bill</span><strong>{money(d.gasMonthly)} / month</strong></p>}
        {d.electricityBill === null && d.gasMonthly === null && <p className={styles.unknown}>You did not add a bill amount.</p>}
      </div>
    );
  }
  if (area === "takeaway") {
    return d.takeawayOrder !== null ? <div className={styles.costLine}>
      <strong>{money(d.takeawayOrder)} <small>/ order</small></strong>
      <span>What you pay for a normal takeaway order</span>
    </div> : <p className={styles.unknown}>You did not add an order price.</p>;
  }
  if (area === "convenience") {
    return d.convenienceWeekly !== null ? <div className={styles.costLine}>
      <strong>{money(d.convenienceWeekly)} <small>/ week</small></strong>
      <span>What you spend on small buys</span>
    </div> : <p className={styles.unknown}>You did not add a weekly amount.</p>;
  }
  return d.unplannedArea
    ? <p className={styles.simpleFact}>You picked: <strong>{d.unplannedArea}</strong>.</p>
    : <p className={styles.unknown}>You can start without a spending amount.</p>;
}

function shortTask(area: SavingsOpportunity["area"]): string {
  const tasks: Record<SavingsOpportunity["area"], string> = {
    subscriptions: "Check subscriptions you no longer use.",
    insurance: "Get two quotes for one insurance policy.",
    takeaway: "Swap one takeaway meal for a cheaper meal.",
    convenience: "Choose one small buy to cut back.",
    phone: "Compare two phone or internet plans.",
    energy: "Compare two power or gas plans.",
    unplanned: "Wait one day before your next extra buy.",
  };
  return tasks[area];
}

export default function SimpleSavingsReport({ reportId, answers, analysis, refinements }: Props) {
  const opportunities = analysis.opportunities.slice(0, 4);
  const count = opportunities.length;
  const todo = opportunities.length
    ? [...opportunities.slice(0, 2).map(op => shortTask(op.area)), "Check the next bill to see what you really saved."]
    : ["Find a bill you pay each month.", "Check whether you still need that plan.", "Compare the price before you make a change."];

  const knownUnused = refinements.details.unusedSubscriptionMonthly;
  const subsTotal = refinements.details.subscriptionsMonthly;
  const canShowSubscriptionExample =
    opportunities.some(o => o.area === "subscriptions") &&
    knownUnused !== null && knownUnused > 0 &&
    (subsTotal === null || knownUnused <= subsTotal);

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.hero}>
          <span className={styles.kicker}>YOUR SPENDSHIFT PLAN</span>
          <h1>{count ? "Your " + count + " best " + (count === 1 ? "place" : "places") + " to check" : "Your simple money plan"}</h1>
          <p>{count
            ? "We used your answers to pick where to start. Do one thing at a time."
            : "Your answers did not show a clear money problem. We won't make one up."}</p>
          <div className={styles.notice}>
            <strong>No made-up savings.</strong> We haven't checked live prices. You'll see what you pay now and how to find a better deal.
          </div>
        </header>

        <section className={styles.areas} aria-label="Your places to check">
          {opportunities.map((op, index) => {
            const message = messages[op.area];
            return (
              <article className={styles.card} key={op.area} id={"area-" + op.area}>
                <div className={styles.cardTitle}>
                  <span className={styles.number}>{index + 1}</span>
                  <div>
                    <h2>{op.title}</h2>
                    <p>{reasonForArea(op.area, answers)}</p>
                  </div>
                </div>
                <AreaCost opportunity={op} refinements={refinements} />
                <div className={styles.steps}>
                  <h3>What to do</h3>
                  <ol>
                    {steps[op.area].map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </div>
                {op.area === "subscriptions" && canShowSubscriptionExample && (
                  <p className={styles.possible}>
                    <strong>{money(knownUnused * 12)} / year</strong> is what you could keep if you cancel the {money(knownUnused)} / month service you said you don't use. It's not saved until you cancel it.
                  </p>
                )}
                {op.area === "insurance" && (
                  <p className={styles.smallNote}>We don't know how much you could save on insurance yet. A cheaper price may mean less cover. Check before you switch.</p>
                )}
                {op.area === "takeaway" && (
                  <p className={styles.smallNote}>A meal you make also costs money. Only count the price difference.</p>
                )}
                {message && (
                  <details className={styles.helpDetails}>
                    <summary>Need help? Copy a message</summary>
                    <div className={styles.message}>
                      <p>{message}</p>
                      <CopyMessage message={message} />
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </section>

        <section className={styles.lastCard}>
          <h2>Your 3 things to do</h2>
          <p>Tick each one when you're done.</p>
          <PlanChecklist reportId={reportId} items={todo} />
        </section>

        <footer className={styles.footer}>
          <p><strong>How to count real savings:</strong> Check what you paid before and after. Take away any new costs or fees.</p>
          <p>We have not checked live prices for you. This plan gives general money tips, not personal financial advice.</p>
        </footer>
      </div>
    </main>
  );
}
