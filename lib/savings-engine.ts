import type { ReportRefinements } from "./report-refinements";
import type { PersonalisationArea } from "./personalisation-questions";
import { areaNames, selectPersonalisationAreas } from "./personalisation-questions";

export type SavingsOpportunity = {
  area: PersonalisationArea;
  title: string;
  auditAnswer: string;
  annualSpend: number | null;
  scenarioSaving: number | null;
  assumption: string;
  firstAction: string;
  verification: string;
};

export type SavingsAnalysis = {
  estimatedAnnualScenario: number | null;
  opportunities: SavingsOpportunity[];
  disclaimer: string;
};

function cents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const indexes: Record<PersonalisationArea, number> = {
  takeaway: 0, subscriptions: 1, insurance: 2, convenience: 3,
  phone: 4, energy: 5, unplanned: 6,
};

/**
 * Use only amounts the customer entered. In particular:
 * - A current bill is never treated as a saving.
 * - An "average unused subscription" is not a known cancelled service.
 * - Takeaway savings must deduct the cost of replacement meals.
 * - Unplanned spending may overlap with other categories.
 */
export function analyseSavings(answers: string[], refinements: ReportRefinements): SavingsAnalysis {
  const areas = selectPersonalisationAreas(answers);
  if (refinements.additionalArea && !areas.includes(refinements.additionalArea)) {
    areas.push(refinements.additionalArea);
  }
  const d = refinements.details;
  const opportunities: SavingsOpportunity[] = areas.map(area => {
    let annualSpend: number | null = null;
    let scenarioSaving: number | null = null;
    let assumption = "We need to check a real price before we can say what you might save.";
    let firstAction = "Find your latest bill.";
    let verification = "Compare the real prices before making a change.";

    if (area === "subscriptions") {
      if (d.subscriptionsMonthly !== null) annualSpend = cents(d.subscriptionsMonthly * 12);
      if (d.unusedSubscriptionMonthly !== null && d.unusedSubscriptionMonthly > 0 &&
          (d.subscriptionsMonthly === null ||
           d.unusedSubscriptionMonthly <= d.subscriptionsMonthly)) {
        scenarioSaving = cents(d.unusedSubscriptionMonthly * 12);
        assumption = "You said a service you don't use costs $" +
          d.unusedSubscriptionMonthly.toLocaleString("en-AU") +
          " a month. You would keep this money only if you cancel it and don't replace it.";
      } else {
        assumption = "We don't know which services you can cancel. Your total bill is not money you can save.";
      }
      firstAction = "Open your bank app and find the subscriptions you pay for.";
      verification = "Find one you don't use. Check its price and how to cancel it.";
    } else if (area === "insurance") {
      const policies = refinements.insurancePolicies;
      if (policies.length > 0 && policies.every(p => p.premium !== null)) {
        annualSpend = cents(policies.reduce((sum, p) =>
          sum + (p.premium ?? 0) * (p.paymentPeriod === "month" ? 12 : 1), 0));
      }
      assumption = "These are the bills you pay, not money you have saved. We have not checked insurance quotes.";
      firstAction = "Choose one policy to check. Start with the one that renews soon.";
      verification = "Get two quotes for the same cover. Check the price, fees and what each plan covers.";
    } else if (area === "takeaway") {
      const orders = answers[0] === "1–2 times/week" ? 1.5 :
        answers[0] === "3–5 times/week" ? 4 :
        answers[0] === "Almost daily" ? 6.5 : 0;
      if (orders > 0 && d.takeawayOrder !== null) {
        annualSpend = cents(d.takeawayOrder * orders * 52);
      }
      assumption = "Food you cook at home also costs money. We can't say what you'll save until you check both costs.";
      firstAction = "Pick one takeaway meal to swap for a cheaper meal.";
      verification = "Compare the price of both meals. Count only the difference.";
    } else if (area === "convenience") {
      if (d.convenienceWeekly !== null) annualSpend = cents(d.convenienceWeekly * 52);
      assumption = "This is the amount you spend. We don't know which buys you can skip.";
      firstAction = "Find one snack, coffee or quick buy you could skip.";
      verification = "Track what you did not buy. Don't count takeaway twice.";
    } else if (area === "phone") {
      const amounts = [d.internetMonthly, d.mobileMonthly].filter((n): n is number => n !== null);
      if (amounts.length) annualSpend = cents(amounts.reduce((a, b) => a + b, 0) * 12);
      assumption = "This is the cost of the bills you entered. We have not checked a cheaper plan.";
      firstAction = "Find your phone or internet bill.";
      verification = "Compare two plans with the same data, speed and coverage. Check extra fees.";
    } else if (area === "energy") {
      const electricity = d.electricityBill === null ? null :
        d.electricityBill * (d.electricityPeriod === "month" ? 12 : 4);
      const gas = d.gasMonthly === null ? null : d.gasMonthly * 12;
      if (electricity !== null || gas !== null) annualSpend = cents((electricity ?? 0) + (gas ?? 0));
      assumption = "These are your bill amounts. We have not checked a cheaper power or gas plan.";
      firstAction = "Find your latest power or gas bill.";
      verification = "Compare plans using your real usage. Check rates and fees.";
    } else if (area === "unplanned") {
      assumption = "We can't guess how much money you'd keep. These buys may overlap with other spending.";
      firstAction = "Wait one day before your next unplanned buy.";
      verification = "If you choose not to buy it, count only what you actually kept.";
    }

    return {
      area, title: areaNames[area], auditAnswer: answers[indexes[area]] ?? "",
      annualSpend, scenarioSaving, assumption, firstAction, verification,
    };
  });

  const savings = opportunities.map(x => x.scenarioSaving)
    .filter((x): x is number => x !== null && x > 0);
  return {
    estimatedAnnualScenario: savings.length ? cents(savings.reduce((a,b) => a+b,0)) : null,
    opportunities,
    disclaimer: "We have not checked live prices. A bill is not a saving. Money you might save is not money already saved. Count real savings after making a change.",
  };
}
