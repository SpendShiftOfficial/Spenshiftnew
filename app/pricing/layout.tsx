import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing: Free Check & A$29 Savings Plan",
  description: "The SpendShift savings check is free. Upgrade after your results to a personalised A$29 plan. Pay once, with no subscription or recurring charge.",
  alternates: { canonical: "https://www.spendshift.com.au/pricing" },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
