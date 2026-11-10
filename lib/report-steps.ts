import type {SavingsOpportunity} from './savings-engine';
import type {ReportRefinements, InsuranceRefinement} from './report-refinements';
import {annualisePayment} from './payment-periods';

function money(amount:number){return '$'+amount.toLocaleString('en-AU',{maximumFractionDigits:2});}
function insuranceAnnual(policy:InsuranceRefinement){return annualisePayment(policy.premium??0, policy.paymentPeriod);}

export function firstSteps(op: SavingsOpportunity, r: ReportRefinements): string[] {
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
    if (d.takeawaySwapPerWeek === 0) return [
      "Keep your takeaway routine if that is what works for you.",
      "Check the full cost, including delivery fees, before your next order.",
      "Only make a change if it suits your needs and costs less.",
    ];
    const n = d.takeawaySwapPerWeek;
    const relevant =
      d.takeawayReason === "busy" ? "For busy nights, choose food you can make quickly, like wraps, eggs or a simple rice bowl. Buy what you need ahead of time."
      : d.takeawayReason === "tired" ? "Make an extra meal when you have more energy. Keep it ready in the fridge or freezer for a tiring day."
      : d.takeawayReason === "enjoy" ? "Keep your favourite takeaway night. Choose less important orders to replace so the plan feels worth keeping."
      : d.takeawayReason === "family" ? "Pick easy meals that feed everyone, such as pasta or wraps. Work out the full cost for the same number of people."
      : "Choose a home meal that you enjoy and can make on a normal week. Buy the food ahead of time.";
    if (d.takeawayOrdersPerWeek !== null && n !== null &&
        n > 0 && n <= d.takeawayOrdersPerWeek) {
      return [
        "Pick " + n + (n === 1 ? " takeaway order" : " takeaway orders") + " you could replace next week.",
        relevant,
        "Check the full cost of each home meal for the same people. Count the difference, including any extra travel.",
      ];
    }
    return [
      "Count how many takeaway orders you usually buy each week.",
      relevant,
      "Choose a change you could keep doing and compare the full cost of both meals.",
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

/** Three steps that match the detailed areas, even when there is only one. */
export function checklistTasks(ops:SavingsOpportunity[], r:ReportRefinements):string[]{
 const top=ops.slice(0,3);
 if(top.length===0)return ['Find a bill you pay each month.','See if the plan still suits you.','Compare the full price before you change.'];
 const tasks=top.map(op=>firstSteps(op,r)[0]);
 for(const op of top){
  if(tasks.length>=3)break;
  for(const step of firstSteps(op,r).slice(1)){
   if(!tasks.includes(step))tasks.push(step);
   if(tasks.length>=3)break;
  }
 }
 return tasks.slice(0,3);
}
