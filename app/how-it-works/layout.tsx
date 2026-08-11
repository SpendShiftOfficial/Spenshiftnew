import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "How It Works | SpendShift",
  description:
    "See how SpendShift guides you through a quick savings audit and turns your answers into practical money-saving recommendations.",
};

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
