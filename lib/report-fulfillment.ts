import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "./supabase";
import { analyseSavings } from "./savings-engine";
import { emptyRefinements, validateRefinements } from "./report-refinements";
import { makeReportMarkdown, optionalNarrative } from "./report-writing";
import {
  auditAnswersFromSession,
  ensurePaidOrder,
  paidSession,
  readExistingReportId,
  readPaidOrder,
  sendReadyEmailOnce,
} from "./paid-orders";

export type ReportGenerationResult =
  | { status: "ready"; reportId: string }
  | { status: "processing"; reportId: null };

function secureReportId() {
  return "rpt_" + randomBytes(24).toString("hex");
}

export async function generatePaidReport(sessionId: string): Promise<ReportGenerationResult> {
  const session = await paidSession(sessionId);
  const { order } = await ensurePaidOrder(session);
  const existing = order.report_id || await readExistingReportId(sessionId);
  if (existing) {
    // Repair an order row if a previous attempt saved the report but lost its final response.
    if (order.status !== "ready") {
      await supabaseAdmin.from("report_orders")
        .update({ status: "ready", report_id: existing, ready_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("stripe_session_id", sessionId);
    }
    try { await sendReadyEmailOnce(order, existing); }
    catch (error) { console.error("Could not resend report email:", error instanceof Error ? error.message : error); }
    return { status: "ready", reportId: existing };
  }

  // Atomic conditional update: concurrent clicks or webhook retries do not generate twice.
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("report_orders")
    .update({ status: "processing", processing_started_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_error: null })
    .eq("stripe_session_id", sessionId)
    .in("status", ["awaiting_details", "failed"])
    .select("stripe_session_id,refinements")
    .maybeSingle();

  if (claimError) throw new Error("Could not reserve report generation.");
  if (!claimed) {
    const latest = await readPaidOrder(sessionId);
    const readyId = latest?.report_id || await readExistingReportId(sessionId);
    return readyId ? { status: "ready", reportId: readyId } : { status: "processing", reportId: null };
  }

  try {
    const answers = auditAnswersFromSession(session);
    const refinements = claimed.refinements == null ? emptyRefinements() : validateRefinements(claimed.refinements);
    const analysis = analyseSavings(answers, refinements);
    const narrative = await optionalNarrative(answers, refinements, analysis);
    const report = makeReportMarkdown(answers, refinements, analysis, narrative);
    const reportId = secureReportId();

    const { error: insertError } = await supabaseAdmin.from("reports").insert({
      id: reportId,
      stripe_session_id: sessionId,
      answers,
      report,
      email: session.customer_details?.email || session.customer_email || null,
      refinements,
      savings_summary: {
        estimatedAnnualScenario: analysis.estimatedAnnualScenario,
        firstAction: analysis.opportunities[0]?.firstAction || "Review one current bill or recurring charge.",
        opportunities: analysis.opportunities,
        disclaimer: analysis.disclaimer,
      },
    });
    if (insertError) throw new Error("Could not save the finished report.");

    const { error: markError } = await supabaseAdmin
      .from("report_orders")
      .update({ status: "ready", report_id: reportId, ready_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("stripe_session_id", sessionId);
    if (markError) {
      // The report is already persisted; the next request will repair the order.
      console.error("Report saved, but order finalisation failed:", markError);
    }
    try { await sendReadyEmailOnce(order, reportId); }
    catch (emailError) { console.error("Report ready, email delivery failed:", emailError instanceof Error ? emailError.message : emailError); }
    return { status: "ready", reportId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report generation failed.";
    console.error("Paid report generation error:", message);
    await supabaseAdmin.from("report_orders")
      .update({ status: "failed", last_error: message.slice(0, 500), updated_at: new Date().toISOString(), processing_started_at: null })
      .eq("stripe_session_id", sessionId)
      .eq("status", "processing");
    throw error;
  }
}
