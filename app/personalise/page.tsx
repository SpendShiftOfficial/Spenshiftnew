"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Plus, Sparkles } from "lucide-react";
import styles from "./personalise.module.css";
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
  | "takeawayOrder"
  | "convenienceWeekly"
  | "unplannedArea";

type Details = Record<DetailKey, string>;
const initialDetails: Details = {
  state: "",
  electricityBill: "",
  electricityPeriod: "quarter",
  gasMonthly: "",
  internetMonthly: "",
  mobileMonthly: "",
  subscriptionsMonthly: "",
  takeawayOrder: "",
  convenienceWeekly: "",
  unplannedArea: "",
};

type InsurancePolicy = {
  id: number;
  type: string;
  premium: string;
  paymentPeriod: "month" | "year";
  insurer: string;
  coverDescription: string;
};

function initialInsurancePolicies(): InsurancePolicy[] {
  return [{ id: 1, type: "", premium: "", paymentPeriod: "year", insurer: "", coverDescription: "" }];
}

type Section = { id: SectionId; title: string; explanation: string };
const sections: Section[] = [
  {
    id: "energy",
    title: "Your electricity and gas bills",
    explanation: "Your state and approximate bills help us avoid guessing what you pay.",
  },
  {
    id: "phone",
    title: "Your internet and mobile plans",
    explanation: "Enter only bills you personally pay. Leave the others blank.",
  },
  {
    id: "subscriptions",
    title: "Your subscriptions",
    explanation: "A rough monthly total is more useful than guessing what each service costs.",
  },
  {
    id: "takeaway",
    title: "Your takeaway and delivery",
    explanation: "Use your typical order price, rather than your most expensive one.",
  },
  {
    id: "convenience",
    title: "Your small convenience purchases",
    explanation: "Think coffees, snacks and quick lunches. Don't include takeaway orders again.",
  },
  {
    id: "insurance",
    title: "Your insurance",
    explanation: "Tell us about the insurance policies you would like to review. Add another only if it applies to you. Never enter a policy or account number.",
  },
  {
    id: "unplanned",
    title: "Your unplanned purchases",
    explanation: "What kinds of things do you tend to buy without planning? You don't need to guess an amount or count spending twice.",
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

export default function PersonalisePage() {
  const router = useRouter();
  const [audit, setAudit] = useState<string[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [additionalArea, setAdditionalArea] = useState<SectionId | "">("");
  const [details, setDetails] = useState<Details>(initialDetails);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>(initialInsurancePolicies);
  const [step, setStep] = useState(0);
  const [demoKey, setDemoKey] = useState("subscriptions-insurance");

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
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
          if (typeof payload.reportId === "string") setExistingReportId(payload.reportId);
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
  }, []);


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
      return [...previous, { id: nextId, type: "", premium: "", paymentPeriod: "year", insurer: "", coverDescription: "" }];
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
      subscriptions: ["subscriptionsMonthly"],
      takeaway: ["takeawayOrder"],
      convenience: ["convenienceWeekly"],
      insurance: [],
      unplanned: ["unplannedArea"],
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
              .map(({ type, premium, paymentPeriod, insurer, coverDescription }) => ({
                type, premium, paymentPeriod, insurer, coverDescription,
              })),
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your answers.");
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
    { label: "Average takeaway order", value: details.takeawayOrder ? "$" + details.takeawayOrder : "" },
    { label: "Convenience purchases", value: details.convenienceWeekly ? "$" + details.convenienceWeekly + " per week" : "" },
    ...insurancePolicies
      .filter((policy) => policy.type !== "" || policy.premium !== "")
      .map((policy, index) => ({
        label: "Insurance " + (index + 1) + " — " + (policy.type || "Type not provided") + (policy.insurer ? " (" + policy.insurer + ")" : ""),
        value: policy.premium !== ""
          ? "$" + Number(policy.premium).toLocaleString("en-AU", { maximumFractionDigits: 2 }) + " per " + (policy.paymentPeriod === "month" ? "month" : "year")
          : "Premium not provided",
      })),
    { label: "Unplanned purchase category", value: details.unplannedArea },
  ].filter((item) => item.value !== "");

  return (
    <div className={styles.page}>
      <Header simple />
      <main className={styles.wrap}>
        <div className={styles.eyebrow}><Sparkles size={17} /> {sessionId ? "Your report" : "Phase 1 preview"}</div>
        <h1>Make your savings report more accurate.</h1>
        <p className={styles.intro}>
          A few optional details can make your recommendations more relevant.
          We never need bank access, policy numbers or account passwords.
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
          <p className={styles.selectionNote}>
            These details are optional. <a href={"/success?session_id=" + encodeURIComponent(sessionId) + "&generate=1"}>Generate my report now without extra questions</a>.
          </p>
        )}
        {!sessionId && !audit && (
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
        {!checkingPayment && !paymentError && !existingReportId && (
        <div className={styles.addArea}>
          <label htmlFor="additionalArea">Did we miss an important area? <span>(optional)</span></label>
          <select
            id="additionalArea"
            value={additionalArea}
            onChange={(event) => {
              setAdditionalArea(event.target.value as SectionId | "");
              setDetails(initialDetails);
              setInsurancePolicies(initialInsurancePolicies());
              setStep(0);
            }}
          >
            <option value="">No, these are the right priorities</option>
            {sections.filter((section) => !selectedByAudit.includes(section.id)).map((section) => (
              <option key={section.id} value={section.id}>{section.title.replace("Your ", "")}</option>
            ))}
          </select>
          <small>You can add one more category if there's something the short audit didn't capture.</small>
        </div>
        )}
        <p className={styles.selectionNote}>
          {visibleSections.length
            ? "Based on the eight audit answers, we've selected only the " + visibleSections.length + " area" + (visibleSections.length === 1 ? "" : "s") + " most worth checking. These are possibilities, not confirmed overpayments."
            : "These audit answers don't indicate a strong need for extra questions. We won't ask unnecessary ones."}
        </p>

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
              <h2>{visibleSections.length ? "Here's what you shared" : "No extra questions needed"}</h2>
              <p className={styles.help}>{visibleSections.length ? "Any blank answers will stay unknown. We won't make up missing figures." : "Your original eight answers are enough to continue. We won't ask about spending areas that don't look relevant."}</p>
              {reviewRows.length ? (
                <dl className={styles.reviewRows}>
                  {reviewRows.map((item) => (
                    <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
                  ))}
                </dl>
              ) : (
                <p className={styles.empty}>{visibleSections.length ? "You skipped the optional questions. That is fine — your original eight audit answers can still be used." : "No additional information is needed for this example."}</p>
              )}
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
                  {submitting ? "Saving your answers..." : sessionId ? "Generate my report" : "Start preview again"}
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
                  <MoneyField id="subscriptionsMonthly" label="All subscriptions combined per month" value={details.subscriptionsMonthly} onChange={update} hint="Streaming, apps, memberships and other recurring subscriptions." />
                )}
                {current.id === "takeaway" && (
                  <MoneyField id="takeawayOrder" label="Average amount you pay per takeaway order" value={details.takeawayOrder} onChange={update} hint="Only include what you personally pay." />
                )}
                {current.id === "convenience" && (
                  <MoneyField id="convenienceWeekly" label="Approximate convenience spending per week" value={details.convenienceWeekly} onChange={update} hint="Do not include takeaway or delivery costs a second time." />
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
                      Include only policies you want help reviewing, up to six.
                      Each amount is optional. Your premium is not automatically an overpayment.
                      Do not enter policy numbers or insurer login details.
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
                    <small>We won't add another guessed savings amount for spending already counted elsewhere.</small>
                  </div>
                )}
              </div>
              <div className={styles.actions}>
                {step > 0 ? (
                  <button className={styles.secondary} type="button" onClick={() => setStep((index) => index - 1)}>
                    <ArrowLeft size={18} /> Back
                  </button>
                ) : <span />}
                <button className={styles.primary} type="button" onClick={() => setStep((index) => Math.min(index + 1, visibleSections.length))}>
                  {step === visibleSections.length - 1 ? "Review answers" : "Next question"} <ArrowRight size={18} />
                </button>
              </div>
              <button className={styles.skip} type="button" onClick={skipSection}>
                Skip this question
              </button>
            </>
          )}
        </section>
        <p className={styles.footnote}><LockKeyhole size={15} /> All questions are optional. {sessionId ? "Your information is used only to prepare your paid report." : "This preview does not process a payment or generate a report."}</p>
      </main>
    </div>
  );
}
