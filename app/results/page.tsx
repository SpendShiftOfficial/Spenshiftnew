"use client";
import Header from "@/components/Header";
import Icon1 from "next/image";
import Icon2 from "next/image";
import { useEffect, useState } from "react";
import {
  CheckCircle,
  Lock,
  ShieldCheck,
  Circle,
  LoaderCircle,
  Wallet,
  BarChart3,
  Search,
  Info,
  FileClock,
  Lightbulb,
  Utensils,
  Zap,
  TrendingUp,
  ChartNoAxesCombined,
  CheckCircle2Icon,
} from "lucide-react";
import { BsCheckCircleFill } from "react-icons/bs";
const leaks = [
  ["HIGH IMPACT", "Takeaway & Food Delivery", "$1,300"],
  ["HIGH IMPACT", "Insurance Overpayment", "$900"],
  ["MEDIUM IMPACT", "Subscriptions", "$650"],
  ["MEDIUM IMPACT", "Convenience Spending", "$540"],
  ["LOW IMPACT", "Internet & Mobile Plan", "$420"],
  ["LOCKED", "10+ Other Categories", "Unlock"],
];
export default function Results() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let current = 0;

    const progressTimer = setInterval(() => {
      current += 3;

      if (current >= 72) {
        current = 72;
        clearInterval(progressTimer);
      }

      setProgress(current);
    }, 70);

    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 2300);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(loadingTimer);
    };
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2300);
    return () => clearTimeout(t);
  }, []);
  async function pay() {
    setBusy(true);
    const answers = localStorage.getItem("spendshift_answers") || "[]";
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    if (data.url) location.href = data.url;
    else alert(data.error || "Stripe checkout failed");
    setBusy(false);
  }
  if (loading)
    return (
      <div className="auditPage">
        <Header simple />
        <div className="container">
          <div className="progressWrap ">
            <div className="progressMeta">
              <b>Audit Progress</b>
              <span>Question 8 of 8</span>
            </div>
            <div className="bar">
              <span style={{ width: "100%" }} />
            </div>
          </div>
          <div className="analysisCard ">
            <div className="icon" style={{ margin: "0 auto 20px" }}>
              <ShieldCheck />
            </div>
            <h2>Analysing your Answers...</h2>
            <p>
              We're scanning thousands of data points to find your biggest money
              leaks.
            </p>
            <div
              className="circle"
              style={{
                background: `conic-gradient(
      #059625 ${progress * 3.6}deg,
      #e5e7eb 0deg
    )`,
              }}
            >
              <div>
                <strong>{progress}%</strong>
                <br />
                <span>Analysing</span>
              </div>
            </div>
            <div className="checksList">
              <div className="checkRow">
                <div className="left">
                  <div className="iconWrap">
                    <Wallet size={18} />
                  </div>
                  <span>Reviewing your spending patterns</span>
                </div>

                <CheckCircle size={20} fill="#059625" color="#fff" />
              </div>

              <div className="checkRow">
                <div className="left">
                  <div className="iconWrap">
                    <BarChart3 size={18} />
                  </div>
                  <span>Comparing against smart benchmarks</span>
                </div>

                {progress >= 30 ? (
                  <CheckCircle size={20} fill="#059625" color="#fff" />
                ) : (
                  <LoaderCircle size={20} color="#059625" className="spin" />
                )}
              </div>

              <div className="checkRow">
                <div className="left">
                  <div className="iconWrap">
                    <Search size={18} />
                  </div>
                  <span>Identifying overpayment opportunities</span>
                </div>

                {progress >= 55 ? (
                  <CheckCircle size={20} fill="#059625" color="#fff" />
                ) : progress >= 35 ? (
                  <LoaderCircle size={20} color="#059625" className="spin" />
                ) : (
                  <Circle size={16} fill="#9CA3AF" color="#9CA3AF" />
                )}
              </div>

              <div className="checkRow">
                <div className="left">
                  <div className="iconWrap">
                    <Lightbulb size={18} />
                  </div>
                  <span>Calculating your potential savings</span>
                </div>

                {progress >= 72 ? (
                  <CheckCircle size={20} fill="#059625" color="#fff" />
                ) : progress >= 60 ? (
                  <LoaderCircle size={20} color="#059625" className="spin" />
                ) : (
                  <Circle size={16} fill="#9CA3AF" color="#9CA3AF" />
                )}
              </div>
            </div>
            <div className="safe">
              <div className="trend-ng-class">
                <Lock color="#059625" size={81} />
              </div>
              <div>
                <b>Your data is safe with us</b>
                <p className="mini">
                  We use bank-level encryption and never share your information.
                  opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  return (
    <div className="auditPage">
      <Header simple />
      <main className="container">
        <div className="main-section-results">
        <section className="resultsHero">
          <div className="content-wrap-first">
            <h1 style={{ fontSize: 55 }}>
              We found your{" "} <br />
              <span style={{ color: "#059625" }}>biggest money leaks</span>
            </h1>
            <p>
              Based on your answers, we identified areas where you could be
              overpaying every year.
            </p>
            <div className="audit-page-label">
              <div>   <ShieldCheck size={34} /></div>
              <div><p>
              Your data is private & secure</p>
              
            </div>
            </div>
             <div className="audit-page-label">
              <div>   <ChartNoAxesCombined size={34} /></div>
              <div>
                <p>Fixed insights. Real savings.</p>
              
            </div>
            </div>
            
          </div>
          <div className="greenPanel"
          style={{ 
    backgroundImage: "url('/result/panelbg.png')", 
  }}>
            <span className="badge">Total Recoverable Cash Found</span>
            <h2 style={{ fontSize: 65 }}>$2,300 - $4,800/year</h2>
            <p className="conclu-para">
             <Info size={34} /> This is a range based on your feedback. Your actual savings may be
              higher or lower.
            </p>
            <button onClick={pay} className="btn white">
              {busy ? "Opening checkout..." : "Get My Full Savings Plan"}
            </button>
          </div>
          
        </section>
        <div className="leakTabs">
          {leaks.map((l) => (
            <div className="leakTab" key={l[1]}>
              <small>{l[0]}</small>
              <strong>{l[2]}</strong>
              <span>{l[1]}</span>
            </div>
          ))}
        </div>
</div>
        
        <h2>Your Top 3 money leaks</h2>
        <section className="mainResults">
          <div>
            {leaks.slice(0, 3).map((l, idx) => (
              <article className="panel leak" key={l[1]}>
                <span className="pill">
                  0{idx + 1} {l[0]}
                </span>
                <h3>{l[1]}</h3>
                <div className="add-bg">
                <p>
                  Based on your answers, this category looks like one of your
                  strongest opportunities.
                </p>
                <div className="savings"><span>Save</span> {l[2]} <span>per year</span></div></div>
                <p className="mini">
                  Full monthly action steps and scripts are included in your
                  unlocked report.
                </p>
              </article>
            ))}
            <div className="safe">
            <div className="trend-ng-class">
            <Zap color="#059625" size={81} /></div>
            <div>
              <b>These are just the big ones.</b>
              <p className="mini">
                Your full report includes personalised insights across 10+
                  categories.
              </p>
            </div>
          </div>
            
          </div>
          <aside className="panel reportBox">
            <span className="pill"><BsCheckCircleFill size={20} color="#059625" /> Unlock Your <span>Full Potential</span></span>
            <h2>Get your personalised action plan</h2>
          
            <p className="list-item">
              <BsCheckCircleFill size={15} color="#059625" /> See all your money leaks
            </p>
            <p className="list-item">
              <BsCheckCircleFill size={15} color="#059625" /> Get your exact savings
            </p>
            <p className="list-item">
              <BsCheckCircleFill size={15} color="#059625" /> Step-by-step action plan
            </p>
            <p className="list-item">
              <BsCheckCircleFill size={15} color="#059625" /> Track your progress
            </p>
            <p className="list-item">
              <BsCheckCircleFill size={15} color="#059625" /> Save more, stress less
            </p>

          
            <div className="card unlock-card">
              <h5><FileClock size={25} color="#059625" />Your Full Report</h5>
              <p><FileClock size={25} color="#fff" /> Potential annual savings</p>
              <div className="savings">$4,276</div>
              <div className="top-bar-leaks">
              <p>
                <div>Top leaks found:</div> <div> 12</div></p>
                
               <p><div> Action plan steps:</div> <div>18</div></p>
             
              </div>
            
            </div>
            <button onClick={pay} className="unlock flex items-center justify-center gap-2">
  <Lock size={20} color="#fff" />
  <span>{busy ? "Redirecting..." : "Unlock My Full Report"}</span>
</button>
            <p className="mini">
              Get instant access to your customized step-by-step negotiation scripts and direct cancellation links.
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}
