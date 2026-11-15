"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { checkedDifference, roundMoney } from "@/lib/savings-math";
import styles from "./simple-report.module.css";

export type TrackerOption = { key: string; title: string };
type Period = "week" | "month" | "year";
type Entry = {
  id: string;
  key: string;
  label: string;
  before: number;
  after: number;
  fees: number;
  period: Period;
  date: string;
  // Existing v2 entries described fees for the same recurring time period.
  // New entries distinguish one-off fees, so we never quietly change old totals.
  feeMode?: "upfront" | "per_period";
};

const factors: Record<Period, number> = { week: 52, month: 12, year: 1 };
const money = (n: number) =>
  "$" + Math.abs(n).toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const periodLabel: Record<Period, string> = { week: "week", month: "month", year: "year" };

function todayHere(): string {
  const now = new Date();
  const two = (n: number) => String(n).padStart(2, "0");
  return now.getFullYear() + "-" + two(now.getMonth() + 1) + "-" + two(now.getDate());
}

function validEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") return false;
  const e = value as Partial<Entry>;
  return typeof e.id === "string" && e.id.length <= 100 &&
    typeof e.key === "string" && e.key.length <= 160 &&
    typeof e.label === "string" && e.label.length <= 120 &&
    (e.period === "week" || e.period === "month" || e.period === "year") &&
    typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
    (e.feeMode === undefined || e.feeMode === "upfront" || e.feeMode === "per_period") &&
    [e.before, e.after, e.fees].every(n =>
      typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100000
    );
}

// An older record's "fees" were costs for every stated period.
// New records specify up-front fees, paid only once.
function oneOffDifference(e: Entry): number {
  return checkedDifference(e.before, e.after, e.fees);
}
function annualPace(e: Entry): number {
  // A single avoided unplanned purchase is not a repeatable yearly saving.
  if (e.key === "unplanned") return 0;
  return roundMoney(checkedDifference(e.before, e.after, e.feeMode === "upfront" ? 0 : e.fees) * factors[e.period]);
}
function firstYear(e: Entry): number {
  if (e.key === "unplanned") return 0;
  return roundMoney(annualPace(e) - (e.feeMode === "upfront" ? e.fees : 0));
}
function impact(n: number): string {
  if (n > 0) return money(n) + " less";
  if (n < 0) return money(n) + " more";
  return "No change";
}

