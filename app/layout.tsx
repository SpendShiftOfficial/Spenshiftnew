import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpendShift",
  description: "Find your biggest money leaks in under 2 minute.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />

        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Mona+Sans:ital,wdth,wght@0,75..125,200..900;1,75..125,200..900&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        {children}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MEHDG2Y7T2"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MEHDG2Y7T2');
          `}
        </Script>
      </body>
    </html>
  );
}