import { NextResponse } from "next/server";
import {validateAuditAnswers} from "@/lib/audit-schema";
import { auditAnswersFromSession, ensurePaidOrder, paidSession, readExistingReportId } from "@/lib/paid-orders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing payment session." }, { status: 400 });
  }
  try {
    const session = await paidSession(sessionId);
    const { order } = await ensurePaidOrder(session);
    const existingReportId = order.report_id || await readExistingReportId(sessionId);
    return NextResponse.json(
      {
        paid: true,
        answers: validateAuditAnswers(order.answers),
        revision: order.updated_at,
        status: existingReportId ? "ready" : order.status,
        reportId: existingReportId,
        refinements: order.refinements || null,
      },
      { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } },
    );
  } catch (error) {
    console.error("Payment-status verification failed:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Unable to verify this paid session. Please contact support if you have paid." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
}
