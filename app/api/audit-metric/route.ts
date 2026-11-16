import { NextResponse } from "next/server";
import { readJson, InputError, privateHeaders } from "@/lib/request-safety";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedEvents = new Set(["audit_start", "audit_complete"]);

/**
 * Aggregate-only first-party audit counter.
 * No cookie, user ID, session ID, answer or URL is accepted or stored.
 * Disabled until the reviewed migration and privacy sign-off are complete.
 * Counts interactions, NOT unique people; do not use for billing.
 */
export async function POST(req: Request) {
  if (process.env.VERCEL_ENV !== "production" ||
      process.env.SPENDSHIFT_AGGREGATE_METRICS_ENABLED !== "true") {
    return new NextResponse(null, { status: 204, headers: privateHeaders });
  }
  try {
    const expectedOrigin = new URL(req.url).origin;
    if (req.headers.get("origin") !== expectedOrigin ||
        (req.headers.get("sec-fetch-site") &&
         req.headers.get("sec-fetch-site") !== "same-origin")) {
      throw new InputError("Request origin not accepted.", 403);
    }
    const body = await readJson(req, 128);
    if (Object.keys(body).length !== 1 ||
        typeof body.event !== "string" || !allowedEvents.has(body.event)) {
      throw new InputError("Invalid event.");
    }
    // Atomic, server-only increment; never put individual event rows in the database.
    const { error } = await supabaseAdmin.rpc("spendshift_increment_audit_daily", {
      p_event: body.event,
    });
    if (error) throw new Error("Aggregate count unavailable");
    return new NextResponse(null, { status: 204, headers: privateHeaders });
  } catch (error) {
    const known = error instanceof InputError;
    return NextResponse.json(
      { error: known ? error.message : "Aggregate measurement unavailable." },
      { status: known ? error.status : 503, headers: privateHeaders },
    );
  }
}
