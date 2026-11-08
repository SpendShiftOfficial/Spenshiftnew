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
  takeawayOrder: number | null;
  convenienceWeekly: number | null;
  unplannedArea: string;
};

export type InsuranceRefinement = {
  type: string;
  premium: number | null;
  paymentPeriod: "month" | "year";
  insurer: string;
  coverDescription: string;
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
      takeawayOrder: null,
      convenienceWeekly: null,
      unplannedArea: "",
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
    const paymentPeriod = policy.paymentPeriod === "month" ? "month" : "year";
    const type = fixedChoice(policy.type, insuranceTypes, "insurance type");
    const premium = money(policy.premium, "Insurance premium " + (index + 1));
    return {
      type,
      premium,
      paymentPeriod,
      insurer: optionalText(policy.insurer, 80, "Insurer name"),
      coverDescription: optionalText(policy.coverDescription, 120, "Coverage note"),
    };
  }).filter((policy) =>
    policy.type || policy.premium !== null || policy.insurer || policy.coverDescription,
  );

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
      subscriptionsMonthly: money(details.subscriptionsMonthly, "Subscription total"),
      takeawayOrder: money(details.takeawayOrder, "Takeaway order"),
      convenienceWeekly: money(details.convenienceWeekly, "Convenience spending"),
      unplannedArea: fixedChoice(details.unplannedArea, unplannedTypes, "unplanned purchases"),
    },
    insurancePolicies: policies,
  };
}
