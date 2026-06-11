import Header from "@/components/Header";
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

const leaks = [
  ["HIGH IMPACT", "Takeaway & Food Delivery", "$1,300"],
  ["HIGH IMPACT", "Insurance Overpayment", "$900"],
  ["MEDIUM IMPACT", "Subscriptions", "$650"],
  ["MEDIUM IMPACT", "Convenience Spending", "$540"],
  ["LOW IMPACT", "Internet & Mobile Plan", "$420"],
];

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <div className="auditPage">
      <Header simple />

      <main className="container">
        <section className="resultsHero">
          <div>
            <h1 style={{ fontSize: 48 }}>
              Your full{" "}
              <span style={{ color: "#059625" }}>savings report is unlocked</span>
            </h1>

            <p>
              Based on your answers, we’ve generated your personalised
              SpendShift action plan.
            </p>

            <p>
              <CheckCircle2 size={18} fill="#059625" stroke="white" /> Payment confirmed
              <br />
              <CheckCircle2 size={18} fill="#059625" stroke="white" /> Full report unlocked
            </p>
          </div>

          <div className="greenPanel">
            <span className="badge">Total Recoverable Cash Found</span>
            <h2 style={{ fontSize: 46 }}>$4,276/year</h2>
            <p>
              Your AI-generated report includes priority leaks, action steps,
              scripts, and a 30-day savings plan.
            </p>
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

        <h2>Your unlocked money leaks</h2>

        <section className="mainResults">
          <div>
            {leaks.map((l, idx) => (
              <article className="panel leak" key={l[1]}>
                <span className="pill">
                  0{idx + 1} {l[0]}
                </span>

                <h3>{l[1]}</h3>

                <p>
                  This category has been unlocked in your full personalised
                  SpendShift report.
                </p>

                <div className="savings">Potential saving {l[2]} per year</div>
              </article>
            ))}
          </div>

          <aside className="panel reportBox unlockedReportBox">
            <span className="pill">Full Report Unlocked</span>

            <h2>Your personalised action plan</h2>

            <div className="card">
              <b>Your Full Report</b>
              <div className="savings">$4,276</div>
              <p>
                Top leaks found: 12
                <br />
                Action plan steps: 18
              </p>
            </div>

            <div className="fullReportText">{data.report}</div>
          </aside>
        </section>
      </main>
    </div>
  );
}