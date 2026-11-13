import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore SpendShift's two options: a free eight-question savings check and a personalised savings plan for A$29 once.",
};

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
