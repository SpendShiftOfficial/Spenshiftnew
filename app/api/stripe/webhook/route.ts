import { after, NextResponse } from "next/server";
import Stripe from "stripe";
import { ensurePaidOrder, sendOrderConfirmationOnce } from "@/lib/paid-orders";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook authentication is unavailable." }, { status: 503 });
  }

  // Webhook signature verification must work while the checkout feature flag is
  // OFF. That flag gates creating purchases, not receiving authenticated events.
  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  if (process.env.VERCEL_ENV === "preview" &&
      (!stripeKey.startsWith("sk_test_") ||
       stripeKey.includes("setup_required") ||
       process.env.SUPABASE_URL !== "https://pcjgzbaigtsnevhcjqyd.supabase.co")) {
    return NextResponse.json({ error: "Webhook test environment is not isolated." }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeKey);
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  // Never accept a live payment event in our isolated preview.
  if (process.env.VERCEL_ENV === "preview" && event.livemode) {
    return NextResponse.json({ error: "Live events are not permitted in Preview." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Workbench's synthetic sample events and other Checkout Sessions do not
    // contain our product marker. Acknowledge, but do not fulfil or store them.
    if (session.metadata?.product !== "spendshift_full_report") {
      return NextResponse.json({ received: true, ignored: true });
    }
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, awaitingPayment: true });
    }
    try {
      const { order } = await ensurePaidOrder(session);
      after(async () => {
        try { await sendOrderConfirmationOnce(order, session.amount_total); }
        catch (error) {
          console.error("Payment confirmation email failed:",
            error instanceof Error ? error.message : error);
        }
      });
    } catch (error) {
      console.error("Could not persist a completed payment:",
        error instanceof Error ? error.message : error);
      return NextResponse.json({ error: "Payment persistence failed; retry event." }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
