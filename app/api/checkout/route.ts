import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();
    if (!Array.isArray(answers) && typeof answers !== "string") {
      return NextResponse.json({ error: "Missing audit answers." }, { status: 400 });
    }

    // Preview purchases must never accidentally use live Stripe credentials.
    const preview = process.env.VERCEL_ENV === "preview";
    if (preview && (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") || process.env.SPENDSHIFT_ALLOW_PREVIEW_PAYMENTS !== "true")) {
      return NextResponse.json(
        { error: "Preview checkout is disabled until test-mode Stripe, a staging database and the preview testing flag are configured." },
        { status: 403 },
      );
    }

    const previewUrl = process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : null;
    const siteUrl = preview
      ? previewUrl
      : process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) throw new Error("Site URL is not configured.");
    const base = siteUrl.replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      customer_creation: "always",

      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: "SpendShift Full Savings Report",
            },
            unit_amount: 3900,
          },
          quantity: 1,
        },
      ],

      metadata: {
        answers:
          typeof answers === "string" ? answers : JSON.stringify(answers),
      },

      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/results`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
