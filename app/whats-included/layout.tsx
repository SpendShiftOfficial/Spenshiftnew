import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "What's Included in Your Savings Plan",
  description: "See what your A$29 SpendShift plan includes: 3 priority actions, help comparing costs, a clear checklist and a way to record real savings.",
  alternates: { canonical: "https://www.spendshift.com.au/whats-included" },
};

export default function WhatsIncludedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
