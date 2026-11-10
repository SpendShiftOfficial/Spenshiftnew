"use client";

import { useState } from "react";
import { quoteDifference } from "@/lib/savings-math";
import styles from "./simple-report.module.css";

export type BillKind = "insurance" | "mobile" | "internet" | "electricity" | "gas";
type Props = {
  label: string;
  currentAnnual: number | null;
  kind: BillKind;
};

const notes: Record<BillKind, { confirm: string; check: string; next: string }> = {
  insurance: {
    confirm: "I checked the same cover, limits and what I pay for a claim.",
    check: "Check what is not covered, waiting times, and whether the policy still protects what matters.",
    next: "A lower quote may mean less cover. Don't cancel your current policy until suitable new cover is active.",
  },
  mobile: {
    confirm: "I checked data, network coverage, extra fees and the price after any deal ends.",
    check: "Check the amount of data you use and whether the network works where you live.",
    next: "Ask your current provider to match the new price before switching.",
  },
  internet: {
    confirm: "I checked the same speed, service, fees and price after any deal ends.",
    check: "Compare the speed you actually need, any modem charge and your total yearly price.",
    next: "Check connection and cancellation fees before changing providers.",
  },
  electricity: {
    confirm: "Both figures use my actual power use and include supply charges and fees.",
    check: "Check the supply charge, usage rate, discounts and whether the price is for your location.",
    next: "A quoted estimate can change with energy use. Check the plan details before switching.",
  },
  gas: {
    confirm: "Both figures use my actual gas use and include supply charges and fees.",
    check: "Check the gas usage rate, supply charge, discounts and any extra fees.",
    next: "A quoted estimate can change with usage. Check the plan details before switching.",
  },
};

const currency = (n: number) => "$" + Math.abs(n).toLocaleString("en-AU", { maximumFractionDigits: 2 });

export default function QuoteCheck({ label, currentAnnual, kind }: Props) {
  const [oldCost, setOldCost] = useState(currentAnnual === null ? "" : String(currentAnnual));
  const [quote, setQuote] = useState("");
  const [period, setPeriod] = useState<"month" | "year">("year");
  const [fees, setFees] = useState("0");
  const [matched, setMatched] = useState(false);
  const advice = notes[kind];

  let difference: number | null = null;
  if (oldCost !== "" && quote !== "" && matched) {
    try {
      difference = quoteDifference(Number(oldCost), Number(quote), period, Number(fees || 0));
    } catch {
      difference = null;
    }
  }

  return (
    <details className={styles.helpDetails}>
      <summary>Compare a price for {label.toLowerCase()}</summary>
      <div className={styles.trackerForm}>
        <p>Use a real quote you found. We have not checked any prices for you.</p>
        <label>
          Your current yearly cost ($)
          <input type="number" min="0" max="100000" step="0.01"
            value={oldCost} onChange={e => setOldCost(e.target.value)} />
        </label>
        {currentAnnual !== null && (
          <small>We filled this in from the bill you entered. Check that it covers a normal year.</small>
        )}
        <label>
          Price from the new quote ($)
          <input type="number" min="0" max="100000" step="0.01"
            value={quote} onChange={e => setQuote(e.target.value)} />
        </label>
        <label>
          The new quote is for
          <select value={period} onChange={e => setPeriod(e.target.value as "month" | "year")}>
            <option value="year">One year</option>
            <option value="month">One month</option>
          </select>
        </label>
        <label>
          Extra first-year fees not in the quote ($)
          <input type="number" min="0" max="100000" step="0.01"
            value={fees} onChange={e => setFees(e.target.value)} />
        </label>
        <p>{advice.check}</p>
        <label className={styles.confirmRow}>
          <input type="checkbox" checked={matched} onChange={e => setMatched(e.target.checked)} />
          {advice.confirm}
        </label>
        {difference !== null && (
          <p role="status">
            <strong>{difference === 0 ? "Both prices are the same in the first year." : "The new price is " + currency(difference) + (difference > 0 ? " lower" : " higher") + " in the first year."}</strong>
            {" "}This is a price comparison, not money you have already saved.
          </p>
        )}
        <small>{advice.next}</small>
      </div>
    </details>
  );
}
