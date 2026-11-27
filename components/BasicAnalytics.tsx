"use client";
import {createContext,useCallback,useContext,useEffect,useId,useRef,useState,type ReactNode} from "react";
import {usePathname} from "next/navigation";
import {useReportWebVitals} from "next/web-vitals";
import {optionalAllowed,protectRollback} from "@/lib/analytics-v2/optional";
import {privacyBlocked,stopPrivacyDocument} from "@/lib/analytics-v2/privacy-runtime.mjs";
import Link from "next/link";
import styles from "./privacy-notice.module.css";
import {browserCollector,type Collector,type Choice,type Preference} from "@/lib/analytics-v2/browser.mjs";
import {pages,enums,sourceCategory,campaignCategory,type Metric} from "@/lib/analytics-v2/core.mjs";
import {homeSections,homeCtas,homeTimingEvents,createDwellTracker} from "@/lib/analytics-v2/home-engagement.mjs";
const noop=()=>false;
// Check viewport intersection, visibility and actual hit testing. Coordinates stay local.
function homeElementVisible(el:HTMLElement){
 const rect=el.getBoundingClientRect(),viewport=window.visualViewport;
 const l=viewport?.offsetLeft??0,t=viewport?.offsetTop??0,r=l+(viewport?.width??innerWidth),b=t+(viewport?.height??innerHeight);
 const x1=Math.max(l,rect.left),y1=Math.max(t,rect.top),x2=Math.min(r,rect.right),y2=Math.min(b,rect.bottom);
 const area=Math.min(rect.width,r-l)*Math.min(rect.height,b-t);
 if(area<=0||x2<=x1||y2<=y1||(x2-x1)*(y2-y1)<area*.5)return false;
 for(let n:Element|null=el;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==="none"||s.visibility!=="visible"||Number(s.opacity)===0)return false;}
 const samples=[[.5,.5],[.25,.25],[.75,.75],[.25,.75],[.75,.25]];
 return samples.filter(([x,y])=>{const hit=document.elementFromPoint(x1+(x2-x1)*x,y1+(y2-y1)*y);return !!hit&&el.contains(hit);}).length>=3;
}
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
 const homeSeen=useRef(new Set<string>()),dwell=useRef(createDwellTracker());
 useEffect(()=>{
   if(!ready||!code)return;
   const home=path==="/";
   const emitHome=(event:string)=>{
     if(homeSeen.current.has(event))return true;
     if(!record(event))return false;
     homeSeen.current.add(event);return true;
   };
   const observeHome=(now:number)=>{
     const candidates:string[]=[];
     for(const el of Array.from(document.querySelectorAll<HTMLElement>("[data-ss-home-section],a[data-ss-home-cta]"))){
       const section=el.dataset.ssHomeSection,cta=el.dataset.ssHomeCta;
       const code=section&&Object.hasOwn(homeSections,section)?"home_section_"+section+"_seen":
         cta&&Object.hasOwn(homeCtas,cta)&&el instanceof HTMLAnchorElement&&el.getAttribute("href")==="/audit"?"home_cta_"+cta+"_impression":null;
       if(code&&!homeSeen.current.has(code)&&homeElementVisible(el))candidates.push(code);
     }
     for(const code of dwell.current.update(now,candidates))emitHome(code);
   };
   const tick=()=>{
     if(location.pathname!==path||!visible()||!allowed()){last.current=null;dwell.current.reset();return;}
     const now=performance.now();
     entry();record("public_page_view",{page:code});
     if(last.current!==null)elapsed.current+=Math.min(1000,Math.max(0,now-last.current));
     last.current=now;
     if(elapsed.current>=10000)record("engaged_10s",{page:code});
     if(elapsed.current>=30000)record("engaged_30s",{page:code});
     if(home){for(const event of homeTimingEvents(elapsed.current))emitHome(event);observeHome(now);}
     const h=document.documentElement.scrollHeight;
     if(h!==height.current.h){height.current={h,at:now};return;}
     if(h>0&&now-height.current.at>=500){const depth=100*(scrollY+innerHeight)/h;for(const n of [25,50,75,90])if(depth>=n)record("scroll_"+n,{page:code});}
   };
   const onVisibility=()=>{last.current=null;dwell.current.reset();tick();};
   const click=(e:MouseEvent)=>{
     if(!e.isTrusted||!visible()||location.pathname!==path||!(e.target instanceof Element))return;
     const a=e.target.closest("a[data-ss-cta],a[data-ss-nav]");if(!(a instanceof HTMLAnchorElement))return;
     const destination=a.getAttribute("href"),place=a.getAttribute("data-ss-cta");
     if(destination==="/audit"&&place&&enums.placement.includes(place))record("public_cta_click",{page:code,placement:place},"one-cta");
     // A trusted activation also qualifies as an impression, even before a one-second dwell.
     const homeCta=a.dataset.ssHomeCta;
     if(home&&destination==="/audit"&&homeCta&&Object.hasOwn(homeCtas,homeCta)&&emitHome("home_cta_"+homeCta+"_impression"))emitHome("home_cta_"+homeCta+"_click");
     if(a.hasAttribute("data-ss-nav")&&destination){const nav=pageCode(destination);if(nav)record("public_nav_click",{page:nav});}
   };
   const toggle=(e:Event)=>{if(!visible()||location.pathname!==path)return;const d=e.target;if(d instanceof HTMLDetailsElement&&d.open){const faq=d.getAttribute("data-ss-faq");if(faq&&enums.faq.includes(faq))record("faq_open",{faq});}};
   tick();const timer=window.setInterval(tick,500);
   window.addEventListener("click",click,true);document.addEventListener("toggle",toggle,true);
   document.addEventListener("visibilitychange",onVisibility);
   return()=>{clearInterval(timer);last.current=null;dwell.current.reset();window.removeEventListener("click",click,true);document.removeEventListener("toggle",toggle,true);document.removeEventListener("visibilitychange",onVisibility);};
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
export default function BasicAnalytics({children,fixture=true,granular=false,collectionEnabled=true}:{children:ReactNode;fixture?:boolean;granular?:boolean;collectionEnabled?:boolean}){
 const path=usePathname(),initialPath=useRef(path);
 const collector=useRef<Collector|null>(null),notice=useRef<HTMLElement|null>(null);
 const [ready,setReady]=useState(false),[revision,setRevision]=useState(0);
 const [pref,setPref]=useState<Preference|null>(null),[legacy,setLegacy]=useState<string|null>(null);
 const [status,setStatus]=useState("");
 const [settings,setSettings]=useState(false);
 const settingsId=useId(),privateTrigger=useRef<HTMLButtonElement|null>(null);
 useEffect(()=>{setSettings(false);},[path]);
 const entrySeen=useRef(false),noticeSeen=useRef(false),noticePresented=useRef(false);
 useEffect(()=>{
   collector.current=browserCollector({enabled:collectionEnabled,noticeVisible:()=>eligible(location.pathname)&&noticePresented.current});
   const state=collector.current.state();setPref(state.pref);setLegacy(state.legacy);setReady(true);
   const sync=(e:StorageEvent)=>{if(e.key===null||e.key==="spendshift_privacy_v2"||e.key==="spendshift_cookie_consent"){
     const c=collector.current?.state();if(c){setPref(c.pref);setLegacy(c.legacy);setRevision(v=>v+1);}
   }};
   window.addEventListener("storage",sync);return()=>{window.removeEventListener("storage",sync);collector.current=null;};
 },[collectionEnabled]);
 // Count only after the primary disclosure and quick controls have actually been
 // in the visible viewport across two animation frames. This is presentation,
 // not proof of reading/consent. Keep the latch for this document after scrolling.
 useEffect(()=>{
   if(!ready||!eligible(path)||noticePresented.current)return;
   let first=0,second=0,done=false;
   const onScreen=(el:Element|null)=>{
     if(!el||!visible())return false;
     const rect=el.getBoundingClientRect(),v=window.visualViewport;
     const left=v?.offsetLeft??0,top=v?.offsetTop??0,right=left+(v?.width??innerWidth),bottom=top+(v?.height??innerHeight);
     if(rect.width<=0||rect.height<=0||rect.left<left-1||rect.top<top-1||rect.right>right+1||rect.bottom>bottom+1)return false;
     for(let n:Element|null=el;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==="none"||s.visibility!=="visible"||Number(s.opacity)===0)return false;}
     const hit=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);
     return !!hit&&el.contains(hit);
   };
   const shown=()=>eligible(location.pathname)&&onScreen(notice.current?.querySelector("[data-ss-disclosure]")??null)&&onScreen(notice.current?.querySelector("[data-ss-privacy-actions]")??null)&&onScreen(notice.current?.querySelector("[data-ss-privacy-settings]")??null);
   const check=()=>{
     if(done||first||second||!shown())return;
     first=requestAnimationFrame(()=>{first=0;if(!shown())return;second=requestAnimationFrame(()=>{second=0;if(done||!shown())return;noticePresented.current=true;done=true;setRevision(v=>v+1);});});
   };
   check();const timer=window.setInterval(()=>{if(done)clearInterval(timer);else check();},200);
   window.addEventListener("scroll",check,{passive:true});window.addEventListener("resize",check);
   document.addEventListener("visibilitychange",check);
   return()=>{done=true;cancelAnimationFrame(first);cancelAnimationFrame(second);clearInterval(timer);window.removeEventListener("scroll",check);window.removeEventListener("resize",check);document.removeEventListener("visibilitychange",check);};
 },[ready,path]);
 const emit=useCallback((event:Metric)=>collector.current?.emit(event)===true,[]);
 const allowed=useCallback(()=>collector.current?.allowed()===true,[]);
 const entry=useCallback(()=>{
   if(entrySeen.current||location.pathname!==initialPath.current)return;
   const code=pageCode(initialPath.current);if(!code)return;
   const source=sourceCategory(document.referrer,location.origin,location.search);
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
   ads="denied";
   // Retain the restrictive recovery path when stored preferences cannot be verified.
   // An explicit basic opt-out must not restore an unverified optional permission.
   if(basicOff===true&&!c.state().storageOK)analytics="denied";
   const failed=()=>{stopPrivacyDocument();setStatus("Statistics stopped here. We could not save your choice. Please retry before reopening other tabs.");setRevision(v=>v+1);window.dispatchEvent(new Event("ss-v2-preferences"));};
   try{if(granular&&(basicOff===undefined||analytics==="denied"))protectRollback(localStorage,analytics,ads);}catch{failed();return;}
   if(c.choose({analytics,ads,basicOff,transition})){
      setPref(c.state().pref);setLegacy(c.state().legacy);setRevision(v=>v+1);setStatus(fixture?"Preferences saved for this synthetic test.":"Privacy choices saved.");
      if(granular)window.dispatchEvent(new Event("ss-v2-preferences"));
   }else failed();
 }
 useEffect(()=>{
   const open=()=>{setSettings(true);requestAnimationFrame(()=>{notice.current?.focus();notice.current?.scrollIntoView({block:"start"});});};
   window.addEventListener("open-cookie-settings",open);return()=>window.removeEventListener("open-cookie-settings",open);
 },[]);
 const currentAnalytics:Choice=ready&&optionalAllowed("analytics")?"granted":pref?.analytics==="unset"||(!pref&&legacy===null)?"unset":"denied";
 const basicOn=ready&&collectionEnabled&&allowed();
 const legacyNeedsTransition=legacy!==null&&!pref?.legacyTransition;
 const canBasic=ready&&collectionEnabled&&collector.current?.eligibleAfterNotice()===true;
 const failed=ready&&privacyBlocked();
 const feedback=status||(failed?"Statistics are off here because your privacy choice could not be verified. Choose again to save your preference.":"");
 const privateSettings=granular&&!eligible(path)&&!path.startsWith('/internal/');
 const summary=!eligible(path)?"Basic statistics are not collected on this page. You can manage both choices here. No third-party trackers."
   :!collectionEnabled?"Basic statistics are off. Any choice here keeps them off until you explicitly enable them."
   :legacyNeedsTransition?"Your earlier choice is preserved. Basic statistics stay off unless enabled in settings. Optional audit/report counts are separate."
   :ready&&!canBasic?"Basic statistics are off or unavailable. Optional audit/report counts are separate."
   :"Basic statistics help us improve SpendShift without recording your name or savings answers. These may continue if you reject optional cookies.";
 const toggleSettings=()=>{
   setSettings(v=>!v);
   if(privateSettings&&settings)requestAnimationFrame(()=>privateTrigger.current?.focus());
 };
 return <Context.Provider value={{emit,allowed,ready,revision}}>
   {privateSettings&&!settings&&<button ref={privateTrigger} className={styles.privateTrigger} type="button" onClick={()=>{setSettings(true);requestAnimationFrame(()=>notice.current?.focus());}}>Privacy settings</button>}
   {(eligible(path)||privateSettings&&settings)&&<aside ref={notice} tabIndex={-1} aria-label="Privacy notice" data-ss-privacy-notice="basic" className={styles.notice}>
    <div className={styles.inner}>
     <div className={styles.heading}>
       <strong>Your privacy choices {fixture&&<span className={styles.testLabel}>Test only</span>}</strong>
       <button className={styles.settingsButton} data-ss-privacy-settings type="button" aria-expanded={settings} aria-controls={settingsId} onClick={toggleSettings}>Privacy settings</button>
     </div>
     <p className={styles.summary} data-ss-disclosure>{summary}</p>
     <div className={styles.actions} data-ss-privacy-actions>
       <button type="button" aria-pressed={currentAnalytics==="granted"} onClick={()=>change("granted","denied")}>Accept optional cookies</button>
       <button type="button" aria-pressed={currentAnalytics==="denied"} onClick={()=>change("denied","denied")}>Reject optional cookies</button>
     </div>
     <div id={settingsId} className={styles.details} hidden={!settings}>
       <p>Basic statistics use limited daily counts, including foreground time ranges, homepage sections viewed and CTA displays and clicks, to improve SpendShift, not individual browsing profiles. For website arrivals, the host's IP-based country estimate is reduced to Australia, outside Australia or unknown; no IP or detailed location is stored in analytics. The optional-cookie buttons control separate audit and report activity counts, not essential browser storage. No Google Analytics, Clarity, Meta or TikTok tracking scripts run in this version. Your choices do not affect your savings check or purchased plan.</p>
       <p><strong>Basic statistics:</strong> {basicOn?"on for this page":failed?"off; choice not verified":!collectionEnabled?"collection disabled":legacyNeedsTransition?"off; your earlier choice is preserved":canBasic?"waiting for notice presentation":"off or unavailable"}. <strong>Optional first-party activity counts:</strong> {currentAnalytics==="granted"?"allowed":"off"}.</p>
       {legacyNeedsTransition&&<p>Basic statistics remain off unless you explicitly enable them under this notice.</p>}
       <div className={styles.detailActions}>
         <button type="button" onClick={()=>change(currentAnalytics,"denied",true)}>Turn off basic statistics</button>
         <button type="button" disabled={!collectionEnabled||!eligible(path)||!noticePresented.current} onClick={()=>change(currentAnalytics,"denied",false,true)}>Explicitly enable basic statistics</button>
       </div>
       <p className={styles.links}><Link href="/privacy-policy">Privacy Policy</Link><Link href="/cookies">Cookie Policy</Link></p>
       {fixture&&<p>This is a test environment. Proposed wording is not yet approved.</p>}
     </div>
     <p role="status" className={failed||status.startsWith("Statistics stopped")?styles.error:styles.visuallyHidden}>{feedback}</p>
    </div>
   </aside>}
   {children}
   {pageCode(path)&&<PublicObserver key={path} path={path} entry={entry}/>}
   <VitalObserver initialPath={initialPath.current}/>
 </Context.Provider>;
}
