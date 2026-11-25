"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {isMarketingPath,cleanPublicMarketingQuery} from "@/lib/privacy";
import {optionalPermissions} from "@/lib/analytics-v2/optional";
import {trackEvent} from "@/lib/gtag";
type Permissions={analytics:boolean;ads:boolean};
type ProviderWindow=Window&{__ssV2Providers?:Permissions;__ssV2Document?:string;__ssV2Blocked?:boolean;fbq?:any;_fbq?:any;ttq?:any;clarity?:any;["ga-disable-G-MEHDG2Y7T2"]?:boolean;};
const equal=(a:Permissions,b:Permissions)=>a.analytics===b.analytics&&a.ads===b.ads;
const none=()=>({analytics:false,ads:false});
function choice(){try{return optionalPermissions(localStorage);}catch{return none();}}
function scope(){return isMarketingPath(location.pathname)&&!location.hash&&cleanPublicMarketingQuery(location.search).allowed;}
function script(id:string,src:string){if(document.getElementById(id))return;const s=document.createElement("script");s.id=id;s.async=true;s.src=src;s.referrerPolicy="no-referrer";document.head.appendChild(s);}
function loadAnalytics(w:ProviderWindow,allowed:()=>boolean){
 if(!allowed())return;
 w.dataLayer=w.dataLayer||[];
 w.gtag=function(){w.dataLayer?.push(arguments as any);};
 w["ga-disable-G-MEHDG2Y7T2"]=false;
 w.gtag("consent","default",{analytics_storage:"granted",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
 w.gtag("js",new Date());
 w.gtag("config","G-MEHDG2Y7T2",{allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+location.pathname+location.search,page_referrer:""});
 if(allowed())script("ss-v2-ga","https://www.googletagmanager.com/gtag/js?id=G-MEHDG2Y7T2");
 if(!allowed())return;
 const c:any=function(...args:unknown[]){(c.q=c.q||[]).push(args);};
 w.clarity=w.clarity||c;
 w.clarity?.('consentv2',{ad_Storage:'denied',analytics_Storage:'granted'});
 if(allowed())script("ss-v2-clarity","https://www.clarity.ms/tag/ykimmnar80");
}
function loadAds(w:ProviderWindow,allowed:()=>boolean){
 if(!allowed())return;
 if(!w.fbq){
  const n:any=function(...args:unknown[]){if(n.callMethod)n.callMethod.apply(n,args);else n.queue.push(args);};n.push=n;n.loaded=true;n.version="2.0";n.queue=[];w.fbq=n;w._fbq=n;
  if(allowed()){n("init","1092210323744514");n("track","PageView");script("ss-v2-meta","https://connect.facebook.net/en_US/fbevents.js");}
 }
 if(!allowed())return;
 const ttq:any=w.ttq||[];w.ttq=ttq;const id="DAQ7793C77UFPT8032V0";
 (w as any).TiktokAnalyticsObject="ttq";
 const methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
 ttq.methods=methods;ttq.setAndDefer=function(t:any,e:string){t[e]=function(...args:unknown[]){t.push([e,...args]);};};
 for(const m of methods)ttq.setAndDefer(ttq,m);
 ttq.instance=(e:string)=>{const t=ttq._i?.[e]||[];for(const m of methods)ttq.setAndDefer(t,m);return t;};
 const url="https://analytics.tiktok.com/i18n/pixel/events.js";
 ttq._i=ttq._i||{};ttq._i[id]=[];ttq._i[id]._u=url;ttq._t=ttq._t||{};ttq._t[id]=Date.now();ttq._o=ttq._o||{};ttq._o[id]={};
 if(allowed()){ttq.page();script("ss-v2-tiktok",url+"?sdkid="+id+"&lib=ttq");}
}
export default function GranularPublicAnalytics({enabled}:{enabled:boolean}){
 const path=usePathname();
 useEffect(()=>{
  if(!enabled)return;
  const w=window as ProviderWindow;
  function disableAndReload(){
    w.__ssV2Providers=none();w.__ssV2Blocked=true;w["ga-disable-G-MEHDG2Y7T2"]=true;
    // Do not send cookieless consent pings on withdrawal. Replace the document.
    location.reload();
  }
  function refresh(){
    if(w.__ssV2Blocked)return;
    const selected=scope()?choice():none(),loaded=w.__ssV2Providers;
    if(loaded&&(loaded.analytics||loaded.ads)){
      if(!equal(loaded,selected)||w.__ssV2Document!==location.pathname+location.search+location.hash){disableAndReload();return;}
      return;
    }
    if(!selected.analytics&&!selected.ads)return;
    // Never forward arbitrary query values. Retain only fixed campaign labels.
    const q=new URLSearchParams(location.search),safe=new URLSearchParams();
    const source=q.get("utm_source"),medium=q.get("utm_medium"),campaign=q.get("utm_campaign");
    if(source&&["facebook","instagram","google","tiktok"].includes(source))safe.set("utm_source",source);
    if(medium&&["paid_social","organic_social","organic","cpc"].includes(medium))safe.set("utm_medium",medium);
    if(campaign==="meta_founder_v1")safe.set("utm_campaign",campaign);
    const search=safe.toString(),wanted=location.pathname+(search?"?"+search:"");
    if(location.pathname+location.search!==wanted){try{history.replaceState(history.state,"",wanted);}catch{return;}}
    if(!scope()||!equal(choice(),selected))return;
    w.__ssV2Document=location.pathname+location.search;
    w.__ssV2Providers=selected;
    const still=(category:keyof Permissions)=>!w.__ssV2Blocked&&scope()&&choice()[category]&&w.__ssV2Document===location.pathname+location.search;
    if(selected.analytics)loadAnalytics(w,()=>still("analytics"));
    if(selected.ads)loadAds(w,()=>still("ads"));
  }
  const click=(e:MouseEvent)=>{
    if(!(w.__ssV2Providers?.analytics||w.__ssV2Providers?.ads)||!(e.target instanceof Element))return;
    const a=e.target.closest("a[href]");if(!(a instanceof HTMLAnchorElement))return;
    const u=new URL(a.href,location.href);
    if(u.origin!==location.origin||a.hasAttribute("download")||a.target&&a.target!=="_self"||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;
    if(u.pathname==="/audit"&&!u.search&&!u.hash&&choice().analytics){trackEvent("audit_cta_click");w.clarity?.("event","audit_cta_click");}
    if(u.href!==location.href){e.preventDefault();e.stopImmediatePropagation();location.assign(u.href);}
  };
  const storage=(e:StorageEvent)=>{if(e.key===null||e.key==="spendshift_privacy_v2"||e.key==="spendshift_cookie_consent")refresh();};
  const restore=()=>refresh();
  refresh();
  window.addEventListener("ss-v2-preferences",refresh);window.addEventListener("storage",storage);
  window.addEventListener("pageshow",restore);window.addEventListener("focus",restore);window.addEventListener("popstate",restore);window.addEventListener("hashchange",restore);
  // After the window-capture first-party CTA listener; prevent Next client transition
  // at document capture so no tracker survives into a private page.
  document.addEventListener("click",click,true);
  return()=>{window.removeEventListener("ss-v2-preferences",refresh);window.removeEventListener("storage",storage);window.removeEventListener("pageshow",restore);window.removeEventListener("focus",restore);window.removeEventListener("popstate",restore);window.removeEventListener("hashchange",restore);document.removeEventListener("click",click,true);};
 },[enabled,path]);
 return null;
}
