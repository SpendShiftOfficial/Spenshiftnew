import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Payment Successful | SpendShift",
  description:
    "Your payment was successful and your SpendShift report is being prepared.",
};

export default function SuccessLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
