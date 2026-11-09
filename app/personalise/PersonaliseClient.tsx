"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Plus, Sparkles } from "lucide-react";
import styles from "./personalise.module.css";
import { trackEvent } from "@/lib/gtag";
import { previewProfiles, selectPersonalisationAreas, type PersonalisationArea } from "@/lib/personalisation-questions";

type SectionId = PersonalisationArea;
type DetailKey =
  | "state"
  | "electricityBill"
  | "electricityPeriod"
  | "gasMonthly"
  | "internetMonthly"
  | "mobileMonthly"
  | "subscriptionsMonthly"
  | "unusedSubscriptionMonthly"
  | "unusedSubscriptionChoice"
  | "unusedSubscriptionName"
  | "takeawayOrder"
  | "takeawayOrdersPerWeek"
  | "takeawaySwapPerWeek"
  | "takeawayReplacementCost"
  | "convenienceWeekly"
  | "convenienceGoalWeekly"
  | "unplannedArea"
  | "shoppingTrigger";

type Details = Record<DetailKey, string>;
const initialDetails: Details = {
  state: "",
  electricityBill: "",
  electricityPeriod: "quarter",
  gasMonthly: "",
  internetMonthly: "",
  mobileMonthly: "",
  subscriptionsMonthly: "",
  unusedSubscriptionMonthly: "",
  unusedSubscriptionChoice: "",
  unusedSubscriptionName: "",
  takeawayOrder: "",
  takeawayOrdersPerWeek: "",
  takeawaySwapPerWeek: "",
  takeawayReplacementCost: "",
  convenienceWeekly: "",
  convenienceGoalWeekly: "",
  unplannedArea: "",
  shoppingTrigger: "",
};

type InsurancePolicy = {
  id: number;
  type: string;
  premium: string;
  paymentPeriod: "month" | "year";
  insurer: string;
  coverDescription: string;
  renewal: "" | "soon" | "later" | "not_sure";
};

function initialInsurancePolicies(): InsurancePolicy[] {
  return [{ id: 1, type: "", premium: "", paymentPeriod: "year", insurer: "", coverDescription: "", renewal: "" }];
}

type Section = { id: SectionId; title: string; explanation: string };
const sections: Section[] = [
  {
    id: "energy",
    title: "Your power and gas bills",
    explanation: "Add your latest bills if you know them.",
  },
  {
    id: "phone",
    title: "Your phone and internet bills",
    explanation: "Only include bills you pay.",
  },
  {
    id: "subscriptions",
    title: "Your subscriptions",
    explanation: "You can use a rough monthly total.",
  },
  {
    id: "takeaway",
    title: "Your takeaway food",
    explanation: "Use your usual order for the whole group you feed.",
  },
  {
    id: "convenience",
    title: "Your small everyday buys",
    explanation: "Do not include takeaway food again.",
  },
  {
    id: "insurance",
    title: "Your insurance",
    explanation: "Add one policy or more. You can skip any box.",
  },
  {
    id: "unplanned",
    title: "Your unplanned shopping",
    explanation: "Tell us what you buy most often.",
  },
];

