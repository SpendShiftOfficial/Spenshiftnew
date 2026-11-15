import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Why SpendShift? Simple Money-Saving Help",
  description: "SpendShift helps Australians check bills and spending without bank logins or complex budgets. Start free, with an optional A$29 personalised plan.",
  alternates: { canonical: "https://www.spendshift.com.au/why-spendshift" },
};

export default function WhySpendShiftLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
