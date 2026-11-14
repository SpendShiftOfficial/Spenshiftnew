import type { PersonalisationArea } from "./personalisation-questions";
import {isPaymentPeriod, type PaymentPeriod} from "./payment-periods";

/**
 * Data accepted from a customer's optional post-purchase questionnaire.
 * Never trust monetary values or arbitrary notes submitted by the browser.
 */
export type PersonalisationDetails = {
  state: string;
  electricityBill: number | null;
  electricityPeriod: "month" | "quarter";
  /** Legacy key: now the gas payment amount for gasPeriod (defaults to monthly for old reports). */
  gasMonthly: number | null;
  gasPeriod: PaymentPeriod;
  internetMonthly: number | null;
  mobileMonthly: number | null;
  subscriptionsMonthly: number | null;
  unusedSubscriptionMonthly: number | null;
  unusedSubscriptionChoice: "" | "yes" | "no" | "not_sure";
  unusedSubscriptionName: string;
  takeawayOrder: number | null;
  takeawayOrdersPerWeek: number | null;
  takeawaySwapPerWeek: number | null;
  takeawayReplacementCost: number | null;
  /** Empty for unanswered new forms; combined for older single-average reports. */
  takeawayMealMode: "" | "takeaway" | "restaurant" | "both" | "combined";
  restaurantOrder: number | null;
  restaurantOrdersPerWeek: number | null;
  restaurantSwapPerWeek: number | null;
  restaurantReplacementCost: number | null;
  convenienceWeekly: number | null;
  convenienceGoalWeekly: number | null;
  unplannedArea: string;
  shoppingTrigger: string;
  hasGas: string;
  phoneService: string;
  takeawayAmountPeriod: "order" | "week";
  takeawayReason: string;
  convenienceOverlap: string;
};

export type InsuranceRefinement = {
  type: string;
  premium: number | null;
  paymentPeriod: PaymentPeriod;
  insurer: string;
  coverDescription: string;
  renewal: "" | "soon" | "later" | "not_sure";
};

export type UnusedSubscription = { name: string; monthly: number | null };

export type ReportRefinements = {
  version: 1;
  additionalArea: PersonalisationArea | null;
  details: PersonalisationDetails;
  insurancePolicies: InsuranceRefinement[];
  unusedSubscriptions: UnusedSubscription[];
};

const areas: PersonalisationArea[] = [
  "energy", "phone", "subscriptions", "takeaway", "convenience", "insurance", "unplanned",
];
const states = new Set(["", "NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]);
const insuranceTypes = new Set(["", "Car", "Home or contents", "Health", "Life or income protection", "CTP / Green Slip", "Pet", "Travel", "Other"]);
const unplannedTypes = new Set(["", "Online shopping", "Clothes or accessories", "Entertainment or hobbies", "Other purchases"]);
const unusedChoices = new Set(["", "yes", "no", "not_sure"]);
const renewalChoices = new Set(["", "soon", "later", "not_sure"]);
const triggerChoices = new Set(["", "Sales or deals", "Boredom", "Social media", "Other", "Not sure"]);

function record(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function money(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(label + " must be a number.");
  }
  const str = String(value);
  if (!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(str)) {
    throw new Error(label + " must be a non-negative amount with at most two decimals.");
  }
  const parsed = Number(str);
  if (!Number.isFinite(parsed) || parsed > 100000) {
    throw new Error(label + " is outside the allowed range.");
  }
  return parsed;
}

function countPerWeek(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value);
  if (!/^(?:0|[1-9][0-9]?)$/.test(raw)) throw new Error(label + " must be a whole number.");
  const n = Number(raw);
  if (n > 21) throw new Error(label + " must be 21 or less.");
  return n;
}

function fixedChoice(value: unknown, allowed: Set<string>, label: string): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string" || !allowed.has(value)) {
    throw new Error("Invalid " + label + ".");
  }
  return value;
}

function optionalText(value: unknown, maxLength: number, label: string): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new Error(label + " must be shorter than " + maxLength + " characters.");
  }
  return value.trim().replace(/[\u0000-\u001f\u007f<>]/g, "");
}

export function emptyRefinements(): ReportRefinements {
  return {
    version: 1,
    additionalArea: null,
    details: {
      state: "",
      electricityBill: null,
      electricityPeriod: "quarter",
      gasMonthly: null,
      gasPeriod: "month",
      internetMonthly: null,
      mobileMonthly: null,
      subscriptionsMonthly: null,
      unusedSubscriptionMonthly: null,
      unusedSubscriptionChoice: "",
      unusedSubscriptionName: "",
      takeawayOrder: null,
      takeawayOrdersPerWeek: null,
      takeawaySwapPerWeek: null,
      takeawayReplacementCost: null,
      takeawayMealMode: "",
      restaurantOrder: null,
      restaurantOrdersPerWeek: null,
      restaurantSwapPerWeek: null,
      restaurantReplacementCost: null,
      convenienceWeekly: null,
      convenienceGoalWeekly: null,
      unplannedArea: "",
      shoppingTrigger: "",
      hasGas: "",
      phoneService: "",
      takeawayAmountPeriod: "order",
      takeawayReason: "",
      convenienceOverlap: "",
    },
    insurancePolicies: [],
    unusedSubscriptions: [],
  };
}

