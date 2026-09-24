import Script from "next/script";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.spendshift.com.au"),

  title: {
    default: "SpendShift | Find Hidden Money Leaks",
    template: "%s | SpendShift",
  },

  description:
    "SpendShift helps Australians uncover hidden money leaks with a fast, AI-powered savings audit and personalised financial report.",

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
      "Find hidden money leaks and discover how much you could save every year.",
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
      "Find hidden money leaks and save more with a personalised AI savings report.",
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
        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "ykimmnar80");
          `}
        </Script>
        <Script id="tiktok-pixel" strategy="afterInteractive">
  {`
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;
      var ttq=w[t]=w[t]||[];
      ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer=function(t,e){
        t[e]=function(){
          t.push([e].concat(Array.prototype.slice.call(arguments,0)))
        }
      };

      for(var i=0;i<ttq.methods.length;i++){
        ttq.setAndDefer(ttq,ttq.methods[i]);
      }

      ttq.instance=function(t){
        for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++){
          ttq.setAndDefer(e,ttq.methods[n]);
        }
        return e;
      };

      ttq.load=function(e,n){
        var i="https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i=ttq._i||{};
        ttq._i[e]=[];
        ttq._i[e]._u=i;
        ttq._t=ttq._t||{};
        ttq._t[e]=+new Date;
        ttq._o=ttq._o||{};
        ttq._o[e]=n||{};

        var o=document.createElement("script");
        o.type="text/javascript";
        o.async=!0;
        o.src=i+"?sdkid="+e+"&lib="+t;

        var a=document.getElementsByTagName("script")[0];
        a.parentNode.insertBefore(o,a);
      };

      ttq.load("DAQ7793C77UFPT8032V0");
      ttq.page();
    }(window, document, "ttq");
  `}
</Script>
      </body>
    </html>
  );
}