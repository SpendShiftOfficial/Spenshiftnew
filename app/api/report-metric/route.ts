import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { readJson, InputError, privateHeaders } from "@/lib/request-safety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const events = new Set(["report_open", "checklist_interaction", "tracker_saved", "feedback_sent"]);
const reportIdPattern = /^rpt_[A-Za-z0-9_-]{8,72}$/;

/**
 * First-party, aggregate-only report engagement. This receives a private
 * bearer report ID solely to verify that the report belongs to a ready paid
 * order. The ID is NEVER stored in the telemetry table or forwarded.
 *
 * OFF by default, pending approval of privacy, abuse control and SQL migration.
 * Counts approximate consented actions, not distinct customers.
 */
export async function POST(req: Request) {
  if (process.env.VERCEL_ENV !== "production" ||
      process.env.SPENDSHIFT_AGGREGATE_METRICS_ENABLED !== "true") {
    return new NextResponse(null, { status: 204, headers: privateHeaders });
  }
  try {
    const origin = new URL(req.url).origin;
    if (req.headers.get("origin") !== origin ||
        (req.headers.get("sec-fetch-site") &&
         req.headers.get("sec-fetch-site") !== "same-origin")) {
      throw new InputError("Request origin not accepted.", 403);
    }
    const body = await readJson(req, 256);
    if (Object.keys(body).length !== 2 ||
        typeof body.event !== "string" || !events.has(body.event) ||
        typeof body.reportId !== "string" ||
        !reportIdPattern.test(body.reportId)) {
      throw new InputError("Invalid event.");
    }

    // Only valid, completed Phase 1 paid reports are eligible.
    // Do not select, log, store, return or export customer financial details.
    const { data: order, error: lookupError } = await supabaseAdmin
      .from("report_orders")
      .select("report_id")
      .eq("report_id", body.reportId)
      .eq("status", "ready")
      .limit(1)
      .maybeSingle();
    if (lookupError) throw new Error("Paid order lookup unavailable");
    if (!order) return new NextResponse(null, { status: 204, headers: privateHeaders });

    const { error } = await supabaseAdmin.rpc("spendshift_increment_report_daily", {
      p_event: body.event,
    });
    if (error) throw new Error("Report aggregate count unavailable");
    return new NextResponse(null, { status: 204, headers: privateHeaders });
  } catch (error) {
    const known = error instanceof InputError;
    return NextResponse.json(
      { error: known ? error.message : "Aggregate measurement unavailable." },
      { status: known ? error.status : 503, headers: privateHeaders },
    );
  }
}
