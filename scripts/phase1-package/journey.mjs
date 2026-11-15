import {write,edit,replace} from './io.mjs';
export default function journey(){
edit('lib/report-refinements.ts',s=>{
 s=replace(s,'  shoppingTrigger: string;','  shoppingTrigger: string;\n  hasGas: string;\n  phoneService: string;\n  takeawayAmountPeriod: "order" | "week";\n  convenienceOverlap: string;');
 s=replace(s,'      shoppingTrigger: "",','      shoppingTrigger: "",\n      hasGas: "",\n      phoneService: "",\n      takeawayAmountPeriod: "order",\n      convenienceOverlap: "",');
 s=replace(s,'      shoppingTrigger: fixedChoice(details.shoppingTrigger, triggerChoices, "shopping trigger"),','      shoppingTrigger: fixedChoice(details.shoppingTrigger, triggerChoices, "shopping trigger"),\n      hasGas: fixedChoice(details.hasGas, new Set(["", "yes", "no", "not_sure"]), "gas answer"),\n      phoneService: fixedChoice(details.phoneService, new Set(["", "mobile", "internet", "both", "neither", "not_sure"]), "phone bills"),\n      takeawayAmountPeriod: details.takeawayAmountPeriod === "week" ? "week" : "order",\n      convenienceOverlap: fixedChoice(details.convenienceOverlap, new Set(["", "yes", "no", "not_sure"]), "overlapping spending"),');
 return s;
});
write('lib/plan-draft.ts',String.raw`import {validateAuditAnswers} from './audit-schema';
import {selectPersonalisationAreas, type PersonalisationArea} from './personalisation-questions';
import {emptyRefinements,validateRefinements} from './report-refinements';
export const sectionKeys:Record<PersonalisationArea,string[]>={
 subscriptions:['subscriptionsMonthly','unusedSubscriptionChoice','unusedSubscriptionName','unusedSubscriptionMonthly'],
 takeaway:['takeawayOrder','takeawayAmountPeriod','takeawayOrdersPerWeek','takeawaySwapPerWeek','takeawayReplacementCost'],
 convenience:['convenienceWeekly','convenienceGoalWeekly','convenienceOverlap'],
 phone:['phoneService','mobileMonthly','internetMonthly'],
 energy:['state','electricityBill','electricityPeriod','hasGas','gasMonthly'],
 insurance:[],unplanned:['unplannedArea','shoppingTrigger'],
};
export type RawPolicy={type:string;premium:string;paymentPeriod:string;insurer:string;coverDescription:string;renewal:string};
export type PlanDraft={version:1;answers:string[];details:Record<string,string>;insurancePolicies:RawPolicy[];additionalArea:string;step:number};
export const emptyPolicy=():RawPolicy=>({type:'',premium:'',paymentPeriod:'year',insurer:'',coverDescription:'',renewal:''});
export function blankDraft(answers:string[]):PlanDraft{
 const details:Record<string,string>={};Object.keys(emptyRefinements().details).forEach(key=>details[key]='');
 details.electricityPeriod='quarter';details.takeawayAmountPeriod='order';
 return {version:1,answers,details,insurancePolicies:[emptyPolicy()],additionalArea:'',step:0};
}
function obj(input:unknown):Record<string,unknown>{if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Please check your saved answers.');return input as Record<string,unknown>;}
export function cleanDraft(input:unknown):PlanDraft{
 const d=obj(input);const answers=validateAuditAnswers(d.answers);const out=blankDraft(answers);const raw=obj(d.details||{});
 for(const key of Object.keys(out.details)){const value=raw[key];if(value===null||value===undefined)continue;if(typeof value!=='string'||value.length>160)throw new Error('Please shorten that answer.');out.details[key]=value.replace(/[\u0000-\u001f<>]/g,'');}
 const policies=d.insurancePolicies??[];if(!Array.isArray(policies)||policies.length>6)throw new Error('Use up to six insurance policies.');
 out.insurancePolicies=policies.map(value=>{const p=obj(value);const result=emptyPolicy();for(const key of Object.keys(result) as (keyof RawPolicy)[]){if(p[key]===null||p[key]===undefined)continue;if(typeof p[key]!=='string'||(p[key] as string).length>160)throw new Error('Please shorten that policy detail.');result[key]=(p[key] as string).replace(/[\u0000-\u001f<>]/g,'');}return result;});
 const area=d.additionalArea||'';if(typeof area!=='string'||(area&&!Object.hasOwn(sectionKeys,area)))throw new Error('Please choose a listed spending area.');out.additionalArea=area;
 if(typeof d.step!=='number'||!Number.isInteger(d.step)||d.step<0||d.step>8)throw new Error('Please reopen your plan.');out.step=d.step;
 return out;
}
export function selectedDraftAreas(d:PlanDraft):PersonalisationArea[]{const areas=selectPersonalisationAreas(d.answers);if(d.additionalArea&&!areas.includes(d.additionalArea as PersonalisationArea))areas.push(d.additionalArea as PersonalisationArea);return areas;}
export function prepareDraft(d:PlanDraft){
 const areas=selectedDraftAreas(d);const details:Record<string,string>={};
 for(const area of areas)for(const key of sectionKeys[area])details[key]=d.details[key]||'';
 if(details.hasGas==='no'||details.hasGas==='not_sure')details.gasMonthly='';
 if(details.phoneService==='neither'){details.mobileMonthly='';details.internetMonthly='';}
 if(details.phoneService==='mobile')details.internetMonthly='';if(details.phoneService==='internet')details.mobileMonthly='';
 if(details.unusedSubscriptionChoice!=='yes'){details.unusedSubscriptionMonthly='';details.unusedSubscriptionName='';}
 return validateRefinements({version:1,additionalArea:d.additionalArea||null,details,insurancePolicies:areas.includes('insurance')?d.insurancePolicies:[]});
}
export function restoreDraft(answers:string[],saved:unknown):PlanDraft{
 if(!saved||typeof saved!=='object')return blankDraft(answers);
 const value=saved as Record<string,unknown>;
 if(value.draft){try{return cleanDraft({...obj(value.draft),answers});}catch{return blankDraft(answers);}}
 const d=blankDraft(answers);const details=value.details as Record<string,unknown>||{};
 for(const key of Object.keys(d.details)){if(typeof details[key]==='string'||typeof details[key]==='number')d.details[key]=String(details[key]);}
 if(d.details.gasMonthly&&!d.details.hasGas)d.details.hasGas='yes';
 if(d.details.unusedSubscriptionMonthly&&!d.details.unusedSubscriptionChoice)d.details.unusedSubscriptionChoice='yes';
 if(Array.isArray(value.insurancePolicies))d.insurancePolicies=value.insurancePolicies.map((p:any)=>({type:p.type||'',premium:p.premium==null?'':String(p.premium),paymentPeriod:p.paymentPeriod||'year',insurer:p.insurer||'',coverDescription:p.coverDescription||'',renewal:p.renewal||''}));
 d.additionalArea=typeof value.additionalArea==='string'?value.additionalArea:'';return d;
}
`);
edit('lib/paid-orders.ts',s=>{
 s=replace(s,'  attempt_count: number;','  attempt_count: number;\n  updated_at: string;');
 s=replace(s,'.select("stripe_session_id,status,answers,refinements,report_id,customer_email,created_at,processing_started_at,attempt_count")','.select("stripe_session_id,status,answers,refinements,report_id,customer_email,created_at,processing_started_at,attempt_count,updated_at")');
 return s;
});
edit('app/api/payment-status/route.ts',s=>{
 s=replace(s,'import { NextResponse } from "next/server";','import { NextResponse } from "next/server";\nimport {validateAuditAnswers} from "@/lib/audit-schema";');
 s=replace(s,'answers: auditAnswersFromSession(session),','answers: validateAuditAnswers(order.answers),\n        revision: order.updated_at,');
 return s;
});
write('app/api/personalisation/draft/route.ts',String.raw`import {NextResponse} from 'next/server';
import {paidSession,ensurePaidOrder,readExistingReportId} from '@/lib/paid-orders';
import {supabaseAdmin} from '@/lib/supabase';
import {cleanDraft,prepareDraft} from '@/lib/plan-draft';
import {readJson,InputError,privateHeaders} from '@/lib/request-safety';
export async function POST(req:Request){
 try{
  const body=await readJson(req);if(typeof body.sessionId!=='string')throw new InputError('Your purchase link is missing.');
  const session=await paidSession(body.sessionId);const {order}=await ensurePaidOrder(session);
  if(order.report_id||await readExistingReportId(session.id))throw new InputError('Your plan is already ready. Open your plan link.',409);
  if(!['awaiting_details','failed'].includes(order.status))throw new InputError('Your plan is being made. Return to your purchase link.',409);
  if(typeof body.revision!=='string'||body.revision!==order.updated_at)throw new InputError('This plan changed in another tab. Reload before editing.',409);
  let draft;let refinements;try{draft=cleanDraft(body.draft);refinements=body.complete===true?{...prepareDraft(draft),completed:true}:{version:1,draft,completed:false};}catch(e){throw new InputError(e instanceof Error?e.message:'Please check your answers.');}
  const revision=new Date().toISOString();
  const {data,error}=await supabaseAdmin.from('report_orders').update({answers:draft.answers,refinements,updated_at:revision}).eq('stripe_session_id',session.id).eq('updated_at',body.revision).in('status',['awaiting_details','failed']).select('updated_at').maybeSingle();
  if(error)throw new Error('Draft write failed');if(!data)throw new InputError('This plan changed in another tab. Reload before editing.',409);
  return NextResponse.json({saved:true,revision:data.updated_at},{headers:privateHeaders});
 }catch(e){return NextResponse.json({error:e instanceof InputError?e.message:'Your answers could not be saved. Keep this page open and try again.'},{status:e instanceof InputError?e.status:503,headers:privateHeaders});}
}
`);
edit('lib/report-fulfillment.ts',s=>{
 s=replace(s,'import { randomBytes } from "node:crypto";','import { randomBytes } from "node:crypto";\nimport {validateAuditAnswers} from "./audit-schema";');
 s=replace(s,'  // Atomic conditional update: concurrent clicks or webhook retries do not generate twice.','  if ((order.refinements as any)?.draft && !(order.refinements as any)?.completed) {\n    throw new Error("Please finish or skip the questions before making your plan.");\n  }\n\n  // Atomic conditional update: concurrent clicks or webhook retries do not generate twice.');
 s=replace(s,'.select("stripe_session_id,refinements")','.select("stripe_session_id,answers,refinements")');
 s=replace(s,'const answers = auditAnswersFromSession(session);','const answers = validateAuditAnswers(claimed.answers);');
 s=s.replace('version: 2,','version: 3,');return s;
});
write('app/api/cron/recover-paid-reports/route.ts',String.raw`import {NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase';
import {generatePaidReport} from '@/lib/report-fulfillment';
export const runtime='nodejs';export const maxDuration=180;
export async function GET(req:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.get('authorization')!=='Bearer '+secret)return NextResponse.json({error:'Unauthorised.'},{status:401});
 try{
  const now=Date.now();
  const {error:resetError}=await supabaseAdmin.from('report_orders').update({status:'failed',last_error:'Generation interrupted',processing_started_at:null}).eq('status','processing').lt('processing_started_at',new Date(now-20*60*1000).toISOString());
  if(resetError)throw new Error('Could not release stuck jobs');
  const {data,error}=await supabaseAdmin.from('report_orders').select('stripe_session_id,status,refinements').in('status',['awaiting_details','failed']).lt('attempt_count',4).lt('updated_at',new Date(now-2*60*1000).toISOString()).order('updated_at',{ascending:true}).limit(40);
  if(error)throw new Error('Could not read pending jobs');
  // Never turn an unfinished paid draft into an uneditable report.
  const ready=(data||[]).filter(o=>(o.refinements as any)?.completed===true||(o.status==='failed'&&!(o.refinements as any)?.draft));
  let recovered=0,failed=0;
  for(let i=0;i<ready.length;i+=3){const results=await Promise.allSettled(ready.slice(i,i+3).map(o=>generatePaidReport(o.stripe_session_id)));for(const result of results){if(result.status==='fulfilled'&&result.value.status==='ready')recovered++;else if(result.status==='rejected')failed++;}}
  return NextResponse.json({recovered,failed,unfinishedDraftsLeftEditable:(data||[]).length-ready.length});
 }catch{return NextResponse.json({error:'Recovery could not finish. It will be retried.'},{status:503});}
}
`);
write('app/personalise/PersonaliseClient.tsx',String.raw`"use client";
import {useEffect,useRef,useState} from 'react';
import Header from '@/components/Header';
import {useRouter} from 'next/navigation';
import {auditQuestions,validateAuditAnswers} from '@/lib/audit-schema';
import {areaNames,previewProfiles,type PersonalisationArea} from '@/lib/personalisation-questions';
import {blankDraft,cleanDraft,restoreDraft,selectedDraftAreas,prepareDraft,sectionKeys,emptyPolicy,type PlanDraft,type RawPolicy} from '@/lib/plan-draft';
import styles from './personalise.module.css';
export default function PersonaliseClient({allowDemo,hasPaidSession}:{allowDemo:boolean;hasPaidSession:boolean}){
 const router=useRouter();const [sessionId,setSessionId]=useState('');const [draft,setDraft]=useState<PlanDraft>(blankDraft(previewProfiles['subscriptions-insurance'].answers));
 const [ready,setReady]=useState(false);const [error,setError]=useState('');const [saving,setSaving]=useState('');const [submitting,setSubmitting]=useState(false);const [reportId,setReportId]=useState('');const [showExtra,setShowExtra]=useState(false);
 const revision=useRef('');const lastSaved=useRef('');const queue=useRef<Promise<void>>(Promise.resolve());const latest=useRef(draft);latest.current=draft;
 const signature=JSON.stringify(draft);const areas=selectedDraftAreas(draft);const review=draft.step>=areas.length;const area=areas[draft.step];const d=draft.details;
 useEffect(()=>{let active=true;const id=new URLSearchParams(location.search).get('session_id')||'';setSessionId(id);
  if(!id){if(!allowDemo){setError('Open the private link from your purchase.');return;}try{const a=validateAuditAnswers(JSON.parse(localStorage.getItem('spendshift_answers')||'null'));setDraft(blankDraft(a));}catch{}setReady(true);return;}
  fetch('/api/payment-status?session_id='+encodeURIComponent(id),{cache:'no-store'}).then(async r=>{const p=await r.json();if(!r.ok||!p.paid)throw new Error('We could not open this purchase. Use your original purchase link.');if(!active)return;if(p.reportId){setReportId(p.reportId);setReady(true);return;}if(p.status==='processing'){router.replace('/success?session_id='+encodeURIComponent(id)+'&generate=1');return;}const restored=restoreDraft(validateAuditAnswers(p.answers),p.refinements);revision.current=p.revision;lastSaved.current=JSON.stringify(restored);setDraft(restored);setReady(true);setSaving('Your saved place is ready.');}).catch(e=>active&&setError(e.message));
  return()=>{active=false;};
 },[allowDemo,router]);
 function persist(snapshot:PlanDraft,complete=false){
  if(!sessionId)return Promise.resolve();
  const operation=queue.current.catch(()=>{}).then(async()=>{if(!complete&&JSON.stringify(snapshot)===lastSaved.current)return;setSaving('Saving…');
   const r=await fetch('/api/personalisation/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,revision:revision.current,draft:snapshot,complete})});const p=await r.json();if(!r.ok){setSaving('Not saved. Keep this page open.');throw new Error(p.error||'Could not save. Please try again.');}revision.current=p.revision;lastSaved.current=JSON.stringify(snapshot);setSaving('Saved. You can return with your purchase link.');});queue.current=operation;return operation;
 }
 useEffect(()=>{if(!ready||!sessionId||reportId||submitting||signature===lastSaved.current)return;setSaving('Changes not saved yet…');const timer=setTimeout(()=>persist(latest.current).catch(e=>setError(e.message)),800);return()=>clearTimeout(timer);},[signature,ready,sessionId,reportId,submitting]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(ready&&sessionId&&!reportId&&JSON.stringify(latest.current)!==lastSaved.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[ready,sessionId,reportId]);
 function update(key:string,value:string){setError('');setDraft(prev=>({...prev,details:{...prev.details,[key]:value,...(key==='unusedSubscriptionChoice'&&value!=='yes'?{unusedSubscriptionMonthly:'',unusedSubscriptionName:''}:{}),...(key==='hasGas'&&value!=='yes'?{gasMonthly:''}:{})}}));}
 function policy(index:number,patch:Partial<RawPolicy>){setDraft(prev=>({...prev,insurancePolicies:prev.insurancePolicies.map((p,i)=>i===index?{...p,...patch}:p)}));}
 function checkCurrent(){try{const test=cleanDraft(draft);const others=areas.filter(a=>a!==area);for(const a of others)for(const key of sectionKeys[a])test.details[key]='';if(area!=='insurance')test.insurancePolicies=[];prepareDraft(test);return '';}catch(e){return e instanceof Error?e.message:'Please check these amounts.';}}
 async function next(skip=false){setError('');const snapshot=cleanDraft(draft);if(skip){for(const key of sectionKeys[area])snapshot.details[key]='';if(area==='insurance')snapshot.insurancePolicies=[];}else{const issue=checkCurrent();if(issue){setError(issue);return;}}snapshot.step=Math.min(snapshot.step+1,areas.length);try{await persist(snapshot);setDraft(snapshot);}catch(e){setError(e instanceof Error?e.message:'Your answers were not saved.');}}
 async function finish(){setError('');let snapshot:PlanDraft;try{snapshot=cleanDraft(draft);prepareDraft(snapshot);}catch(e){setError(e instanceof Error?e.message:'Please check your answers.');return;}setSubmitting(true);try{await persist(snapshot,true);if(sessionId){router.push('/success?session_id='+encodeURIComponent(sessionId)+'&generate=1');}else{sessionStorage.setItem('spendshift_demo_plan',JSON.stringify(snapshot));router.push('/plan-preview');}}catch(e){setError(e instanceof Error?e.message:'Please try again.');setSubmitting(false);}}
 const choice=(key:string,label:string,options:[string,string][])=> <div className={styles.field}><label htmlFor={key}>{label}</label><select id={key} value={d[key]||''} onChange={e=>update(key,e.target.value)}><option value=''>Not sure / skip</option>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>;
 const amount=(key:string,label:string,hint='')=><div className={styles.field}><label htmlFor={key}>{label}</label><div className={styles.moneyInput}><span aria-hidden='true'>$</span><input id={key} type='number' min='0' max='100000' step='0.01' inputMode='decimal' value={d[key]||''} placeholder='Not sure' onChange={e=>update(key,e.target.value)}/></div>{hint&&<small>{hint}</small>}</div>;
 const count=(key:string,label:string)=> <div className={styles.field}><label htmlFor={key}>{label}</label><input id={key} type='number' min='0' max='21' step='1' inputMode='numeric' value={d[key]||''} placeholder='Not sure' onChange={e=>update(key,e.target.value)}/></div>;
 if(!ready)return <div className={styles.page}><Header simple/><main className={styles.wrap}><h1>{error?'We could not open your plan':'Opening your plan'}</h1><p role={error?'alert':undefined}>{error||'Checking your purchase…'}</p></main></div>;
 if(reportId)return <div className={styles.page}><Header simple/><main className={styles.wrap}><h1>Your plan is ready.</h1><a className={styles.primary} href={'/report/'+encodeURIComponent(reportId)}>Open my plan</a></main></div>;
 return <div className={styles.page}><Header simple/><main className={styles.wrap}>
  <h1>Make your plan fit you.</h1><p className={styles.intro}>{areas.length} areas to check. Skip anything you do not know.</p>
  {sessionId&&<p role='status' aria-live='polite' className={styles.selectionNote}>{saving}</p>}
  {!sessionId&&<div className={styles.demoPanel}><label htmlFor='demo'>Test customer — no payment or saved customer data</label><select id='demo' onChange={e=>setDraft(blankDraft(previewProfiles[e.target.value].answers))}>{Object.entries(previewProfiles).map(([key,p])=><option key={key} value={key}>{p.label}</option>)}</select></div>}
  <details className={styles.optionalDetails}><summary>Check or change my first answers</summary><div className={styles.optionalInner}>{auditQuestions.map((q,i)=><div className={styles.field} key={q.q}><label htmlFor={'audit-edit-'+i}>{q.q}</label><select id={'audit-edit-'+i} value={draft.answers[i]} onChange={e=>setDraft(p=>({...p,step:0,answers:p.answers.map((a,j)=>i===j?e.target.value:a)}))}>{q.options.map(a=><option key={a}>{a}</option>)}</select></div>)}</div></details>
  <div className={styles.progressTop}><strong>{review?'Check your answers':'Area '+(draft.step+1)+' of '+areas.length}</strong></div><div className={styles.track} role='progressbar' aria-label='Your progress' aria-valuenow={review?100:Math.round(draft.step/areas.length*100)} aria-valuemin={0} aria-valuemax={100}><div style={{width:(review?100:draft.step/areas.length*100)+'%'}}/></div>
  <section className={styles.panel}>
   {review?<><h2>Your answers</h2><p>Check each area before we make your plan.</p>{areas.map((a,i)=><div className={styles.reviewExtra} key={a}><strong>{areaNames[a]}</strong><button className={styles.extraLink} type='button' onClick={()=>setDraft(p=>({...p,step:i}))}>Check or edit {areaNames[a].toLowerCase()}</button></div>)}
    {areas.length<7&&!draft.additionalArea&&<><button className={styles.extraLink} type='button' onClick={()=>setShowExtra(!showExtra)}>Want to check another bill?</button>{showExtra&&<select aria-label='Extra area' defaultValue='' onChange={e=>setDraft(p=>({...p,additionalArea:e.target.value,step:areas.length}))}><option value=''>Choose an area</option>{Object.entries(areaNames).filter(([key])=>!areas.includes(key as PersonalisationArea)).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select>}</>}
    <div className={styles.actions}><button className={styles.primary} type='button' disabled={submitting} onClick={finish}>{submitting?'Making your plan…':'Make my plan'}</button></div></>:
    <><h2>{areaNames[area]}</h2><div className={styles.fields}>
     {area==='subscriptions'&&<>{amount('subscriptionsMonthly','What do all your subscriptions cost each month?')}{choice('unusedSubscriptionChoice','Do you pay for a subscription you no longer use?',[['yes','Yes'],['no','No — I use them all'],['not_sure','Not sure']])}{d.unusedSubscriptionChoice==='yes'&&<><div className={styles.field}><label htmlFor='unusedSubscriptionName'>Which service? (optional)</label><input id='unusedSubscriptionName' maxLength={60} value={d.unusedSubscriptionName||''} onChange={e=>update('unusedSubscriptionName',e.target.value)}/></div>{amount('unusedSubscriptionMonthly','What does that service cost each month?')}</>}{d.unusedSubscriptionChoice==='no'&&<p>We will help you check prices, not tell you to cancel services you use.</p>}</>}
     {area==='takeaway'&&<>{amount('takeawayOrder','What do you usually spend on takeaway?')}{choice('takeawayAmountPeriod','That amount is…',[['order','For one order'],['week','For a whole week']])}{count('takeawayOrdersPerWeek','How many orders do you buy each week?')}{count('takeawaySwapPerWeek','How many orders could you replace each week?')}{Number(d.takeawaySwapPerWeek)>0&&amount('takeawayReplacementCost','What would food at home cost for the same people?','Include all food costs for one replacement meal.')}<small>Check that your takeaway and home meal prices feed the same people.</small></>}
     {area==='convenience'&&<>{amount('convenienceWeekly','What do coffee, snacks and quick buys cost each week?')}{areas.includes('takeaway')&&choice('convenienceOverlap','Does that include the takeaway you already listed?',[['no','No — these are separate costs'],['yes','Yes'],['not_sure','Not sure']])}{d.convenienceOverlap==='yes'?<p>Take out the takeaway costs, then change the amount above. We will not count the same saving twice.</p>:amount('convenienceGoalWeekly','What could you aim to spend each week?','Pick a goal you could keep to. Leave it blank if unsure.')}</>}
     {area==='phone'&&<>{choice('phoneService','Which bills do you pay?',[['both','Mobile and home internet'],['mobile','Mobile only'],['internet','Home internet only'],['neither','Neither'],['not_sure','Not sure']])}{['both','mobile'].includes(d.phoneService)&&amount('mobileMonthly','Your mobile bill each month')}{['both','internet'].includes(d.phoneService)&&amount('internetMonthly','Your home internet bill each month')}</>}
     {area==='energy'&&<>{choice('state','Your state or territory',['NSW','VIC','QLD','SA','WA','TAS','ACT','NT'].map(s=>[s,s]))}{amount('electricityBill','Your latest power bill')}{choice('electricityPeriod','How long does that bill cover?',[['quarter','Three months'],['month','One month']])}{choice('hasGas','Do you pay a gas bill?',[['yes','Yes'],['no','No'],['not_sure','Not sure']])}{d.hasGas==='yes'&&amount('gasMonthly','Your gas cost each month','A rough monthly amount is fine.')}</>}
     {area==='insurance'&&<>{draft.insurancePolicies.map((p,i)=><div className={styles.policyCard} key={i}><strong>Policy {i+1}</strong><div className={styles.field}><label htmlFor={'policy-type-'+i}>Insurance type</label><select id={'policy-type-'+i} value={p.type} onChange={e=>policy(i,{type:e.target.value})}><option value=''>Not sure</option>{['Car','Home or contents','Health','Life or income protection','Pet','Travel','Other'].map(t=><option key={t}>{t}</option>)}</select></div><div className={styles.field}><label htmlFor={'policy-cost-'+i}>What do you pay?</label><input id={'policy-cost-'+i} type='number' min='0' max='100000' step='0.01' inputMode='decimal' value={p.premium} onChange={e=>policy(i,{premium:e.target.value})}/></div><div className={styles.field}><label htmlFor={'policy-period-'+i}>How often?</label><select id={'policy-period-'+i} value={p.paymentPeriod} onChange={e=>policy(i,{paymentPeriod:e.target.value})}><option value='year'>Each year</option><option value='month'>Each month</option></select></div><div className={styles.field}><label htmlFor={'policy-renewal-'+i}>When does it renew?</label><select id={'policy-renewal-'+i} value={p.renewal} onChange={e=>policy(i,{renewal:e.target.value})}><option value=''>Not sure / skip</option><option value='soon'>In the next 3 months</option><option value='later'>Later</option></select></div><details className={styles.optionalDetails}><summary>Add company or cover (optional)</summary><div className={styles.optionalInner}><label>Company<input maxLength={80} value={p.insurer} onChange={e=>policy(i,{insurer:e.target.value})}/></label><label>Cover type<input maxLength={120} value={p.coverDescription} onChange={e=>policy(i,{coverDescription:e.target.value})}/></label><small>No policy or account numbers.</small></div></details><button type='button' className={styles.extraLink} onClick={()=>setDraft(prev=>({...prev,insurancePolicies:prev.insurancePolicies.filter((_,j)=>i!==j)}))}>Remove policy {i+1}</button></div>)}{draft.insurancePolicies.length<6&&<button type='button' className={styles.addPolicy} onClick={()=>setDraft(p=>({...p,insurancePolicies:[...p.insurancePolicies,emptyPolicy()]}))}>Add another policy</button>}</>}
     {area==='unplanned'&&<>{choice('unplannedArea','What do you tend to buy?',['Online shopping','Clothes or accessories','Entertainment or hobbies','Other purchases'].map(x=>[x,x]))}{choice('shoppingTrigger','What makes you want to buy it?',['Sales or deals','Boredom','Social media','Other','Not sure'].map(x=>[x,x]))}</>}
    </div><div className={styles.actions}>{draft.step>0&&<button className={styles.secondary} type='button' onClick={()=>setDraft(p=>({...p,step:p.step-1}))}>Back</button>}<button className={styles.primary} type='button' onClick={()=>next()}>Next</button></div><button className={styles.skip} type='button' onClick={()=>next(true)}>Skip this area</button></>}
   {error&&<p role='alert' className={styles.submitError}>{error}</p>}
  </section><p className={styles.footnote}>No bank login, policy numbers or passwords needed.</p>
 </main></div>;
}
`);
write('app/plan-preview/page.tsx',String.raw`import {notFound} from 'next/navigation';
import DemoPlan from './DemoPlan';
export const metadata={title:'Test savings plan',robots:{index:false,follow:false}};
export default function Page(){if(process.env.VERCEL_ENV!=='preview'&&process.env.NODE_ENV!=='development')notFound();return <DemoPlan/>;}
`);
write('app/plan-preview/DemoPlan.tsx',String.raw`"use client";
import {useEffect,useState} from 'react';
import Header from '@/components/Header';
import SimpleSavingsReport from '@/app/report/[id]/SimpleSavingsReport';
import {cleanDraft,prepareDraft,type PlanDraft} from '@/lib/plan-draft';
import {analyseSavings} from '@/lib/savings-engine';
export default function DemoPlan(){const [draft,setDraft]=useState<PlanDraft|null>(null);useEffect(()=>{try{setDraft(cleanDraft(JSON.parse(sessionStorage.getItem('spendshift_demo_plan')||'null')));}catch{}},[]);if(!draft)return <p style={{padding:30}}>Open the test questionnaire first.</p>;const r=prepareDraft(draft);return <><Header simple/><p style={{padding:20,textAlign:'center'}}>Test plan only. No payment. No customer record saved.</p><SimpleSavingsReport reportId='demo-custom' answers={draft.answers} refinements={r} analysis={analyseSavings(draft.answers,r)}/></>;}
`);
}
