import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "How the Free Savings Check Works",
  description: "See how SpendShift works: answer 8 free questions, get your results, then choose a personalised A$29 savings plan if you want more help.",
  alternates: { canonical: "https://www.spendshift.com.au/how-it-works" },
};

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
