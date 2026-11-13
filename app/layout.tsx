import PublicAnalytics from "@/components/PublicAnalytics";
import "./globals.css";
import type { Metadata } from "next";
import { Inter, Mona_Sans } from "next/font/google";
import ConsentBanner from "@/components/ConsentBanner";

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
    default: "SpendShift | See Where You Could Spend Less",
    template: "%s | SpendShift",
  },

  description:
    "Answer eight free spending questions. See what to check first, then choose an optional A$29 personalised savings plan with clear steps.",

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
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "SpendShift",
    description:
      "Start with free spending results. Get a personalised savings plan for A$29 once if you want more help.",
    images: ["/og-image.jpg"],
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
  return (
    <html lang="en" className={`${inter.variable} ${monaSans.variable}`}>
      <head>
        
       
      </head>

      <body>
        {children}
        <ConsentBanner />
<PublicAnalytics enabled={process.env.VERCEL_ENV === "production"} />


      </body>
    </html>
  );
}
