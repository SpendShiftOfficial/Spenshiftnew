import "./globals.css";
import type { Metadata } from "next";
import { Inter, Mona_Sans } from "next/font/google";
import ConsentBanner from "@/components/ConsentBanner";
import BasicAnalytics from "@/components/BasicAnalytics";
import {analyticsFixtureEnabled} from "@/lib/analytics-v2/fixture-mode";
import {releaseCapabilities} from "@/lib/analytics-v2/release-config.mjs";
import {purchaseAttributionEnabled} from "@/lib/analytics-v2/purchase-attribution.mjs";

const inter = Inter({
subsets: ["latin"],
variable: "--font-inter",
display: "swap",
});

const monaSans = Mona_Sans({
subsets: ["latin"],
variable: "--font-mona-sans",
display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.spendshift.com.au"),

  title: {
    default: "Free Savings Check for Australians | SpendShift",
    template: "%s | SpendShift",
  },

  description:
    "Answer 8 free questions about your spending. See bills and everyday costs worth checking, then choose an optional A$29 savings plan with clear next steps.",

  keywords: [
    "money saving",
    "personal finance",
    "budget audit",
    "financial health",
    "Australia",
    "free savings check",
    "personalised savings plan",
    "SpendShift",
  ],

  authors: [{ name: "SpendShift" }],

  creator: "SpendShift",

  publisher: "SpendShift",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "SpendShift",
    description:
      "Answer eight free questions to see what to check first. A personalised savings plan costs A$29 once.",
    url: "https://www.spendshift.com.au",
    siteName: "SpendShift",
    locale: "en_AU",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SpendShift: Free savings check for Australians",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "SpendShift",
    description:
      "Start with free spending results. Get a personalised savings plan for A$29 once if you want more help.",
    images: ["/opengraph-image"],
  },

  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fixture=analyticsFixtureEnabled(),release=releaseCapabilities(process.env);
  const granular=fixture||release.privacy;
  const attribution=fixture?process.env.SPENDSHIFT_PURCHASE_ATTRIBUTION_FIXTURE==="true":purchaseAttributionEnabled(process.env);
  return (
    <html data-ss-privacy-mode={granular?'v2':undefined} data-ss-purchase-attribution={attribution?'v1':undefined} lang="en" className={`${inter.variable} ${monaSans.variable}`}>
      <head>
        
       
      </head>

      <body>
        {fixture||release.privacy ? <BasicAnalytics fixture={fixture} granular={granular} collectionEnabled={fixture||release.collect} attributionEnabled={attribution}>{children}</BasicAnalytics> : <><ConsentBanner />{children}</>}
{/* First-party-only candidate: no browser measurement provider is mounted. */}


      </body>
    </html>
  );
}
