"use client";

import Header from "@/components/Header";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Utensils,
  CreditCard,
  ShieldCheck,
  Coffee,
  Smartphone,
  RefreshCcw,
  ShoppingBag,
  Target,
  TrendingUp,
  ArrowRight,
  Lock,
  ChevronDown,
} from "lucide-react";

const qs = [
  {
    q: "How often do you order takeaway or food delivery?",
    options: ["Never", "1–2 times/week", "3–5 times/week", "Almost daily"],
    icon: Utensils,
  },
  {
    q: "How many subscriptions do you currently pay for?",
    options: ["0–2", "3–5", "6–10", "10+", "Not sure"],
    icon: CreditCard,
  },
  {
    q: "When did you last compare your insurance?",
    options: [
      "Within 6 months",
      "6–12 months ago",
      "1–2 years ago",
      "Over 2 years ago",
      "Never / not sure",
    ],
    icon: ShieldCheck,
  },
  {
    q: "How often do you buy convenience items like coffee, drinks, snacks, or quick lunches?",
    options: ["Rarely", "1–2 times/week", "3–5 times/week", "Daily"],
    icon: Coffee,
  },
  {
    q: "When did you last compare your internet or mobile plan?",
    options: [
      "Within 6 months",
      "6–12 months ago",
      "Over a year ago",
      "I honestly don’t know",
    ],
    icon: Smartphone,
  },
  {
    q: "How often do you review recurring payments leaving your account?",
    options: ["Monthly", "Every few months", "Rarely", "Almost never"],
    icon: RefreshCcw,
  },
  {
    q: "How often do you spend money on things you didn’t originally plan to buy?",
    options: ["Rarely", "1–2 times/week", "3–5 times/week", "Almost daily"],
    icon: ShoppingBag,
  },
  {
    q: "What would help you MOST right now?",
    options: [
      "Lower my bills",
      "Save more money",
      "Reduce stress",
      "Stop money disappearing so fast",
      "Feel more financially in control",
    ],
    icon: Target,
  },
];

export default function Audit() {
  const [open, setOpen] = useState(false);
  const r = useRouter();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const pct = useMemo(() => ((i + 1) / qs.length) * 100, [i]);
  const CurrentIcon = qs[i].icon;

  function pick(a: string) {
    const next = [...answers];
    next[i] = a;
    setAnswers(next);
  }

  function nextQuestion() {
    if (!answers[i]) return;

    if (i === qs.length - 1) {
      localStorage.setItem("spendshift_answers", JSON.stringify(answers));
      r.push("/results?loading=1");
    } else {
      setI(i + 1);
    }
  }

  return (
    <div className="auditPage">
      <Header simple />

      <div className="container progressWrap">
        <div className="progressMeta">
          <b>Audit Progress</b>
          <span>
            Question {i + 1} of {qs.length}
          </span>
        </div>

        <div className="bar">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="container">
        <div className="quizInner">
          <div className="icon" style={{ margin: "0 auto 20px" }}>
            <CurrentIcon />
          </div>

          <h2>{qs[i].q}</h2>

          <p>
            This helps us quickly spot simple money leaks without needing bank
            access.
          </p>

          <div className="options">
            {qs[i].options.map((a) => (
              <button
                type="button"
                className={"option " + (answers[i] === a ? "active" : "")}
                onClick={() => pick(a)}
                key={a}
              >
                <span className="radio" />
                {a}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn"
            disabled={!answers[i]}
            onClick={nextQuestion}
          >
            {i === qs.length - 1 ? "See My Results" : "Next Question"}
            <ArrowRight size={18} />
          </button>
<div className="auditNote">
  <Lock size={16} strokeWidth={2.2} />
  <span>
    Takes less than 2 minutes. No credit card required.
  </span>
</div>
          <div className="safe">
            <div className="trend-ng-class">
            <TrendingUp color="#059625" size={81} /></div>
            <div>
              <b>100% data-driven. 100% about you.</b>
              <p className="mini">
                We analyse your answers to estimate your biggest saving
                opportunities.
              </p>
            </div>
          </div>
        </div>

       <div className="faqBlock">
      <button
        className="faqHeader"
        onClick={() => setOpen(!open)}
      >
        <span>Why do we ask these questions?</span>

        <div className={`faqIcon ${open ? "active" : ""}`}>
          <ChevronDown size={18} />
        </div>
      </button>

      {open && (
        <div className="faqContent">
          <p>
            Your answers help us provide personalised insights that are
            relevant to your situation.
          </p>
        </div>
      )}
    </div>
      </div>
    </div>
  );
}