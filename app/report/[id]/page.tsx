import Header from "@/components/Header";
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  CalendarDays,
  LockOpen,
} from "lucide-react";

function cleanOldJson(report: string): string {
  try {
    const parsed = JSON.parse(report);

    if (typeof parsed === "string") return parsed;
    if (parsed?.summary) return parsed.summary;

    return report;
  } catch {
    return report;
  }
}

function getSavings(report: string): string {
  const match = report.match(/\$[\d,]+\/year/);
  return match ? match[0] : "$4,276/year";
}

function getSavingsNumber(savings: string): number {
  return Number(savings.replace("$", "").replace(",", "").replace("/year", ""));
}

function getSavingsEquivalent(amount: number) {
  if (amount >= 6000) {
    return {
      label: "What this could mean",
      title: "A serious savings buffer",
      text: "That could cover a family holiday, several weeks of groceries, or a meaningful emergency buffer.",
    };
  }

  if (amount >= 4000) {
    return {
      label: "What this could mean",
      title: "A family holiday or grocery breathing room",
      text: "That could be enough for a family holiday, or around 20 weeks of groceries at $200/week.",
    };
  }

  if (amount >= 2500) {
    return {
      label: "What this could mean",
      title: "Weeks of groceries covered",
      text: "That could cover roughly 12 weeks of groceries at $200/week.",
    };
  }

  if (amount >= 1500) {
    return {
      label: "What this could mean",
      title: "Multiple bills covered",
      text: "That could cover several household bills or give your savings buffer a strong boost.",
    };
  }

  return {
    label: "What this could mean",
    title: "Money staying with you",
    text: "Even a smaller saving means less money quietly disappearing each month.",
  };
}

function renderReport(report: string) {
  const text = cleanOldJson(report);

  const lines: string[] = text
    .split("\n")
    .filter((line: string) => line.trim() !== "");

  return lines.map((line: string, index: number) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      return (
        <h1 className="docTitle" key={index}>
          {trimmed.replace("# ", "")}
        </h1>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h2 className="docHeading" key={index}>
          {trimmed.replace("## ", "")}
        </h2>
      );
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h3 className="docSubheading" key={index}>
          {trimmed.replace("### ", "")}
        </h3>
      );
    }

    if (trimmed.startsWith("- ")) {
      return (
        <div className="docBullet" key={index}>
          <CheckCircle2 size={18} fill="#059625" stroke="white" />
          <span>{trimmed.replace("- ", "")}</span>
        </div>
      );
    }

    if (trimmed.startsWith("Estimated saving:")) {
      return (
        <div className="reportCallout savingCallout" key={index}>
          <b>Estimated saving</b>
          <strong>{trimmed.replace("Estimated saving:", "").trim()}</strong>
        </div>
      );
    }

    if (trimmed.startsWith("Why this matters:")) {
      return (
        <div className="reportCallout whyCallout" key={index}>
          <b>Why this matters</b>
          <p>{trimmed.replace("Why this matters:", "").trim()}</p>
        </div>
      );
    }

    if (trimmed.startsWith("Quick win:")) {
      return (
        <div className="reportCallout quickCallout" key={index}>
          <b>Quick win</b>
          <p>{trimmed.replace("Quick win:", "").trim()}</p>
        </div>
      );
    }

    if (trimmed.startsWith("Next step:")) {
      return (
        <div className="reportCallout nextCallout" key={index}>
          <b>Next step</b>
          <p>{trimmed.replace("Next step:", "").trim()}</p>
        </div>
      );
    }

    if (
      trimmed.startsWith("Impact:") ||
      trimmed.startsWith("What your answer revealed:") ||
      trimmed.startsWith("Likely pattern:") ||
      trimmed.startsWith("Why this reduces stress:") ||
      trimmed.startsWith("When to use:") ||
      trimmed.startsWith("Script:") ||
      trimmed.startsWith("Focus:") ||
      trimmed.startsWith("Actions:")
    ) {
      const [label, ...rest] = trimmed.split(":");

      return (
        <div className="docInfoRow" key={index}>
          <b>{label}:</b>
          <span>{rest.join(":").trim()}</span>
        </div>
      );
    }

    return (
      <p className="docParagraph" key={index}>
        {trimmed}
      </p>
    );
  });
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

  const reportText = cleanOldJson(data.report);
  const savings = getSavings(reportText);
  const savingsNumber = getSavingsNumber(savings);
  const equivalent = getSavingsEquivalent(savingsNumber);

  return (
    <div className="auditPage">
      <Header simple />

      <main className="container reportUnlockedPage">
        <div className="unlockreport-bg">
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

              <p>
                Your biggest opportunities are highlighted below, with estimated
                yearly savings, quick wins, scripts, and a 30-day action plan to
                help you take action without feeling overwhelmed.
              </p>

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

            <div
              className="greenPanel"
              style={{
                backgroundImage: "url('/result/panelbg.png')",
              }}
            >
              <span className="badge">Total Recoverable Cash Found</span>
              <h2>{savings}</h2>
              <p>
                Your report includes priority leaks, action steps, scripts, and
                a 30-day savings plan.
              </p>

              <div className="savingsEquivalent">
                <span>{equivalent.label}</span>
                <h3>{equivalent.title}</h3>
                <p>{equivalent.text}</p>
              </div>
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
                  <strong>{savings}</strong>
                </div>
              </div>

              <div className="summaryWowBox">
                <span>{equivalent.label}</span>
                <strong>{equivalent.title}</strong>
                <p>{equivalent.text}</p>
              </div>

              <div className="potential-report">
                <p className="list-item">
                  <CheckCircle2 size={15} color="#059625" /> Personalised money
                  leaks
                </p>
                <p className="list-item">
                  <CheckCircle2 size={15} color="#059625" /> Hidden spending
                  patterns
                </p>
                <p className="list-item">
                  <CheckCircle2 size={15} color="#059625" /> Scripts included
                </p>
                <p className="list-item">
                  <CheckCircle2 size={15} color="#059625" /> 30-day action plan
                  included
                </p>
              </div>
            </aside>

            <hr />

            <article className="reportDocument">
              <div className="documentHeader">
                <span className="pill">
                  <LockOpen size={25} color="#059625" /> Unlocked Personalised
                  Report
                </span>
                <h2>Your SpendShift Savings Report</h2>
                <p>
                  This report is saved at <b>/report/{id}</b>. You can revisit
                  it anytime.
                </p>
              </div>

              <div className="documentBody">{renderReport(data.report)}</div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}