export default function SavingsTracker({ reportId, options }: { reportId: string; options: TrackerOption[] }) {
  const storageKey = "spendshift_checked_results_v2_" + reportId;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [itemKey, setItemKey] = useState(options[0]?.key || "");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [fees, setFees] = useState("0");
  const [period, setPeriod] = useState<Period>("month");
  const [date, setDate] = useState("");
  const [localToday, setLocalToday] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setEntries(saved.filter(validEntry).slice(0, 50));
      else setMessage("We couldn't open earlier entries on this device.");
    } catch {
      setMessage("We couldn't open earlier entries on this device.");
    }
    setLoaded(true);
    setLocalToday(todayHere());
    setDate(current => current || todayHere());
  }, [storageKey]);

  useEffect(() => {
    if (formOpen && editId) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formOpen, editId]);

  function store(next: Entry[], notice: string): boolean {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setEntries(next);
      setMessage(notice);
      return true;
    } catch {
      setMessage("This browser couldn't save your changes. Please keep a separate copy of the figures.");
      return false;
    }
  }

  function resetForm() {
    setEditId("");
    setItemKey(options[0]?.key || "");
    setBefore("");
    setAfter("");
    setFees("0");
    setPeriod("month");
    setDate(todayHere());
    setConfirmed(false);
    setFormError("");
  }

  function startAdd() {
    resetForm();
    setFormOpen(true);
  }

  function startEdit(entry: Entry) {
    if (!options.some(option => option.key === entry.key)) return;
    setEditId(entry.id);
    setItemKey(entry.key);
    setBefore(String(entry.before));
    setAfter(String(entry.after));
    // Legacy per-period costs still display as the original period-specific fees.
    setFees(String(entry.fees));
    setPeriod(entry.period);
    setDate(entry.date);
    setConfirmed(false);
    setFormError("");
    setFormOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!confirmed || !date || before.trim() === "" || after.trim() === "") {
      setFormError("Add the costs and check the confirmation box before saving.");
      return;
    }
    if (!options.some(option => option.key === itemKey)) {
      setFormError("Choose one of the areas in your plan.");
      return;
    }
    if (entries.some(entry => entry.key === itemKey && entry.id !== editId)) {
      setFormError("You already track this area. Choose Edit on that result to update it, rather than counting it twice.");
      return;
    }
    const next: Entry = {
      id: editId || crypto.randomUUID(),
      key: itemKey,
      label: options.find(option => option.key === itemKey)?.title || "Spending area",
      before: Number(before),
      after: Number(after),
      fees: Number(fees || "0"),
      period: itemKey === "unplanned" ? "year" : period,
      date,
      feeMode: itemKey !== "unplanned" && editId && entries.find(entry => entry.id === editId)?.feeMode !== "upfront"
        ? "per_period" : "upfront",
    };
    if ([before, after, fees || "0"].some(n => n.trim() === "" || !/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(n))) {
      setFormError("Use valid dollar amounts with up to two decimal places.");
      return;
    }
    try {
      checkedDifference(next.before, next.after, next.fees);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Please check your amounts.");
      return;
    }
    if (next.date > todayHere() || !/^\d{4}-\d{2}-\d{2}$/.test(next.date)) {
      setFormError("Choose a valid date no later than today.");
      return;
    }
    const nextEntries = editId
      ? entries.map(entry => entry.id === editId ? next : entry)
      : [next, ...entries].slice(0, 50);
    if (store(nextEntries, "Saved on this device.")) {
      resetForm();
      setFormOpen(false);
    }
  }

  // Old entries sometimes contain repeat entries for the same area.
  // Keep them visible/editable, but count only the most recent one.
  const seen = new Set<string>();
  const current = entries.filter(entry => {
    if (seen.has(entry.key)) return false;
    seen.add(entry.key);
    return true;
  });
  const duplicateIds = new Set(entries.filter(entry => !current.includes(entry)).map(entry => entry.id));
  const recurring = current.filter(entry => entry.key !== "unplanned");
  const oneOff = current.filter(entry => entry.key === "unplanned");
  const annualTotal = roundMoney(recurring.reduce((sum, entry) => sum + annualPace(entry), 0));
  const firstYearTotal = roundMoney(recurring.reduce((sum, entry) => sum + firstYear(entry), 0));
  const monthlyTotal = roundMoney(annualTotal / 12);
  const oneOffTotal = roundMoney(oneOff.reduce((sum, entry) => sum + oneOffDifference(entry), 0));

  return (
    <section className={styles.trackerShell} aria-labelledby="savings-progress-title">
      <div className={styles.trackerHeading}>
        <span className={styles.trackerEyebrow}>OPTIONAL • YOUR PROGRESS</span>
        <h2 id="savings-progress-title">See what your changes are worth</h2>
        <p>Made a change since getting your plan? Come back and compare what you paid before and after. We'll show how much lower (or higher) your spending is.</p>
      </div>

      {loaded && current.length > 0 ? (
        <>
          {recurring.length > 0 && <div className={styles.trackerMetrics} aria-label="Your recorded spending changes">
            <div className={styles.trackerMetric}>
              <span>Ongoing change per month</span>
              <strong>{impact(monthlyTotal)}</strong>
              <small>From {recurring.length} ongoing {recurring.length === 1 ? "area" : "areas"} you recorded</small>
            </div>
            <div className={styles.trackerMetric}>
              <span>Possible effect over 12 months</span>
              <strong>{impact(firstYearTotal)}</strong>
              <small>After any fees you entered</small>
            </div>
          </div>}
          {oneOff.length > 0 && <div className={styles.trackerOneOff} aria-label="One-time spending change">
            <span>One-time spending change</span>
            <strong>{impact(oneOffTotal)}</strong>
            <small>From an unplanned purchase you chose not to make, or replaced more cheaply. Not projected into monthly or yearly totals.</small>
          </div>}
          <p className={styles.trackerExplanation}>
            These figures show a change in spending, not money already in your bank. The 12-month figure assumes ongoing costs stay the same. One-time choices are counted once. We have not checked your figures.
          </p>
        </>
      ) : (
        <p className={styles.trackerEmpty}>Nothing recorded yet? That's normal. This is for later. Come back after a bill drops or you genuinely spend less.</p>
      )}

      {loaded && options.length > 0 && (
        <>
          <button className={styles.trackerAction} type="button"
            aria-expanded={formOpen} aria-controls="savings-progress-form"
            onClick={() => {
              if (formOpen) { resetForm(); setFormOpen(false); }
              else startAdd();
            }}>
            {formOpen ? "Close tracker form" : current.length ? "Update my progress" : "Record my first change"}
            <span aria-hidden="true">{formOpen ? "−" : "+"}</span>
          </button>

          {formOpen && (
            <form id="savings-progress-form" ref={formRef} className={styles.trackerFormV2} onSubmit={submit}>
              <h3>{editId ? "Update this cost change" : "Record a real cost change"}</h3>
              <p>{itemKey === "unplanned"
                ? "For a one-time purchase you decided not to make, enter its price and what you actually spent instead (if anything). Don't count a wish or hypothetical purchase."
                : "Example: A subscription you cancelled went from $20 to $0 a month. Only add it when the charge has actually stopped."}</p>
              <label>
                Which part of your plan changed?
                <select value={itemKey} onChange={e => setItemKey(e.target.value)}>
                  {options.map(item => <option key={item.key} value={item.key}>{item.title}</option>)}
                </select>
              </label>
              {itemKey === "unplanned"
                ? <p className={styles.trackerFormHint}>One-time purchase. We'll record this once, not multiply it across weeks or months.</p>
                : <label>
                    How often are these costs paid?
                    <select value={period} onChange={e => setPeriod(e.target.value as Period)}>
                      <option value="month">Each month</option>
                      <option value="week">Each week</option>
                      <option value="year">Each year</option>
                    </select>
                  </label>}
              <div className={styles.trackerFormGrid}>
                <label>
                  {itemKey === "unplanned" ? "Price of the purchase ($)" : "Before ($)"}
                  <input type="number" min="0" max="100000" step="0.01" inputMode="decimal" required
                    value={before} onChange={e => setBefore(e.target.value)} placeholder="e.g. 70" />
                </label>
                <label>
                  {itemKey === "unplanned" ? "What you spent instead ($)" : "Now ($)"}
                  <input type="number" min="0" max="100000" step="0.01" inputMode="decimal" required
                    value={after} onChange={e => setAfter(e.target.value)} placeholder="e.g. 50" />
                </label>
              </div>
              {itemKey !== "unplanned" && <p className={styles.trackerFormHint}>Compare the same service or spending area over the same length of time. For power, compare similar usage as well.</p>}
              <label>
                {itemKey === "unplanned"
                  ? "Other one-off costs ($), if any"
                  : editId && entries.find(entry => entry.id === editId)?.feeMode !== "upfront"
                    ? "Extra costs in that same time period ($)"
                    : "One-off switching or cancellation fees ($), if any"}
                <input type="number" min="0" max="100000" step="0.01" inputMode="decimal"
                  value={fees} onChange={e => setFees(e.target.value)} />
              </label>
              <label>
                {itemKey === "unplanned" ? "Date you decided not to buy it" : "Date you checked your new cost"}
                <input type="date" max={localToday || undefined} value={date}
                  onChange={e => setDate(e.target.value)} required />
              </label>
              <label className={styles.trackerConfirmation}>
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
                <span>{itemKey === "unplanned"
                  ? "I really chose not to make this purchase, or bought something cheaper, and haven't counted it elsewhere."
                  : "I checked a real change, used the same time period, and haven't counted this spending elsewhere."}</span>
              </label>
              {formError && <p className={styles.trackerFormError} role="alert">{formError}</p>}
              <div className={styles.trackerFormActions}>
                <button type="submit" className={styles.trackerSave} disabled={!confirmed}>
                  {editId ? "Save updated result" : "Save my change"}
                </button>
                <button type="button" className={styles.trackerCancel} onClick={() => { resetForm(); setFormOpen(false); }}>Cancel</button>
              </div>
            </form>
          )}
        </>
      )}

      {loaded && entries.length > 0 && (
        <div className={styles.trackerHistory}>
          <h3>Your recorded changes</h3>
          <p>Keep one result per area. For recurring costs, edit the current total after another change. For one-time shopping choices, record only one specific decision.</p>
          {entries.map(entry => {
            const isDuplicate = duplicateIds.has(entry.id);
            const isOneOff = entry.key === "unplanned";
            const ongoing = roundMoney(annualPace(entry) / 12);
            const currentOption = options.find(option => option.key === entry.key);
            return (
              <article className={styles.trackerResult} key={entry.id}>
                <div className={styles.trackerResultTop}>
                  <strong>{currentOption?.title || entry.label || "Spending area"}</strong>
                  <span>{entry.date}</span>
                </div>
                <p>{isOneOff
                  ? "Planned purchase " + money(entry.before) + " → spent " + money(entry.after) + " once"
                  : "Before " + money(entry.before) + " → now " + money(entry.after) + " / " + periodLabel[entry.period]}</p>
                <strong className={styles.trackerResultAmount}>{isOneOff
                  ? impact(oneOffDifference(entry)) + " from this one-time choice"
                  : impact(ongoing) + " per month"}</strong>
                {entry.fees > 0 && <small>{money(entry.fees)} {isOneOff
                  ? "other one-time costs included once"
                  : entry.feeMode === "upfront" ? "one-off fee" : "extra cost per " + periodLabel[entry.period]} included in the comparison</small>}
                {isDuplicate && <p className={styles.trackerDuplicate}>Older record. Not included in the combined figures, to avoid counting this area twice.</p>}
                <div className={styles.trackerRowActions}>
                  {currentOption && <button type="button" onClick={() => startEdit(entry)}>Edit</button>}
                  <button type="button" onClick={() => {
                    if (store(entries.filter(item => item.id !== entry.id), "Removed on this device.")) {
                      if (editId === entry.id) { resetForm(); setFormOpen(false); }
                    }
                  }}>Remove</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className={styles.trackerPrivacy}>Saved only in this browser, not your SpendShift account. It won't sync to another device, and clearing browser data can erase it. Tracking is optional and does not change your report.</p>
      <p className={styles.trackerStatus} role="status" aria-live="polite">{message}</p>
    </section>
  );
}
