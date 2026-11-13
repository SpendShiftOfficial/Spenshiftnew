import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "What’s Included - Free Audit & Savings Report",
  description:
    "See what's included in SpendShift's free savings audit and A$29 one-time savings plan, with three priority actions, comparison help and a savings tracker.",
};

export default function WhatsIncludedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
