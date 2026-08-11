import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Free Savings Audit | SpendShift",
  description:
    "Take SpendShift’s free savings audit and uncover your biggest money leaks in just a few minutes.",
};

export default function AuditLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
