/**
 * Ranking signals from the eight-question free audit.
 * 0 = no clear reason to ask more, 4 = worth checking first.
 * Scores are NEVER dollars or promises of savings.
 */
export type PersonalisationArea =
  | "energy"
  | "phone"
  | "subscriptions"
  | "takeaway"
  | "convenience"
  | "insurance"
  | "unplanned";

type Rule = { index: number; signals: Record<string, number> };

const rules: Record<PersonalisationArea, Rule> = {
  takeaway: { index: 0, signals: {
    "Never": 0, "1–2 times/week": 2, "3–5 times/week": 3, "Almost daily": 4,
  }},
  subscriptions: { index: 1, signals: {
    "0–2": 0, "3–5": 2, "6–10": 3, "10+": 4, "Not sure": 2,
  }},
  insurance: { index: 2, signals: {
    "I don’t currently have insurance": 0, "Within 6 months": 0,
    "6–12 months ago": 1, "1–2 years ago": 2,
    "Over 2 years ago": 3, "Never / not sure": 3,
  }},
  convenience: { index: 3, signals: {
    "Rarely": 0, "1–2 times/week": 2, "3–5 times/week": 3, "Daily": 4,
  }},
  phone: { index: 4, signals: {
    "Within 6 months": 0, "6-12 months ago": 1,
    "Over a year ago": 2, "I honestly don't know": 2,
    "I don’t pay either of these bills": 0,
    "I don't pay either of these bills": 0,
  }},
  energy: { index: 5, signals: {
    "Within 6 months": 0, "6-12 months ago": 1,
    "Over a year ago": 2, "I honestly don't know": 2,
    "I don’t pay these bills": 0,
    "I don't pay these bills": 0,
  }},
  unplanned: { index: 6, signals: {
    "Rarely": 0, "1–2 times/week": 2, "3–5 times/week": 3, "Almost daily": 4,
  }},
};

export const areaNames: Record<PersonalisationArea, string> = {
  subscriptions: "Subscriptions",
  insurance: "Insurance",
  takeaway: "Takeaway food",
  convenience: "Small everyday buys",
  phone: "Phone and internet",
  energy: "Power and gas",
  unplanned: "Unplanned shopping",
};

/** Score for deciding where to start. This is never a dollar value. */
export function auditPriorityScore(area: PersonalisationArea, auditAnswers: string[]): number {
  const rule = rules[area];
  return rule.signals[auditAnswers[rule.index]] ?? 0;
}

export function selectPersonalisationAreas(auditAnswers: string[]): PersonalisationArea[] {
  if (auditAnswers.length !== 8 ||
      auditAnswers.some(answer => typeof answer !== "string")) return [];

  const ranked = (Object.keys(rules) as PersonalisationArea[])
    .map(area => {
      const rule = rules[area];
      return { area, score: rule.signals[auditAnswers[rule.index]] ?? 0 };
    })
    .filter(x => x.score >= 2)
    .sort((a,b) => b.score - a.score);
  // An eight-answer audit can reveal seven genuine review areas.
  // Do not arbitrarily discard the fourth, fifth or later concern.
  return ranked.map(item => item.area);
}

export function reasonForArea(area: PersonalisationArea, answers: string[]): string {
  switch (area) {
    case "subscriptions":
      return answers[1] === "Not sure" ? "You're not sure how many you pay for." : "You pay for " + answers[1] + " subscriptions.";
    case "insurance":
      return answers[2] === "Never / not sure"
        ? "You're not sure when you last checked your insurance."
        : "You last checked your insurance " + answers[2].toLowerCase() + ".";
    case "takeaway": return "You buy takeaway " + answers[0].toLowerCase() + ".";
    case "convenience": return "You buy coffee, snacks or quick lunches " + answers[3].toLowerCase() + ".";
    case "phone": return answers[4]==="I honestly don't know"?"You're not sure when you last checked your phone or internet price.":"You last checked your phone or internet price " + answers[4].toLowerCase() + ".";
    case "energy": return answers[5]==="I honestly don't know"?"You're not sure when you last checked your power or gas price.":"You last checked your power or gas price " + answers[5].toLowerCase() + ".";
    case "unplanned": return "You make unplanned buys " + answers[6].toLowerCase() + ".";
  }
}

/** Fictional customer profiles for the private preview only. */
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
  "all-seven": {
    label: "All 7 areas flagged",
    answers: [
      "Almost daily",
      "10+",
      "Never / not sure",
      "Daily",
      "I honestly don't know",
      "I honestly don't know",
      "Almost daily",
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
