"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import { trackEvent } from "@/lib/gtag";
import { trackTikTok } from "@/lib/tiktok";
import { trackMeta, trackMetaStandard } from "@/lib/meta";
import { areaNames, reasonForArea, selectPersonalisationAreas } from "@/lib/personalisation-questions";
import styles from "./results.module.css";
import {TERMS_VERSION} from "@/lib/audit-schema";

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

  const areas = useMemo(() => selectPersonalisationAreas(answers), [answers]);

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
              <details className={styles.samplePlan}>
                <summary>See an example of what your plan looks like</summary>
                <div className={styles.sampleInside}>
                  <span className={styles.exampleLabel}>EXAMPLE ONLY — NOT YOUR ESTIMATE</span>
                  <h3>Takeaway food</h3>
                  <p>A customer pays $30 per order. They replace 2 orders a week with meals costing $10 each for the same people.</p>
                  <p className={styles.sampleSaving}><strong>$40 less each week</strong> if they follow that plan.</p>
                  <ol>
                    <li>Choose two nights for food at home.</li>
                    <li>Get the food in one shop.</li>
                    <li>Compare what both meals really cost.</li>
                  </ol>
                  <small>Your report will use your answers. We won't promise any saving before checking the numbers.</small>
                </div>
              </details>
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
              <p className={styles.footnote}>One payment. Next, answer a few questions about your bills and spending. Skip any amount you do not know.</p>
            </section>

            <p className={styles.retake}>Want to change an answer? <Link href="/audit">Start again</Link></p>
          </>
        )}
      </main>
    </div>
  );
}
