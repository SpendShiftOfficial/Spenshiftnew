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
  const storageKey = "spendshift_plan_v2_" + reportId;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      // Report edits can change these tasks. Never show a new task as already done.
      if (saved && Array.isArray(saved.items) &&
          JSON.stringify(saved.items) === JSON.stringify(items) &&
          Array.isArray(saved.checked) && saved.checked.length === items.length) {
        setChecked(saved.checked.map(Boolean));
      } else {
        setChecked(items.map(() => false));
      }
    } catch {
      setChecked(items.map(() => false));
    }
  }, [storageKey, items]);

  function toggle(index: number) {
    setChecked(current => {
      const next = [...current];
      next[index] = !next[index];
      try {
        localStorage.setItem(storageKey, JSON.stringify({ items, checked: next }));
      } catch {
        // The checklist still works if storage is blocked.
      }
      return next;
    });
  }

  return (
    <div className={styles.checklist}>
      {items.map((item, index) => (
        <label className={styles.checkRow} key={index}>
          <input type="checkbox" checked={checked[index] || false}
            onChange={() => toggle(index)} />
          <span className={checked[index] ? styles.checked : ""}>{item}</span>
        </label>
      ))}
      <p className={styles.checkNote}>Your ticks are saved on this device. If your plan changes, the new tasks start unticked.</p>
    </div>
  );
}
