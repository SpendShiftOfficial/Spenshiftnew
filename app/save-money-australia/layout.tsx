import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
title: "How to Save Money in Australia: 12 Practical Ways",
description:
"Discover practical ways to save money in Australia across bills, groceries, subscriptions and everyday expenses, plus a free 2-minute savings audit.",
alternates: {
canonical: "https://www.spendshift.com.au/save-money-australia",
},
};

export default function SaveMoneyAustraliaLayout({
children,
}: {
children: ReactNode;
}) {
return <>{children}</>;
}
