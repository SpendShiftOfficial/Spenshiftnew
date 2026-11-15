import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// This diagnostic only runs on protected Vercel previews.
// It returns booleans, never secret values, customer data, or account balances.
export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const stripeKey = process.env.STRIPE_SECRET_KEY || "";

  const databaseIsolated =
    supabaseUrl === "https://pcjgzbaigtsnevhcjqyd.supabase.co";
  const databaseCredentialsReady =
    databaseIsolated &&
    !!supabaseKey &&
    !supabaseKey.startsWith("phase1_test_");
  const stripeTestCredentialsReady =
    stripeKey.startsWith("sk_test_") &&
    !stripeKey.includes("setup_required");

  let databaseConnectionPassed = false;
  if (databaseCredentialsReady) {
    try {
      const client = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await client
        .from("report_orders")
        .select("stripe_session_id", { head: true });
      databaseConnectionPassed = !error;
    } catch {
      databaseConnectionPassed = false;
    }
  }

  let stripeTestConnectionPassed = false;
  if (stripeTestCredentialsReady) {
    try {
      const stripe = new Stripe(stripeKey);
      await stripe.balance.retrieve();
      stripeTestConnectionPassed = true;
    } catch {
      stripeTestConnectionPassed = false;
    }
  }

  const checkoutEnabled =
    process.env.SPENDSHIFT_ALLOW_PREVIEW_PAYMENTS === "true" &&
    databaseConnectionPassed &&
    stripeTestConnectionPassed;

  return NextResponse.json(
    {
      environment: "preview",
      databaseIsolated,
      databaseCredentialsReady,
      databaseConnectionPassed,
      stripeTestCredentialsReady,
      stripeTestConnectionPassed,
      checkoutEnabled,
      emailTestingEnabled: process.env.PHASE1_TEST_EMAILS === "enabled",
      aiTestingEnabled: process.env.PHASE1_TEST_AI === "enabled",
      nextAction: checkoutEnabled
        ? "Sandbox checkout is enabled. Test using a Stripe test card only; never a real card."
        : databaseConnectionPassed && stripeTestConnectionPassed
          ? "Test credentials verified. Checkout remains disabled pending final configuration."
          : "One or more test credentials need attention. Do not enable checkout.",
    },
    { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } },
  );
}
