import type {SavingsOpportunity} from './savings-engine';
import type {ReportRefinements, InsuranceRefinement} from './report-refinements';
import {annualisePayment,periodLabel} from './payment-periods';

function money(amount:number){return '$'+amount.toLocaleString('en-AU',{maximumFractionDigits:2});}
function insuranceAnnual(policy:InsuranceRefinement){return annualisePayment(policy.premium??0, policy.paymentPeriod);}

export function firstSteps(op: SavingsOpportunity, r: ReportRefinements): string[] {
  const d = r.details;
  if (op.area === "subscriptions") {
    if (d.unusedSubscriptionChoice === "no") return [
      d.subscriptionsMonthly === null
        ? "Keep the subscriptions you use. Find each charge in your bank app or app-store account."
        : "You pay about " + money(d.subscriptionsMonthly) + " a month for subscriptions. Write down each service and its price.",
      "Check whether the same service has a cheaper plan with the features you actually use.",
      "Change only if it still suits you and costs less. Check next month's bill.",
    ];
    if (d.unusedSubscriptionChoice === "yes") {
      const priced=r.unusedSubscriptions.filter(s=>s.name&&s.monthly!==null&&s.monthly>0);
      if(priced.length>1)return [
        "Find each unused service's charge in your bank app or email receipts.",
        "Open each service's account page and check how to cancel it.",
        "Cancel only services you don't use. Save confirmations and check the charges stop.",
      ];
      return [
        "Find the charge for " + (priced[0]?.name || d.unusedSubscriptionName || "the unused service") + " in your bank app.",
        "Open that service's account page and check how to cancel it.",
        "Cancel only if you don't use it. Save the email and check your next bill.",
      ];
    }
    return [
      "Open your bank app and look at the last two months.",
      "Write down each app, streaming bill, and membership you pay for.",
      "Mark the ones you use. Check for old charges or cheaper plans.",
    ];
  }
  if (op.area === "takeaway") {
    const mode = d.takeawayMealMode || "combined";
    const selected=[
      ...(["takeaway","both","combined"].includes(mode)?[{name:mode==="combined"?"meal out":"takeaway meal",n:d.takeawaySwapPerWeek,orders:d.takeawayOrdersPerWeek}]:[]),
      ...(["restaurant","both"].includes(mode)?[{name:"restaurant meal",n:d.restaurantSwapPerWeek,orders:d.restaurantOrdersPerWeek}]:[]),
    ];
    if(selected.length&&selected.every(s=>s.n===0))return [
      "Keep your usual meals out if that's what works for you.",
      "Check the full price before you order, including any fees.",
      "Only make a change if it suits your needs and costs less.",
    ];
    const relevant =
      d.takeawayReason === "busy" ? "For busy nights, choose food you can make quickly, like wraps, eggs or a rice bowl. Buy what you need ahead of time."
      : d.takeawayReason === "tired" ? "Make an extra meal when you have more energy. Keep it ready for a tiring day."
      : d.takeawayReason === "enjoy" ? "Keep your favourite meal out. Pick less important meals to replace."
      : d.takeawayReason === "family" ? "Choose easy meals that feed everyone. Work out the total cost for the same people."
      : "Choose a home meal you enjoy and can make in a normal week. Buy the food ahead of time.";
    const changed=selected.filter(s=>s.n!==null&&s.n>0&&s.orders!==null&&s.n<=s.orders);
    if(changed.length){
      const summary=changed.map(s=>s.n+" "+s.name+(s.n===1?"":"s")).join(" and ");
      return [
        "Choose "+summary+" to replace next week.",
        relevant,
        "Compare the full costs for the same people, including groceries, drinks and any extra travel.",
      ];
    }
    return [
      "For seven days, note each takeaway order and restaurant visit. Keep the receipt for the people you paid for.",
      "Add up the costs, including delivery fees and drinks. Also check what a home meal would cost for the same people.",
      "Choose one realistic meal to replace. Only count a saving if its full replacement cost is lower.",
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
      "Open your bank app or keep receipts for seven days. Add up coffee, snacks and small treats, not full meals.",
      "Choose a weekly limit you can manage after you know the amount.",
      "Bring a drink or snack on days you'd rather not spend. Check the total after a week.",
    ];
  }
  if (op.area === "insurance") {
    const policies = [...r.insurancePolicies];
    const first = policies.filter(p => p.renewal === "soon")
      .sort((a,b) => insuranceAnnual(b) - insuranceAnnual(a))[0]
      || policies.filter(p => p.premium !== null)
        .sort((a,b) => insuranceAnnual(b) - insuranceAnnual(a))[0]
      || policies[0];
    const firstName = (first?.insurer ? first.insurer + " " : "") + (first?.type || "insurance policy");
    const price = first?.premium !== null && first?.premium !== undefined
      ? " (" + money(first.premium) + " per " + periodLabel(first.paymentPeriod) + ")" : "";
    return [
      first?.premium !== null && first?.premium !== undefined
        ? "Start with your " + firstName + price + (first.renewal === "soon" ? ". It renews in the next 3 months." : ". Find its current cover.")
        : "Find the price and renewal date for your " + firstName + " in your insurer's app or renewal email.",
      "Ask for two quotes with the same cover and what you'd pay if you claim. Get the full yearly price.",
      "Compare what's not covered and any fees before switching. Keep the protection you need.",
    ];
  }
  if (op.area === "phone") {
    const current = [
      ...(d.mobileMonthly !== null ? ["mobile at " + money(d.mobileMonthly) + " a month"] : []),
      ...(d.internetMonthly !== null ? ["home internet at " + money(d.internetMonthly) + " a month"] : []),
    ];
    return [
      current.length
        ? "You listed " + current.join(" and ") + ". Open the bills and note your data, speed and any device repayments."
        : "Open your phone or internet provider's app or latest bill. Find the monthly charge, data or speed, and any phone or modem repayments.",
      "Ask your current company for a lower price with the same service. Then compare two other suitable plans.",
      "Check the full 12-month cost, any joining fees and the price after deals end. Keep device repayments separate.",
    ];
  }
  if (op.area === "energy") {
    const period = d.electricityPeriod === "month" ? "month" : "3 months";
    const current = d.electricityBill !== null
      ? "Your latest power bill was " + money(d.electricityBill) + " for " + period + ". "
      : d.gasMonthly !== null
        ? "Your gas bill was " + money(d.gasMonthly) + " per " + periodLabel(d.gasPeriod) + ". "
        : "";
    return [
      current + "Find the dates and energy use on your last bill. Look for units used (kWh for power or MJ for gas) and the daily fee.",
      d.state === "VIC"
        ? "Use the free Victorian Energy Compare site linked below to compare plans for your usage."
        : ["NSW","QLD","SA","TAS","ACT"].includes(d.state)
          ? "Use the free Energy Made Easy site linked below. Enter your state and actual energy use."
          : "Ask your retailer or state consumer agency where you can compare the plans available to you.",
      "Compare estimated costs over a full year, including daily charges, rates and any fees. One bill may not reflect every season.",
    ];
  }
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
