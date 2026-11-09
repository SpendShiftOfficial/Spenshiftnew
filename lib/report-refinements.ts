import type { PersonalisationArea } from "./personalisation-questions";

/**
 * Data accepted from a customer's optional post-purchase questionnaire.
 * Never trust monetary values or arbitrary notes submitted by the browser.
 */
export type PersonalisationDetails = {
  state: string;
  electricityBill: number | null;
  electricityPeriod: "month" | "quarter";
  gasMonthly: number | null;
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
  convenienceWeekly: number | null;
  convenienceGoalWeekly: number | null;
  unplannedArea: string;
  shoppingTrigger: string;
  hasGas: string;
  phoneService: string;
  takeawayAmountPeriod: "order" | "week";
  convenienceOverlap: string;
};

export type InsuranceRefinement = {
  type: string;
  premium: number | null;
  paymentPeriod: "month" | "year";
  insurer: string;
  coverDescription: string;
  renewal: "" | "soon" | "later" | "not_sure";
};

export type ReportRefinements = {
  version: 1;
  additionalArea: PersonalisationArea | null;
  details: PersonalisationDetails;
  insurancePolicies: InsuranceRefinement[];
};

const areas: PersonalisationArea[] = [
  "energy", "phone", "subscriptions", "takeaway", "convenience", "insurance", "unplanned",
];
const states = new Set(["", "NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]);
const insuranceTypes = new Set(["", "Car", "Home or contents", "Health", "Life or income protection", "Pet", "Travel", "Other"]);
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
      convenienceWeekly: null,
      convenienceGoalWeekly: null,
      unplannedArea: "",
      shoppingTrigger: "",
      hasGas: "",
      phoneService: "",
      takeawayAmountPeriod: "order",
      convenienceOverlap: "",
    },
    insurancePolicies: [],
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
    const paymentPeriod: "month" | "year" = policy.paymentPeriod === "month" ? "month" : "year";
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
  const unusedSubscriptionChoice = fixedChoice(details.unusedSubscriptionChoice, unusedChoices, "unused subscription answer") as PersonalisationDetails["unusedSubscriptionChoice"];
  const effectiveUnusedChoice = unusedSubscriptionChoice || (unusedSubscriptionMonthly !== null ? "yes" : "");
  if (effectiveUnusedChoice !== "yes" && unusedSubscriptionMonthly !== null) {
    throw new Error("Choose Yes before entering an unused subscription price.");
  }
  if (unusedSubscriptionMonthly !== null && subscriptionsMonthly !== null &&
      unusedSubscriptionMonthly > subscriptionsMonthly) {
    throw new Error("An unused subscription cannot cost more than your monthly subscription total.");
  }
  const takeawayOrdersPerWeek = countPerWeek(details.takeawayOrdersPerWeek, "Takeaway orders");
  const takeawaySwapPerWeek = countPerWeek(details.takeawaySwapPerWeek, "Meals to swap");
  if (takeawayOrdersPerWeek !== null && takeawaySwapPerWeek !== null &&
      takeawaySwapPerWeek > takeawayOrdersPerWeek) {
    throw new Error("You can't swap more takeaway orders than you buy.");
  }
  const convenienceWeekly = money(details.convenienceWeekly, "Small buys each week");
  const convenienceGoalWeekly = money(details.convenienceGoalWeekly, "New weekly small-buy goal");
  if (convenienceWeekly !== null && convenienceGoalWeekly !== null &&
      convenienceGoalWeekly > convenienceWeekly) {
    throw new Error("Your new weekly goal must be no higher than what you spend now.");
  }

  return {
    version: 1,
    additionalArea: selectedAdditionalArea,
    details: {
      state: fixedChoice(details.state, states, "state"),
      electricityBill: money(details.electricityBill, "Electricity bill"),
      electricityPeriod: details.electricityPeriod === "month" ? "month" : "quarter",
      gasMonthly: money(details.gasMonthly, "Gas bill"),
      internetMonthly: money(details.internetMonthly, "Internet bill"),
      mobileMonthly: money(details.mobileMonthly, "Mobile bill"),
      subscriptionsMonthly,
      unusedSubscriptionMonthly,
      unusedSubscriptionChoice: effectiveUnusedChoice,
      unusedSubscriptionName: optionalText(details.unusedSubscriptionName, 60, "Subscription name"),
      takeawayOrder: money(details.takeawayOrder, "Takeaway order"),
      takeawayOrdersPerWeek,
      takeawaySwapPerWeek,
      takeawayReplacementCost: money(details.takeawayReplacementCost, "Cost to make a meal instead"),
      convenienceWeekly,
      convenienceGoalWeekly,
      unplannedArea: fixedChoice(details.unplannedArea, unplannedTypes, "unplanned purchases"),
      shoppingTrigger: fixedChoice(details.shoppingTrigger, triggerChoices, "shopping trigger"),
      hasGas: fixedChoice(details.hasGas, new Set(["", "yes", "no", "not_sure"]), "gas answer"),
      phoneService: fixedChoice(details.phoneService, new Set(["", "mobile", "internet", "both", "neither", "not_sure"]), "phone bills"),
      takeawayAmountPeriod: details.takeawayAmountPeriod === "week" ? "week" : "order",
      convenienceOverlap: fixedChoice(details.convenienceOverlap, new Set(["", "yes", "no", "not_sure"]), "overlapping spending"),
    },
    insurancePolicies: policies,
  };
}
