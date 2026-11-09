import type { ReportRefinements } from "./report-refinements";
import type { SavingsAnalysis } from "./savings-engine";
import { reasonForArea } from "./personalisation-questions";

function money(amount: number): string {
  return "$" + amount.toLocaleString("en-AU", { maximumFractionDigits: 2 });
}

/** Store an easy-to-read plain-text copy alongside the structured plan. */
export function makeReportMarkdown(
  answers: string[],
  refinements: ReportRefinements,
  analysis: SavingsAnalysis,
): string {
  const ops = analysis.opportunities;
  const d = refinements.details;
  const lines: string[] = [
    "# Your SpendShift savings plan",
    ops.length
      ? "Your answers show " + ops.length + " " + (ops.length === 1 ? "area" : "areas") + " to check."
      : "Your answers did not show a clear money problem.",
    "We have not checked live prices. We do not count bills as money saved.",
  ];

  ops.forEach((op,index) => {
    lines.push("## " + (index+1) + ". " + op.title, reasonForArea(op.area, answers));
    if (op.area === "subscriptions" && d.subscriptionsMonthly !== null) {
      lines.push("You pay " + money(d.subscriptionsMonthly) + " each month.");
      if (d.unusedSubscriptionChoice === "no") lines.push("You said you use all your subscriptions. We won't tell you to cancel one.");
      if (d.unusedSubscriptionChoice === "not_sure") lines.push("You are not sure if any services are unused.");
    } else if (op.area === "insurance") {
      for(const p of refinements.insurancePolicies) {
        lines.push((p.type || "Insurance") + ": " +
          (p.premium === null ? "Price not given" : money(p.premium) + " per " + (p.paymentPeriod === "month" ? "month" : "year")) +
          (p.renewal === "soon" ? " (Renews soon)" : ""));
      }
    } else if (op.area === "takeaway") {
      if (d.takeawayOrder !== null) lines.push("Your usual takeaway order: " + money(d.takeawayOrder) + ".");
      if (d.takeawayOrdersPerWeek !== null) lines.push("You buy " + d.takeawayOrdersPerWeek + " orders each week.");
      if (d.takeawaySwapPerWeek !== null) lines.push("Your goal is to replace " + d.takeawaySwapPerWeek + " orders a week.");
      if (d.takeawayReplacementCost !== null) lines.push("Food from home for the same people: " + money(d.takeawayReplacementCost) + ".");
    } else if (op.area === "convenience") {
      if (d.convenienceWeekly !== null) lines.push("You spend " + money(d.convenienceWeekly) + " a week on small buys.");
      if (d.convenienceGoalWeekly !== null) lines.push("Your weekly goal: " + money(d.convenienceGoalWeekly) + ".");
    } else if (op.area === "energy") {
      if (d.electricityBill !== null) lines.push("Power bill: " + money(d.electricityBill) + " per " + (d.electricityPeriod === "month" ? "month" : "3 months") + ".");
      if (d.gasMonthly !== null) lines.push("Gas bill: " + money(d.gasMonthly) + " a month.");
    } else if (op.area === "phone") {
      if (d.mobileMonthly !== null) lines.push("Mobile: " + money(d.mobileMonthly) + " a month.");
      if (d.internetMonthly !== null) lines.push("Internet: " + money(d.internetMonthly) + " a month.");
    } else if (op.area === "unplanned") {
      if (d.unplannedArea) lines.push("You buy: " + d.unplannedArea + ".");
      if (d.shoppingTrigger) lines.push("What makes you shop: " + d.shoppingTrigger + ".");
    }
    lines.push("What to do: " + op.firstAction, "How to check: " + op.verification);
    if (op.scenarioSaving !== null) lines.push(
      "If you follow the change you chose, you could save " + money(op.scenarioSaving) +
      " a year. This is not money saved yet.",
    );
    else lines.push("We don't know the saving yet. Check real prices first.");
  });

  lines.push("## Start here",
    ...ops.slice(0,2).map(op => "- " + op.firstAction),
    "- Check what you actually spent after making a change.",
    "## Important",
    "Only count money you keep, after any costs or fees. Do not count the same money twice.",
    "This plan gives general money tips, not personal financial advice.",
  );
  return lines.join("\n\n");
}
