/**
 * Phase 1 preview selection only.
 *
 * These values mirror the midpoint opportunity bands already shown on the
 * existing free-results page. They are ranking signals, not verified savings,
 * and MUST NOT be used as report totals or customer-specific price comparisons.
 * The report-calculation stage will be designed and tested separately.
 */
export type PersonalisationArea =
  | "energy"
  | "phone"
  | "subscriptions"
  | "takeaway"
  | "convenience"
  | "insurance"
  | "unplanned";

type Rule = {
  index: number;
  amounts: Record<string, number>;
};

const rules: Record<PersonalisationArea, Rule> = {
  takeaway: {
    index: 0,
    amounts: {
      "Never": 0,
      "1–2 times/week": 800,
      "3–5 times/week": 1600,
      "Almost daily": 3250,
    },
  },
  subscriptions: {
    index: 1,
    amounts: {
      "0–2": 50,
      "3–5": 550,
      "6–10": 1100,
      "10+": 2000,
      "Not sure": 1100,
    },
  },
  insurance: {
    index: 2,
    amounts: {
      "I don’t currently have insurance": 0,
      "Within 6 months": 100,
      "6–12 months ago": 300,
      "1–2 years ago": 500,
      "Over 2 years ago": 850,
      "Never / not sure": 1050,
    },
  },
  convenience: {
    index: 3,
    amounts: {
      "Rarely": 100,
      "1–2 times/week": 550,
      "3–5 times/week": 1100,
      "Daily": 2000,
    },
  },
  phone: {
    index: 4,
    amounts: {
      "Within 6 months": 50,
      "6-12 months ago": 150,
      "Over a year ago": 300,
      "I honestly don't know": 300,
      "I don’t pay either of these bills": 0,
    },
  },
  energy: {
    index: 5,
    amounts: {
      "Within 6 months": 50,
      "6-12 months ago": 150,
      "Over a year ago": 250,
      "I honestly don't know": 250,
      "I don’t pay these bills": 0,
    },
  },
  unplanned: {
    index: 6,
    amounts: {
      "Rarely": 100,
      "1–2 times/week": 450,
      "3–5 times/week": 900,
      "Almost daily": 1500,
    },
  },
};

export function selectPersonalisationAreas(
  auditAnswers: string[],
): PersonalisationArea[] {
  if (
    auditAnswers.length !== 8 ||
    auditAnswers.some((answer) => typeof answer !== "string")
  ) {
    return [];
  }

  const ranked = (Object.keys(rules) as PersonalisationArea[])
    .map((area) => {
      const rule = rules[area];
      return { area, score: rule.amounts[auditAnswers[rule.index]] ?? 0 };
    })
    // Don't ask about small/absent categories merely to fill a questionnaire.
    .filter((candidate) => candidate.score >= 250)
    .sort((a, b) => b.score - a.score);

  const selected = ranked.slice(0, 2);

  // A third section is justified only when it is a genuinely strong signal.
  if (ranked[2]?.score >= 850) {
    selected.push(ranked[2]);
  }

  return selected.map((item) => item.area);
}

/** Sample responses exist only to let us inspect the unconnected preview. */
export const previewProfiles: Record<
  string,
  { label: string; answers: string[] }
> = {
  "subscriptions-insurance": {
    label: "Subscriptions + insurance",
    answers: [
      "Never",
      "6–10",
      "Over 2 years ago",
      "Rarely",
      "Within 6 months",
      "Within 6 months",
      "Rarely",
      "Lower my bills",
    ],
  },
  "takeaway-convenience": {
    label: "Takeaway + convenience purchases",
    answers: [
      "Almost daily",
      "0–2",
      "Within 6 months",
      "Daily",
      "Within 6 months",
      "Within 6 months",
      "Rarely",
      "Save more money",
    ],
  },
  "household-bills": {
    label: "Internet + energy bills",
    answers: [
      "Never",
      "0–2",
      "Within 6 months",
      "Rarely",
      "Over a year ago",
      "Over a year ago",
      "Rarely",
      "Lower my bills",
    ],
  },
  "few-opportunities": {
    label: "Few obvious opportunities",
    answers: [
      "Never",
      "0–2",
      "Within 6 months",
      "Rarely",
      "Within 6 months",
      "Within 6 months",
      "Rarely",
      "Feel more financially in control",
    ],
  },
};
