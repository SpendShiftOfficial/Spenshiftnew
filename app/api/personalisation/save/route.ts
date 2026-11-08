import { NextResponse } from "next/server";
import { ensurePaidOrder, paidSession, readExistingReportId } from "@/lib/paid-orders";
import { supabaseAdmin } from "@/lib/supabase";
import { validateRefinements } from "@/lib/report-refinements";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const sessionId = payload?.sessionId;
    if (typeof sessionId !== "string") {
      return NextResponse.json({ error: "Missing payment session." }, { status: 400 });
    }
    const refinements = validateRefinements(payload?.refinements);
    const session = await paidSession(sessionId);
    await ensurePaidOrder(session);
    if (await readExistingReportId(sessionId)) {
      return NextResponse.json({ error: "Your report was already generated. Open the link from your payment confirmation." }, { status: 409 });
    }
    const { data, error } = await supabaseAdmin
      .from("report_orders")
      .update({ refinements, updated_at: new Date().toISOString() })
      .eq("stripe_session_id", sessionId)
      .in("status", ["awaiting_details", "failed"])
      .select("stripe_session_id");
    if (error) throw error;
    if (!data?.length) {
      return NextResponse.json({ error: "Your report is already processing. Please return to the payment confirmation page." }, { status: 409 });
    }
    return NextResponse.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save personalisation.";
    console.error("Save personalisation failed:", message);
    const clientError = /^(Invalid |You may include|.*must be |.*outside the allowed range|.*shorter than )/.test(message);
    return NextResponse.json(
      { error: clientError ? message : "Could not save your answers. Please try again." },
      { status: clientError ? 400 : 500 },
    );
  }
}
