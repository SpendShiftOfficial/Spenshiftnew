import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "How It Works - Free Savings Audit",
  description:
    "See how SpendShift's eight free questions lead to free results and an optional A$29 personalised savings plan.",
};

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
