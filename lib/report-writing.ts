import type { ReportRefinements } from "./report-refinements";
import type { SavingsAnalysis } from "./savings-engine";
import { reasonForArea } from "./personalisation-questions";

function money(value: number): string {
  return "$" + value.toLocaleString("en-AU", { maximumFractionDigits: 2 });
}

/**
 * Keep a short plain-language copy with each report.
 * The customer-facing web page uses the same structured data to make big,
 * easy-to-read cards. No AI or guessed prices are needed to write this.
 */
export function makeReportMarkdown(
  answers: string[],
  refinements: ReportRefinements,
  analysis: SavingsAnalysis,
): string {
  const ops = analysis.opportunities;
  const lines: string[] = [
    "# Your SpendShift plan",
    ops.length
      ? "We found " + ops.length + (ops.length === 1 ? " place" : " places") + " worth checking."
      : "Your answers did not show a clear money problem. We won't invent one.",
    "We have not checked live prices. Your bills are costs, not savings.",
  ];

  ops.forEach((op, index) => {
    lines.push(
      "## " + (index + 1) + ". " + op.title,
      reasonForArea(op.area, answers),
    );
    if (op.area === "subscriptions" && refinements.details.subscriptionsMonthly !== null) {
      lines.push("You pay " + money(refinements.details.subscriptionsMonthly) + " per month.");
    } else if (op.area === "insurance") {
      for (const p of refinements.insurancePolicies) {
        lines.push(
          (p.type || "Insurance") + ": " +
          (p.premium === null ? "Price not given" : money(p.premium) + " per " + (p.paymentPeriod === "month" ? "month" : "year")),
        );
      }
    } else if (op.annualSpend !== null) {
      lines.push("What you may pay now: about " + money(op.annualSpend) + " a year, from the amounts you entered.");
    }
    lines.push("What to do: " + op.firstAction, "Next: " + op.verification);
    if (op.area === "subscriptions" && refinements.details.unusedSubscriptionMonthly !== null &&
        refinements.details.unusedSubscriptionMonthly > 0 &&
        (refinements.details.subscriptionsMonthly === null ||
         refinements.details.unusedSubscriptionMonthly <= refinements.details.subscriptionsMonthly)) {
      lines.push(
        "If you cancel the unused " + money(refinements.details.unusedSubscriptionMonthly) +
        " per month service you named, you could keep " +
        money(refinements.details.unusedSubscriptionMonthly * 12) +
        " a year. You have not saved it yet.",
      );
    } else {
      lines.push("We don't know how much you'll save yet. Check the real prices first.");
    }
  });

  lines.push(
    "## Your 3 things to do",
    ...ops.slice(0, 2).map(op => "- " + op.firstAction),
    "- Check your next bill to see what you really saved.",
    "## Important",
    "Only count money you actually keep after paying any new costs or fees.",
    "This plan gives general money tips, not personal financial advice.",
  );
  return lines.join("\n\n");
}
