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

function fallbackReport(rawText: string) {
  return {
    title: "Your SpendShift Savings Report",
    estimatedAnnualSavings: "$4,276",
    summary:
      "Your personalised report was generated, but the structured formatting could not be fully processed.",
    clarityStatement:
      "Your biggest opportunity is to focus on the spending habits that repeat quietly every week.",
    topInsights: [
      {
        category: "Personalised Savings Opportunity",
        impact: "High Impact",
        estimatedSaving: "$4,276/year",
        userSignal: "Your answers showed multiple recurring spending patterns.",
        whyItMatters:
          "Small repeated costs can add up quickly when they happen every week or every month.",
        likelyPattern:
          "The main opportunity is likely coming from everyday convenience spending, recurring payments, or plans that have not been reviewed recently.",
        quickWin:
          "Review your last 30 days of transactions and highlight anything recurring or repeated.",
        nextStep:
          "Cancel, reduce, or renegotiate one recurring cost this week.",
        stressReduction:
          "This gives you more control because the same saving repeats automatically each month.",
      },
    ],
    hiddenLeaks: [
      {
        title: "Small repeat payments",
        whyItIsEasyToMiss:
          "They feel minor individually, so they are easy to ignore.",
        explanation:
          "Small weekly or monthly charges often create the biggest yearly leaks.",
        action:
          "Search your bank app for recurring payments and list every charge.",
      },
    ],
    scripts: [
      {
        title: "Cancel a subscription",
        whenToUse: "Use this when cancelling a service you no longer need.",
        script:
          "Hi, I’d like to cancel my subscription today. Please confirm that no further payments will be taken from my account.",
      },
    ],
    thirtyDayPlan: [
      {
        week: "Week 1",
        focus: "Find the leaks",
        goal: "Get visibility on where money is disappearing.",
        actions: [
          "Review your last 30 days of transactions.",
          "List all subscriptions and recurring payments.",
          "Choose one category to reduce this week.",
        ],
      },
    ],
    upgradeValue: [
      "The full report turns broad categories into specific next actions.",
    ],
    finalSummary: rawText.slice(0, 600),
  };
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
      max_tokens: 3000,
      system: `
You are SpendShift, an Australian personal-savings audit assistant.

You must return ONLY valid JSON.

Do not return markdown.
Do not use headings with #.
Do not wrap the response in backticks.
Do not include comments.
Do not include trailing commas.
Do not include explanations outside the JSON.
The response must start with { and end with }.

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
- Make exactly 4 topInsights.
- Make exactly 3 hiddenLeaks.
- Make exactly 2 scripts.
- Make exactly 4 thirtyDayPlan items.
- Each actions array must contain exactly 3 strings.
- Use Australian English.
- Practical money-saving guidance only.
- Non-financial-advice.
- Use realistic estimates.
- Keep all strings JSON-safe.
`,
      messages: [
        {
          role: "user",
          content: `
Create a personalised SpendShift savings report from these audit answers:

${JSON.stringify(answers, null, 2)}

Make the report specific, useful, and action-focused.

The free results should feel useful but incomplete.
The paid report should give the user the rest of the clarity.

The user should immediately understand:
- where they are likely losing the most money
- roughly how much it could be costing them
- exactly what they should do next
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
      reportJson = extractJson(rawText);
    } catch (error) {
      console.error("Claude JSON parse failed:", error);
      console.error("Claude raw response:", rawText);
      reportJson = fallbackReport(rawText);
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