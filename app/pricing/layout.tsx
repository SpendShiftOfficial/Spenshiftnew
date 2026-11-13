import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing - Free Audit & A$29 Savings Report",
  description:
    "Answer eight questions and see free results. The personalised savings plan is A$29 once, with no subscription or recurring charge.",
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
