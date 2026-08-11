import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Your Results | SpendShift",
  description:
    "Review your SpendShift savings results and see the biggest opportunities to cut everyday costs.",
};

export default function ResultsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