export function validateRefinements(input: unknown): ReportRefinements {
  if (input === undefined || input === null) return emptyRefinements();
  const raw = record(input);
  const details = record(raw.details);
  const additional = raw.additionalArea;
  if (additional !== undefined && additional !== null &&
    (typeof additional !== "string" || !areas.includes(additional as PersonalisationArea))) {
    throw new Error("Invalid additional spending area.");
  }
  const selectedAdditionalArea = additional
    ? (additional as PersonalisationArea)
    : null;

  const rawPolicies = raw.insurancePolicies ?? [];
  if (!Array.isArray(rawPolicies) || rawPolicies.length > 6) {
    throw new Error("You may include up to six insurance policies.");
  }
  const policies: InsuranceRefinement[] = rawPolicies.map((entry, index) => {
    const policy = record(entry);
    // Missing legacy policy frequencies were yearly. Reject unsupported new values.
    const paymentValue = policy.paymentPeriod || "year";
    if (!isPaymentPeriod(paymentValue)) throw new Error("Choose a valid insurance payment frequency.");
    const paymentPeriod: PaymentPeriod = paymentValue;
    const type = fixedChoice(policy.type, insuranceTypes, "insurance type");
    const premium = money(policy.premium, "Insurance premium " + (index + 1));
    return {
      type,
      premium,
      paymentPeriod,
      insurer: optionalText(policy.insurer, 80, "Insurer name"),
      coverDescription: optionalText(policy.coverDescription, 120, "Coverage note"),
      renewal: fixedChoice(policy.renewal, renewalChoices, "renewal timing") as InsuranceRefinement["renewal"],
    };
  }).filter((policy) =>
    policy.type || policy.premium !== null || policy.insurer || policy.coverDescription,
  );

  const subscriptionsMonthly = money(details.subscriptionsMonthly, "Subscription total");
  const unusedSubscriptionMonthly = money(details.unusedSubscriptionMonthly, "Unused subscription price");
  const unusedSubscriptionName = optionalText(details.unusedSubscriptionName, 60, "Subscription name");
  const unusedSubscriptionChoice = fixedChoice(details.unusedSubscriptionChoice, unusedChoices, "unused subscription answer") as PersonalisationDetails["unusedSubscriptionChoice"];
  // A new questionnaire supplies additionalUnusedSubscriptions; stored reports
  // contain the full unusedSubscriptions list. Do not count a legacy first entry twice.
  const extra = raw.additionalUnusedSubscriptions ?? [];
  const stored = raw.unusedSubscriptions;
  if (!Array.isArray(extra) || extra.length > 5) throw new Error("Add up to six unused subscriptions.");
  if (stored !== undefined && (!Array.isArray(stored) || stored.length > 6)) throw new Error("Add up to six unused subscriptions.");
  const rawEntries: unknown[] = Array.isArray(stored) && stored.length
    ? stored
    : [...(unusedSubscriptionName || unusedSubscriptionMonthly !== null
      ? [{name:unusedSubscriptionName,monthly:unusedSubscriptionMonthly}] : []), ...extra];
  const unusedSubscriptions: UnusedSubscription[] = rawEntries.map((entry,index)=>{
    const item=record(entry);
    return {name:optionalText(item.name,60,"Unused service "+(index+1)),
      monthly:money(item.monthly,"Unused subscription price "+(index+1))};
  }).filter(item=>item.name || item.monthly !== null);
  const effectiveUnusedChoice = unusedSubscriptionChoice || (unusedSubscriptions.length ? "yes" : "");
  if(effectiveUnusedChoice !== "yes" && unusedSubscriptions.length)throw new Error("Choose Yes before listing unused subscriptions.");
  const names=new Set<string>();
  for(const item of unusedSubscriptions) {
    if(!item.name)continue;
    const name=item.name.toLocaleLowerCase("en-AU");
    if(names.has(name))throw new Error("List each unused service only once.");
    names.add(name);
  }
  const unusedMonthlyTotal=Math.round(unusedSubscriptions.reduce((sum,item)=>sum+(item.monthly??0),0)*100)/100;
  if(subscriptionsMonthly !== null && unusedMonthlyTotal>subscriptionsMonthly)
    throw new Error("Unused subscriptions cannot cost more than your monthly subscription total.");
  const takeawayOrdersPerWeek = countPerWeek(details.takeawayOrdersPerWeek, "Takeaway orders");
  const takeawaySwapPerWeek = countPerWeek(details.takeawaySwapPerWeek, "Meals to swap");
  if (takeawayOrdersPerWeek !== null && takeawaySwapPerWeek !== null &&
      takeawaySwapPerWeek > takeawayOrdersPerWeek) {
    throw new Error("You can't swap more takeaway orders than you buy.");
  }
  const restaurantOrdersPerWeek = countPerWeek(details.restaurantOrdersPerWeek, "Eating-out visits");
  const restaurantSwapPerWeek = countPerWeek(details.restaurantSwapPerWeek, "Eating-out meals to replace");
  if (restaurantOrdersPerWeek !== null && restaurantSwapPerWeek !== null &&
      restaurantSwapPerWeek > restaurantOrdersPerWeek) {
    throw new Error("You can't replace more restaurant meals than you buy.");
  }
  const requestedMealMode = fixedChoice(
    details.takeawayMealMode, new Set(["", "takeaway", "restaurant", "both", "combined"]), "meal type",
  ) as PersonalisationDetails["takeawayMealMode"];
  // Preserve earlier paid reports that used a single average for takeaway and eating out.
  const hasEarlierCombinedMeals = takeawayOrdersPerWeek !== null ||
    takeawaySwapPerWeek !== null || details.takeawayOrder !== undefined &&
    details.takeawayOrder !== null && details.takeawayOrder !== "";
  const takeawayMealMode = requestedMealMode || (hasEarlierCombinedMeals ? "combined" : "");
  const hasTakeaway = ["combined", "takeaway", "both"].includes(takeawayMealMode);
  const hasRestaurant = ["restaurant", "both"].includes(takeawayMealMode);
  const convenienceWeekly = money(details.convenienceWeekly, "Small buys each week");
  const convenienceGoalWeekly = money(details.convenienceGoalWeekly, "New weekly small-buy goal");
  if (convenienceWeekly !== null && convenienceGoalWeekly !== null &&
      convenienceGoalWeekly > convenienceWeekly) {
    throw new Error("Your new weekly goal must be no higher than what you spend now.");
  }

  // An explicit bill choice overrides any old amounts that are now hidden.
  // A blank choice is preserved for older saved reports that did not ask this question.
  const phoneService = fixedChoice(details.phoneService, new Set(['', 'mobile', 'internet', 'both', 'neither', 'not_sure']), 'phone bills');
  const gasValue = details.gasPeriod || "month";
  if (!isPaymentPeriod(gasValue)) throw new Error("Choose a valid gas payment frequency.");
  const gasPeriod: PaymentPeriod = gasValue;

  return {
    version: 1,
    additionalArea: selectedAdditionalArea,
    details: {
      state: fixedChoice(details.state, states, "state"),
      electricityBill: money(details.electricityBill, "Electricity bill"),
      electricityPeriod: details.electricityPeriod === "month" ? "month" : "quarter",
      gasMonthly: money(details.gasMonthly, "Gas bill"),
      gasPeriod,
      internetMonthly: ['mobile','neither','not_sure'].includes(phoneService) ? null : money(details.internetMonthly, "Internet bill"),
      mobileMonthly: ['internet','neither','not_sure'].includes(phoneService) ? null : money(details.mobileMonthly, "Mobile bill"),
      subscriptionsMonthly,
      unusedSubscriptionMonthly,
      unusedSubscriptionChoice: effectiveUnusedChoice,
      unusedSubscriptionName,
      takeawayOrder: hasTakeaway ? money(details.takeawayOrder, "Takeaway order") : null,
      takeawayOrdersPerWeek: hasTakeaway ? takeawayOrdersPerWeek : null,
      takeawaySwapPerWeek: hasTakeaway ? takeawaySwapPerWeek : null,
      takeawayReplacementCost: hasTakeaway ? money(details.takeawayReplacementCost, "Cost to make a takeaway meal instead") : null,
      takeawayMealMode,
      restaurantOrder: hasRestaurant ? money(details.restaurantOrder, "Restaurant meal") : null,
      restaurantOrdersPerWeek: hasRestaurant ? restaurantOrdersPerWeek : null,
      restaurantSwapPerWeek: hasRestaurant ? restaurantSwapPerWeek : null,
      restaurantReplacementCost: hasRestaurant ? money(details.restaurantReplacementCost, "Cost to make a restaurant meal instead") : null,
      convenienceWeekly,
      convenienceGoalWeekly,
      unplannedArea: fixedChoice(details.unplannedArea, unplannedTypes, "unplanned purchases"),
      shoppingTrigger: fixedChoice(details.shoppingTrigger, triggerChoices, "shopping trigger"),
      hasGas: fixedChoice(details.hasGas, new Set(["", "yes", "no", "not_sure"]), "gas answer"),
      phoneService,
      takeawayAmountPeriod: details.takeawayAmountPeriod === "week" ? "week" : "order",
      takeawayReason: fixedChoice(details.takeawayReason, new Set(["", "busy", "tired", "enjoy", "family", "other"]), "takeaway reason"),
      convenienceOverlap: fixedChoice(details.convenienceOverlap, new Set(["", "yes", "no", "not_sure"]), "overlapping spending"),
    },
    insurancePolicies: policies,
    unusedSubscriptions: effectiveUnusedChoice === "yes" ? unusedSubscriptions : [],
  };
}
