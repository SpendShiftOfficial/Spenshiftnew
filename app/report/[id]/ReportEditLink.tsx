"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./simple-report.module.css";

export default function ReportEditLink({
  reportId,
  revisionCount = 0,
}: {
  reportId: string;
  revisionCount?: number;
}) {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    try {
      const value = sessionStorage.getItem("spendshift_edit_session_" + reportId);
      if (value && /^cs_(test|live)_[A-Za-z0-9]{12,200}$/.test(value)) {
        setSessionId(value);
      }
    } catch {
      // The secure purchase email remains the alternate way to edit.
    }
  }, [reportId]);

  return (
    <div className={styles.revisionPanel}>
      <h2>Need to fix a number?</h2>
      <p>You can correct an answer and update this plan. You will not pay again.</p>
      {sessionId ? (
        <Link className={styles.revisionLink}
          href={"/personalise?session_id=" + encodeURIComponent(sessionId) + "&revise=1"}>
          Fix an answer in my plan
        </Link>
      ) : (
        <p>Open the private <strong>Fix an answer</strong> link in your SpendShift purchase email. If you cannot find it, contact support.</p>
      )}
      {revisionCount > 0 && (
        <p className={styles.checkNote}>You have updated this plan {revisionCount} {revisionCount === 1 ? "time" : "times"}. Earlier versions are kept securely.</p>
      )}
    </div>
  );
}
