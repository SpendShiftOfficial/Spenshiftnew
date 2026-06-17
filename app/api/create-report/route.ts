import { NextResponse } from "next/server";
import Stripe from "stripe";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function makeReportId() {
  return `rpt_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 403 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("reports")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({ reportId: existing.id });
    }

    const answers = JSON.parse(session.metadata?.answers || "[]");

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3500,
      system: `
You are SpendShift, an Australian personal-savings audit assistant.

Return ONLY valid JSON.
Do not return markdown.
Do not use ### headings.
Do not wrap the response in backticks.
Do not include explanations outside JSON.

The JSON must follow this exact shape:

{
  "title": "Your SpendShift Savings Report",
  "estimatedAnnualSavings": "$4,276",
  "summary": "Short personalised summary.",
  "topInsights": [
    {
      "category": "Takeaway & Food Delivery",
      "impact": "High Impact",
      "estimatedSaving": "$1,300/year",
      "whyItMatters": "Specific explanation based on the user's answer.",
      "quickWin": "One clear action this week.",
      "nextStep": "Specific next step."
    }
  ],
  "hiddenLeaks": [
    {
      "title": "Leak title",
      "explanation": "Useful explanation.",
      "action": "Specific action."
    }
  ],
  "scripts": [
    {
      "title": "Subscription cancellation script",
      "script": "Short script user can copy."
    }
  ],
  "thirtyDayPlan": [
    {
      "week": "Week 1",
      "focus": "Main focus",
      "actions": ["Action 1", "Action 2"]
    }
  ],
  "finalSummary": "Encouraging closing summary."
}

Rules:
- Avoid generic advice.
- Do not just identify categories.
- Explain why each insight applies to the user.
- Give realistic yearly savings estimates.
- Make every recommendation specific and actionable.
- Use Australian English.
- Give practical money-saving guidance only.
- Do not provide regulated financial advice.
- The user should finish thinking: "That is actually useful."
`,
      messages: [
        {
          role: "user",
          content: `
Create a personalised SpendShift savings report from these audit answers:

${JSON.stringify(answers, null, 2)}

The report must feel specific, personal, useful, and action-focused.
`,
        },
      ],
    });

    const rawText = msg.content
      .map((b: any) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    let reportJson;

    try {
      reportJson = JSON.parse(rawText);
    } catch {
      reportJson = {
        title: "Your SpendShift Savings Report",
        estimatedAnnualSavings: "$4,276",
        summary: rawText,
        topInsights: [],
        hiddenLeaks: [],
        scripts: [],
        thirtyDayPlan: [],
        finalSummary:
          "Your report has been generated, but formatting could not be fully structured.",
      };
    }

    const reportId = makeReportId();

    const { error } = await supabaseAdmin.from("reports").insert({
      id: reportId,
      stripe_session_id: sessionId,
      answers,
      report: JSON.stringify(reportJson),
    });

    if (error) throw error;

    return NextResponse.json({ reportId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}