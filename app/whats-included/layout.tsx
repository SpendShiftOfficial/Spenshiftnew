import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "What’s Included | SpendShift",
  description:
    "Explore what comes with SpendShift’s free audit and paid personalised report, including savings insights and action plans.",
};

export default function WhatsIncludedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
