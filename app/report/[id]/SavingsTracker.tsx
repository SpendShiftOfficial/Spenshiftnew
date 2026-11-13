"use client";

import { useEffect, useState } from "react";
import { checkedDifference } from "@/lib/savings-math";
import styles from "./simple-report.module.css";

export type TrackerOption = { key: string; title: string };
type Entry = {
  id: string;
  key: string;
  label: string;
  before: number;
  after: number;
  fees: number;
  period: "week" | "month" | "year";
  date: string;
};

const money = (n: number) => "$" + Math.abs(n).toLocaleString("en-AU", { maximumFractionDigits: 2 });

function todayHere(): string {
  const now = new Date();
  const two = (n: number) => String(n).padStart(2, "0");
  return now.getFullYear() + "-" + two(now.getMonth() + 1) + "-" + two(now.getDate());
}

export default function SavingsTracker({
  reportId,
  options,
}: {
  reportId: string;
  options: TrackerOption[];
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editId, setEditId] = useState("");
  const [itemKey, setItemKey] = useState(options[0]?.key || "");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [fees, setFees] = useState("0");
  const [period, setPeriod] = useState<Entry["period"]>("month");
  const [date, setDate] = useState("");
  const [localToday, setLocalToday] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");

  const storageKey = "spendshift_checked_results_v2_" + reportId;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) {
        setEntries(saved.filter((entry): entry is Entry =>
          entry && typeof entry.id === "string" &&
          (options.some(option => option.key === entry.key) ||
            (typeof entry.label === "string" && entry.label.length < 120)) &&
          ["week", "month", "year"].includes(entry.period) &&
          typeof entry.date === "string" &&
          [entry.before, entry.after, entry.fees].every(n =>
            typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100000
          )
        ).slice(0, 50));
      }
    } catch {
      setMessage("Your saved results could not be opened on this device.");
    }
    setLoaded(true);
    setLocalToday(todayHere());
  }, [storageKey, options.length]);

  function store(next: Entry[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setEntries(next);
      setMessage("Saved on this device.");
      return true;
    } catch {
      setMessage("This browser cannot save the result. Write the figures down.");
      return false;
    }
  }

  function startEdit(entry: Entry) {
    setEditId(entry.id);
    setItemKey(entry.key);
    setBefore(String(entry.before));
    setAfter(String(entry.after));
    setFees(String(entry.fees));
    setPeriod(entry.period);
    setDate(entry.date);
    setConfirmed(false);
  }

  function clearForm() {
    setEditId("");
    setBefore("");
    setAfter("");
    setFees("0");
    setPeriod("month");
    setDate("");
    setConfirmed(false);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed || !date || before === "" || after === "") {
      setMessage("Add both costs, the date, and confirm you checked the same period.");
      return;
    }
    const next: Entry = {
      id: editId || crypto.randomUUID(),
      key: itemKey,
      label: options.find(option => option.key === itemKey)?.title || "Bill",
      before: Number(before),
      after: Number(after),
      fees: Number(fees || "0"),
      period,
      date,
    };
    try {
      checkedDifference(next.before, next.after, next.fees);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please check your amounts.");
      return;
    }
    if (next.date > todayHere()) {
      setMessage("Please use today's date or an earlier date.");
      return;
    }
    if (!options.some(option => option.key === next.key)) {
      setMessage("Please choose a bill or spending area.");
      return;
    }
    const nextEntries = editId
      ? entries.map(entry => entry.id === editId ? next : entry)
      : [next, ...entries].slice(0, 50);
    if (store(nextEntries)) clearForm();
  }

  return (
    <section className={styles.lastCard}>
      <h2>Track money you've actually saved (optional)</h2>
      <p><strong>This is for later.</strong> After you cancel a subscription, switch a bill or spend less on something, come back and compare what you paid before and after. We'll work out the difference using your figures.</p>
      <p className={styles.trackerExample}>Example: If you cancel a $20-a-month subscription, your cost goes from $20 to $0 a month. That's $20 less a month, once the charge really stops.</p>
      {loaded && entries.length===0 && <p className={styles.checkNote}>Nothing recorded yet? That's normal. You can skip this section until you've made a change.</p>}
      {loaded && entries.map(entry => {
        const difference = checkedDifference(entry.before, entry.after, entry.fees);
        return (
          <article className={styles.resultRow} key={entry.id}>
            <strong>{entry.label || options.find(item => item.key === entry.key)?.title || "Bill"}</strong>
            <p>{difference === 0 ? "You recorded no change in cost" : "You recorded " + money(difference) + (difference > 0 ? " less" : " more")} for this {entry.period}, after fees, on {entry.date}.</p>
            {options.some(option => option.key === entry.key) &&
              <button type="button" onClick={() => startEdit(entry)}>Edit</button>}
            {!options.some(option => option.key === entry.key) &&
              <small>From an earlier version of your plan</small>}
            <button type="button" onClick={() => store(entries.filter(item => item.id !== entry.id))}>Remove</button>
          </article>
        );
      })}
      {options.length > 0 && (
        <details className={styles.helpDetails} open={Boolean(editId) || undefined}>
          <summary>{editId ? "Edit a saved cost change" : "I've made a change — compare my costs"}</summary>
          <form className={styles.trackerForm} onSubmit={submit}>
            <label>
              Which bill or spending area?
              <select value={itemKey} onChange={e => setItemKey(e.target.value)}>
                {options.map(item => <option key={item.key} value={item.key}>{item.title}</option>)}
              </select>
            </label>
            <label>
              Both amounts cover the same time period
              <select value={period} onChange={e => setPeriod(e.target.value as Entry["period"])}>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </label>
            <label>
              What you paid before ($)
              <input type="number" min="0" max="100000" step="0.01" required
                value={before} onChange={e => setBefore(e.target.value)} />
            </label>
            <label>
              What you paid after ($)
              <input type="number" min="0" max="100000" step="0.01" required
                value={after} onChange={e => setAfter(e.target.value)} />
            </label>
            <label>
              Extra costs for that same week, month or year ($)
              <input type="number" min="0" max="100000" step="0.01" required
                value={fees} onChange={e => setFees(e.target.value)} />
               <small>Use the same time period for all amounts. For a one-off switching fee, choose Year and compare the full-year costs.</small>
            </label>
            <label>
              Date you checked
              <input type="date" required max={localToday || undefined} value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <label className={styles.confirmRow}>
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
              I compared the same service, people and time period. I did not count this change elsewhere.
            </label>
            <button type="submit" className={styles.copyButton} disabled={!confirmed}>
              {editId ? "Save changes" : "Save this result"}
            </button>
            {editId && <button type="button" className={styles.copyButton} onClick={clearForm}>Cancel edit</button>}
          </form>
        </details>
      )}
      <p className={styles.checkNote}>
        Your entries are saved only in this browser, not on other devices. We keep weekly, monthly and yearly changes separate so they aren't added together by mistake.
      </p>
      <p role="status" aria-live="polite">{message}</p>
    </section>
  );
}
