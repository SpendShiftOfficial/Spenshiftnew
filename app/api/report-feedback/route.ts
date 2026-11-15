import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { InputError, privateHeaders, readJson } from "@/lib/request-safety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = await readJson(request, 1400);
    const reportId = input.reportId;
    const rating = input.rating;
    const comment = input.comment ?? "";

    if (typeof reportId !== "string" || !/^rpt_[A-Za-z0-9_-]{8,72}$/.test(reportId)) {
      throw new InputError("Open your paid report to share feedback.");
    }
    if (rating !== "helpful" && rating !== "needs_work") {
      throw new InputError("Please choose how you found your plan.");
    }
    if (typeof comment !== "string" || comment.length > 600) {
      throw new InputError("Please keep your comment under 600 characters.");
    }
    const trimmed = comment.trim();

    // Report links are private, unguessable tokens. Only ready paid reports
    // can send feedback. Never return or email the customer's financial details.
    const { data, error: lookupError } = await supabaseAdmin
      .from("report_orders")
      .select("report_id")
      .eq("report_id", reportId)
      .eq("status", "ready")
      .limit(1)
      .maybeSingle();
    if (lookupError) throw new Error("Feedback order lookup failed");
    if (!data) throw new InputError("Your paid report could not be verified.", 404);

    const key = process.env.RESEND_API_KEY;
    if (!key || (process.env.VERCEL_ENV === "preview" && process.env.PHASE1_TEST_EMAILS !== "enabled")) {
      return NextResponse.json({ error: "Feedback is unavailable right now. Please email info@spendshift.com.au." },
        { status: 503, headers: privateHeaders });
    }

    const subject = rating === "helpful" ? "SpendShift report feedback: Helpful" : "SpendShift report feedback: Needs work";
    const body = "Private customer feedback, not permission to publish.\n"
      + "Report reference: " + reportId + "\n"
      + "Response: " + (rating === "helpful" ? "Helpful" : "Needs work") + "\n"
      + "Comment: " + (trimmed || "(No comment provided)") + "\n"
      + "To use as a public review, ask the customer for separate consent.";

    // Resend deduplicates identical submissions within its 24-hour window.
    const fingerprint = createHash("sha256")
      .update(JSON.stringify({ reportId, rating, comment: trimmed }))
      .digest("hex");
    const sent = await new Resend(key).emails.send(
      { from: "SpendShift <info@spendshift.com.au>",
        to: ["info@spendshift.com.au"], subject, text: body },
      { idempotencyKey: "spendshift-feedback/" + fingerprint },
    );
    if (sent.error) throw new Error("Feedback email provider unavailable");

    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (cause) {
    const status = cause instanceof InputError ? cause.status : 503;
    const message = cause instanceof InputError ? cause.message : "We couldn't send your feedback. Please try again.";
    return NextResponse.json({ error: message }, { status, headers: privateHeaders });
  }
}
