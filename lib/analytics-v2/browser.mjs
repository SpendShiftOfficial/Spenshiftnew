// Candidate collector, imported by synthetic fixtures ONLY. No live page hooks.
import {basicAllowed,campaignCategory,sourceCategory,pages,makeRecorder,makeAuditRun,validEvent} from './core.mjs';
const preferenceKey='spendshift_privacy_v2',legacyKey='spendshift_cookie_consent';
export function browserCollector({enabled=false,noticeVisible=()=>false}={}){
 let blocked=false;
 function state(){try{const storage=window.localStorage,raw=storage.getItem(preferenceKey);return {enabled:enabled&&!blocked,noticeVisible:noticeVisible(),storageOK:true,legacy:storage.getItem(legacyKey),pref:raw===null?null:JSON.parse(raw)};}catch{return {enabled:false,noticeVisible:false,storageOK:false,legacy:null,pref:null};}}
 const allowed=()=>basicAllowed(state());
 const send=event=>fetch('/api/analytics-v2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',keepalive:true,redirect:'error'});
 const recorder=makeRecorder({allowed,send});
 function withdraw(){blocked=true;recorder.withdraw();}
 // Optional choices do not change a separate basic opt-out. Explicit basic change only.
 function choose({analytics,ads,basicOff,transition=false}){try{const prior=state();if(!prior.storageOK||![null,'granted','denied'].includes(prior.legacy))return false;if(prior.pref!==null&&!basicAllowed({...prior,enabled:true,noticeVisible:true,legacy:null,pref:{...prior.pref,basicOff:false}}))return false;if(!['unset','granted','denied'].includes(analytics)||!['unset','granted','denied'].includes(ads)||(basicOff!==undefined&&typeof basicOff!=='boolean'))return false;const pref={version:'2026-11-v2',basicOff:basicOff??prior.pref?.basicOff??false,legacyTransition:prior.pref?.legacyTransition===true||(transition===true&&basicOff===false),analytics,ads};if(pref.basicOff)withdraw();localStorage.setItem(preferenceKey,JSON.stringify(pref));blocked=pref.basicOff;return true;}catch{withdraw();return false;}}
 function entry(){if(document.visibilityState!=='visible'||document.prerendering)return;const page=Object.entries(pages).find(([,path])=>path===location.pathname)?.[0];if(!page||!allowed())return;const source=sourceCategory(document.referrer,location.origin);const device=innerWidth<600?'mobile':innerWidth<1024?'tablet':'desktop';const ua=navigator.userAgent;const browser=/Edg\//.test(ua)?'edge':/Firefox\//.test(ua)?'firefox':/Chrome\//.test(ua)?'chrome':/Safari\//.test(ua)?'safari':'other_or_unknown';if(source!==null)recorder.record({v:2,event:'site_entry',page,source,campaign:campaignCategory(location.search),device,browser},'site_entry');recorder.record({v:2,event:'public_page_view',page});}
 function audit(){const scoped=makeRecorder({allowed,send});const run=makeAuditRun(e=>scoped.record(e));return {...run,reset(){run.reset();scoped.reset();}};}
 function emit(event){if(!allowed()||!validEvent(event))return false;try{Promise.resolve(send(event)).catch(()=>{});return true;}catch{return false;}}
 return {allowed,state,choose,withdraw,entry,record:recorder.record,audit,emit};
}
