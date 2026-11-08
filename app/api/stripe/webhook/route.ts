import { after, NextResponse } from "next/server";
import type Stripe from "stripe";
import { ensurePaidOrder, getStripe, sendOrderConfirmationOnce } from "@/lib/paid-orders";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook authentication is unavailable." }, { status: 503 });
  }
  let event: Stripe.Event;
  try {
    // Stripe's signed body MUST be read as raw text, never req.json().
    event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, awaitingPayment: true });
    }
    try {
      const { order } = await ensurePaidOrder(session);
      // Notification is best-effort. Durable recovery of an abandoned order
      // is handled by the scheduled job, not by the customer's browser.
      after(async () => {
        try { await sendOrderConfirmationOnce(order); }
        catch (error) { console.error("Payment confirmation email failed:", error instanceof Error ? error.message : error); }
      });
    } catch (error) {
      console.error("Could not persist completed payment:", error instanceof Error ? error.message : error);
      return NextResponse.json({ error: "Payment persistence failed; retry event." }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
