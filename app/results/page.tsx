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
import {TERMS_VERSION} from "@/lib/audit-schema";

const firstChecks:Record<PersonalisationArea,string>={
 takeaway:"Check how much your takeaway and restaurant meals cost in a normal week.",
 subscriptions:"Open your bank app and look for regular app, streaming and membership charges.",
 insurance:"Find one policy's renewal date and the cost of keeping the same cover.",
 convenience:"Add up a week's coffee, snack and small-treat purchases, excluding meals.",
 phone:"Find your latest phone or internet bill and check its monthly price.",
 energy:"Find your latest power bill and see what you pay for the electricity you use.",
 unplanned:"Write down your next unplanned purchase and wait one day before deciding.",
};
type PreviewExample={story:string;costs:{label:string;value:string}[];outcome:string;note:string;steps:[string,string,string]};
const previewExamples:Record<PersonalisationArea,PreviewExample>={
 subscriptions:{
  story:"Example customer: they find two streaming services they no longer use.",
  costs:[{label:"Stan",value:"$20/month"},{label:"Netflix",value:"$15/month"},{label:"Total unused charges",value:"$35/month"}],
  outcome:"Possible $420 less in one year",
  note:"Only if both services are cancelled, no replacements are bought and the charges stop for 12 months.",
  steps:["Find both charges in bank transactions or receipts.","Open each account to cancel the unused service.","Check the next bank statement to see that both payments stopped."],
 },
 takeaway:{
  story:"Example customer: they replace two $30 takeaway orders each week with $10 home meals for the same people.",
  costs:[{label:"Two takeaway meals",value:"$60/week"},{label:"Two home meals",value:"$20/week"}],
  outcome:"Possible $40 less each week",
  note:"This example only includes those two takeaway meals, not restaurant visits. Extra shopping, travel or food costs may change the result.",
  steps:["Pick two usual takeaway nights to change.","Buy the food for two home meals and check the full price.","Check what both meals really cost before counting any saving."],
 },
 insurance:{
  story:"Example customer: their car insurance costs $1,500 a year. They find a sample quote for $1,300.",
  costs:[{label:"Current policy",value:"$1,500/year"},{label:"Example new quote",value:"$1,300/year"}],
  outcome:"Possible $200 first-year price difference",
  note:"Not a real quote. Compare the same cover, claim costs, exclusions, renewal terms and switching fees before changing.",
  steps:["Find your renewal notice and current cover.","Ask for two quotes based on the same protection.","Check the full first-year cost and what is excluded."],
 },
 phone:{
  story:"Example customer: they pay $70 a month for mobile and find a comparable $55 plan.",
  costs:[{label:"Current mobile plan",value:"$70/month"},{label:"Example new plan",value:"$55/month"}],
  outcome:"Possible $180 difference in one year",
  note:"Assumes the same coverage, data and service for 12 months, with no extra fees. Not live provider pricing.",
  steps:["Find your latest bill and note your data use.","Compare plans that meet the same needs.","Check any joining fees and when special prices end."],
 },
 energy:{
  story:"Example customer: a full year's electricity bills add up to $2,000. A comparable example plan costs $1,800.",
  costs:[{label:"Current yearly electricity cost",value:"$2,000"},{label:"Example yearly quote",value:"$1,800"}],
  outcome:"Possible $200 first-year price difference",
  note:"Assumes the same energy use and included supply charges. Actual bills change with usage and seasons.",
  steps:["Find a year's bills and look at your energy use.","Compare plans using that same use and location.","Check supply charges, discounts and other fees."],
 },
 convenience:{
  story:"Example customer: small buys cost $50 a week. They choose a realistic $35 weekly limit.",
  costs:[{label:"Current small buys",value:"$50/week"},{label:"New weekly goal",value:"$35/week"}],
  outcome:"Possible $15 less each week",
  note:"Only if they keep to the limit. It is a spending goal, not money already saved.",
  steps:["Look at last week's coffees and snacks, without meals.","Choose the small treats worth keeping.","Check actual spending after seven days."],
 },
 unplanned:{
  story:"Example customer: they almost buy a $60 item they had not planned for.",
  costs:[{label:"Unplanned item",value:"$60"},{label:"If they skip it",value:"$0 spent"}],
  outcome:"Possible $60 not spent once",
  note:"Only if they decide not to buy it and do not replace it with another purchase. There is no reliable yearly estimate.",
  steps:["Put the item on a list instead of checking out.","Wait a full day before deciding.","If you skip the purchase, record only what you actually kept."],
 },
};
export default function Results() {
  const [answers, setAnswers] = useState<string[]>([]);
  const checkoutAttempt=useRef({answers:"",id:""});
  const [loaded, setLoaded] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

  async function checkout() {
    if (busy || !acceptedTerms || areas.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, acceptedTerms, termsVersion: TERMS_VERSION, checkoutRequestId: (()=>{const fingerprint=JSON.stringify(answers);if(checkoutAttempt.current.answers!==fingerprint||!checkoutAttempt.current.id)checkoutAttempt.current={answers:fingerprint,id:crypto.randomUUID()};return checkoutAttempt.current.id;})() }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string" ||
          !data.url.startsWith("https://checkout.stripe.com/")) {
        throw new Error(data.error || "We couldn't open checkout. Please try again.");
      }
      trackEvent("begin_checkout", {
        currency: "AUD", value: 39,
        items: [{ item_id: "spendshift_full_report", item_name: "SpendShift Full Savings Report", price: 39, quantity: 1 }],
      });
      trackTikTok("InitiateCheckout", {
        contents: [{ content_id: "spendshift_full_report", content_name: "SpendShift Full Savings Report", quantity: 1, price: 39 }],
        content_type: "product", value: 39, currency: "AUD",
      });
      trackMetaStandard("InitiateCheckout", { value: 39, currency: "AUD" });
      await new Promise(resolve => setTimeout(resolve, 350));
      window.location.assign(data.url);
    } catch (err) {
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
        ) : areas.length === 0 ? (
          <section className={styles.empty}>
            <span className={styles.eyebrow}><CheckCircle2 size={17} /> YOUR FREE RESULTS</span>
            <h1>We didn't find a clear place to start.</h1>
            <p>Your answers didn't point to a big problem. We won't guess how much you could save.</p>
            <p><strong>We don't recommend buying a report based on these answers.</strong> You can check your answers again whenever you like.</p>
            <Link className={styles.primaryLink} href="/audit">Check my answers again <ArrowRight size={18} /></Link>
          </section>
        ) : (
          <>
            <section className={styles.hero}>
              <span className={styles.eyebrow}><CheckCircle2 size={17} /> YOUR FREE RESULTS</span>
              <h1>We found {areas.length} {areas.length === 1 ? "place" : "places"} to check.</h1>
              <p className={styles.subhead}>
                Your answers show where to start. These are checks, not proof you are overpaying. More details could change the order.
              </p>
            </section>

            <section className={styles.areas} aria-label="Places to check">
              {areas.length > 3 && <h2 className={styles.topLabel}>Start with these three checks</h2>}
              {areas.slice(0,3).map((area,index)=>(
                <article className={styles.areaCard} key={area}>
                  <span className={styles.index}>{index + 1}</span>
                  <div className={styles.areaCopy}>
                    <h2>{areaNames[area]}</h2>
                    <p>{reasonForArea(area, answers)}</p>
                    <p className={styles.freeAction}><strong>First step:</strong> {firstChecks[area]}</p>
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
                  <p>Your paid plan will cover all {areas.length} areas. Detailed answers may change which ones come first.</p>
                </div>
              )}
            </section>

            <section className={styles.purchase} id="unlock-full-report">
              <div className={styles.purchaseHeader}>
                <span className={styles.eyebrow}><ShieldCheck size={16} /> YOUR NEXT STEP</span>
                <h2>Get your simple savings plan.</h2>
                <p>We'll use your answers to show what to check first and how to do it.</p>
              </div>
              <div className={styles.benefits}>
                <p><CheckCircle2 size={20} /> Steps made for your answers</p>
                <p><CheckCircle2 size={20} /> Help checking bills and regular payments</p>
                <p><CheckCircle2 size={20} /> A short list to follow at your own pace</p>
              </div>
              <div className={styles.miniPreview} aria-label="Example of a possible savings action">
                <span className={styles.exampleLabel}>EXAMPLE ONLY — NOT YOUR ESTIMATE</span>
                <h3>{areaNames[areas[0]]}</h3>
                <p>{previewExamples[areas[0]].story}</p>
                <dl className={styles.previewNumbers}>
                  {previewExamples[areas[0]].costs.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
                </dl>
                <p className={styles.previewResult}>{previewExamples[areas[0]].outcome}</p>
                <p className={styles.previewCaution}>{previewExamples[areas[0]].note}</p>
                <strong className={styles.previewSubheading}>What the customer would do:</strong>
                <ol>{previewExamples[areas[0]].steps.map(step=><li key={step}>{step}</li>)}</ol>
                <small>Your paid plan will use your details and show relevant help links. No saving is guaranteed.</small>
              </div>
              <div className={styles.price}>A$39 <span>one-time payment</span></div>
              <p className={styles.honesty}>We don't compare live prices for you or promise a set amount of savings. Your plan will help you find out.</p>
              <label className={styles.terms}>
                <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                <span>I agree to the <Link href="/terms-and-conditions" target="_blank">Terms</Link>, <Link href="/privacy-policy" target="_blank">Privacy Policy</Link> and <Link href="/financial-information-ai-disclaimer" target="_blank">Financial Information & AI Disclaimer</Link>.</span>
              </label>
              <button className={styles.payButton} type="button" disabled={!acceptedTerms || busy} onClick={checkout}>
                <LockKeyhole size={18} /> {busy ? "Opening checkout…" : "Get my savings plan — A$39"} <ArrowRight size={19} />
              </button>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <p className={styles.footnote}>One payment. Next, you can add details for the areas we found. Skip any amount you do not know.</p>
            </section>

            <p className={styles.retake}>Want to change an answer? <Link href="/audit">Start again</Link></p>
          </>
        )}
      </main>
    </div>
  );
}
