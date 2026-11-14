import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Personalise your savings report",
  description: "Optional details to make your SpendShift savings report more relevant.",
  robots: { index: false, follow: false },
};

export default function PersonaliseLayout({ children }: { children: ReactNode }) {
  return children;
}
