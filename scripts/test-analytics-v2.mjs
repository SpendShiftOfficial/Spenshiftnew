import {pages,enums,events,validEvent,parseEvent,marginals,basicAllowed,sourceCategory,campaignCategory,makeRecorder,questionRatio,suppress,sydneyDay,makeAuditRun} from "../lib/analytics-v2/core.mjs";
let passed=0;
function check(c,label){if(!c)throw Error(label);passed++;}
function runCoreTests(){
 check(validEvent({v:2,event:"site_entry",page:"home",source:"instagram",campaign:"meta_founder_v1",device:"mobile",browser:"other_or_unknown"}),"site entry");
 for(const event of Object.keys(events)){const obj={v:2,event};for(const f of events[event])obj[f]=event==="audit_back"&&f==="question"?2:enums[f][0];check(validEvent(obj),event);check(parseEvent(JSON.stringify(obj))!==null,event+" roundtrip");check(!validEvent({...obj,email:"synthetic@example.invalid"}),event+" rejects extra fields");}
 for(const raw of ['{"v":2,"event":"audit_arrival","event":"audit_start"}','{"v":2,"event":"audit_question_seen","question":9}','{"v":2,"event":"audit_question_seen","question":"1"}','{"v":2,"event":"audit_back","question":1}','{"v":2,"event":"report_open"}','{"v":2,"event":"audit_start","answer":"daily"}','{"v":2,"event":"audit_start","x":{}}','{"v":2,"event":"audit_start","x":null}','{"v":2,"event":"audit_start"}'+" ".repeat(512)])check(parseEvent(raw)===null,"reject malformed");
 const a={enabled:true,noticeVisible:true,storageOK:true,legacy:null,pref:null};
 check(basicAllowed(a),"new visitor");check(!basicAllowed({...a,enabled:false}),"flag");check(!basicAllowed({...a,noticeVisible:false}),"notice");check(!basicAllowed({...a,storageOK:false}),"storage");check(!basicAllowed({...a,legacy:"denied"}),"legacy denial");check(!basicAllowed({...a,legacy:"granted"}),"legacy grant");
 const pref={version:"2026-11-v2",basicOff:false,legacyTransition:false,analytics:"denied",ads:"denied"};
 check(basicAllowed({...a,pref}),"new reject");check(!basicAllowed({...a,pref:{...pref,basicOff:true}}),"basic withdrawal");check(!basicAllowed({...a,legacy:"denied",pref}),"legacy reject retained");check(basicAllowed({...a,legacy:"denied",pref:{...pref,legacyTransition:true}}),"explicit transition");check(!basicAllowed({...a,pref:{...pref,id:"forbidden"}}),"invalid preference");
 const e={v:2,event:"site_entry",page:"home",source:"instagram",campaign:"none_or_unknown",device:"mobile",browser:"safari"};check(marginals(e).length===6,"six marginals");check(marginals(e).every(x=>x.length===3),"no joined profile");
 check(questionRatio(3,4)===.75,"ratio");check(questionRatio(5,4)===null,"mismatch");check(questionRatio(0,0)===null,"zero");check(suppress(9)===null&&suppress(10)===10,"suppression");
 const sent=[];let allow=true;const recorder=makeRecorder({allowed:()=>allow,send:x=>sent.push(x)});check(recorder.record({v:2,event:"audit_start"}),"record");check(!recorder.record({v:2,event:"audit_start"}),"dedup");allow=false;check(!recorder.record({v:2,event:"audit_complete"}),"withdrawal");check(sent.length===1,"no extra send");
 const audit=[];const run=makeAuditRun(x=>audit.push(x));run.arrive();run.arrive();run.see(7);run.advance(7);run.advance(7);check(!audit.some(x=>x.event==="audit_start"),"resume no false start");check(audit.length===3,"resume dedup");run.reset();run.arrive();run.see(1);run.choose(1);run.choose(1);run.advance(1);run.complete();run.complete();check(audit.filter(x=>x.event==="audit_start").length===1,"one start");check(audit.filter(x=>x.event==="audit_complete").length===1,"one complete");check(audit.every(validEvent),"audit safe payload");
}
runCoreTests();
check(sourceCategory("https://l.instagram.com/private?secret=x","https://www.spendshift.com.au")==="instagram","source coarse");
check(sourceCategory("https://www.spendshift.com.au/private","https://www.spendshift.com.au")===null,"internal entry");
check(sourceCategory("https://instagram.com.evil.invalid/","https://www.spendshift.com.au")==="other_referral","hostname spoof");
check(campaignCategory("?utm_campaign=meta_founder_v1&fbclid=private")==="meta_founder_v1","campaign");
check(campaignCategory("?utm_campaign=meta_founder_v1&utm_campaign=other")==="none_or_unknown","duplicate");
check(sydneyDay(new Date("2026-11-24T13:01:00Z"))==="2026-11-25","Sydney DST");
console.log("PASS "+passed+" synthetic checks");
