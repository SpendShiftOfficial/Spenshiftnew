import type { ReportRefinements } from "./report-refinements";
import type { PersonalisationArea } from "./personalisation-questions";
import { selectPersonalisationAreas } from "./personalisation-questions";

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
  // This is a *conditional* behaviour-change scenario, not a verified saving.
  opportunities: SavingsOpportunity[];
  disclaimer: string;
};

// Keep customer-supplied spending exact to cents. Never distort a known bill
// by rounding it to the nearest $25.
function moneyToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const labels: Record<PersonalisationArea, string> = {
  subscriptions: "Subscriptions",
  insurance: "Insurance",
  takeaway: "Takeaway and delivery",
  convenience: "Convenience purchases",
  phone: "Internet and mobile",
  energy: "Electricity and gas",
  unplanned: "Unplanned purchases",
};

const indexes: Record<PersonalisationArea, number> = {
  takeaway: 0, subscriptions: 1, insurance: 2, convenience: 3,
  phone: 4, energy: 5, unplanned: 6,
};

/**
 * Pure function. Only computes conditional examples using amounts the customer
 * actually gave us. No invented insurance, telco or energy comparison savings.
 */
export function analyseSavings(
  answers: string[],
  refinements: ReportRefinements,
): SavingsAnalysis {
  const preferred = selectPersonalisationAreas(answers);
  const areas: PersonalisationArea[] = [...preferred];
  if (refinements.additionalArea && !areas.includes(refinements.additionalArea)) {
    areas.push(refinements.additionalArea);
  }

  const d = refinements.details;
  const opportunities: SavingsOpportunity[] = areas.map((area) => {
    const answer = answers[indexes[area]] ?? "Not provided";
    let annualSpend: number | null = null;
    let scenarioSaving: number | null = null;
    let assumption = "This is an area to review, not a confirmed saving.";
    let firstAction = "Review your latest statements or bills.";
    let verification = "Check actual costs and compare suitable alternatives before making changes.";

    if (area === "subscriptions") {
      annualSpend = d.subscriptionsMonthly === null ? null : moneyToCents(d.subscriptionsMonthly * 12);
      const count = answer === "3–5" ? 4 : answer === "6–10" ? 8 : answer === "10+" ? 10 : null;
      if (count && d.subscriptionsMonthly !== null && d.subscriptionsMonthly > 0) {
        scenarioSaving = moneyToCents((d.subscriptionsMonthly / count) * 12);
        assumption = "Illustration only: cancel ONE unused subscription at the estimated average price across your " + answer + " subscriptions. It assumes you have one you can actually cancel.";
      }
      firstAction = "Check your recurring payments and identify any service you no longer use.";
      verification = "Confirm the exact subscription cost and cancellation terms before counting savings.";
    } else if (area === "takeaway") {
      const perWeek = answer === "1–2 times/week" ? 1.5 : answer === "3–5 times/week" ? 4 : answer === "Almost daily" ? 6.5 : 0;
      const reduceBy = answer === "Almost daily" ? 2 : perWeek > 0 ? 1 : 0;
      if (perWeek && d.takeawayOrder !== null) {
        annualSpend = moneyToCents(d.takeawayOrder * perWeek * 52);
        scenarioSaving = moneyToCents(d.takeawayOrder * reduceBy * 52);
        assumption = "Illustration only: " + reduceBy + " fewer takeaway order" + (reduceBy === 1 ? "" : "s") + " per week at the price you entered. This is a change in spending, not an existing overpayment.";
      }
      firstAction = "Choose one takeaway occasion you could replace with a lower-cost meal.";
      verification = "Compare your actual order totals with the replacement-meal cost; net savings may be lower.";
    } else if (area === "convenience") {
      if (d.convenienceWeekly !== null) {
        annualSpend = moneyToCents(d.convenienceWeekly * 52);
        scenarioSaving = moneyToCents(d.convenienceWeekly * 0.2 * 52);
        assumption = "Illustration only: reduce the separate weekly convenience spending you entered by 20%. It must exclude takeaway already counted above.";
      }
      firstAction = "Pick one repeat purchase to reduce this week.";
      verification = "Track what you actually stop purchasing; don't count takeaway or unplanned spending twice.";
    } else if (area === "insurance") {
      const annualPolicies = refinements.insurancePolicies.reduce((sum, p) =>
        sum + (p.premium === null ? 0 : p.premium * (p.paymentPeriod === "month" ? 12 : 1)), 0);
      annualSpend = refinements.insurancePolicies.some((p) => p.premium !== null) ? moneyToCents(annualPolicies) : null;
      assumption = "Premiums are current costs, NOT potential savings. No saving is included until an equivalent policy quote confirms the difference.";
      firstAction = "Choose one policy and request equivalent-cover comparison quotes.";
      verification = "Compare exclusions, insured amounts, claim conditions, waiting periods and total costs before switching.";
    } else if (area === "phone") {
      const amounts = [d.internetMonthly, d.mobileMonthly].filter((n): n is number => n !== null);
      annualSpend = amounts.length ? moneyToCents(amounts.reduce((a,b) => a+b,0)*12) : null;
      assumption = "Your monthly bills show spending, not proof of overpayment. We cannot calculate a saving without a suitable alternative quote.";
      firstAction = "Check your current plan price, data and inclusions against available plans.";
      verification = "Compare equivalent coverage, speeds, data, exit fees and promotion expiry.";
    } else if (area === "energy") {
      const electricityAnnual = d.electricityBill === null ? null :
        d.electricityBill * (d.electricityPeriod === "month" ? 12 : 4);
      const gasAnnual = d.gasMonthly === null ? null : d.gasMonthly * 12;
      annualSpend = electricityAnnual !== null || gasAnnual !== null
        ? moneyToCents((electricityAnnual ?? 0) + (gasAnnual ?? 0))
        : null;
      assumption = "Your bills reflect spending, not an established saving. Comparison savings require a like-for-like plan estimate.";
      firstAction = "Find your most recent energy bill and identify your current retailer and tariff.";
      verification = "Use your state and actual usage with a reputable comparison service; check all tariffs and conditions.";
    } else if (area === "unplanned") {
      assumption = "We do not add a second saving for unplanned purchases that might overlap with takeaway, shopping or convenience spending.";
      firstAction = "Apply a 24-hour pause to your next non-essential unplanned purchase.";
      verification = "Only count money genuinely not spent, after excluding purchases tracked in other categories.";
    }

    return {
      area,
      title: labels[area],
      auditAnswer: answer,
      annualSpend,
      scenarioSaving,
      assumption,
      firstAction,
      verification,
    };
  });

  const scenarioValues = opportunities
    .map((o) => o.scenarioSaving)
    .filter((n): n is number => n !== null && n > 0);
  return {
    estimatedAnnualScenario: scenarioValues.length
      ? scenarioValues.reduce((total, amount) => total + amount, 0)
      : null,
    opportunities,
    disclaimer: "These are conditional illustrations, not guaranteed savings. Only reductions supported by an amount you entered are counted. Insurance, energy and phone comparisons are excluded until a like-for-like offer is verified. Actual net savings may be lower.",
  };
}
