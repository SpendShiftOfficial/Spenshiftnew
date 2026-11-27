"use client";

import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import {isMarketingPath} from "@/lib/privacy";
import {optionalPermissions,protectRollback} from "@/lib/analytics-v2/optional";
import {browserCollector} from "@/lib/analytics-v2/browser.mjs";
import {privacyBlocked,stopPrivacyDocument} from "@/lib/analytics-v2/privacy-runtime.mjs";
import styles from "./privacy-notice.module.css";

const CONSENT_KEY="spendshift_cookie_consent";
type ConsentChoice="granted"|"denied";

export default function ConsentBanner(){
 const path=usePathname(),notice=useRef<HTMLElement|null>(null);
 const [visible,setVisible]=useState(false),[settings,setSettings]=useState(false),[status,setStatus]=useState("");
 useEffect(()=>{
  setSettings(false);setStatus("");
  if(!isMarketingPath(path)){setVisible(false);return;}
  try{
   const raw=localStorage.getItem("spendshift_privacy_v2"),legacy=localStorage.getItem(CONSENT_KEY);
   const saved=raw!==null?(optionalPermissions(localStorage).analytics?"granted":"denied"):legacy;
   setVisible(privacyBlocked()||(saved!=="granted"&&saved!=="denied"));
  }catch{setVisible(true);}
 },[path]);
 useEffect(()=>{
  const open=()=>{setVisible(true);setSettings(true);requestAnimationFrame(()=>{notice.current?.focus();notice.current?.scrollIntoView({block:"start"});});};
  window.addEventListener("open-cookie-settings",open);return()=>window.removeEventListener("open-cookie-settings",open);
 },[]);
 function saveConsent(choice:ConsentChoice){
  try{
   protectRollback(localStorage,choice,"denied");
   // Preserve any existing basic-statistics preference while collection is disabled.
   const c=browserCollector({enabled:false,noticeVisible:()=>false});
   if(c.choose({analytics:choice,ads:"denied",basicOff:true})){setVisible(false);window.dispatchEvent(new Event("ss-v2-preferences"));return;}
  }catch{}
  stopPrivacyDocument();window.dispatchEvent(new Event("ss-v2-preferences"));setStatus("Statistics stopped here. We could not save your choice. Please retry before reopening other tabs.");
 }
 if(!visible)return null;
 return <aside ref={notice} tabIndex={-1} aria-label="Privacy notice" data-ss-privacy-notice="fallback" className={styles.notice}>
   <div className={styles.inner}>
    <div className={styles.heading}>
     <strong>Your privacy choices</strong>
     <button className={styles.settingsButton} type="button" aria-expanded={settings} aria-controls="ss-fallback-privacy-details" onClick={()=>setSettings(v=>!v)}>Privacy settings</button>
    </div>
    <p className={styles.summary}>Basic statistics are off. Optional audit/report counts are separate.</p>
    <div className={styles.actions}>
      <button type="button" onClick={()=>saveConsent("granted")}>Accept optional cookies</button>
      <button type="button" onClick={()=>saveConsent("denied")}>Reject optional cookies</button>
    </div>
    <div id="ss-fallback-privacy-details" className={styles.details} hidden={!settings}>
      <p>The optional-cookie buttons control limited audit and report activity counts on SpendShift's own servers, not essential browser storage. Your answers are not included in the totals. Basic statistics are currently disabled. A choice saved while basic statistics are disabled does not enable them on a later release. Your choice does not affect your savings check or purchased plan.</p>
      <p className={styles.links}><Link href="/privacy-policy">Privacy Policy</Link><Link href="/cookies">Cookie Policy</Link></p>
    </div>
    <p role="status" className={status||privacyBlocked()?styles.error:styles.visuallyHidden}>{status||(privacyBlocked()?"Statistics are off here because your privacy choice could not be verified. Choose again to save your preference.":"")}</p>
   </div>
 </aside>;
}
