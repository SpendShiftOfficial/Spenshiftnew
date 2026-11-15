"use client";
import Script from 'next/script';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {isMarketingPath} from '@/lib/privacy';
export default function PublicAnalytics({enabled}:{enabled:boolean}){
 const pathname=usePathname();const [allowed,setAllowed]=useState(false);
 useEffect(()=>{
  let consent=false;try{consent=localStorage.getItem('spendshift_cookie_consent')==='granted';}catch{}
  const ok=enabled&&consent&&isMarketingPath(pathname)&&!location.search&&!location.hash;
  if(!ok&&(window as any).__spendshiftPublicTracking){location.replace(location.href);return;}
  (window as any).__spendshiftPublicTracking=ok;setAllowed(ok);
  // Full navigation creates a fresh, tracker-free document before any answers are entered.
  const leave=(event:MouseEvent)=>{const link=(event.target as Element)?.closest?.('a');if(!link)return;const url=new URL(link.href,location.href);if(url.origin===location.origin&&(!isMarketingPath(url.pathname)||url.search||url.hash)){event.preventDefault();event.stopImmediatePropagation();location.assign(url.href);}};
  if(ok)window.addEventListener('click',leave,true);
  return()=>window.removeEventListener('click',leave,true);
 },[pathname,enabled]);
 if(!allowed)return null;
 return (<><Script id="consent-default" strategy="afterInteractive">
{`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
analytics_storage: 'denied',
ad_storage: 'denied',
ad_user_data: 'denied',
ad_personalization: 'denied',
wait_for_update: 500
});
`}
</Script>
        <Script id="consent-restore" strategy="afterInteractive">
{`
try {
var savedConsent = localStorage.getItem("spendshift_cookie_consent");

if (savedConsent === "granted" || savedConsent === "denied") {
gtag("consent", "update", {
analytics_storage: savedConsent,
ad_storage: savedConsent,
ad_user_data: savedConsent,
ad_personalization: savedConsent
});
}
} catch (e) {}
`}
</Script>
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
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "ykimmnar80");
          `}
        </Script>
        {/* TIK TOK PIXEL INTEGRATION */}
        <Script id="tiktok-pixel" strategy="lazyOnload">
  {`
  if (localStorage.getItem("spendshift_cookie_consent") === "granted") {
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
    }
  `}
</Script>
{/* META INTEGRATION */}
<Script id="meta-pixel" strategy="lazyOnload">
  {`
  if (localStorage.getItem("spendshift_cookie_consent") === "granted") {
    !function(f,b,e,v,n,t,s)
    {
      if(f.fbq)return;
      n=f.fbq=function(){
        n.callMethod
          ? n.callMethod.apply(n,arguments)
          : n.queue.push(arguments)
      };
      if(!f._fbq)f._fbq=n;
      n.push=n;
      n.loaded=!0;
      n.version='2.0';
      n.queue=[];
      t=b.createElement(e);
      t.async=!0;
      t.src=v;
      s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js'
    );

    fbq('init', '1092210323744514');
    fbq('track', 'PageView');
    }
  `}
</Script></>);
}
