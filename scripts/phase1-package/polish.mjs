import fs from 'node:fs';
import {read,write,edit,replace} from './io.mjs';
export default function polish(){
edit('next.config.ts',s=>s.replace("'/report-preview','/api/:path*'","'/report-preview','/plan-preview','/api/:path*'"));
edit('components/ConsentBanner.tsx',s=>{
 const a=s.indexOf('const previousChoice = localStorage.getItem(');const b=s.indexOf('try { localStorage.setItem',a);
 if(a>=0&&b>a)s=s.slice(0,a)+`let previousChoice:ConsentChoice|null=null;try{previousChoice=localStorage.getItem(CONSENT_KEY) as ConsentChoice|null;}catch{}\n`+s.slice(b);
 return s;
});
edit('app/results/page.tsx',s=>{
 s=s.replace('useEffect, useMemo, useState','useEffect, useMemo, useRef, useState');
 s=replace(s,'  const [answers, setAnswers] = useState<string[]>([]);','  const [answers, setAnswers] = useState<string[]>([]);\n  const checkoutAttempt=useRef({answers:"",id:""});');
 s=s.replace("checkoutRequestId: (()=>{const key='spendshift_checkout_'+JSON.stringify(answers);let id=sessionStorage.getItem(key);if(!id){id=crypto.randomUUID();sessionStorage.setItem(key,id);}return id;})()","checkoutRequestId: (()=>{const fingerprint=JSON.stringify(answers);if(checkoutAttempt.current.answers!==fingerprint||!checkoutAttempt.current.id)checkoutAttempt.current={answers:fingerprint,id:crypto.randomUUID()};return checkoutAttempt.current.id;})()");
 s=s.replace('page_location: window.location.href','source: "free_results"');
 // Progress and payment should never depend on optional analytics storage.
 s=s.replace('    if (!sessionStorage.getItem("free_results_view_tracked")) {','    try { if (!sessionStorage.getItem("free_results_view_tracked")) {');
 s=s.replace('      sessionStorage.setItem("free_results_view_tracked", "1");\n    }','      sessionStorage.setItem("free_results_view_tracked", "1");\n    } } catch {}');
 s=s.replace('const stored = JSON.parse(localStorage.getItem("spendshift_answers") || "null");','const stored = JSON.parse(localStorage.getItem("spendshift_answers") || sessionStorage.getItem("spendshift_answers") || "null");');
 return s;
});
edit('app/success/page.tsx',s=>{
 const a=s.indexOf('    function recordPurchase() {');const b=s.indexOf('    async function checkAndProceed()',a);
 if(a<0||b<0)throw new Error('success tracking boundary missing');
 s=s.slice(0,a)+String.raw`    // Private payment and report pages deliberately send no analytics.
    function recordPurchase() {}
    function openReadyReport(reportId: string) {
      if (!cancelled) window.location.replace("/report/" + encodeURIComponent(reportId));
    }

`+s.slice(b);
 s=s.replace('const [activeStep, setActiveStep] = useState(0);','const [activeStep, setActiveStep] = useState(0);');
 s=s.replace('Your report is still processing. Please check your email or retry later.','Your plan is still being made. Keep your purchase link and open it again. Do not pay again.');
 return s;
});
edit('lib/personalisation-questions.ts',s=>{
 s=s.replace('case "phone": return "You last checked your phone or internet price " + answers[4].toLowerCase() + ".";',`case "phone": return answers[4]==="I honestly don't know"?"You're not sure when you last checked your phone or internet price.":"You last checked your phone or internet price " + answers[4].toLowerCase() + ".";`);
 s=s.replace('case "energy": return "You last checked your power or gas price " + answers[5].toLowerCase() + ".";',`case "energy": return answers[5]==="I honestly don't know"?"You're not sure when you last checked your power or gas price.":"You last checked your power or gas price " + answers[5].toLowerCase() + ".";`);
 return s;
});
write('app/audit/page.tsx',String.raw`"use client";
import {useEffect,useState} from 'react';
import Header from '@/components/Header';
import {auditQuestions,validateAuditAnswers} from '@/lib/audit-schema';
import styles from './audit.module.css';
const key='spendshift_free_draft_v2';
export default function Audit(){
 const [index,setIndex]=useState(0);const [answers,setAnswers]=useState<string[]>([]);const [loaded,setLoaded]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&Array.isArray(saved.answers)&&saved.answers.length<=8&&saved.answers.every((a:unknown,i:number)=>typeof a==='string'&&auditQuestions[i].options.includes(a))){setAnswers(saved.answers);setIndex(Math.max(0,Math.min(7,Number(saved.index)||0)));}}catch{}setLoaded(true);},[]);
 useEffect(()=>{if(loaded){try{localStorage.setItem(key,JSON.stringify({answers,index}));}catch{}}},[answers,index,loaded]);
 function choose(value:string){setAnswers(prev=>{const next=[...prev];next[index]=value;return next;});setError('');}
 function next(){if(!answers[index])return;if(index<7){setIndex(index+1);return;}try{const valid=validateAuditAnswers(answers);let saved=false;try{localStorage.setItem('spendshift_answers',JSON.stringify(valid));localStorage.removeItem(key);saved=true;}catch{}if(!saved){try{sessionStorage.setItem('spendshift_answers',JSON.stringify(valid));saved=true;}catch{}}if(!saved){setError('Your browser is blocking saved answers. Allow website storage to view your free results.');return;}window.location.assign('/results');}catch(e){setError(e instanceof Error?e.message:'Please check your answers.');}}
 const q=auditQuestions[index];
 return <div className={styles.page}><Header simple/><main className={styles.wrap}>
  <p className={styles.progress}>Question {index+1} of 8</p><div className={styles.track} role='progressbar' aria-label='Your free check' aria-valuenow={Math.round(index/8*100)} aria-valuemin={0} aria-valuemax={100}><span style={{width:index/8*100+'%'}}/></div>
  <h1>{q.q}</h1><p>Choose the answer that fits you best.</p>
  <div className={styles.options} role='group' aria-label={q.q}>{q.options.map(a=><button key={a} type='button' aria-pressed={answers[index]===a} onClick={()=>choose(a)}>{a}</button>)}</div>
  <div className={styles.actions}>{index>0?<button type='button' onClick={()=>setIndex(index-1)}>Back</button>:<a href='/'>Back home</a>}<button className={styles.next} type='button' disabled={!answers[index]} onClick={next}>{index===7?'See my free results':'Next question'}</button></div>
  {error&&<p role='alert'>{error}</p>}<p className={styles.small}>No bank login. No payment for your free results.</p>
  <button className={styles.reset} type='button' onClick={()=>{setAnswers([]);setIndex(0);setError('');try{localStorage.removeItem(key);}catch{}}}>Start a new check</button>
 </main></div>;
}
`);
write('app/audit/audit.module.css',String.raw`.page{min-height:100vh;background:#f7faf7;color:#173b25}.wrap{max-width:700px;width:calc(100% - 32px);margin:35px auto;padding:22px 0 70px}.progress{font-weight:750;color:#42654d}.track{height:8px;background:#e1ebe3;border-radius:8px;overflow:hidden;margin-bottom:32px}.track span{display:block;height:100%;background:#148535}.wrap h1{font-size:clamp(29px,5vw,39px);font-weight:850;line-height:1.2;letter-spacing:-.025em}.wrap>p{font-size:17px;line-height:1.6}.options{display:grid;gap:12px;margin:28px 0}.options button{background:#fff;border:1px solid #cbdccd;border-radius:14px;padding:18px 20px;text-align:left;font:inherit;font-size:18px;min-height:58px;color:#294431}.options button[aria-pressed=true]{background:#e7f5e9;border:2px solid #128034;font-weight:750}.options button:focus-visible,.actions button:focus-visible{outline:3px solid #a2dcb2;outline-offset:3px}.actions{display:flex;align-items:center;justify-content:space-between;gap:20px}.actions button,.actions a{font:inherit;font-weight:750;padding:14px 22px;border-radius:28px;border:1px solid #b9d0be;color:#14652c;background:#fff}.actions .next{background:#087c2b;color:white;border-color:#087c2b}.actions button:disabled{opacity:.45}.small{font-size:14px!important;color:#5a6c5e}.reset{padding:10px 0;border:0;background:none;text-decoration:underline;font:inherit;color:#3c5d46;cursor:pointer}
`);
edit('app/personalise/PersonaliseClient.tsx',s=>{
 s=replace(s,"const [submitting,setSubmitting]=useState(false);","const [submitting,setSubmitting]=useState(false);const [moving,setMoving]=useState(false);");
 s=s.replace("async function next(skip=false){setError('');","async function next(skip=false){if(moving||submitting)return;setError('');");
 s=s.replace("snapshot.step=Math.min(snapshot.step+1,areas.length);try{await persist(snapshot);setDraft(snapshot);}catch(e){setError(e instanceof Error?e.message:'Your answers were not saved.');}","snapshot.step=Math.min(snapshot.step+1,areas.length);setMoving(true);try{await persist(snapshot);setDraft(snapshot);}catch(e){setError(e instanceof Error?e.message:'Your answers were not saved.');}finally{setMoving(false);}");
 s=s.replace("const timer=setTimeout(()=>persist(latest.current).catch(e=>setError(e.message)),800)","const timer=setTimeout(()=>persist(latest.current).catch(e=>setError(e.message)),800)");
 s=s.replace("return <div className={styles.page}><Header simple/><main className={styles.wrap}>\n  <h1>","return <div className={styles.page}><Header simple/><main className={styles.wrap}><fieldset className={styles.journeyFieldset} disabled={moving||submitting}>\n  <h1>");
 s=s.replace("</section><p className={styles.footnote}>","</section></fieldset><p className={styles.footnote}>");
 const marker="<strong>{areaNames[a]}</strong><button className={styles.extraLink}";
 s=replace(s,marker,`<strong>{areaNames[a]}</strong><dl>{reviewFacts(a).map(([label,value],n)=><div key={n}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><button className={styles.extraLink}`);
 const before=" const choice=(key:string,label:string,options:[string,string][])";
 const inserted=String.raw` function reviewFacts(a:PersonalisationArea):[string,string][]{
   const money=(v:string,unit:string)=>v!==''?'$'+Number(v).toLocaleString('en-AU',{maximumFractionDigits:2})+' '+unit:'Not provided';
   if(a==='subscriptions')return [['Total',money(d.subscriptionsMonthly,'a month')],['Unused service?',d.unusedSubscriptionChoice==='no'?'No — I use them all':d.unusedSubscriptionChoice==='yes'?'Yes':'Not sure'],...(d.unusedSubscriptionChoice==='yes'?[['Service',d.unusedSubscriptionName||'Not named'],['Price',money(d.unusedSubscriptionMonthly,'a month')]] as [string,string][]:[])];
   if(a==='takeaway')return [['Takeaway cost',money(d.takeawayOrder,d.takeawayAmountPeriod==='week'?'a week':'an order')],['Orders each week',d.takeawayOrdersPerWeek||'Not provided'],['Orders to replace',d.takeawaySwapPerWeek||'Not provided'],['Cost at home',money(d.takeawayReplacementCost,'for the same people')]];
   if(a==='convenience')return [['Current cost',money(d.convenienceWeekly,'a week')],['Weekly goal',money(d.convenienceGoalWeekly,'a week')],['Includes takeaway?',d.convenienceOverlap==='no'?'No':d.convenienceOverlap==='yes'?'Yes':'Not sure']];
   if(a==='phone')return [['Bills',d.phoneService||'Not provided'],['Mobile',money(d.mobileMonthly,'a month')],['Internet',money(d.internetMonthly,'a month')]];
   if(a==='energy')return [['State',d.state||'Not provided'],['Power',money(d.electricityBill,d.electricityPeriod==='month'?'a month':'for 3 months')],['Gas',d.hasGas==='no'?'No gas bill':money(d.gasMonthly,'a month')]];
   if(a==='insurance')return draft.insurancePolicies.filter(p=>p.type||p.premium).map(p=>[p.type||'Insurance',money(p.premium,p.paymentPeriod==='month'?'a month':'a year')]);
   return [['Shopping',d.unplannedArea||'Not provided'],['What triggers it',d.shoppingTrigger||'Not provided']];
 }
`;
 s=replace(s,before,inserted+before);
 return s;
});
edit('app/personalise/personalise.module.css',s=>s+'\n.journeyFieldset{border:0;padding:0;margin:0;min-width:0}.journeyFieldset:disabled{opacity:.78}.field input[type=text],.field input[type=number]{border:1px solid #c5d8ca;border-radius:10px;background:white}.reviewExtra dt,.reviewExtra dd{overflow-wrap:anywhere}\n');
edit('app/api/personalisation/draft/route.ts',s=>s.replace('update({answers:draft.answers,refinements,updated_at:revision})','update({answers:draft.answers,refinements,status:"awaiting_details",updated_at:revision})'));
edit('app/api/cron/recover-paid-reports/route.ts',s=>{
 const a=s.indexOf('  const {data,error}=await supabaseAdmin');const b=s.indexOf('  // Never turn an unfinished',a);
 if(a<0||b<0)throw new Error('Recovery selection boundary missing');
 s=s.slice(0,a)+String.raw`  const cutoff=new Date(now-2*60*1000).toISOString();
  const [completed,failedJobs]=await Promise.all([
   supabaseAdmin.from('report_orders').select('stripe_session_id,status,refinements').eq('status','awaiting_details').eq('refinements->>completed','true').lt('attempt_count',4).lt('updated_at',cutoff).order('updated_at',{ascending:true}).limit(20),
   supabaseAdmin.from('report_orders').select('stripe_session_id,status,refinements').eq('status','failed').lt('attempt_count',4).lt('updated_at',cutoff).order('updated_at',{ascending:true}).limit(20),
  ]);
  if(completed.error||failedJobs.error)throw new Error('Could not read pending jobs');
  const data=[...(completed.data||[]),...(failedJobs.data||[])];
`+s.slice(b);return s;
});
// Metadata should describe the implemented product, not the removed large-savings example.
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);}
for(const file of walk('app').filter(p=>p.endsWith('layout.tsx')&&!p.endsWith('app/layout.tsx'))){edit(file,s=>s.replaceAll('AI-powered','answer-based').replaceAll('personalised AI','personalised').replaceAll('estimated savings range','areas worth checking').replaceAll('30-day action plan','step-by-step action plan'));}
write('docs/PHASE_1_TEN_IMPROVEMENTS.md',String.raw`# Phase 1: ten-improvement package — preview only

## Implemented scope
- Truthful shared offer across home, pricing, what is included and how it works. No unsupported dollar examples, old 30-day report promise or AI-generation claim.
- Strict shared eight-answer validation before checkout, versioned terms, server-fixed AUD39 price, idempotent session creation and safe error responses.
- Third-party measurement restricted to consented public brochure pages. Private audit, results, payment, personalisation and report documents do not load measurement scripts. Private CSP blocks external script/network execution. No access IDs in events or console logs.
- Paid plan uses guided questions, not a second upgrade. Unknown amounts can be skipped.
- Autosaved server-side drafts with optimistic revision checks and a visible saved state. Original answers can be corrected before generation. Only relevant, visible data is included in the final plan.
- Meal cost can be per order or per week, and home meals must feed the same people. Overlapping takeaway/small-buy scenarios are not added without a separate-cost answer.
- The main customer goal and upcoming insurance renewals affect ranking. All meaningful areas remain in the plan.
- Weekly targets appear first. Yearly scenarios are behind a clear optional explanation.
- Quote-price tools and a local, self-reported savings tracker separate possible savings from checked differences. Tracker records do not sync across devices and are not independently verified.
- Automated regression and browser tests cover desktop and mobile, privacy, all seven areas, saved draft recovery, editing, mistakes and the report tools.

## Operational limits / release gates
- No production merge, migration or production environment edits are part of this package.
- Tests with mocked Stripe/Supabase responses verify the interface and client recovery, NOT a real new Stripe charge or actual provider delivery.
- Email content and code are reviewed, but real sandbox receipt/resume/report inbox delivery remains to be verified with the owner's test email setup.
- A new end-to-end Stripe sandbox purchase on the deployed build is still required before release.
- The current recovery schedule is once per day. It retries completed/failed work, never finalises a customer's unfinished draft. Production needs an agreed support/recovery expectation.
- Five independent customer sessions and a financial-product-advice review are still human release gates. Do not describe them as completed.
- Store no credentials, bank logins or policy numbers in tests, artifacts, commits or public logs.

## Manual acceptance cases
1. All seven high-signal answers: every area is offered, urgent renewal is easy to find.
2. Two-area customer: no unrelated follow-ups.
3. All subscriptions used: no instruction to cancel a useful service.
4. Takeaway weekly total: never label it as an order price.
5. Zero swaps: no forced saving. Higher replacement cost: no claimed reduction.
6. Overlapping lunch/takeaway costs: no double-counted potential total.
7. Close and return after Saved: recover the same data and position.
8. Correct an original answer: stale amounts no longer appear in the plan.
9. Two tabs: stale revision fails safely instead of overwriting work.
10. Paid report: compare a quote, record a measured difference and revisit on the same device.
`);
}
