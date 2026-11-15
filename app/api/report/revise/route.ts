import { NextResponse } from "next/server";
import { paidSession, ensurePaidOrder } from "@/lib/paid-orders";
import { readJson, InputError, privateHeaders } from "@/lib/request-safety";
import { cleanDraft, prepareDraft } from "@/lib/plan-draft";
import { analyseSavings } from "@/lib/savings-engine";
import { makeReportMarkdown } from "@/lib/report-writing";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = await readJson(req, 26000);
    if (typeof data.sessionId !== "string") {
      throw new InputError("Your private purchase link is missing.", 400);
    }
    const session = await paidSession(data.sessionId);
    const { order } = await ensurePaidOrder(session);
    if (order.status !== "ready" || !order.report_id) {
      throw new InputError("Your plan is being made. Try your purchase link again.", 409);
    }
    if (typeof data.revision !== "string" || data.revision !== order.updated_at) {
      throw new InputError("Your answers changed in another tab. Reload before saving.", 409);
    }

    let draft: ReturnType<typeof cleanDraft>;
    let refinements: ReturnType<typeof prepareDraft>;
    try {
      draft = cleanDraft(data.draft);
      refinements = prepareDraft(draft);
    } catch (error) {
      throw new InputError(error instanceof Error ? error.message : "Please check your answers.");
    }

    const analysis = analyseSavings(draft.answers, refinements);
    const report = makeReportMarkdown(draft.answers, refinements, analysis);
    const summary = {
      version: 4,
      estimatedAnnualScenario: analysis.estimatedAnnualScenario,
      opportunities: analysis.opportunities,
      firstAction: analysis.opportunities[0]?.firstAction || "Check a bill when you are ready.",
      disclaimer: analysis.disclaimer,
    };

    // One database transaction saves the old version before replacing the report.
    // A stale tab or a second simultaneous update cannot silently overwrite it.
    const { data: revised, error } = await supabaseAdmin.rpc(
      "spendshift_update_report_revision",
      {
        p_session_id: session.id,
        p_expected_updated_at: order.updated_at,
        p_answers: draft.answers,
        p_refinements: { ...refinements, completed: true },
        p_report_text: report,
        p_savings_summary: summary,
      },
    );
    if (error) {
      const known = error.message.includes("revision_conflict") ||
        error.message.includes("revision_limit");
      throw new InputError(
        known ? "This plan has been changed. Open your purchase link and try again." :
          "Your plan could not be updated. The previous version is still safe.",
        known ? 409 : 503,
      );
    }
    const updated = Array.isArray(revised) ? revised[0] : null;
    if (!updated || updated.report_id !== order.report_id) {
      throw new InputError("The updated report could not be confirmed. Please open your purchase link.", 503);
    }
    return NextResponse.json({
      updated: true,
      reportId: order.report_id,
      revisionNumber: updated.revision_number,
    }, { headers: privateHeaders });
  } catch (error) {
    const known = error instanceof InputError;
    return NextResponse.json({
      error: known ? error.message : "We could not save your changes. Your old report is still there.",
    }, { status: known ? error.status : 503, headers: privateHeaders });
  }
}
