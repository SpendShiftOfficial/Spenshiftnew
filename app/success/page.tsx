"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
  { title: "Reviewing your answers", text: "Looking at the relevant spending areas.", icon: BarChart3 },
  { title: "Checking the calculations", text: "Separating spending from potential savings.", icon: Sparkles },
  { title: "Building your action plan", text: "Preparing useful steps and scripts.", icon: FileText },
  { title: "Saving your report", text: "Preparing a private link for you.", icon: MessageSquareText },
];

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const generating = searchParams.get("generate") === "1";
  const [mode, setMode] = useState<"checking" | "choice" | "generating" | "error">("checking");
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const startedFor = useRef<string | null>(null);

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
    const key = sessionId + (generating ? ":generate" : ":choice");
    if (startedFor.current === key) return;
    startedFor.current = key;
    let cancelled = false;

    function recordPurchase() {
      const trackKey = "purchase_tracked_" + sessionId;
      if (localStorage.getItem(trackKey)) return;
      trackEvent("purchase", {
        transaction_id: sessionId, value: 39, currency: "AUD",
        items: [{ item_id: "spendshift_full_report", item_name: "SpendShift Full Savings Report", price: 39, quantity: 1 }],
      });
      trackTikTok("Purchase", {
        contents: [{ content_id: "spendshift_full_report", content_name: "SpendShift Full Savings Report", quantity: 1, price: 39 }],
        content_type: "product", value: 39, currency: "AUD",
      });
      trackMetaStandard("Purchase", { value: 39, currency: "AUD" });
      localStorage.setItem(trackKey, "1");
    }

    function openReadyReport(reportId: string) {
      if (cancelled) return;
      const trackKey = "paid_report_ready_tracked_" + sessionId;
      if (!localStorage.getItem(trackKey)) {
        trackEvent("paid_report_ready", { transaction_id: sessionId, report_id: reportId, value: 39, currency: "AUD" });
        localStorage.setItem(trackKey, "1");
      }
      router.replace("/report/" + encodeURIComponent(reportId));
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
          setMode("choice");
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
        if (!cancelled) throw new Error("Your report is still processing. Please check your email or retry later.");
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
          <p>Verifying your purchase securely.</p>
        </>
      )}
      {mode === "choice" && (
        <>
          <CheckCircle2 size={48} color="#059625" />
          <h1>Payment successful</h1>
          <p>Your full SpendShift report is unlocked. Choose how you would like to continue.</p>
          <div style={{ display: "grid", gap: 15, margin: "26px auto", maxWidth: 480 }}>
            <button
              type="button"
              className="btn"
              style={{ minHeight: 58, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              onClick={() => router.push("/personalise?session_id=" + encodeURIComponent(sessionId!))}
            >
              <Sparkles size={20} /> Make my report more accurate <ArrowRight size={18} />
            </button>
            <p style={{ margin: "-7px 0 5px", fontSize: 13 }}>Answer a few short, relevant questions. Completely optional.</p>
            <button
              type="button"
              className="btn btnSecondary"
              style={{ minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              onClick={() => router.replace("/success?session_id=" + encodeURIComponent(sessionId!) + "&generate=1")}
            >
              <FileText size={19} /> Generate my report now
            </button>
          </div>
          <p className="mini">Either choice includes your full $39 purchase. We do not charge you again.</p>
        </>
      )}
      {mode === "generating" && (
        <>
          <ShieldCheck size={42} color="#059625" />
          <h1>Preparing your savings report</h1>
          <p>We're checking your answers and making an action plan. This can take a little time.</p>
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
          <p className="mini">If you close this page, your payment is recorded. Your report link will be emailed when ready.</p>
        </>
      )}
      {mode === "error" && (
        <>
          <h1>We couldn't finish that step</h1>
          <p role="alert" style={{ color: "#8b2929" }}>{error}</p>
          <p>Your payment has not been charged again. Please retry using the same link.</p>
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
