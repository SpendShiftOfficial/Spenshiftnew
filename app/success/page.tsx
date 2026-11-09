"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { trackEvent } from "@/lib/gtag";
import { trackTikTok } from "@/lib/tiktok";
import { trackMetaStandard } from "@/lib/meta";
import {
  ArrowRight, BarChart3, CheckCircle2, FileText, LoaderCircle,
  MessageSquareText, ShieldCheck, Sparkles,
} from "lucide-react";

const steps = [
  { title: "Payment confirmed", text: "Your purchase has been verified.", icon: ShieldCheck },
  { title: "Checking your answers", text: "Finding the best places to start.", icon: BarChart3 },
  { title: "Checking your costs", text: "Making sure we do not guess your savings.", icon: Sparkles },
  { title: "Making your plan", text: "Writing clear steps you can follow.", icon: FileText },
  { title: "Saving your plan", text: "Making your private link.", icon: MessageSquareText },
];

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const generating = searchParams.get("generate") === "1";
  const [mode, setMode] = useState<"checking" | "generating" | "error">("checking");
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "generating") return;
    const interval = setInterval(() => setActiveStep(prev => Math.min(prev + 1, steps.length - 1)), 7000);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    if (!sessionId) {
      setMode("error");
      setError("The payment link is missing. Please use the link from your SpendShift confirmation email.");
      return;
    }
    let cancelled = false;

    // Private payment and report pages deliberately send no analytics.
    function recordPurchase() {}
    function openReadyReport(reportId: string) {
      if (cancelled) return;
      // This private payment token is held only in this browser session.
      // It is not sent to analytics or included in the report HTML.
      try {
        sessionStorage.setItem("spendshift_edit_session_" + reportId, sessionId!);
      } catch {}
      window.location.replace("/report/" + encodeURIComponent(reportId));
    }

    async function checkAndProceed() {
      try {
        setMode("checking");
        setError("");
        const statusRes = await fetch("/api/payment-status?session_id=" + encodeURIComponent(sessionId!), { cache: "no-store" });
        const status = await statusRes.json();
        if (!statusRes.ok || !status.paid) throw new Error(status.error || "Payment could not be verified.");
        if (cancelled) return;
        recordPurchase();
        if (typeof status.reportId === "string" && status.reportId) {
          openReadyReport(status.reportId);
          return;
        }
        if (!generating) {
          // Personalisation is part of the paid plan, not an extra upsell.
          // Each question still offers Skip or Not sure.
          router.replace("/personalise?session_id=" + encodeURIComponent(sessionId!));
          return;
        }
        setActiveStep(0);
        setMode("generating");
        const createRes = await fetch("/api/create-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const created = await createRes.json();
        if (!createRes.ok) throw new Error(created.error || "Could not generate your report.");
        if (typeof created.reportId === "string") {
          openReadyReport(created.reportId);
          return;
        }
        // Another tab or scheduled worker may already be generating this report.
        // Wait for the server to finish; don't make another costly model request.
        for (let attempt = 0; attempt < 75 && !cancelled; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 4000));
          const poll = await fetch("/api/payment-status?session_id=" + encodeURIComponent(sessionId!), { cache: "no-store" });
          const current = await poll.json();
          if (!poll.ok) throw new Error("Report status could not be checked.");
          if (current.status === "ready" && typeof current.reportId === "string") {
            openReadyReport(current.reportId);
            return;
          }
          if (current.status === "failed") throw new Error("Report generation was interrupted. Please retry.");
        }
        if (!cancelled) throw new Error("Your plan is still being made. Keep your purchase link and open it again. Do not pay again.");
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
        setMode("error");
      }
    }
    checkAndProceed();
    return () => { cancelled = true; };
  }, [sessionId, generating, router]);

  return (
    <main className="analysisCard" style={{ maxWidth: 700, margin: "50px auto", padding: "30px 22px" }}>
      {mode === "checking" && (
        <>
          <LoaderCircle size={36} className="spin" color="#059625" />
          <h1>Checking your payment</h1>
          <p>Making sure your payment went through.</p>
        </>
      )}
      {mode === "generating" && (
        <>
          <ShieldCheck size={42} color="#059625" />
          <h1>Making your savings plan</h1>
          <p>We're using your answers to make clear next steps.</p>
          <div className="reportLoader"><span /></div>
          <div className="reportSteps" aria-live="polite">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className={"reportStep " + (index < activeStep ? "done" : index === activeStep ? "active" : "")}>
                  <div className="reportStepIcon">
                    {index < activeStep ? <CheckCircle2 size={20} fill="#059625" stroke="white" /> :
                      index === activeStep ? <LoaderCircle size={20} className="spin" color="#059625" /> :
                        <Icon size={20} />}
                  </div>
                  <div><b>{step.title}</b><p>{step.text}</p></div>
                </div>
              );
            })}
          </div>
          <p className="mini">Keep this page open if you can. Your payment is saved if you need to come back.</p>
        </>
      )}
      {mode === "error" && (
        <>
          <h1>We couldn't make your plan</h1>
          <p role="alert" style={{ color: "#8b2929" }}>{error}</p>
          <p>We have not charged you again. Try the same link.</p>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Try again
          </button>
          <p className="mini">If this continues, contact info@spendshift.com.au with your purchase email.</p>
        </>
      )}
    </main>
  );
}

export default function SuccessPage() {
  return (
    <div className="auditPage">
      <Header simple />
      <Suspense fallback={<p style={{ textAlign: "center", padding: 40 }}>Loading your payment session...</p>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
