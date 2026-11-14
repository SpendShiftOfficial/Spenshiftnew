import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Our Services: Free Check & Savings Plan",
  description: "Explore SpendShift's two options: free results from 8 spending questions, or an A$29 personalised savings plan with practical actions and a tracker.",
  alternates: { canonical: "https://www.spendshift.com.au/services" },
};

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
