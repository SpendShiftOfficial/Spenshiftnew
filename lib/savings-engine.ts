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
      const unused = d.unusedSubscriptionChoice === "yes";
      const label = d.unusedSubscriptionName ? d.unusedSubscriptionName : "the service";
      if (unused && d.unusedSubscriptionMonthly !== null && d.unusedSubscriptionMonthly > 0 &&
          (d.subscriptionsMonthly === null || d.unusedSubscriptionMonthly <= d.subscriptionsMonthly)) {
        scenarioSaving = cents(d.unusedSubscriptionMonthly * 12);
        assumption = "If you cancel " + label + " at $" +
          d.unusedSubscriptionMonthly.toLocaleString("en-AU") +
          " a month, you may keep $" + scenarioSaving.toLocaleString("en-AU") +
          " a year. This is not a saving until it is cancelled.";
        firstAction = "Check how to cancel " + label + ".";
        verification = "Cancel it only if you don't need it. Check your next statement for the missing charge.";
      } else if (d.unusedSubscriptionChoice === "no") {
        assumption = "You said you use all your subscriptions. We won't tell you to cancel one.";
        firstAction = "List your subscriptions and check whether any have a cheaper plan.";
        verification = "Compare the same service and features. Only change when it still suits you.";
      } else if (d.unusedSubscriptionChoice === "yes") {
        assumption = "You found an unused service, but we don't know its price.";
        firstAction = "Find the unused service's monthly charge.";
        verification = "Check its price and cancel it if you no longer need it.";
      } else {
        assumption = "We don't know if any subscriptions are unused. We can't call your total bill a saving.";
        firstAction = "Check your bank app for subscriptions you've forgotten about.";
        verification = "If every service is useful, check for cheaper plans instead of cancelling.";
      }
    } else if (area === "insurance") {
      const policies = refinements.insurancePolicies;
      if (policies.length > 0 && policies.every(p => p.premium !== null)) {
        annualSpend = cents(policies.reduce((sum, p) =>
          sum + (p.premium ?? 0) * (p.paymentPeriod === "month" ? 12 : 1), 0));
      }
      const soon = policies.find(p => p.renewal === "soon");
      const mostExpensive = policies.filter(p => p.premium !== null)
        .sort((a,b) => (b.premium ?? 0) * (b.paymentPeriod === "month" ? 12 : 1) -
          (a.premium ?? 0) * (a.paymentPeriod === "month" ? 12 : 1))[0];
      const priority = soon || mostExpensive;
      assumption = "These are the prices you pay now. We have not checked other quotes.";
      firstAction = priority
        ? "Start by checking your " + (priority.type || "insurance") + " policy."
        : "Choose one policy to check first.";
      verification = "Ask for two quotes with the same cover. Check the full price, what is covered, claim costs and fees.";
    } else if (area === "takeaway") {
      if (d.takeawayOrder !== null && d.takeawayOrdersPerWeek !== null) {
        annualSpend = cents(d.takeawayOrder * d.takeawayOrdersPerWeek * 52);
      }
      const swaps = d.takeawaySwapPerWeek;
      const orders = d.takeawayOrdersPerWeek;
      const homeCost = d.takeawayReplacementCost;
      if (d.takeawayOrder !== null && orders !== null && swaps !== null &&
          homeCost !== null && swaps > 0 && swaps <= orders && d.takeawayOrder > homeCost) {
        scenarioSaving = cents((d.takeawayOrder - homeCost) * swaps * 52);
        assumption = "Plan: swap " + swaps + " of your " + orders + " orders each week. Each swap could save $" +
          cents(d.takeawayOrder - homeCost).toLocaleString("en-AU") +
          " after paying $" + homeCost.toLocaleString("en-AU") + " for food at home.";
        firstAction = "Plan " + swaps + " takeaway " + (swaps === 1 ? "swap" : "swaps") + " for next week.";
      } else {
        assumption = "Food at home costs money too. We need a full order price, how often you order and a home-meal cost before we can work out a fair saving.";
        firstAction = "Count your takeaway orders this week and decide how many you could swap.";
      }
      verification = "Shop for food to feed the SAME people. Write down both totals and count only the difference.";
    } else if (area === "convenience") {
      if (d.convenienceWeekly !== null) annualSpend = cents(d.convenienceWeekly * 52);
      if (d.convenienceWeekly !== null && d.convenienceGoalWeekly !== null &&
          d.convenienceGoalWeekly < d.convenienceWeekly) {
        scenarioSaving = cents((d.convenienceWeekly - d.convenienceGoalWeekly) * 52);
        assumption = "You chose a weekly goal of $" +
          d.convenienceGoalWeekly.toLocaleString("en-AU") +
          ". This is a goal, not money already saved. It only counts if you stay within it.";
        firstAction = "Set aside $" + d.convenienceGoalWeekly.toLocaleString("en-AU") +
          " for small buys next week.";
      } else {
        assumption = "We know what you spend, but not what you'd like to cut back.";
        firstAction = "Pick a weekly limit for coffees, snacks and quick buys.";
      }
      verification = "Check your spending at the end of the week. Don't count takeaway twice.";
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
      const trigger = d.shoppingTrigger;
      if (trigger === "Sales or deals") firstAction = "Mute sale emails for 7 days and wait before buying.";
      else if (trigger === "Boredom") firstAction = "Write a short free-to-do list for when you're bored.";
      else if (trigger === "Social media") firstAction = "Hide shopping ads and wait a day before you buy.";
      else if (d.unplannedArea === "Online shopping") firstAction = "Take saved cards off shopping sites. Wait a day before checkout.";
      else if (d.unplannedArea === "Clothes or accessories") firstAction = "Check what you already own before buying more.";
      else firstAction = "Wait one day before an unplanned buy.";
      verification = "If you skip a buy, record the real amount you kept. Don't count other spending twice.";
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
