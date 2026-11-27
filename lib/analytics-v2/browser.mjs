// First-party browser collector. No persistent visitor identifier.
import {basicAllowed,campaignCategory,sourceCategory,pages,makeRecorder,makeAuditRun,validEvent} from './core.mjs';
import {decodePreference,privacyBlocked,stopPrivacyDocument,clearPrivacyFailureAfterSave} from './privacy-runtime.mjs';
const preferenceKey='spendshift_privacy_v2',legacyKey='spendshift_cookie_consent';
export function browserCollector({enabled=false,noticeVisible=()=>false,onAccepted=()=>{}}={}){
 let blocked=false;
 function state(){try{
  const storage=window.localStorage,decoded=decodePreference(storage.getItem(preferenceKey)),legacy=storage.getItem(legacyKey);
  return {enabled:enabled&&!blocked&&!privacyBlocked(),noticeVisible:noticeVisible()===true,readable:true,storageOK:decoded.ok&&[null,'granted','denied'].includes(legacy),legacy,pref:decoded.pref};
 }catch{return {enabled:false,noticeVisible:false,readable:false,storageOK:false,legacy:null,pref:null};}}
 const allowed=()=>basicAllowed(state());
 const eligibleAfterNotice=()=>basicAllowed({...state(),noticeVisible:true});
 const send=event=>fetch('/api/analytics-v2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',keepalive:true,redirect:'error'}).then(response=>{if(event.event==='site_entry'&&response?.status===204)try{onAccepted(event);}catch{}return response;});
 const recorder=makeRecorder({allowed,send});
 function withdraw(){blocked=true;recorder.withdraw();}
 // A disabled-stage choice must never silently become permission for basic statistics.
 // Failure of any preference write stops both first-party categories in this document.
 function fail(){withdraw();stopPrivacyDocument();return false;}
 function choose({analytics,ads,basicOff,transition=false}){
  try{
   const prior=state();
   if(!['unset','granted','denied'].includes(analytics)||!['unset','granted','denied'].includes(ads)||(basicOff!==undefined&&typeof basicOff!=='boolean'))return fail();
   // Repair a malformed choice only by an explicit restrictive all-off action.
   if(!prior.storageOK){
    if(!prior.readable||analytics!=='denied'||basicOff!==true)return fail();
    if(![null,'granted','denied'].includes(prior.legacy)){
     localStorage.setItem(legacyKey,'denied');if(localStorage.getItem(legacyKey)!=='denied')return fail();
    }
   }
   const presented=enabled&&noticeVisible()===true;
   if(basicOff===false&&(!presented||transition!==true))return fail();
   const off=!enabled||basicOff===true?true:basicOff===false?false:privacyBlocked()?true:prior.pref?.basicOff??!presented;
   const pref={version:'2026-11-v2',basicOff:off,legacyTransition:prior.pref?.legacyTransition===true||(presented&&transition===true&&basicOff===false),analytics,ads};
   if(off)withdraw();
   const saved=JSON.stringify(pref);
   localStorage.setItem(preferenceKey,saved);
   if(localStorage.getItem(preferenceKey)!==saved||!clearPrivacyFailureAfterSave())return fail();
   blocked=off;
   return true;
  }catch{return fail();}
 }
 function entry(){if(document.visibilityState!=='visible'||document.prerendering)return;const page=Object.entries(pages).find(([,path])=>path===location.pathname)?.[0];if(!page||!allowed())return;const source=sourceCategory(document.referrer,location.origin,location.search);const device=innerWidth<600?'mobile':innerWidth<1024?'tablet':'desktop';const ua=navigator.userAgent;const browser=/Edg\//.test(ua)?'edge':/Firefox\//.test(ua)?'firefox':/Chrome\//.test(ua)?'chrome':/Safari\//.test(ua)?'safari':'other_or_unknown';if(source!==null)recorder.record({v:2,event:'site_entry',page,source,campaign:campaignCategory(location.search),device,browser},'site_entry');recorder.record({v:2,event:'public_page_view',page});}
 function audit(){const scoped=makeRecorder({allowed,send});const run=makeAuditRun(e=>scoped.record(e));return {...run,reset(){run.reset();scoped.reset();}};}
 function emit(event){if(!allowed()||!validEvent(event))return false;try{Promise.resolve(send(event)).catch(()=>{});return true;}catch{return false;}}
 return {allowed,eligibleAfterNotice,state,choose,withdraw,entry,record:recorder.record,audit,emit};
}
