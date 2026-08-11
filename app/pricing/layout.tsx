import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing | SpendShift",
  description:
    "See SpendShift’s simple pricing for the free audit and the full personalised savings report.",
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
