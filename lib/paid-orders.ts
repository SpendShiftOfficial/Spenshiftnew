import Stripe from "stripe";
import {validateAuditAnswers} from "./audit-schema";
import {isPersonalisationArea} from "./personalisation-questions";
import {blankDraft} from "./plan-draft";
import { Resend } from "resend";
import { supabaseAdmin } from "./supabase";

export type PaidOrder = {
  stripe_session_id: string;
  status: "awaiting_details" | "processing" | "ready" | "failed";
  answers: string[];
  refinements: unknown;
  report_id: string | null;
  customer_email: string | null;
  created_at: string;
  processing_started_at: string | null;
  attempt_count: number;
  updated_at: string;
};

const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.spendshift.com.au").replace(/\/$/, "");

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  // Paid preview tests must be deliberately enabled with test-mode Stripe and
  // a staging database. Otherwise the preview cannot read/create paid orders.
  if (process.env.VERCEL_ENV === "preview" &&
      (!key.startsWith("sk_test_") || key.includes("setup_required") || process.env.SUPABASE_URL !== "https://pcjgzbaigtsnevhcjqyd.supabase.co")) {
    throw new Error("Preview payment testing is disabled until staging is configured.");
  }
  return new Stripe(key);
}

export function auditAnswersFromSession(session: Stripe.Checkout.Session): string[] {
  let answers: unknown;
  try {
    answers = JSON.parse(session.metadata?.answers || "null");
  } catch {
    throw new Error("Payment metadata contains invalid audit answers.");
  }
  if (!Array.isArray(answers) || answers.length !== 8 || answers.some(a => typeof a !== "string" || a.length > 180)) {
    throw new Error("Payment metadata is missing the eight audit answers.");
  }
  return validateAuditAnswers(answers);
}

function isCorrectReportPurchase(session: Stripe.Checkout.Session): boolean {
  return session.mode === "payment" &&
    session.currency?.toLowerCase() === "aud" &&
    session.amount_total === 3900 &&
    session.metadata?.product === "spendshift_full_report";
}

export async function paidSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  if (typeof sessionId !== "string" || !/^cs_(?:test|live)_[A-Za-z0-9]{12,200}$/.test(sessionId)) {
    throw new Error("Invalid payment session.");
  }
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") throw new Error("Payment is not complete.");
  if (!isCorrectReportPurchase(session)) throw new Error("Payment does not match a SpendShift full report.");
  return session;
}

/** Idempotent: duplicate webhook calls never reset an existing order. */
export async function ensurePaidOrder(session: Stripe.Checkout.Session): Promise<{ order: PaidOrder; created: boolean }> {
  if (session.payment_status !== "paid") throw new Error("Cannot record an unpaid order.");
  if (!isCorrectReportPurchase(session)) throw new Error("Invalid report purchase.");
  const answers = auditAnswersFromSession(session);
  const savedArea = session.metadata?.additional_area || "";
  if (savedArea && !isPersonalisationArea(savedArea)) throw new Error("Invalid paid spending area.");
  // The first paid draft keeps an explicitly chosen area even when the free
  // eight-question screening found none. Never overwrite an existing paid order.
  const initialRefinements = savedArea
    ? { version: 1, draft: { ...blankDraft(answers), additionalArea: savedArea } }
    : null;
  const { data: created, error } = await supabaseAdmin
    .from("report_orders")
    .upsert({
      stripe_session_id: session.id,
      status: "awaiting_details",
      answers,
      ...(initialRefinements ? { refinements: initialRefinements } : {}),
      customer_email: session.customer_details?.email || session.customer_email || null,
      paid_at: new Date().toISOString(),
    }, { onConflict: "stripe_session_id", ignoreDuplicates: true })
    .select("stripe_session_id");
  if (error) throw new Error("Could not record your payment. Please try again.");
  const order = await readPaidOrder(session.id);
  if (!order) throw new Error("Payment record could not be read.");
  return { order, created: Array.isArray(created) && created.length > 0 };
}

