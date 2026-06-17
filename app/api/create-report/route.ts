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
      max_tokens: 7000,
      system: `
You are SpendShift, an Australian personal-savings audit assistant.

Create a premium personalised savings report.

Do NOT return JSON.
Do NOT use code blocks.
Do NOT give generic advice.

The report must feel:
- personal
- specific
- practical
- emotionally reassuring
- action-focused

The user should think:
"That is actually useful. I know exactly what to do next."

For every insight, use this logic:
You told us X. That usually means Y. This could be costing you Z. Here is the simplest next action.

Use this exact structure:

# Your SpendShift Savings Report

## Estimated Annual Savings
$4,276/year

## Executive Summary
Write a personalised summary.

## Clarity Statement
One clear sentence explaining the user's biggest opportunity.

## Your Top Money Leaks

### 01. Category Name
Impact: High Impact
Estimated saving: $1,300/year

What your answer revealed:
...

Why this matters:
...

Likely pattern:
...

Quick win:
...

Next step:
...

Why this reduces stress:
...

### 02. Category Name
...

## Hidden Leaks You Might Not Have Considered

### Hidden leak title
Why it is easy to miss:
...

What to do:
...

## Scripts You Can Use

### Script title
When to use:
...

Script:
...

## 30-Day Action Plan

### Week 1
Focus:
...

Actions:
- Action 1
- Action 2
- Action 3

### Week 2
...

## Final Clarity Summary
Write a short encouraging summary.

Rules:
- Use Australian English.
- Use realistic savings estimates.
- Practical money-saving guidance only.
- Non-financial-advice.
- Avoid obvious advice like "spend less" or "budget better".
- Make every section feel connected to the user's audit answers.
`,
      messages: [
        {
          role: "user",
          content: `
Create the full SpendShift report from these audit answers:

${JSON.stringify(answers, null, 2)}
`,
        },
      ],
    });

    const report = msg.content
      .map((b: any) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    const reportId = makeReportId();

    const { error } = await supabaseAdmin.from("reports").insert({
      id: reportId,
      stripe_session_id: sessionId,
      answers,
      report,
    });

    if (error) throw error;

    return NextResponse.json({ reportId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}