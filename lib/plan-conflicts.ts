import type { PlanDraft } from "./plan-draft";
import type { PersonalisationArea } from "./personalisation-questions";
import { selectedDraftAreas } from "./plan-draft";

export type AuditConflict = { area: PersonalisationArea; message: string };

/**
 * Compare the broad free audit against more specific paid answers.
 * Leave uncertain / borderline frequency answers alone; flag hard contradictions.
 */
export function findAuditConflict(d: PlanDraft): AuditConflict | null {
  const areas = selectedDraftAreas(d);
  const { answers, details } = d;
  const weekly = details.takeawayOrdersPerWeek === ""
    ? null : Number(details.takeawayOrdersPerWeek);
  if (areas.includes("takeaway") && weekly !== null && Number.isFinite(weekly)) {
    const freeAnswer = answers[0];
    if ((freeAnswer === "Never" && weekly > 0) ||
        (freeAnswer !== "Never" && weekly === 0) ||
        (freeAnswer === "1–2 times/week" && weekly > 4) ||
        (freeAnswer === "Almost daily" && weekly < 3)) {
      return {
        area: "takeaway",
        message: "Your first takeaway answer and your weekly order count do not match. Check one of them before making your plan.",
      };
    }
  }
  if (areas.includes("insurance") && answers[2] === "I don’t currently have insurance" &&
      d.insurancePolicies.some(p => p.type || (p.premium !== "" && Number(p.premium) > 0))) {
    return {
      area: "insurance",
      message: "You first said you don't have insurance, but added an insurance policy. Please check your first answer.",
    };
  }
  if (areas.includes("phone") && answers[4].includes("don't pay either") &&
      ["both", "mobile", "internet"].includes(details.phoneService)) {
    return {
      area: "phone",
      message: "You first said you don't pay phone or internet bills. Please check your first answer.",
    };
  }
  if (areas.includes("energy") && answers[5].includes("don't pay these bills") &&
      ((details.electricityBill !== "" && Number(details.electricityBill) > 0) ||
        (details.hasGas === "yes" && details.gasMonthly !== "" && Number(details.gasMonthly) > 0))) {
    return {
      area: "energy",
      message: "You first said you don't pay power or gas bills. Please check your first answer.",
    };
  }
  return null;
}
