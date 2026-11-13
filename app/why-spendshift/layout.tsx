import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Why SpendShift - Find Hidden Money Leaks",
  description:
    "See why SpendShift starts with eight free questions, Australian spending checks and an optional A$29 personalised savings plan.",
};

export default function WhySpendShiftLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
