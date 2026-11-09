import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Status for the isolated development branch, never production.
// No credentials or customer details are returned.
export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const dbIsolated =
    process.env.SUPABASE_URL === "https://pcjgzbaigtsnevhcjqyd.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const dbSecretReady = Boolean(key) && !key.startsWith("phase1_test_");
  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  const stripeTestReady =
    stripeKey.startsWith("sk_test_") && !stripeKey.includes("setup_required");
  const checkoutEnabled =
    process.env.SPENDSHIFT_ALLOW_PREVIEW_PAYMENTS === "true" &&
    dbIsolated && dbSecretReady && stripeTestReady;
  return NextResponse.json({
    environment: "preview",
    databaseIsolated: dbIsolated,
    databaseCredentialsReady: dbSecretReady,
    stripeTestCredentialsReady: stripeTestReady,
    checkoutEnabled,
    emailTestingEnabled: process.env.PHASE1_TEST_EMAILS === "enabled",
    aiTestingEnabled: process.env.PHASE1_TEST_AI === "enabled",
    nextAction: checkoutEnabled
      ? "Proceed with an authorised Stripe test-mode purchase."
      : "Complete the remaining test-only credentials and controls.",
  }, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
