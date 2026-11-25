"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import {usePathname} from "next/navigation";
import {useReportWebVitals} from "next/web-vitals";
import {protectRollback} from "@/lib/analytics-v2/optional";
import Link from "next/link";
import {browserCollector,type Collector,type Choice,type Preference} from "@/lib/analytics-v2/browser.mjs";
import {pages,enums,sourceCategory,campaignCategory,type Metric} from "@/lib/analytics-v2/core.mjs";
const noop=()=>false;
const Context=createContext({emit:noop as (event:Metric)=>boolean,allowed:noop,ready:false,revision:0});
const pageCode=(path:string)=>Object.keys(pages).find(key=>pages[key]===path);
const eligible=(path:string)=>!!pageCode(path)||path==="/audit"||path==="/results";
const visible=()=>document.visibilityState==="visible"&&!(document as Document&{prerendering?:boolean}).prerendering;
export function useBasicMetricScope(){
 const {emit,allowed,ready,revision}=useContext(Context);
 const seen=useRef(new Set<string>());
 const record=useCallback((event:string,fields:Record<string,string|number>={},key?:string)=>{
   if(typeof document==="undefined"||!visible()||!allowed())return false;
   const payload:Metric={v:2,event,...fields};
   const mark=key??JSON.stringify(payload);
   if(seen.current.has(mark)||!emit(payload))return false;
   seen.current.add(mark);return true;
 },[emit,allowed]);
 const reset=useCallback(()=>seen.current.clear(),[]);
 return {record,reset,ready,revision};
}
export function useForegroundClock(active:boolean,run:number){
 const {allowed,revision}=useContext(Context);
 const total=useRef(0),start=useRef<number|null>(null),invalid=useRef(true);
 useEffect(()=>{
   total.current=0;start.current=null;invalid.current=!active||!allowed();if(!active)return;
   const update=()=>{const now=performance.now();if(!allowed())invalid.current=true;if(start.current!==null)total.current+=Math.max(0,now-start.current);start.current=!invalid.current&&visible()?now:null;};
   update();document.addEventListener("visibilitychange",update);
   return()=>{document.removeEventListener("visibilitychange",update);start.current=null;};
 },[active,run,allowed]);
 useEffect(()=>{if(!allowed())invalid.current=true;},[revision,allowed]);
 return useCallback(()=>invalid.current||!allowed()?null:total.current+(start.current===null?0:Math.max(0,performance.now()-start.current)),[allowed]);
}
export const durationBucket=(ms:number)=>ms<30000?"under_30":ms<60000?"30_59":ms<120000?"60_119":ms<240000?"120_239":"240_plus";
function PublicObserver({path,entry}:{path:string;entry:()=>void}){
 const code=pageCode(path);
 const {record,ready,revision}=useBasicMetricScope();
 const {allowed}=useContext(Context);
 const elapsed=useRef(0),last=useRef<number|null>(null),height=useRef({h:0,at:0});
 useEffect(()=>{
   if(!ready||!code)return;
   const tick=()=>{
     if(location.pathname!==path||!visible()||!allowed()){last.current=null;return;}
     const now=performance.now();
     entry();record("public_page_view",{page:code});
     if(last.current!==null)elapsed.current+=Math.min(1000,Math.max(0,now-last.current));
     last.current=now;
     if(elapsed.current>=10000)record("engaged_10s",{page:code});
     if(elapsed.current>=30000)record("engaged_30s",{page:code});
     const h=document.documentElement.scrollHeight;
     if(h!==height.current.h){height.current={h,at:now};return;}
     if(h>0&&now-height.current.at>=500){const depth=100*(scrollY+innerHeight)/h;for(const n of [25,50,75,90])if(depth>=n)record("scroll_"+n,{page:code});}
   };
   const onVisibility=()=>{last.current=null;tick();};
   const click=(e:MouseEvent)=>{
     if(!e.isTrusted||!visible()||location.pathname!==path||!(e.target instanceof Element))return;
     const a=e.target.closest("a[data-ss-cta],a[data-ss-nav]");if(!(a instanceof HTMLAnchorElement))return;
     const destination=a.getAttribute("href"),place=a.getAttribute("data-ss-cta");
     if(destination==="/audit"&&place&&enums.placement.includes(place))record("public_cta_click",{page:code,placement:place},"one-cta");
     if(a.hasAttribute("data-ss-nav")&&destination){const nav=pageCode(destination);if(nav)record("public_nav_click",{page:nav});}
   };
   const toggle=(e:Event)=>{if(!visible()||location.pathname!==path)return;const d=e.target;if(d instanceof HTMLDetailsElement&&d.open){const faq=d.getAttribute("data-ss-faq");if(faq&&enums.faq.includes(faq))record("faq_open",{faq});}};
   tick();const timer=window.setInterval(tick,500);
   window.addEventListener("click",click,true);document.addEventListener("toggle",toggle,true);
   document.addEventListener("visibilitychange",onVisibility);
   return()=>{clearInterval(timer);last.current=null;window.removeEventListener("click",click,true);document.removeEventListener("toggle",toggle,true);document.removeEventListener("visibilitychange",onVisibility);};
 },[code,path,ready,revision,record,entry,allowed]);
 return null;
}
// Use Next's Web Vitals instrumentation, restricted to the original public document.
function VitalObserver({initialPath}:{initialPath:string}){
 const {emit,ready}=useContext(Context);
 const seen=useRef(new Set<string>());
 const callback=useCallback((metric:{name:string;value:number})=>{
   if(!ready||!pageCode(initialPath)||location.pathname!==initialPath||seen.current.has(metric.name))return;
   const n=metric.value;if(!Number.isFinite(n)||n<0)return;
   let payload:Metric|undefined;
   if(metric.name==="LCP")payload={v:2,event:"lcp_bucket",lcp:n<=2500?"0_2500":n<=4000?"2501_4000":"4001_plus"};
   if(metric.name==="INP")payload={v:2,event:"inp_bucket",inp:n<=200?"0_200":n<=500?"201_500":"501_plus"};
   if(metric.name==="CLS")payload={v:2,event:"cls_bucket",cls:n<=.1?"0_010":n<=.25?"010_025":"025_plus"};
   if(payload&&emit(payload))seen.current.add(metric.name);
 },[emit,ready,initialPath]);
 useReportWebVitals(callback);
 return null;
}
export default function BasicAnalytics({children,fixture=true,granular=false}:{children:ReactNode;fixture?:boolean;granular?:boolean}){
 const path=usePathname(),initialPath=useRef(path);
 const collector=useRef<Collector|null>(null),notice=useRef<HTMLElement|null>(null);
 const [ready,setReady]=useState(false),[revision,setRevision]=useState(0);
 const [pref,setPref]=useState<Preference|null>(null),[legacy,setLegacy]=useState<string|null>(null);
 const [status,setStatus]=useState("");
 const [settings,setSettings]=useState(false);
 const entrySeen=useRef(false),noticeSeen=useRef(false);
 useEffect(()=>{
   collector.current=browserCollector({enabled:true,noticeVisible:()=>eligible(location.pathname)&&!!notice.current?.getClientRects().length});
   const state=collector.current.state();setPref(state.pref);setLegacy(state.legacy);setReady(true);
   const sync=(e:StorageEvent)=>{if(e.key===null||e.key==="spendshift_privacy_v2"||e.key==="spendshift_cookie_consent"){
     const c=collector.current?.state();if(c){setPref(c.pref);setLegacy(c.legacy);setRevision(v=>v+1);}
   }};
   window.addEventListener("storage",sync);return()=>{window.removeEventListener("storage",sync);collector.current=null;};
 },[]);
 const emit=useCallback((event:Metric)=>collector.current?.emit(event)===true,[]);
 const allowed=useCallback(()=>collector.current?.allowed()===true,[]);
 const entry=useCallback(()=>{
   if(entrySeen.current||location.pathname!==initialPath.current)return;
   const code=pageCode(initialPath.current);if(!code)return;
   const source=sourceCategory(document.referrer,location.origin);
   if(source===null){entrySeen.current=true;return;}
   const ua=navigator.userAgent;
   const browser=/Edg\//.test(ua)?"edge":/Firefox\//.test(ua)?"firefox":/Chrome\//.test(ua)?"chrome":/Safari\//.test(ua)?"safari":"other_or_unknown";
   const device=innerWidth<600?"mobile":innerWidth<1024?"tablet":"desktop";
   if(emit({v:2,event:"site_entry",page:code,source,campaign:campaignCategory(location.search),device,browser}))entrySeen.current=true;
 },[emit]);
 useEffect(()=>{
   if(!ready||!eligible(path))return;
   const observe=()=>{if(!noticeSeen.current&&visible()&&emit({v:2,event:"privacy_notice_shown"}))noticeSeen.current=true;};
   observe();document.addEventListener("visibilitychange",observe);return()=>document.removeEventListener("visibilitychange",observe);
 },[ready,path,revision,emit]);
 function change(analytics:Choice,ads:Choice,basicOff?:boolean,transition=false){
   const c=collector.current;if(!c)return;
   try{if(granular)protectRollback(localStorage,analytics,ads);}catch{setStatus("Preferences unavailable. Measurement remains restricted.");return;}
   if(c.choose({analytics,ads,basicOff,transition})){
      setPref(c.state().pref);setLegacy(c.state().legacy);setRevision(v=>v+1);setStatus(fixture?"Preferences saved for this synthetic test.":"Privacy choices saved.");
      if(granular)window.dispatchEvent(new Event("ss-v2-preferences"));
   }else {setStatus("Preferences unavailable. New measurement remains restricted.");if(granular)window.dispatchEvent(new Event("ss-v2-preferences"));}

 }
 useEffect(()=>{
   const open=()=>{setSettings(true);requestAnimationFrame(()=>{notice.current?.focus();notice.current?.scrollIntoView({block:"start"});});};
   window.addEventListener("open-cookie-settings",open);return()=>window.removeEventListener("open-cookie-settings",open);
 },[]);
 const currentAnalytics=pref?.analytics??(granular&&legacy==="granted"?"granted":"unset"),currentAds=pref?.ads??(granular&&legacy==="granted"?"granted":"unset");
 const privateSettings=granular&&!eligible(path)&&(path==="/personalise"||path==="/success"||path.startsWith("/report/"));
 return <Context.Provider value={{emit,allowed,ready,revision}}>
   {privateSettings&&!settings&&<button type="button" onClick={()=>setSettings(true)} style={{margin:"8px"}}>Privacy settings</button>}
   {(eligible(path)||privateSettings&&settings)&&<aside ref={notice} tabIndex={-1} aria-label="Synthetic privacy settings" style={{padding:"12px 16px",background:"#f3f7f3",color:"#17291b",borderBottom:"1px solid #cad8ca",fontSize:"14px"}}>
     <strong>{fixture?"Test environment only — privacy choices":"Your privacy choices"}</strong>
     <p>{fixture?"Limited aggregate statistics help improve SpendShift. No individual browsing profiles. Optional analytics and advertising are separate. This is draft wording, not a published privacy notice.":"We use limited first-party statistics to improve SpendShift, without creating individual browsing profiles. You can turn basic statistics off. Optional website analytics and advertising tracking are off unless you allow them. Your choices do not affect the savings check."}</p>
     {granular&&<p><Link href="/privacy-policy">Privacy Policy</Link>{" · "}<Link href="/cookies">Cookie Policy</Link></p>}
     <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
       <button type="button" onClick={()=>change("granted","granted")}>Accept optional</button>
       <button type="button" onClick={()=>change("denied","denied")}>Reject optional</button>
       <button type="button" onClick={()=>change(currentAnalytics,currentAds,true)}>Turn off basic statistics</button>
       <button type="button" onClick={()=>change(currentAnalytics,currentAds,false,true)}>Explicitly enable basic statistics</button>
     </div>
     <details><summary>Separate optional preferences</summary>
       <label><input type="checkbox" checked={currentAnalytics==="granted"} onChange={e=>change(e.target.checked?"granted":"denied",currentAds)}/> Optional website analytics</label>{" "}
       <label><input type="checkbox" checked={currentAds==="granted"} onChange={e=>change(currentAnalytics,e.target.checked?"granted":"denied")}/> Optional advertising</label>
     </details>
     {legacy!==null&&!pref?.legacyTransition&&<p>Your earlier privacy choice is preserved. Basic statistics remain off unless you explicitly enable them under this notice.</p>}
     <p role="status">{status}</p>
   </aside>}
   {children}
   {pageCode(path)&&<PublicObserver key={path} path={path} entry={entry}/>}
   <VitalObserver initialPath={initialPath.current}/>
 </Context.Provider>;
}
