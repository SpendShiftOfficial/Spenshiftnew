"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    async function createReport() {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setError("Missing payment session.");
        return;
      }

      const res = await fetch("/api/create-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (data.reportId) {
        router.push(`/report/${data.reportId}`);
      } else {
        setError(data.error || "Could not generate report.");
      }
    }

    createReport();
  }, [router, searchParams]);

  return (
    <div className="analysisCard">
      <h1>Payment successful 🎉</h1>
      <p>Generating your personalised SpendShift report...</p>

      <div className="reportLoader">
        <span />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="auditPage">
      <Header simple />

      <Suspense fallback={<p>Loading payment session...</p>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}