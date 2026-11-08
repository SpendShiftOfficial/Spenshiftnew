import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generatePaidReport } from "@/lib/report-fulfillment";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }
  try {
    // Reclaim jobs that have been stuck far longer than a normal function run.
    const staleBefore = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    await supabaseAdmin.from("report_orders")
      .update({ status: "failed", last_error: "Previous attempt timed out", processing_started_at: null })
      .eq("status", "processing")
      .lt("processing_started_at", staleBefore);

    // Recover paid orders when the customer closed their browser before
    // choosing personalisation or generation.
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: waiting, error } = await supabaseAdmin
      .from("report_orders")
      .select("stripe_session_id")
      .eq("status", "awaiting_details")
      .lt("created_at", thirtyMinutesAgo)
      .order("created_at", { ascending: true })
      .limit(4);
    if (error) throw error;
    if (!waiting?.length) return NextResponse.json({ recovered: 0 });
    const results = await Promise.allSettled(waiting.map(order => generatePaidReport(order.stripe_session_id)));
    const recovered = results.filter(result =>
      result.status === "fulfilled" && result.value.status === "ready").length;
    const failed = results.filter(result => result.status === "rejected").length;
    return NextResponse.json({ recovered, failed });
  } catch (error) {
    console.error("Abandoned paid-report recovery failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Recovery failed and will be retried." }, { status: 500 });
  }
}
