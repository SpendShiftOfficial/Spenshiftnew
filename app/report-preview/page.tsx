import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import SimpleSavingsReport from "@/app/report/[id]/SimpleSavingsReport";
import { previewProfiles } from "@/lib/personalisation-questions";
import { analyseSavings } from "@/lib/savings-engine";
import { validateRefinements } from "@/lib/report-refinements";

export const metadata: Metadata = {
  title: "SpendShift — report design preview",
  robots: { index: false, follow: false },
};

const examples = {
  "subscriptions-insurance": {
    label: "Subscriptions + insurance",
    details: { subscriptionsMonthly: "120", unusedSubscriptionChoice: "yes", unusedSubscriptionName: "Old video app", unusedSubscriptionMonthly: "15" },
    insurancePolicies: [
      { type: "Car", premium: "1800", paymentPeriod: "year" },
      { type: "Home or contents", premium: "240", paymentPeriod: "month" },
      { type: "Health", premium: "250", paymentPeriod: "month" },
    ],
  },
  "takeaway-convenience": {
    label: "Takeaway + small buys",
    details: { takeawayOrder: "30", takeawayOrdersPerWeek: "6", takeawaySwapPerWeek: "2", takeawayReplacementCost: "10", convenienceWeekly: "35", convenienceGoalWeekly: "25" },
    insurancePolicies: [],
  },
  "household-bills": {
    label: "Phone + power",
    details: {
      state: "NSW", internetMonthly: "79.95", mobileMonthly: "44.90",
      electricityBill: "425.50", electricityPeriod: "quarter",
    },
    insurancePolicies: [],
  },
  "all-seven": {
    label: "All 7 areas — big test",
    details: {
      takeawayOrder: "120", takeawayOrdersPerWeek: "7",
      takeawaySwapPerWeek: "3", takeawayReplacementCost: "40",
      subscriptionsMonthly: "70", unusedSubscriptionChoice: "no",
      convenienceWeekly: "100", convenienceGoalWeekly: "70",
      internetMonthly: "85", mobileMonthly: "55",
      state: "NSW", electricityBill: "520", electricityPeriod: "quarter", gasMonthly: "85",
      unplannedArea: "Online shopping", shoppingTrigger: "Social media",
    },
    insurancePolicies: [
      { type: "Car", premium: "1800", paymentPeriod: "year", renewal: "later" },
      { type: "Home or contents", premium: "240", paymentPeriod: "month", renewal: "soon" },
      { type: "Health", premium: "250", paymentPeriod: "month", renewal: "not_sure" },
    ],
  },
  "few-opportunities": {
    label: "No clear savings areas",
    details: {},
    insurancePolicies: [],
  },
} as const;

export default async function ReportPreview({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  if (process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development") {
    notFound();
  }
  const params = await searchParams;
  const key: keyof typeof examples =
    params.customer && Object.prototype.hasOwnProperty.call(examples, params.customer)
      ? params.customer as keyof typeof examples
      : "subscriptions-insurance";
  const example = examples[key];
  const answers = previewProfiles[key].answers;
  const refinements = validateRefinements({
    version: 1,
    details: example.details,
    insurancePolicies: example.insurancePolicies,
  });
  const analysis = analyseSavings(answers, refinements);

  return (
    <div className="auditPage">
      <Header simple />
      <section style={{
        maxWidth: 850, margin: "24px auto 0", padding: "16px 18px",
        background: "#fff7dd", borderRadius: 13, border: "1px solid #f0dfa5",
        color: "#5d4c22", width: "calc(100% - 24px)"
      }}>
        <strong>DESIGN TEST ONLY — NO REAL CUSTOMER DATA</strong>
        <p style={{ margin: "7px 0 12px", fontSize: 14 }}>
          Switch between fake customer answers below. This does not charge anyone or save a report.
        </p>
        <nav aria-label="Example customers" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {(Object.keys(examples) as (keyof typeof examples)[]).map(item => (
            <Link
              key={item}
              href={"/report-preview?customer=" + item}
              style={{ fontWeight: 750, textDecoration: item === key ? "underline" : "none", color: "#165c2c", fontSize: 14 }}
            >{examples[item].label}</Link>
          ))}
        </nav>
      </section>
      <SimpleSavingsReport
        reportId={"demo-" + key}
        answers={answers}
        analysis={analysis}
        refinements={refinements}
      />
    </div>
  );
}
