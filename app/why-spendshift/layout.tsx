import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Why SpendShift | SpendShift",
  description:
    "Learn why SpendShift helps Australians uncover everyday money leaks without needing bank connections or complicated budgeting.",
};

export default function WhySpendShiftLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
