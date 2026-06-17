import Header from "@/components/Header";
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";

type Report = {
  title: string;
  estimatedAnnualSavings: string;
  summary: string;
  topInsights: {
    category: string;
    impact: string;
    estimatedSaving: string;
    whyItMatters: string;
    quickWin: string;
    nextStep: string;
  }[];
  hiddenLeaks: {
    title: string;
    explanation: string;
    action: string;
  }[];
  scripts: {
    title: string;
    script: string;
  }[];
  thirtyDayPlan: {
    week: string;
    focus: string;
    actions: string[];
  }[];
  finalSummary: string;
};

function safeParseReport(report: string): Report {
  try {
    return JSON.parse(report);
  } catch {
    return {
      title: "Your SpendShift Savings Report",
      estimatedAnnualSavings: "$4,276",
      summary: report,
      topInsights: [],
      hiddenLeaks: [],
      scripts: [],
      thirtyDayPlan: [],
      finalSummary: "",
    };
  }
}

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

  const report = safeParseReport(data.report);

  return (
    <div className="auditPage">
      <Header simple />

      <main className="container reportUnlockedPage">
        <section className="resultsHero reportHero">
          <div>
            <span className="reportStatus">
              <ShieldCheck size={18} />
              Payment confirmed
            </span>

            <h1>
              Your full{" "}
              <span style={{ color: "#059625" }}>
                savings report is unlocked
              </span>
            </h1>

            <p>{report.summary}</p>

            <div className="reportMeta">
              <span>
                <CheckCircle2 size={18} fill="#059625" stroke="white" />
                Full report unlocked
              </span>
              <span>
                <Sparkles size={18} color="#059625" />
                AI-generated insights
              </span>
              <span>
                <CalendarDays size={18} color="#059625" />
                Saved report URL
              </span>
            </div>
          </div>

          <div className="greenPanel">
            <span className="badge">Total Recoverable Cash Found</span>
            <h2>{report.estimatedAnnualSavings}/year</h2>
            <p>
              Your report includes priority leaks, action steps, scripts, and a
              30-day savings plan.
            </p>
          </div>
        </section>

        <section className="reportDocumentLayout">
          <aside className="reportSummaryCard">
            <span className="pill">Full Report</span>

            <h2>Your savings summary</h2>

            <div className="summaryBox">
              <FileText size={34} color="#059625" />
              <div>
                <b>Potential annual savings</b>
                <strong>{report.estimatedAnnualSavings}</strong>
              </div>
            </div>

            <ul>
              <li>Top insights: {report.topInsights.length}</li>
              <li>Hidden leaks: {report.hiddenLeaks.length}</li>
              <li>Scripts included: {report.scripts.length}</li>
              <li>30-day action plan included</li>
            </ul>
          </aside>

          <article className="reportDocument">
            <div className="documentHeader">
              <span className="pill">Unlocked Personalised Report</span>
              <h2>{report.title}</h2>
              <p>
                This report is saved at <b>/report/{id}</b>. You can revisit it
                anytime.
              </p>
            </div>

            <div className="documentBody">
              <section className="docSection">
                <h2>Executive Summary</h2>
                <p>{report.summary}</p>
              </section>

              <section className="docSection">
                <h2>Your Top Money Leaks</h2>

                {report.topInsights.map((item, index) => (
                  <article className="insightCard" key={index}>
                    <div className="insightTop">
                      <span className="pill">
                        {String(index + 1).padStart(2, "0")} {item.impact}
                      </span>
                      <strong>{item.estimatedSaving}</strong>
                    </div>

                    <h3>{item.category}</h3>

                    <div className="insightBlock">
                      <b>Why this matters for you</b>
                      <p>{item.whyItMatters}</p>
                    </div>

                    <div className="insightBlock green">
                      <b>Quick win</b>
                      <p>{item.quickWin}</p>
                    </div>

                    <div className="insightBlock">
                      <b>Next step</b>
                      <p>{item.nextStep}</p>
                    </div>
                  </article>
                ))}
              </section>

              <section className="docSection">
                <h2>Hidden Leaks You Might Not Have Considered</h2>

                {report.hiddenLeaks.map((item, index) => (
                  <article className="miniDocCard" key={index}>
                    <h3>{item.title}</h3>
                    <p>{item.explanation}</p>
                    <div className="actionBox">
                      <b>Action:</b> {item.action}
                    </div>
                  </article>
                ))}
              </section>

              <section className="docSection">
                <h2>Scripts You Can Use</h2>

                {report.scripts.map((item, index) => (
                  <article className="scriptCard" key={index}>
                    <h3>{item.title}</h3>
                    <p>{item.script}</p>
                  </article>
                ))}
              </section>

              <section className="docSection">
                <h2>30-Day Action Plan</h2>

                {report.thirtyDayPlan.map((item, index) => (
                  <article className="weekCard" key={index}>
                    <span className="pill">{item.week}</span>
                    <h3>{item.focus}</h3>

                    <ul>
                      {item.actions.map((action, i) => (
                        <li key={i}>
                          <CheckCircle2
                            size={18}
                            fill="#059625"
                            stroke="white"
                          />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </section>

              <section className="docSection finalSummary">
                <h2>Final Clarity Summary</h2>
                <p>{report.finalSummary}</p>
              </section>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}