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
    default: "SpendShift | Find Hidden Money Leaks",
    template: "%s | SpendShift",
  },

  description:
    "SpendShift helps Australians uncover hidden money leaks with a free money check and a clear, step-by-step savings plan.",

  keywords: [
    "money saving",
    "personal finance",
    "budget audit",
    "financial health",
    "Australia",
    "AI savings",
    "expense tracker",
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
      "Find bills and spending worth checking, with clear steps to follow.",
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
      "Find hidden money leaks and save more with a step-by-step savings plan.",
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
