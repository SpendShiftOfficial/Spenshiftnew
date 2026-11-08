import { NextResponse } from "next/server";
import { generatePaidReport } from "@/lib/report-fulfillment";

export const maxDuration = 180;

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const sessionId = payload?.sessionId;
    if (typeof sessionId !== "string") {
      return NextResponse.json({ error: "Missing payment session." }, { status: 400 });
    }
    const result = await generatePaidReport(sessionId);
    if (result.status === "processing") {
      return NextResponse.json({ status: "processing" }, { status: 202, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ status: "ready", reportId: result.reportId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report generation failed.";
    console.error("Create-report request failed:", message);
    return NextResponse.json(
      { error: /^(Invalid payment session|Payment is not complete)/.test(message) ? "Payment not verified." : "Could not generate your report. Please try again; your payment is safe." },
      { status: /^(Invalid payment session|Payment is not complete)/.test(message) ? 403 : 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
