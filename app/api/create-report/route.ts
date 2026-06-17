import { NextResponse } from "next/server";
import Stripe from "stripe";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function makeReportId() {
  return `rpt_${Math.random().toString(36).slice(2, 10)}`;
}

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Claude did not return JSON");
  }

  return JSON.parse(match[0]);
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

The product goal is clarity, not information overload.

The user should NOT finish thinking:
"I already knew that."

The user SHOULD finish thinking:
"That is actually useful. I know exactly what to do next."

Return JSON in this exact shape:

{
  "title": "Your SpendShift Savings Report",
  "estimatedAnnualSavings": "$4,276",
  "summary": "Short personalised summary.",
  "clarityStatement": "One sentence that makes the user feel clear about their biggest opportunity.",
  "topInsights": [
    {
      "category": "Takeaway & Food Delivery",
      "impact": "High Impact",
      "estimatedSaving": "$1,300/year",
      "userSignal": "What the user's answer revealed.",
      "whyItMatters": "Specific explanation based on their behaviour.",
      "likelyPattern": "The spending pattern likely happening.",
      "quickWin": "One clear action this week.",
      "nextStep": "Specific next step.",
      "stressReduction": "How this gives them more control."
    }
  ],
  "hiddenLeaks": [
    {
      "title": "Leak title",
      "whyItIsEasyToMiss": "Why users usually miss this.",
      "explanation": "Useful explanation.",
      "action": "Specific action."
    }
  ],
  "scripts": [
    {
      "title": "Script title",
      "whenToUse": "When the user should use this.",
      "script": "Short script user can copy."
    }
  ],
  "thirtyDayPlan": [
    {
      "week": "Week 1",
      "focus": "Main focus",
      "goal": "What this week achieves.",
      "actions": ["Action 1", "Action 2", "Action 3"]
    }
  ],
  "upgradeValue": [
    "What the paid report revealed beyond the free preview."
  ],
  "finalSummary": "Encouraging closing summary."
}

Rules:
- Avoid generic advice.
- Do not just identify categories.
- Connect every insight directly to the user's audit answers.
- Explain the behaviour pattern, cost impact, and exact next step.
- Use realistic yearly estimates.
- Australian English.
- Non-financial-advice.
`,
      messages: [
        {
          role: "user",
          content: `
Create a personalised SpendShift savings report from these audit answers:

${JSON.stringify(answers, null, 2)}

Make the report specific, useful, and action-focused.
`,
        },
      ],
    });

    const rawText = msg.content
      .map((b: any) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    const reportJson = extractJson(rawText);

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