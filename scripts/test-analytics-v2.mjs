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
const own="https://www.spendshift.com.au";
const sourceCases=[
 ["","?utm_source=instagram","instagram"],["","?utm_source=IG","instagram"],["","?utm_source=facebook","facebook"],["","?utm_source=fb","facebook"],["","?utm_source=tiktok","tiktok"],["","?utm_source=tt","tiktok"],["","?utm_source=google","google"],["","?utm_source=bing","other_search"],["","?utm_source=linkedin","other_social"],
 ["https://l.facebook.com/","?utm_source=instagram","instagram"],["https://l.instagram.com/","?utm_source=unknown","instagram"],["https://www.spendshift.com.au/","?utm_source=instagram",null],
 ["","?utm_source=meta","direct_or_unknown"],["","?utm_source=instagram&utm_source=facebook","direct_or_unknown"],["","?utm_source=instagram&utm%5Fsource=facebook","direct_or_unknown"],["","?utm_source=instagram&UTM_SOURCE=facebook","direct_or_unknown"],["","?UTM_SOURCE=instagram","direct_or_unknown"],["","?utm_source=instagram%40example.invalid","direct_or_unknown"],["","?utm_source=https%3A%2F%2Finstagram.com","direct_or_unknown"],["","?utm_source=instagram%20","direct_or_unknown"],["","?utm_source=constructor","direct_or_unknown"],["","?utm_source=instagram&x="+"z".repeat(4096),"direct_or_unknown"],["","?fbclid=private&gclid=private","direct_or_unknown"],["not a URL","?utm_source=tiktok","tiktok"],["https://instagram.com.evil.invalid/","?utm_source=unknown","other_referral"],["","?utm_source=%69nstagram&fbclid=private","instagram"]
];
for(const [ref,search,expected] of sourceCases)check(sourceCategory(ref,own,search)===expected,"strict finite UTM source case "+sourceCases.findIndex(x=>x[0]===ref&&x[1]===search));
check(campaignCategory("?utm_campaign=meta_founder_v1&fbclid=private")==="meta_founder_v1","campaign");
check(campaignCategory("?utm_campaign=meta_founder_v1&utm_campaign=other")==="none_or_unknown","duplicate");
check(sydneyDay(new Date("2026-11-24T13:01:00Z"))==="2026-11-25","Sydney DST");
console.log("PASS "+passed+" synthetic checks");

// Homepage metric allowlist and deterministic dwell/foreground thresholds.
{
 const {homeMetrics,homeTimingEvents,createDwellTracker}=await import('../lib/analytics-v2/home-engagement.mjs');
 const assert=(await import('node:assert/strict')).default;
 assert.equal(homeMetrics.length,18);
 for(const event of homeMetrics){
  assert.equal(validEvent({v:2,event}),true);
  assert.equal(validEvent({v:2,event,page:'home'}),false);
  assert.deepEqual(marginals({v:2,event}),[[event,'all','all']]);
 }
 assert.equal(validEvent({v:2,event:'home_section_arbitrary_seen'}),false);
 assert.deepEqual(homeTimingEvents(59999),[]);
 assert.deepEqual(homeTimingEvents(60000),['home_engaged_60s']);
 assert.deepEqual(homeTimingEvents(120000),['home_engaged_60s','home_engaged_120s']);
 const d=createDwellTracker(),code='home_section_hero_seen';
 assert.deepEqual(d.update(0,[code]),[]);assert.deepEqual(d.update(500,[code]),[]);
 assert.deepEqual(d.update(1000,[code]),[code]);d.reset();
 assert.deepEqual(d.update(2000,[code]),[]);assert.deepEqual(d.update(3500,[code]),[]);
 d.update(4000,[]);assert.deepEqual(d.update(4500,[code]),[]);
 assert.deepEqual(d.update(5500,[code]),[code]);d.reset();
 assert.deepEqual(d.update(10000,['home_cta_hero_click','unknown']),[]);
 console.log('PASS homepage fixed event catalogue, threshold and dwell tests');
}
