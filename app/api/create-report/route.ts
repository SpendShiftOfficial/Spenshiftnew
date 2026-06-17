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

The product goal is clarity, not information overload.

The user should NOT finish thinking:
"I already knew that."

The user SHOULD finish thinking:
"That is actually useful. I know exactly what to do next."

The report must feel:
- personal
- specific
- behavioural
- practical
- emotionally reassuring
- action-focused

Do not just identify categories like takeaway, subscriptions, insurance, impulse spending, internet, or mobile plans.

For every insight, connect it directly to the user's answer using this logic:

"You told us X. That usually means Y. This could be costing you Z. Here is the simplest next action."

Avoid generic advice such as:
- spend less
- budget better
- cancel subscriptions
- cook more
- compare insurance

Instead, explain:
1. why the issue applies to this user,
2. what behaviour pattern is likely happening,
3. roughly how much it may be costing per year,
4. what they should do first,
5. what they should do this week,
6. how this reduces stress or gives them more control.

The full report must feel significantly deeper than the free preview.

The free preview gives curiosity.
The paid report gives clarity and execution.

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
- Australian English.
- Practical money-saving guidance only.
- Non-financial-advice.
- Use realistic estimates, not exaggerated promises.
- Make every insight feel earned from the audit answers.
- Keep language simple and emotionally clear.
`,
      messages: [
        {
          role: "user",
          content: `
Create a personalised SpendShift savings report from these audit answers:

${JSON.stringify(answers, null, 2)}

Important:
The free results should feel useful but incomplete.
The paid report should feel like it gives the user the rest of the clarity.

Make the user immediately understand:
- where they are likely losing the most money,
- roughly how much it could be costing them,
- exactly what they should do next.

Avoid generic or obvious advice.
Every recommendation must connect directly to the user's answers.
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