import { NextResponse } from "next/server";
import { paidSession, ensurePaidOrder, readExistingReportId } from "@/lib/paid-orders";
import { supabaseAdmin } from "@/lib/supabase";
import { cleanDraft, prepareDraft } from "@/lib/plan-draft";
import { readJson, InputError, privateHeaders } from "@/lib/request-safety";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    if (typeof body.sessionId !== "string") {
      throw new InputError("Your private purchase link is missing.");
    }
    const session = await paidSession(body.sessionId);
    const { order } = await ensurePaidOrder(session);
    const revise = body.revise === true;

    if (revise) {
      if (!order.report_id || order.status !== "ready") {
        throw new InputError("Open your finished plan before correcting it.", 409);
      }
    } else {
      if (order.report_id || await readExistingReportId(session.id)) {
        throw new InputError("Your plan is already ready. Open your plan link.", 409);
      }
      if (!["awaiting_details", "failed"].includes(order.status)) {
        throw new InputError("Your plan is being made. Return to your purchase link.", 409);
      }
    }
    if (typeof body.revision !== "string" || body.revision !== order.updated_at) {
      throw new InputError("This plan changed in another tab. Reload before editing.", 409);
    }

    let draft: ReturnType<typeof cleanDraft>;
    let refinements: unknown;
    try {
      draft = cleanDraft(body.draft);
      if (revise) {
        if (body.complete === true) throw new Error("Use Make my plan to save the corrected report.");
        refinements = {
          ...(order.refinements && typeof order.refinements === "object" ? order.refinements : {}),
          editDraft: draft,
        };
      } else {
        refinements = body.complete === true
          ? { ...prepareDraft(draft), completed: true }
          : { version: 1, draft, completed: false };
      }
    } catch (error) {
      throw new InputError(error instanceof Error ? error.message : "Please check your answers.");
    }

    const time = new Date().toISOString();
    const changes = revise
      ? { refinements, updated_at: time }
      : { answers: draft.answers, refinements, status: "awaiting_details", updated_at: time };
    const { data, error } = await supabaseAdmin.from("report_orders")
      .update(changes)
      .eq("stripe_session_id", session.id)
      .eq("updated_at", body.revision)
      .eq("status", revise ? "ready" : order.status)
      .select("updated_at")
      .maybeSingle();

    if (error) throw new Error("Could not save changes.");
    if (!data) throw new InputError("This plan changed in another tab. Reload before editing.", 409);
    return NextResponse.json({ saved: true, revision: data.updated_at }, { headers: privateHeaders });
  } catch (error) {
    const known = error instanceof InputError;
    return NextResponse.json({
      error: known ? error.message : "Your answers could not be saved. Keep this page open and try again.",
    }, { status: known ? error.status : 503, headers: privateHeaders });
  }
}