export async function readPaidOrder(sessionId: string): Promise<PaidOrder | null> {
  const { data, error } = await supabaseAdmin
    .from("report_orders")
    .select("stripe_session_id,status,answers,refinements,report_id,customer_email,created_at,processing_started_at,attempt_count,updated_at")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (error) throw new Error("Could not load the payment record.");
  return data as PaidOrder | null;
}

export async function readExistingReportId(sessionId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .limit(1);
  if (error) throw new Error("Could not check the existing report.");
  return data?.[0]?.id ?? null;
}

function htmlSafe(value: string): string {
  return value.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[c] || c);
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not configured.");
  const result = await new Resend(key).emails.send({
    from: "SpendShift <info@spendshift.com.au>",
    to,
    subject,
    html: '<div style="font-family:Arial,sans-serif;color:#173621;max-width:580px;margin:auto;padding:32px"><h1 style="color:#059625">SpendShift</h1>' +
      '<p style="font-size:17px;line-height:1.6">' + body + '</p><p style="font-size:12px;color:#566559;margin-top:30px">SpendShift Enterprises Pty Ltd · Australia<br>General information, not financial advice.</p></div>',
  });
  if (result.error) throw new Error(result.error.message);
}

async function claimEmailColumn(sessionId: string, column: "confirmation_sent_at" | "report_sent_at"): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("report_orders")
    .update({ [column]: new Date().toISOString() })
    .eq("stripe_session_id", sessionId)
    .is(column, null)
    .select("stripe_session_id");
  if (error) throw error;
  return Boolean(data?.length);
}

export async function sendOrderConfirmationOnce(order: PaidOrder): Promise<void> {
  if (!order.customer_email || !process.env.RESEND_API_KEY || (process.env.VERCEL_ENV === "preview" && process.env.PHASE1_TEST_EMAILS !== "enabled")) return;
  if (!(await claimEmailColumn(order.stripe_session_id, "confirmation_sent_at"))) return;
  try {
    const url = site + "/success?session_id=" + encodeURIComponent(order.stripe_session_id);
    await sendEmail(
      order.customer_email,
      "Your SpendShift payment is confirmed — finish your savings report",
      "Your $39 payment is confirmed. Your report is reserved. Next, answer short questions about the areas in your plan. You can skip any amount you do not know. Your progress is saved as you go.<br><br>" +
      '<a style="background:#059625;color:#fff;padding:13px 22px;border-radius:24px;text-decoration:none;display:inline-block" href="' + htmlSafe(url) + '">Continue to your report</a><br><br>' +
      "Keep this link private because it provides access to your purchase.",
    );
  } catch (e) {
    await supabaseAdmin.from("report_orders").update({ confirmation_sent_at: null }).eq("stripe_session_id", order.stripe_session_id);
    throw e;
  }
}

export async function sendReadyEmailOnce(order: PaidOrder, reportId: string): Promise<void> {
  if (!order.customer_email || !process.env.RESEND_API_KEY || (process.env.VERCEL_ENV === "preview" && process.env.PHASE1_TEST_EMAILS !== "enabled")) return;
  if (!(await claimEmailColumn(order.stripe_session_id, "report_sent_at"))) return;
  try {
    const url = site + "/report/" + encodeURIComponent(reportId);
    const editUrl = site + "/personalise?session_id=" + encodeURIComponent(order.stripe_session_id) + "&revise=1";
    await sendEmail(
      order.customer_email,
      "Your SpendShift savings report is ready",
      "Your personalised SpendShift savings report is ready. Review the relevant opportunities and practical next steps.<br><br>" +
      '<a style="background:#059625;color:#fff;padding:13px 22px;border-radius:24px;text-decoration:none;display:inline-block" href="' + htmlSafe(url) + '">Open my report</a><br><br>' +
      '<a style="color:#087332;text-decoration:underline" href="' + htmlSafe(editUrl) + '">Fix an answer in my plan</a><br><br>' +
      "Keep these private links safe. They give access to your plan. Possible savings are not money saved yet.",
    );
  } catch (e) {
    await supabaseAdmin.from("report_orders").update({ report_sent_at: null }).eq("stripe_session_id", order.stripe_session_id);
    throw e;
  }
}
