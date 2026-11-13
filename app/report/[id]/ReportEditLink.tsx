"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./simple-report.module.css";

/** A small correction route, not a second post-report action panel. */
export default function ReportEditLink({ reportId }: { reportId: string }) {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    try {
      const value = sessionStorage.getItem("spendshift_edit_session_" + reportId);
      if (value && /^cs_(test|live)_[A-Za-z0-9]{12,200}$/.test(value)) setSessionId(value);
    } catch {
      // Customers can use the secure correction link in their report email.
    }
  }, [reportId]);

  return (
    <p className={styles.reportCorrection}>
      {sessionId ? (
        <>Need to correct an answer? <Link href={"/personalise?session_id=" + encodeURIComponent(sessionId) + "&revise=1"}>Update my answers</Link> — no new payment.</>
      ) : (
        <>Need to correct an answer? Use the private edit link in your report email, or contact <a href="mailto:info@spendshift.com.au">SpendShift support</a>.</>
      )}
    </p>
  );
}
