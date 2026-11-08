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
    // Recover paid orders where the customer closed their browser before
    // choosing personalisation or generation. One at a time for safe timeouts.
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: waiting, error } = await supabaseAdmin
      .from("report_orders")
      .select("stripe_session_id")
      .eq("status", "awaiting_details")
      .lt("created_at", thirtyMinutesAgo)
      .order("created_at", { ascending: true })
      .limit(1);
    if (error) throw error;
    if (!waiting?.length) return NextResponse.json({ recovered: 0 });
    const result = await generatePaidReport(waiting[0].stripe_session_id);
    return NextResponse.json({ recovered: result.status === "ready" ? 1 : 0, status: result.status });
  } catch (error) {
    console.error("Abandoned paid-report recovery failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Recovery failed and will be retried." }, { status: 500 });
  }
}
