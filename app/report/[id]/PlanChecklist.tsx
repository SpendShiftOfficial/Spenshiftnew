"use client";

import { useEffect, useState } from "react";
import styles from "./simple-report.module.css";

export default function PlanChecklist({
  reportId,
  items,
}: {
  reportId: string;
  items: string[];
}) {
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false));
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("spendshift_plan_" + reportId) || "null");
      if (Array.isArray(saved) && saved.length === items.length) {
        setChecked(saved.map(Boolean));
      }
    } catch {
      // Progress is kept only in this browser; no financial details are stored.
    }
  }, [items.length, reportId]);

  function toggle(index: number) {
    setChecked(current => {
      const next = [...current];
      next[index] = !next[index];
      try {
        localStorage.setItem("spendshift_plan_" + reportId, JSON.stringify(next));
      } catch {
        // Checklist still works if local storage isn't available.
      }
      return next;
    });
  }

  return (
    <div className={styles.checklist}>
      {items.map((item, index) => (
        <label className={styles.checkRow} key={index}>
          <input type="checkbox" checked={checked[index] || false} onChange={() => toggle(index)} />
          <span className={checked[index] ? styles.checked : ""}>{item}</span>
        </label>
      ))}
      <p className={styles.checkNote}>Your ticks are saved on this device.</p>
    </div>
  );
}
