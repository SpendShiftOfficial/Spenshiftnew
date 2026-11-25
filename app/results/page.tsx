"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import { trackEvent } from "@/lib/gtag";
import { trackTikTok } from "@/lib/tiktok";
import { trackMeta, trackMetaStandard } from "@/lib/meta";
import { areaNames, reasonForArea, type PersonalisationArea } from "@/lib/personalisation-questions";
import { analyseSavings } from "@/lib/savings-engine";
import { emptyRefinements } from "@/lib/report-refinements";
import styles from "./results.module.css";
import {useBasicMetricScope} from "@/components/BasicAnalytics";
import {TERMS_VERSION,PLAN_PRICE_CENTS,validateAuditAnswers} from "@/lib/audit-schema";

const firstChecks:Record<PersonalisationArea,string>={
 takeaway:"Check how much your takeaway and restaurant meals cost in a normal week.",
 subscriptions:"Open your bank app and look for regular app, streaming and membership charges.",
 insurance:"Find one policy's renewal date and the cost of keeping the same cover.",
 convenience:"Add up a week's coffee, snack and small-treat purchases, excluding meals.",
 phone:"Find your latest phone or internet bill and check its monthly price.",
 energy:"Find your latest power bill and see what you pay for the electricity you use.",
 unplanned:"Write down your next unplanned purchase and wait one day before deciding.",
};
type PreviewExample={story:string;costs:{label:string;value:string}[];outcome:string;note:string};
const previewExamples:Record<PersonalisationArea,PreviewExample>={
 subscriptions:{
  story:"Example: two streaming services are no longer used.",
  costs:[{label:"Stan",value:"$20/month"},{label:"Netflix",value:"$15/month"},{label:"Total unused charges",value:"$35/month"}],
  outcome:"Possible $420 less in one year",
  note:"Only if both are cancelled, not replaced and stop billing for 12 months.",
 },
 takeaway:{
  story:"Example: swap two takeaway orders for home meals each week.",
  costs:[{label:"Two takeaway meals",value:"$60/week"},{label:"Two home meals",value:"$20/week"}],
  outcome:"Possible $40 less each week",
  note:"For the same people, with all extra costs included. Not saved yet.",
 },
 insurance:{
  story:"Example: compare a car policy with an illustrative quote.",
  costs:[{label:"Current policy",value:"$1,500/year"},{label:"Example new quote",value:"$1,300/year"}],
  outcome:"Possible $200 first-year price difference",
  note:"Not a live quote. Check the same cover, claim costs and fees.",
 },
 phone:{
  story:"Example: compare a mobile plan with an illustrative alternative.",
  costs:[{label:"Current mobile plan",value:"$70/month"},{label:"Example new plan",value:"$55/month"}],
  outcome:"Possible $180 difference in one year",
  note:"Not live prices. Check data, coverage, fees and the full-year cost.",
 },
 energy:{
  story:"Example: compare yearly power costs for the same usage.",
  costs:[{label:"Current yearly electricity cost",value:"$2,000"},{label:"Example yearly quote",value:"$1,800"}],
  outcome:"Possible $200 first-year price difference",
  note:"Not live prices. Assumes the same usage and all charges.",
 },
 convenience:{
  story:"Example: set a lower weekly limit for coffee and snacks.",
  costs:[{label:"Current small buys",value:"$50/week"},{label:"New weekly goal",value:"$35/week"}],
  outcome:"Possible $15 less each week",
  note:"A goal, not money saved yet. Meals aren't included.",
 },
 unplanned:{
  story:"Example: skip an unplanned $60 purchase.",
  costs:[{label:"Unplanned item",value:"$60"},{label:"If they skip it",value:"$0 spent"}],
  outcome:"Possible $60 not spent once",
  note:"Only if it's not bought or replaced. One-off, not yearly.",
 },
};
export default function Results() {
  const metric=useBasicMetricScope();
  const offerRef=useRef<HTMLElement|null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const checkoutAttempt=useRef({answers:"",id:""});
  const [loaded, setLoaded] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [additionalArea, setAdditionalArea] = useState<PersonalisationArea | "">("");
  const [showExtraArea, setShowExtraArea] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("spendshift_answers") || sessionStorage.getItem("spendshift_answers") || "null");
      if (Array.isArray(stored) && stored.length === 8 &&
          stored.every(answer => typeof answer === "string")) {
        setAnswers(stored);
      }
    } catch {
      // Never invent answers when the browser has none.
    }
    setLoaded(true);
    try { if (!sessionStorage.getItem("free_results_view_tracked")) {
      trackEvent("free_results_view", { source: "free_results" });
      trackTikTok("free_results_view");
      trackMeta("free_results_view");
      sessionStorage.setItem("free_results_view_tracked", "1");
    } } catch {}
  }, []);

  const areas = useMemo(() =>
    analyseSavings(answers, emptyRefinements()).opportunities.map(item=>item.area),
    [answers]
  );

  const validForMetrics=useMemo(()=>{if(!loaded)return false;try{validateAuditAnswers(answers);return true;}catch{return false;}},[loaded,answers]);
  useEffect(()=>{
    if(!loaded||!metric.ready)return;
    const observe=()=>{if(validForMetrics)metric.record("results_view");else metric.record("safe_ui_error",{error:"results_unavailable"});};
    observe();document.addEventListener("visibilitychange",observe);return()=>document.removeEventListener("visibilitychange",observe);
  },[loaded,validForMetrics,metric.ready,metric.revision,metric.record]);
  useEffect(()=>{
    if(!validForMetrics||!metric.ready||!offerRef.current||typeof IntersectionObserver==="undefined")return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))metric.record("upgrade_offer_view");});
    observer.observe(offerRef.current);return()=>observer.disconnect();
  },[validForMetrics,metric.ready,metric.revision,metric.record,areas.length,additionalArea]);
  const previewArea: PersonalisationArea = areas[0] || additionalArea || "subscriptions";
  const shownAreas = areas.length ? areas : additionalArea ? [additionalArea] : [];
  const extraAreaChoice = (
    <div className={styles.extraChoice}>
      <label htmlFor="optional-extra-area">Want to check an area we didn't find? (optional)</label>
      <select id="optional-extra-area" value={additionalArea}
        onChange={event => setAdditionalArea(event.target.value as PersonalisationArea | "")}>
        <option value="">No extra area</option>
        {Object.entries(areaNames).filter(([key]) => !areas.includes(key as PersonalisationArea))
          .map(([key, title]) => <option key={key} value={key}>{title}</option>)}
      </select>
      <p>Choose an area only if you want help checking it. This is not proof you're overpaying.</p>
    </div>
  );

  async function checkout() {
    if (busy || !acceptedTerms || (areas.length === 0 && !additionalArea)) return;
    if(validForMetrics)metric.record("upgrade_cta_click");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, additionalArea: additionalArea || null, acceptedTerms, termsVersion: TERMS_VERSION, checkoutRequestId: (()=>{const fingerprint=JSON.stringify({answers,additionalArea});if(checkoutAttempt.current.answers!==fingerprint||!checkoutAttempt.current.id)checkoutAttempt.current={answers:fingerprint,id:crypto.randomUUID()};return checkoutAttempt.current.id;})() }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string" ||
          !data.url.startsWith("https://checkout.stripe.com/")) {
        throw new Error(data.error || "We couldn't open checkout. Please try again.");
      }
      if(validForMetrics)metric.record("checkout_opened");
      trackEvent("begin_checkout", {
        currency: "AUD", value: PLAN_PRICE_CENTS / 100,
        items: [{ item_id: "spendshift_full_report", item_name: "SpendShift Full Savings Report", price: PLAN_PRICE_CENTS / 100, quantity: 1 }],
      });
      trackTikTok("InitiateCheckout", {
        contents: [{ content_id: "spendshift_full_report", content_name: "SpendShift Full Savings Report", quantity: 1, price: PLAN_PRICE_CENTS / 100 }],
        content_type: "product", value: PLAN_PRICE_CENTS / 100, currency: "AUD",
      });
      trackMetaStandard("InitiateCheckout", { value: PLAN_PRICE_CENTS / 100, currency: "AUD" });
      window.location.assign(data.url);
    } catch (err) {
      metric.record("safe_ui_error",{error:"checkout_open_failed"});
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <Header simple />
      <main className={styles.wrap}>
        {!loaded ? (
          <p className={styles.loading}>Getting your results…</p>
        ) : answers.length !== 8 ? (
          <section className={styles.empty}>
            <h1>Let's start with your free check.</h1>
            <p>Answer 8 short questions. No bank details needed.</p>
            <Link className={styles.primaryLink} href="/audit">Start my free check <ArrowRight size={18} /></Link>
          </section>
        ) : areas.length === 0 && !additionalArea ? (
          <section className={styles.empty}>
            <span className={styles.eyebrow}><CheckCircle2 size={17} /> YOUR FREE RESULTS</span>
            <h1>We didn't find a clear place to start.</h1>
            <p>Your answers didn't point to a big problem. We won't guess how much you could save.</p>
            <p><strong>We don't recommend paying based on these answers alone.</strong> If you already know one bill or spending habit you want to check, choose it below.</p>
            {extraAreaChoice}
            <Link className={styles.primaryLink} href="/audit">Check my answers again <ArrowRight size={18} /></Link>
          </section>
        ) : (
          <>
            <section className={styles.hero}>
              <span className={styles.eyebrow}><CheckCircle2 size={17} /> YOUR FREE RESULTS</span>
              <h1>{areas.length ? "We found " + areas.length + (areas.length === 1 ? " place" : " places") + " to check." : "You chose " + areaNames[previewArea] + " to check."}</h1>
              <p className={styles.subhead}>
                {areas.length ? "Your answers point to places worth reviewing. This doesn't prove you're overpaying, and we haven't checked prices for you." : "Your eight answers did not flag this as a concern, but you asked to check it. We cannot promise a saving."}
              </p>
              {answers[7]==="Save more money" && <p className={styles.freeGoalNote}>
                <strong>Your goal: Save more money.</strong> We put concrete opportunities, such as unused subscriptions, ahead of less certain checks where possible. Without bill amounts, we can't rank these by dollars saved.
              </p>}
              <div className={styles.planShortcut} aria-label="Optional paid savings plan">
                <div>
                  <strong>Want a plan for these checks?</strong>
                  <span>A$29 once · No subscription · Skip amounts you don't know</span>
                </div>
                <a href="#unlock-full-report" className={styles.planShortcutLink}>
                  See what's included <ArrowRight size={18} aria-hidden="true" />
                </a>
              </div>
            </section>

            <section className={styles.areas} aria-label="Places to check">
              <h2 className={styles.topLabel}>{shownAreas.length > 3 ? "Start with these three free checks" : "Your free checks"}</h2>
              {shownAreas.slice(0,3).map((area,index)=>(
                <article className={styles.areaCard} key={area}>
                  <span className={styles.index}>{index + 1}</span>
                  <div className={styles.areaCopy}>
                    <h2>{areaNames[area]}</h2>
                    <p>{areas.includes(area) ? reasonForArea(area, answers) : "You chose this area. We have not confirmed a problem."}</p>
                    <p className={styles.freeAction}><strong>First step:</strong> {area==="subscriptions"&&answers[1]==="Yes — at least one unused"
                        ? "Check the latest charge for the unused subscription and whether you still need it."
                        : firstChecks[area]}</p>
                  </div>
                  <CheckCircle2 className={styles.areaIcon} size={23} aria-hidden="true" />
                </article>
              ))}
              {areas.length>3&&(
                <div className={styles.otherAreas}>
                  <h2>Also worth checking</h2>
                  <ul>{areas.slice(3).map((area,index)=>(
                    <li key={area}><strong>{index+4}. {areaNames[area]}</strong><span>{reasonForArea(area, answers)}</span></li>
                  ))}</ul>
                  <p>Your paid plan will cover all {areas.length + (additionalArea ? 1 : 0)} areas. Detailed answers may change which ones come first.</p>
                </div>
              )}
              {areas.length === 0
                ? extraAreaChoice
                : areas.length < 7
                  ? showExtraArea
                    ? extraAreaChoice
                    : <button type="button" className={styles.extraToggle}
                        onClick={() => setShowExtraArea(true)}>Want to check another area?</button>
                  : null}
            </section>

            <section ref={offerRef} className={styles.purchase} id="unlock-full-report" aria-labelledby="paid-plan-title">
              <div className={styles.purchaseHeader}>
                <span className={styles.eyebrow}><ShieldCheck size={16} /> OPTIONAL PERSONALISED PLAN</span>
                <h2 id="paid-plan-title">Turn your checks into a plan you can use.</h2>
                <p>Your free results tell you <strong>where to look.</strong> Your paid plan helps you work out <strong>what to do next.</strong></p>
              </div>
              <div className={styles.benefits} aria-label="What your plan includes">
                <p><CheckCircle2 size={20} /><span><strong>Your top 3 actions</strong>, put in order using your answers.</span></p>
                <p><CheckCircle2 size={20} /><span><strong>Clear steps for each area</strong>, not just generic money-saving tips.</span></p>
                <p><CheckCircle2 size={20} /><span><strong>Help comparing costs</strong>, including questions to ask providers, where relevant.</span></p>
                <p><CheckCircle2 size={20} /><span><strong>A checklist and optional savings tracker</strong>. Return when you're ready to act.</span></p>
              </div>
              <div className={styles.price}>A$29 <span>once · no subscription</span></div>
              <div className={styles.afterPayment}>
                <strong>What happens after payment?</strong>
                <p>Answer a few more questions about these areas. Skip any amount you don't know. Then get your step-by-step plan and a link to return to it.</p>
              </div>
              <p className={styles.honesty}>We don't check live prices or promise savings. If you don't know a bill amount, we'll show you where to find it. We can only calculate possible reductions when you provide enough figures.</p>
              <label className={styles.terms}>
                <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                <span>I agree to the <Link href="/terms-and-conditions" target="_blank">Terms</Link>, <Link href="/privacy-policy" target="_blank">Privacy Policy</Link> and <Link href="/financial-information-ai-disclaimer" target="_blank">Financial Information & AI Disclaimer</Link>.</span>
              </label>
              <button className={styles.payButton} type="button" disabled={!acceptedTerms || busy} onClick={checkout}>
                <LockKeyhole size={18} /> {busy ? "Opening checkout…" : "Get my savings plan for A$29"} <ArrowRight size={19} />
              </button>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <p className={styles.checkoutTrust}><ShieldCheck size={16} aria-hidden="true" /> Payment handled by Stripe. No bank login needed.</p>
              <p className={styles.footnote}>One payment. No recurring charges. <Link href="/refund-policy" target="_blank">Read the refund policy</Link>.</p>
              <details className={styles.previewDetails} id="plan-example">
                <summary>See an example of a plan action <span>Example only. Not your estimate</span></summary>
                <div className={styles.miniPreview} aria-label="Example of a possible savings action">
                  <span className={styles.exampleLabel}>EXAMPLE ONLY. NOT YOUR ESTIMATE</span>
                  <h3>{areaNames[previewArea]}</h3>
                  <p>{previewExamples[previewArea].story}</p>
                  <dl className={styles.previewNumbers}>
                    {previewExamples[previewArea].costs.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
                  </dl>
                  <p className={styles.previewResult}>{previewExamples[previewArea].outcome}</p>
                  <p className={styles.previewCaution}>{previewExamples[previewArea].note}</p>
                  <small>In your paid plan: clear steps and useful links for your answers. No saving is guaranteed.</small>
                </div>
              </details>
            </section>

            <p className={styles.retake}>Want to change an answer? <Link href="/audit">Start again</Link></p>
          </>
        )}
      </main>
    </div>
  );
}