function MoneyField({
  id, label, value, onChange, hint,
}: {
  id: DetailKey;
  label: string;
  value: string;
  onChange: (key: DetailKey, value: string) => void;
  hint?: string;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.moneyInput}>
        <span aria-hidden="true">$</span>
        <input
          id={id}
          type="number"
          min="0"
          max="100000"
          step="0.01"
          inputMode="decimal"
          placeholder="Optional"
          value={value}
          onChange={(event) => onChange(id, event.target.value)}
        />
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function WholeNumberField({
  id, label, value, onChange, hint,
}: {
  id: DetailKey;
  label: string;
  value: string;
  onChange: (key: DetailKey, value: string) => void;
  hint?: string;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min="0"
        max="21"
        step="1"
        inputMode="numeric"
        placeholder="Not sure"
        value={value}
        onChange={event => onChange(id, event.target.value)}
      />
      {hint && <small>{hint}</small>}
    </div>
  );
}

export default function PersonaliseClient({ allowDemo, hasPaidSession }: { allowDemo: boolean; hasPaidSession: boolean }) {
  const router = useRouter();
  const [audit, setAudit] = useState<string[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(hasPaidSession);
  const [paymentError, setPaymentError] = useState("");
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [additionalArea, setAdditionalArea] = useState<SectionId | "">("");
  const [showAnotherArea, setShowAnotherArea] = useState(false);
  const [details, setDetails] = useState<Details>(initialDetails);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>(initialInsurancePolicies);
  const [step, setStep] = useState(0);
  const [demoKey, setDemoKey] = useState("subscriptions-insurance");

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    if (!qs.get("session_id") && !allowDemo) {
      setPaymentError("Please use the secure personalisation link from your completed checkout. This page is only for paid customers.");
      return;
    }
    const paidSession = qs.get("session_id");
    if (paidSession) {
      setCheckingPayment(true);
      setSessionId(paidSession);
      fetch("/api/payment-status?session_id=" + encodeURIComponent(paidSession), { cache: "no-store" })
        .then(async (res) => {
          const payload = await res.json();
          if (!res.ok || !payload.paid || !Array.isArray(payload.answers)) {
            throw new Error(payload.error || "This payment could not be verified.");
          }
          setAudit(payload.answers);
          if (typeof payload.reportId === "string") {
            setExistingReportId(payload.reportId);
            return;
          }
          if (payload.status === "processing") {
            router.replace("/success?session_id=" + encodeURIComponent(paidSession) + "&generate=1");
            return;
          }
          const saved = payload.refinements;
          if (saved && typeof saved === "object" && saved.version === 1) {
            const fromServer = saved.details || {};
            const restored = { ...initialDetails };
            (Object.keys(initialDetails) as DetailKey[]).forEach((key) => {
              const value = fromServer[key];
              if (typeof value === "number" && Number.isFinite(value)) restored[key] = String(value);
              else if (typeof value === "string") restored[key] = value;
            });
            setDetails(restored);
            if (typeof saved.additionalArea === "string") {
              setAdditionalArea(saved.additionalArea as SectionId);
            }
            if (Array.isArray(saved.insurancePolicies) && saved.insurancePolicies.length) {
              setInsurancePolicies(saved.insurancePolicies.slice(0, 6).map((p: Record<string, unknown>, index: number) => ({
                id: index + 1,
                type: typeof p.type === "string" ? p.type : "",
                premium: typeof p.premium === "number" ? String(p.premium) : "",
                paymentPeriod: p.paymentPeriod === "month" ? "month" : "year",
                insurer: typeof p.insurer === "string" ? p.insurer : "",
                coverDescription: typeof p.coverDescription === "string" ? p.coverDescription : "",
                renewal: p.renewal === "soon" || p.renewal === "later" || p.renewal === "not_sure" ? p.renewal : "",
              })));
            }
          }
        })
        .catch((error) => setPaymentError(error instanceof Error ? error.message : "Unable to verify payment."))
        .finally(() => setCheckingPayment(false));
      return;
    }
    try {
      const stored = localStorage.getItem("spendshift_answers");
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === 8 && parsed.every((answer) => typeof answer === "string")) {
        setAudit(parsed);
      }
    } catch {
      // For isolated preview tests, use sample eight-answer profiles.
    }
  }, [allowDemo, router]);


  // The actual audit takes priority. Example profiles are preview-only and
  // appear when this stand-alone URL has no earlier audit in localStorage.
  const activeAudit = audit ?? previewProfiles[demoKey].answers;
  const selectedByAudit = selectPersonalisationAreas(activeAudit);
  const visibleSections = useMemo(() => {
    const selected = selectPersonalisationAreas(activeAudit);
    if (additionalArea && !selected.includes(additionalArea)) selected.push(additionalArea);
    return selected
      .map((area) => sections.find((section) => section.id === area))
      .filter((section): section is Section => Boolean(section));
  }, [activeAudit, additionalArea]);
  const review = step >= visibleSections.length;
  const current = visibleSections[step];
  const progress = visibleSections.length === 0
    ? 100
    : Math.round((Math.min(step, visibleSections.length) / visibleSections.length) * 100);

  // Show a clear, short error before moving on. Never force a customer
  // to guess numbers just to finish their paid plan.
  const sectionError = (() => {
    if (review || !current) return "";
    const n = (key: DetailKey) => details[key] === "" ? null : Number(details[key]);
    if (current.id === "subscriptions" &&
      details.unusedSubscriptionChoice === "yes" &&
      n("unusedSubscriptionMonthly") !== null && n("subscriptionsMonthly") !== null &&
      n("unusedSubscriptionMonthly")! > n("subscriptionsMonthly")!) {
      return "One subscription cannot cost more than your full monthly total.";
    }
    if (current.id === "takeaway") {
      for (const key of ["takeawayOrdersPerWeek", "takeawaySwapPerWeek"] as DetailKey[]) {
        const raw = details[key];
        if (raw !== "" && (!Number.isInteger(Number(raw)) ||
            Number(raw) < 0 || Number(raw) > 21)) {
          return "Use a whole number from 0 to 21.";
        }
      }
      const weekly = n("takeawayOrdersPerWeek");
      const swaps = n("takeawaySwapPerWeek");
      if (weekly !== null && swaps !== null && swaps > weekly) {
        return "You cannot swap more orders than you buy.";
      }
    }
    if (current.id === "convenience" &&
      n("convenienceGoalWeekly") !== null && n("convenienceWeekly") !== null &&
      n("convenienceGoalWeekly")! > n("convenienceWeekly")!) {
      return "Your new weekly goal should be lower than what you spend now.";
    }
    return "";
  })();

  function update(key: DetailKey, value: string) {
    setDetails((previous) => ({ ...previous, [key]: value }));
  }

  function updateInsurancePolicy(id: number, patch: Partial<Omit<InsurancePolicy, "id">>) {
    setInsurancePolicies((previous) =>
      previous.map((policy) => policy.id === id ? { ...policy, ...patch } : policy),
    );
  }

  function addInsurancePolicy() {
    setInsurancePolicies((previous) => {
      if (previous.length >= 6) return previous;
      const nextId = Math.max(0, ...previous.map((policy) => policy.id)) + 1;
      return [...previous, { id: nextId, type: "", premium: "", paymentPeriod: "year", insurer: "", coverDescription: "", renewal: "" }];
    });
  }

  function removeInsurancePolicy(id: number) {
    setInsurancePolicies((previous) =>
      previous.length === 1
        ? initialInsurancePolicies()
        : previous.filter((policy) => policy.id !== id),
    );
  }

  // Skipping a section must also discard its answers if someone comes back.
  function skipSection() {
    const keysBySection: Record<SectionId, DetailKey[]> = {
      energy: ["state", "electricityBill", "gasMonthly"],
      phone: ["internetMonthly", "mobileMonthly"],
      subscriptions: ["subscriptionsMonthly", "unusedSubscriptionMonthly", "unusedSubscriptionChoice", "unusedSubscriptionName"],
      takeaway: ["takeawayOrder", "takeawayOrdersPerWeek", "takeawaySwapPerWeek", "takeawayReplacementCost"],
      convenience: ["convenienceWeekly", "convenienceGoalWeekly"],
      insurance: [],
      unplanned: ["unplannedArea", "shoppingTrigger"],
    };
    setDetails((previous) => {
      const next = { ...previous };
      for (const key of keysBySection[current.id]) next[key] = "";
      return next;
    });
    if (current.id === "insurance") setInsurancePolicies(initialInsurancePolicies());
    setStep((index) => Math.min(index + 1, visibleSections.length));
  }

  async function completeQuestionnaire() {
    if (!sessionId) {
      setStep(0);
      setDetails(initialDetails);
      setInsurancePolicies(initialInsurancePolicies());
      setAdditionalArea("");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/personalisation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          refinements: {
            version: 1,
            additionalArea: additionalArea || null,
            details,
            insurancePolicies: insurancePolicies
              .filter((p) => p.type || p.premium || p.insurer || p.coverDescription)
              .map(({ type, premium, paymentPeriod, insurer, coverDescription, renewal }) => ({
                type, premium, paymentPeriod, insurer, coverDescription, renewal,
              })),
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your answers.");
      trackEvent("personalisation_completed", {
        sections_presented: visibleSections.length,
        extra_area_selected: Boolean(additionalArea),
        insurance_policies: insurancePolicies.filter((policy) => policy.type || policy.premium || policy.insurer).length,
      });
      router.push("/success?session_id=" + encodeURIComponent(sessionId) + "&generate=1");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  const reviewRows = [
    { label: "State or territory", value: details.state },
    { label: "Electricity bill", value: details.electricityBill ? "$" + details.electricityBill + " per " + (details.electricityPeriod === "month" ? "month" : "quarter") : "" },
    { label: "Gas", value: details.gasMonthly ? "$" + details.gasMonthly + " per month" : "" },
    { label: "Internet", value: details.internetMonthly ? "$" + details.internetMonthly + " per month" : "" },
    { label: "Mobile", value: details.mobileMonthly ? "$" + details.mobileMonthly + " per month" : "" },
    { label: "Subscriptions", value: details.subscriptionsMonthly ? "$" + details.subscriptionsMonthly + " per month" : "" },
    { label: "Unused subscription?", value: details.unusedSubscriptionChoice === "yes" ? "Yes" : details.unusedSubscriptionChoice === "no" ? "No" : details.unusedSubscriptionChoice === "not_sure" ? "Not sure" : "" },
    { label: "Unused service", value: details.unusedSubscriptionChoice === "yes" ? details.unusedSubscriptionName : "" },
    { label: "Unused service price", value: details.unusedSubscriptionChoice === "yes" && details.unusedSubscriptionMonthly ? "$" + details.unusedSubscriptionMonthly + " per month" : "" },
    { label: "Usual takeaway order", value: details.takeawayOrder ? "$" + details.takeawayOrder : "" },
    { label: "Orders each week", value: details.takeawayOrdersPerWeek },
    { label: "Orders to swap each week", value: details.takeawaySwapPerWeek },
    { label: "Cost to feed same people at home", value: details.takeawayReplacementCost ? "$" + details.takeawayReplacementCost : "" },
    { label: "Small buys now", value: details.convenienceWeekly ? "$" + details.convenienceWeekly + " per week" : "" },
    { label: "Small buys goal", value: details.convenienceGoalWeekly ? "$" + details.convenienceGoalWeekly + " per week" : "" },
    ...insurancePolicies
      .filter((policy) => policy.type !== "" || policy.premium !== "" || policy.insurer !== "" || policy.coverDescription !== "")
      .map((policy, index) => ({
        label: "Insurance " + (index + 1) + " — " + (policy.type || "Type not provided") + (policy.insurer ? " (" + policy.insurer + ")" : ""),
        value: policy.premium !== ""
          ? "$" + Number(policy.premium).toLocaleString("en-AU", { maximumFractionDigits: 2 }) + " per " + (policy.paymentPeriod === "month" ? "month" : "year")
          : "Premium not provided",
      })),
    { label: "Unplanned purchase category", value: details.unplannedArea },
    { label: "What makes you shop", value: details.shoppingTrigger },
  ].filter((item) => item.value !== "");

  if (checkingPayment) {
    return (
      <div className={styles.page}>
        <Header simple />
        <main className={styles.wrap}>
          <h1>Checking your payment</h1>
          <p className={styles.intro}>Confirming your paid report access securely.</p>
        </main>
      </div>
    );
  }

  if (paymentError) {
    return (
      <div className={styles.page}>
        <Header simple />
        <main className={styles.wrap}>
          <h1>Open your purchase link</h1>
          <p className={styles.intro} role="alert">{paymentError}</p>
          <p>If you've paid, use the link in your SpendShift confirmation email or contact info@spendshift.com.au.</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header simple />
      <main className={styles.wrap}>
        <div className={styles.eyebrow}><Sparkles size={17} /> {sessionId ? "Your report" : "Phase 1 preview"}</div>
        <h1>Make your plan fit you.</h1>
        <p className={styles.intro}>
          {visibleSections.length === 0
            ? "No extra questions needed."
            : "Let's check " + visibleSections.length + " spending " + (visibleSections.length === 1 ? "area" : "areas") + ". You can skip anything you don't know."}
        </p>
        {!sessionId && (
          <div className={styles.previewNotice}>
            This is a development preview. Your answers are not saved or sent to the report generator yet.
          </div>
        )}
        {checkingPayment && <div className={styles.previewNotice}>Checking your payment...</div>}
        {paymentError && <div className={styles.previewNotice} role="alert">{paymentError} Use your original payment confirmation link to continue.</div>}
        {existingReportId && (
          <div className={styles.previewNotice}>
            Your report is already ready. <a href={"/report/" + existingReportId}>Open your report</a>.
          </div>
        )}
        {sessionId && !checkingPayment && !paymentError && !existingReportId && (
          <p className={styles.selectionNote}>You can skip any amount you don't know. We won't make up numbers.</p>
        )}
        {!sessionId && !audit && allowDemo && (
          <div className={styles.demoPanel}>
            <label htmlFor="demoProfile">Try another example customer's eight audit answers</label>
            <select
              id="demoProfile"
              value={demoKey}
              onChange={(event) => {
                setDemoKey(event.target.value);
                setDetails(initialDetails);
                setInsurancePolicies(initialInsurancePolicies());
                setAdditionalArea("");
                setStep(0);
              }}
            >
              {Object.entries(previewProfiles).map(([key, profile]) => (
                <option key={key} value={key}>{profile.label}</option>
              ))}
            </select>
            <small>No original audit was found on this preview website, so you're viewing sample customers. A paid customer won't see this selector.</small>
          </div>
        )}
        <div className={styles.progressTop}>
          <strong>{review ? "Review your details" : "Question " + (step + 1) + " of " + visibleSections.length}</strong>
          <span>{progress}%</span>
        </div>
        <div className={styles.track} role="progressbar" aria-label="Personalisation progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: progress + "%" }} />
        </div>

        <section className={styles.panel}>
          {review ? (
            <>
              <div className={styles.check}><CheckCircle2 size={26} /></div>
              <h2>{visibleSections.length ? "Your answers" : "You're ready"}</h2>
              <p className={styles.help}>{visibleSections.length ? "Check these details before we make your plan." : "We can use your first eight answers."}</p>
              {reviewRows.length ? (
                <dl className={styles.reviewRows}>
                  {reviewRows.map((item) => (
                    <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
                  ))}
                </dl>
              ) : (
                <p className={styles.empty}>No extra details. That's okay.</p>
              )}
              <div className={styles.reviewExtra}>
                {selectedByAudit.length < sections.length && !additionalArea && !showAnotherArea && (
                  <button className={styles.extraLink} type="button" onClick={() => setShowAnotherArea(true)}>
                    Want to check another bill?
                  </button>
                )}
                {showAnotherArea && !additionalArea && (
                  <div className={styles.addArea}>
                    <label htmlFor="additionalArea">Pick one more thing to check</label>
                    <select id="additionalArea" value="" onChange={event => {
                      const chosen = event.target.value as SectionId | "";
                      if (!chosen) return;
                      setAdditionalArea(chosen);
                      setShowAnotherArea(false);
                      setStep(visibleSections.length);
                    }}>
                      <option value="">Choose a bill or spending area</option>
                      {sections.filter(section => !selectedByAudit.includes(section.id)).map(section => (
                        <option key={section.id} value={section.id}>{section.title}</option>
                      ))}
                    </select>
                    <button className={styles.extraLink} type="button" onClick={() => setShowAnotherArea(false)}>Never mind</button>
                  </div>
                )}
                {additionalArea && (
                  <button className={styles.extraLink} type="button" onClick={() => {
                    setAdditionalArea("");
                    setStep(selectedByAudit.length);
                  }}>
                    Remove extra area
                  </button>
                )}
              </div>
              <div className={styles.actions}>
                {visibleSections.length > 0 && (
                  <button className={styles.secondary} type="button" onClick={() => setStep(Math.max(0, visibleSections.length - 1))}>
                    <ArrowLeft size={18} /> Edit answers
                  </button>
                )}
                <button
                  className={styles.primary}
                  type="button"
                  disabled={submitting || checkingPayment || !!paymentError || !!existingReportId}
                  onClick={completeQuestionnaire}
                >
                  {submitting ? "Making your plan…" : sessionId ? "Make my plan" : "Start again"}
                  <ArrowRight size={18} />
                </button>
              </div>
              {submitError && <p role="alert" className={styles.submitError}>{submitError}</p>}
            </>
          ) : (
            <>
              <h2>{current.title}</h2>
              <p className={styles.help}>{current.explanation}</p>
              <div className={styles.fields}>
                {current.id === "energy" && (
                  <>
                    <div className={styles.field}>
                      <label htmlFor="state">State or territory</label>
                      <select id="state" value={details.state} onChange={(e) => update("state", e.target.value)}>
                        <option value="">Prefer not to say / not sure</option>
                        {["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"].map((state) =>
                          <option key={state} value={state}>{state}</option>
                        )}
                      </select>
                    </div>
                    <MoneyField id="electricityBill" label="Approximate electricity bill" value={details.electricityBill} onChange={update} />
                    <div className={styles.field}>
                      <label htmlFor="electricityPeriod">Electricity bill covers</label>
                      <select id="electricityPeriod" value={details.electricityPeriod} onChange={(e) => update("electricityPeriod", e.target.value)}>
                        <option value="quarter">Three months</option>
                        <option value="month">One month</option>
                      </select>
                    </div>
                    <MoneyField id="gasMonthly" label="Gas bill per month, if applicable" value={details.gasMonthly} onChange={update} />
                  </>
                )}
                {current.id === "phone" && (
                  <>
                    <MoneyField id="internetMonthly" label="Home internet per month" value={details.internetMonthly} onChange={update} />
                    <MoneyField id="mobileMonthly" label="Mobile plan per month" value={details.mobileMonthly} onChange={update} hint="Only include your own plan." />
                  </>
                )}
                {current.id === "subscriptions" && (
                  <>
                    <MoneyField id="subscriptionsMonthly" label="How much do all your subscriptions cost each month?" value={details.subscriptionsMonthly} onChange={update} hint="Add up apps, streaming and memberships." />
                    <div className={styles.field}>
                      <label htmlFor="unusedSubscriptionChoice">Do you pay for a subscription you no longer use?</label>
                      <select id="unusedSubscriptionChoice" value={details.unusedSubscriptionChoice} onChange={event => {
                        const answer = event.target.value;
                        setDetails(previous => ({
                          ...previous,
                          unusedSubscriptionChoice: answer,
                          unusedSubscriptionMonthly: answer === "yes" ? previous.unusedSubscriptionMonthly : "",
                          unusedSubscriptionName: answer === "yes" ? previous.unusedSubscriptionName : "",
                        }));
                      }}>
                        <option value="">Choose an answer</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="not_sure">Not sure</option>
                      </select>
                    </div>
                    {details.unusedSubscriptionChoice === "yes" && (
                      <>
                        <div className={styles.field}>
                          <label htmlFor="unusedSubscriptionName">Which subscription? (optional)</label>
                          <input id="unusedSubscriptionName" type="text" maxLength={60}
                            placeholder="For example, an app"
                            value={details.unusedSubscriptionName}
                            onChange={e => update("unusedSubscriptionName", e.target.value)} />
                        </div>
                        <MoneyField id="unusedSubscriptionMonthly"
                          label="How much does that one cost each month?"
                          value={details.unusedSubscriptionMonthly} onChange={update}
                          hint="If you don't know, leave this blank." />
                      </>
                    )}
                    {details.unusedSubscriptionChoice === "not_sure" && (
                      <p className={styles.policyHint}>That's okay. Your plan will show you how to find out.</p>
                    )}
                  </>
                )}
                {current.id === "takeaway" && (
                  <>
                    <MoneyField id="takeawayOrder" label="How much is one usual takeaway order?" value={details.takeawayOrder} onChange={update} hint="Include the whole order, not just one person's meal." />
                    <WholeNumberField id="takeawayOrdersPerWeek" label="How many orders do you buy in a week?" value={details.takeawayOrdersPerWeek} onChange={update} hint="Use a normal week. Not sure? Skip." />
                    <WholeNumberField id="takeawaySwapPerWeek" label="How many could you replace with food from home?" value={details.takeawaySwapPerWeek} onChange={update} hint="Pick a number you could keep doing each week." />
                    <MoneyField id="takeawayReplacementCost" label="What would food from home cost instead?" value={details.takeawayReplacementCost} onChange={update} hint="Cost to feed the SAME people. Include all food costs." />
                  </>
                )}
                {current.id === "convenience" && (
                  <>
                    <MoneyField id="convenienceWeekly" label="How much do you spend on coffee, snacks and quick buys each week?" value={details.convenienceWeekly} onChange={update} hint="Do not add takeaway or unplanned shopping twice." />
                    <MoneyField id="convenienceGoalWeekly" label="What weekly amount could you aim for?" value={details.convenienceGoalWeekly} onChange={update} hint="This is a goal, not money you have saved yet. You can skip it." />
                  </>
                )}
                {current.id === "insurance" && (
                  <div className={styles.insuranceList}>
                    {insurancePolicies.map((policy, index) => (
                      <div className={styles.policyCard} key={policy.id}>
                        <div className={styles.policyHeader}>
                          <strong>Policy {index + 1}</strong>
                          {insurancePolicies.length > 1 && (
                            <button
                              type="button"
                              className={styles.removePolicy}
                              onClick={() => removeInsurancePolicy(policy.id)}
                              aria-label={"Remove insurance policy " + (index + 1)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className={styles.field}>
                          <label htmlFor={"insuranceType-" + policy.id}>Insurance type</label>
                          <select
                            id={"insuranceType-" + policy.id}
                            value={policy.type}
                            onChange={(event) => updateInsurancePolicy(policy.id, { type: event.target.value })}
                          >
                            <option value="">Not sure / prefer not to say</option>
                            <option>Car</option>
                            <option>Home or contents</option>
                            <option>Health</option>
                            <option>Life or income protection</option>
                            <option>Pet</option>
                            <option>Travel</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label htmlFor={"insurancePremium-" + policy.id}>Approximate premium (optional)</label>
                          <div className={styles.moneyInput}>
                            <span aria-hidden="true">$</span>
                            <input
                              id={"insurancePremium-" + policy.id}
                              type="number"
                              min="0"
                              max="100000"
                              step="0.01"
                              inputMode="decimal"
                              placeholder="Optional"
                              value={policy.premium}
                              onChange={(event) => updateInsurancePolicy(policy.id, { premium: event.target.value })}
                            />
                          </div>
                        </div>
                        <details className={styles.optionalDetails}>
                          <summary>Add insurer and cover details (optional)</summary>
                          <div className={styles.optionalInner}>
                        <div className={styles.field}>
                          <label htmlFor={"insurer-" + policy.id}>Insurance company (optional)</label>
                          <input
                            id={"insurer-" + policy.id}
                            type="text"
                            maxLength={80}
                            placeholder="e.g. your insurer's name"
                            value={policy.insurer}
                            onChange={(event) => updateInsurancePolicy(policy.id, { insurer: event.target.value })}
                          />
                        </div>
                        <div className={styles.field}>
                          <label htmlFor={"coverage-" + policy.id}>Type of cover (optional)</label>
                          <input
                            id={"coverage-" + policy.id}
                            type="text"
                            maxLength={120}
                            placeholder="e.g. comprehensive / third party"
                            value={policy.coverDescription}
                            onChange={(event) => updateInsurancePolicy(policy.id, { coverDescription: event.target.value })}
                          />
                          <small>Only a short coverage description. No policy numbers or personal details.</small>
                        </div>
                          </div>
                        </details>
                        <div className={styles.field}>
                          <label htmlFor={"renewal-" + policy.id}>When will this insurance renew? (optional)</label>
                          <select id={"renewal-" + policy.id} value={policy.renewal}
                            onChange={event => updateInsurancePolicy(policy.id, {renewal: event.target.value as InsurancePolicy["renewal"]})}>
                            <option value="">Skip</option>
                            <option value="soon">In the next 3 months</option>
                            <option value="later">Later than 3 months</option>
                            <option value="not_sure">Not sure</option>
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label htmlFor={"insurancePeriod-" + policy.id}>How often do you pay?</label>
                          <select
                            id={"insurancePeriod-" + policy.id}
                            value={policy.paymentPeriod}
                            onChange={(event) => updateInsurancePolicy(policy.id, { paymentPeriod: event.target.value === "month" ? "month" : "year" })}
                          >
                            <option value="year">Yearly</option>
                            <option value="month">Monthly</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {insurancePolicies.length < 6 && (
                      <button
                        className={styles.addPolicy}
                        type="button"
                        onClick={addInsurancePolicy}
                      >
                        <Plus size={18} /> Add another insurance policy
                      </button>
                    )}
                    <p className={styles.policyHint}>
                      Add only policies you want to check. Do not enter policy numbers or passwords.
                    </p>
                  </div>
                )}
                {current.id === "unplanned" && (
                  <div className={styles.field}>
                    <label htmlFor="unplannedArea">Which purchases are most likely to be unplanned?</label>
                    <select id="unplannedArea" value={details.unplannedArea} onChange={(event) => update("unplannedArea", event.target.value)}>
                      <option value="">Not sure / skip</option>
                      <option>Online shopping</option>
                      <option>Clothes or accessories</option>
                      <option>Entertainment or hobbies</option>
                      <option>Other purchases</option>
                    </select>
                    <small>We won't count shopping already listed as takeaway or snacks.</small>
                    <div className={styles.field}>
                      <label htmlFor="shoppingTrigger">What makes you want to buy something?</label>
                      <select id="shoppingTrigger" value={details.shoppingTrigger}
                        onChange={event => update("shoppingTrigger", event.target.value)}>
                        <option value="">Not sure / skip</option>
                        <option>Sales or deals</option>
                        <option>Boredom</option>
                        <option>Social media</option>
                        <option>Other</option>
                        <option>Not sure</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.actions}>
                {step > 0 ? (
                  <button className={styles.secondary} type="button" onClick={() => setStep((index) => index - 1)}>
                    <ArrowLeft size={18} /> Back
                  </button>
                ) : <span />}
                <button className={styles.primary} type="button" disabled={Boolean(sectionError)}
                  onClick={() => setStep((index) => Math.min(index + 1, visibleSections.length))}>
                  {step === visibleSections.length - 1 ? "Check my answers" : "Next"} <ArrowRight size={18} />
                </button>
              </div>
              {sectionError && <p className={styles.submitError} role="alert">{sectionError}</p>}
              <button className={styles.skip} type="button" onClick={skipSection}>
                Skip this question
              </button>
            </>
          )}
        </section>
        <p className={styles.footnote}><LockKeyhole size={15} /> No bank login or policy numbers needed. {sessionId ? "You can skip any question." : "This is a test page."}</p>
      </main>
    </div>
  );
}
