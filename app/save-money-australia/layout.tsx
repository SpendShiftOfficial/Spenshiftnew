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

const articleStructuredData = {
"@context": "https://schema.org",
"@type": "Article",
"@id": "https://www.spendshift.com.au/save-money-australia#article",
headline: "How to Save Money in Australia: 12 Practical Ways",
description:
"Discover practical ways to save money in Australia across bills, groceries, subscriptions and everyday expenses, plus a free 2-minute savings audit.",
url: "https://www.spendshift.com.au/save-money-australia",
mainEntityOfPage: {
"@type": "WebPage",
"@id": "https://www.spendshift.com.au/save-money-australia",
},
author: {
"@type": "Organization",
"@id": "https://www.spendshift.com.au/#organization",
name: "SpendShift",
url: "https://www.spendshift.com.au/",
},
publisher: {
"@type": "Organization",
"@id": "https://www.spendshift.com.au/#organization",
name: "SpendShift",
url: "https://www.spendshift.com.au/",
},
inLanguage: "en-AU",
about: {
"@type": "Thing",
name: "Saving money in Australia",
},
isAccessibleForFree: true,
};

export default function SaveMoneyAustraliaLayout({
children,
}: {
children: ReactNode;
}) {
return (
<>
<script
type="application/ld+json"
dangerouslySetInnerHTML={{
__html: JSON.stringify(articleStructuredData).replace(/</g, "\\u003c"),
}}
/>
{children}
</>
);
}
