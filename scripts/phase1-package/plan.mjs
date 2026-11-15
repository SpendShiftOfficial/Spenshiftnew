import {write,edit,replace} from './io.mjs';
export default function plan(){
write('lib/savings-math.ts',String.raw`import type {ReportRefinements} from './report-refinements';
export const roundMoney=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
export function takeawayMath(r:ReportRefinements){
 const d=r.details;const amount=d.takeawayOrder;const orders=d.takeawayOrdersPerWeek;const swaps=d.takeawaySwapPerWeek;const home=d.takeawayReplacementCost;
 const orderCost=amount===null?null:d.takeawayAmountPeriod==='week'?(orders!==null&&orders>0?amount/orders:null):amount;
 const weeklyCost=amount===null?null:d.takeawayAmountPeriod==='week'?amount:(orders!==null?amount*orders:null);
 const weeklySaving=orderCost!==null&&orders!==null&&swaps!==null&&home!==null&&swaps>0&&swaps<=orders&&orderCost>home?roundMoney((orderCost-home)*swaps):null;
 return {orderCost:orderCost===null?null:roundMoney(orderCost),weeklyCost:weeklyCost===null?null:roundMoney(weeklyCost),weeklySaving,annualExample:weeklySaving===null?null:roundMoney(weeklySaving*52)};
}
export function checkedDifference(before:number,after:number,fees:number){
 if([before,after,fees].some(v=>!Number.isFinite(v)||v<0||v>100000))throw new Error('Use amounts from 0 to 100,000.');
 return roundMoney(before-after-fees);
}
export function quoteDifference(currentAnnual:number,quote:number,period:'month'|'year',fees:number){return checkedDifference(currentAnnual,quote*(period==='month'?12:1),fees);}
`);
write('lib/plan-priority.ts',String.raw`import type {SavingsOpportunity} from './savings-engine';
import type {ReportRefinements} from './report-refinements';
import {auditPriorityScore,type PersonalisationArea} from './personalisation-questions';
export function priorityReason(op:SavingsOpportunity,answers:string[],r:ReportRefinements){
 if(op.area==='insurance'&&r.insurancePolicies.some(p=>p.renewal==='soon'))return 'Check soon: one of your policies renews in the next 3 months.';
 const goal=answers[7];
 if(goal==='Lower my bills'&&['insurance','phone','energy','subscriptions'].includes(op.area))return 'This fits your goal: lower your bills.';
 if(goal==='Stop money disappearing so fast'&&['takeaway','convenience','unplanned','subscriptions'].includes(op.area))return 'This fits your goal: take control of regular spending.';
 if(goal==='Reduce stress'&&['subscriptions','convenience'].includes(op.area))return 'A small, low-pressure place to start.';
 if(op.scenarioSaving!==null)return 'You gave enough costs to work out a possible change.';
 return 'Your answers show a reason to check, not proof that you pay too much.';
}
export function rankOpportunities(ops:SavingsOpportunity[],answers:string[],r:ReportRefinements){
 const goal=answers[7];
 const score=(op:SavingsOpportunity)=>{
  const urgent=op.area==='insurance'&&r.insurancePolicies.some(p=>p.renewal==='soon');
  let goalFit=0;
  if(goal==='Lower my bills'&&['insurance','phone','energy','subscriptions'].includes(op.area))goalFit=12;
  if(goal==='Save more money'&&op.scenarioSaving!==null)goalFit=12;
  if(goal==='Stop money disappearing so fast'&&['unplanned','takeaway','convenience','subscriptions'].includes(op.area))goalFit=12;
  if(goal==='Reduce stress'&&['subscriptions','convenience'].includes(op.area))goalFit=12;
  if(goal==='Feel more financially in control'&&['phone','energy','insurance','subscriptions'].includes(op.area))goalFit=8;
  const actionable=op.scenarioSaving!==null?4:0;
  return (urgent?100:0)+goalFit+actionable+auditPriorityScore(op.area,answers);
 };
 return [...ops].sort((a,b)=>score(b)-score(a)||(b.scenarioSaving??0)-(a.scenarioSaving??0));
}
export function goalIntro(goal:string){
 const copy:Record<string,string>={
 'Lower my bills':'Your goal is to lower your bills. We put bill checks and any near renewals first.',
 'Save more money':'Your goal is to save more. Start with a change you can measure and keep doing.',
 'Reduce stress':'Your goal is less stress. Start with one manageable step. You do not need to do everything today.',
 'Stop money disappearing so fast':'Your goal is to take control of regular spending. We put those habits near the top.',
 'Feel more financially in control':'Your goal is to feel in control. Start by knowing what you pay and what needs checking.',
 };return copy[goal]||'Start with one clear step. Work through the rest at your own pace.';
}
`);
edit('lib/savings-engine.ts',s=>{
 s=replace(s,'import type { ReportRefinements } from "./report-refinements";','import type { ReportRefinements } from "./report-refinements";\nimport {takeawayMath} from "./savings-math";\nimport {rankOpportunities} from "./plan-priority";');
 s=replace(s,'  const opportunities: SavingsOpportunity[] = areas.map(area => {','  let opportunities: SavingsOpportunity[] = areas.map(area => {');
 const a=s.indexOf('    } else if (area === "takeaway") {');const b=s.indexOf('    } else if (area === "convenience") {',a);
 if(a<0||b<0)throw new Error('Takeaway engine boundary missing');
 s=s.slice(0,a)+String.raw`    } else if (area === "takeaway") {
      const math=takeawayMath(refinements);
      annualSpend=math.weeklyCost===null?null:Math.round(math.weeklyCost*52*100)/100;
      scenarioSaving=math.annualExample;
      assumption=math.weeklySaving===null?'We need both meal costs and a realistic change before showing a saving.':'This is a weekly goal after paying for food at home. It is not money saved yet.';
      firstAction=d.takeawaySwapPerWeek===0?'Keep your routine for now. Check delivery fees before the next order.':d.takeawaySwapPerWeek!==null?'Choose '+d.takeawaySwapPerWeek+' orders to replace next week.':'Count your orders in a normal week before choosing a change.';
      verification='Compare both costs for the same people, including food, delivery and extra travel.';
`+s.slice(b);
 s=replace(s,'      if (d.convenienceWeekly !== null && d.convenienceGoalWeekly !== null &&\n          d.convenienceGoalWeekly < d.convenienceWeekly) {','      if (d.convenienceWeekly !== null && d.convenienceGoalWeekly !== null &&\n          d.convenienceGoalWeekly < d.convenienceWeekly &&\n          (!areas.includes("takeaway") || d.convenienceOverlap === "no")) {');
 const start=s.indexOf('  // Put actions with customer-set');const end=s.indexOf('  const savings = opportunities.map',start);
 if(start>=0&&end>=0)s=s.slice(0,start)+'  opportunities = rankOpportunities(opportunities, answers, refinements);\n\n'+s.slice(end);
 else if(!s.includes('opportunities = rankOpportunities'))throw new Error('Priority sort block missing');
 return s;
});
write('app/report/[id]/SavingsTracker.tsx',String.raw`"use client";
import {useEffect,useState} from 'react';
import {checkedDifference} from '@/lib/savings-math';
import styles from './simple-report.module.css';
type Entry={area:string;before:number;after:number;fees:number;period:'week'|'month'|'year';date:string};
export default function SavingsTracker({reportId,areas}:{reportId:string;areas:{area:string;title:string}[]}){
 const [entries,setEntries]=useState<Entry[]>([]);const [loaded,setLoaded]=useState(false);const [area,setArea]=useState(areas[0]?.area||'');const [before,setBefore]=useState('');const [after,setAfter]=useState('');const [fees,setFees]=useState('0');const [period,setPeriod]=useState<Entry['period']>('month');const [date,setDate]=useState('');const [checked,setChecked]=useState(false);const [message,setMessage]=useState('');
 const key='spendshift_checked_results_v1_'+reportId;
 useEffect(()=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(value))setEntries(value.filter(e=>areas.some(a=>a.area===e.area)&&['week','month','year'].includes(e.period)&&[e.before,e.after,e.fees].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100000)).slice(0,7));}catch{}setLoaded(true);},[key]);
 function save(next:Entry[]){try{localStorage.setItem(key,JSON.stringify(next));setEntries(next);setMessage('Saved on this device.');return true;}catch{setMessage('This browser could not save your result. Copy it somewhere safe.');return false;}}
 function submit(e:React.FormEvent){e.preventDefault();if(!checked||!date||!before||!after){setMessage('Add both costs and confirm you checked the same period.');return;}const entry={area,before:Number(before),after:Number(after),fees:Number(fees||0),period,date};try{checkedDifference(entry.before,entry.after,entry.fees);}catch(err){setMessage(err instanceof Error?err.message:'Check your amounts.');return;}if(save([...entries.filter(x=>x.area!==area),entry]))setChecked(false);}
 const fmt=(n:number)=>'$'+Math.abs(n).toLocaleString('en-AU',{maximumFractionDigits:2});
 return <section className={styles.lastCard}><h2>What did you actually save?</h2><p>Add a result after checking a bill or statement. These are your own records, not savings checked by SpendShift.</p>
  {loaded&&entries.map(e=>{const net=checkedDifference(e.before,e.after,e.fees);return <article className={styles.resultRow} key={e.area}><strong>{areas.find(a=>a.area===e.area)?.title}</strong><p>You reported {fmt(net)} {net>=0?'less':'more'} for this {e.period}, after extra costs. Checked {e.date}.</p><button type='button' onClick={()=>{setArea(e.area);setBefore(String(e.before));setAfter(String(e.after));setFees(String(e.fees));setPeriod(e.period);setDate(e.date);setChecked(false);}}>Edit</button><button type='button' onClick={()=>save(entries.filter(x=>x.area!==e.area))}>Remove</button></article>;})}
  {areas.length>0&&<details className={styles.helpDetails}><summary>Add or update a checked result</summary><form className={styles.trackerForm} onSubmit={submit}>
   <label>Area<select value={area} onChange={e=>setArea(e.target.value)}>{areas.map(a=><option key={a.area} value={a.area}>{a.title}</option>)}</select></label>
   <label>Both amounts cover the same…<select value={period} onChange={e=>setPeriod(e.target.value as Entry['period'])}><option value='week'>Week</option><option value='month'>Month</option><option value='year'>Year</option></select></label>
   <label>What you paid before ($)<input type='number' min='0' max='100000' step='0.01' required value={before} onChange={e=>setBefore(e.target.value)}/></label>
   <label>What you paid after ($)<input type='number' min='0' max='100000' step='0.01' required value={after} onChange={e=>setAfter(e.target.value)}/></label>
   <label>Extra costs or fees not already included ($)<input type='number' min='0' max='100000' step='0.01' required value={fees} onChange={e=>setFees(e.target.value)}/></label>
   <label>Date you checked<input type='date' required max={new Date().toISOString().slice(0,10)} value={date} onChange={e=>setDate(e.target.value)}/></label>
   <label className={styles.confirmRow}><input type='checkbox' checked={checked} onChange={e=>setChecked(e.target.checked)}/>I checked the same period and people or service. I have not counted this change elsewhere.</label>
   <button type='submit' className={styles.copyButton} disabled={!checked}>Save checked result</button>
  </form></details>}
  <p className={styles.checkNote}>Saved only in this browser, not across devices. One record per area. Weekly and monthly results are not added together.</p><p role='status' aria-live='polite'>{message}</p>
 </section>;
}
`);
write('app/report/[id]/QuoteCheck.tsx',String.raw`"use client";
import {useState} from 'react';
import {quoteDifference} from '@/lib/savings-math';
import styles from './simple-report.module.css';
export default function QuoteCheck({label,currentAnnual}:{label:string;currentAnnual:number|null}){
 const [old,setOld]=useState(currentAnnual===null?'':String(currentAnnual));const [quote,setQuote]=useState('');const [period,setPeriod]=useState<'month'|'year'>('year');const [fees,setFees]=useState('0');const [same,setSame]=useState(false);
 let diff:number|null=null;if(old!==''&&quote!==''&&same){try{diff=quoteDifference(Number(old),Number(quote),period,Number(fees||0));}catch{}}
 return <details className={styles.helpDetails}><summary>Check a quote for {label.toLowerCase()}</summary><div className={styles.trackerForm}>
  <p>Use a quote you found. We have not checked it for you.</p><label>Your current full yearly cost ($)<input type='number' min='0' max='100000' step='0.01' value={old} onChange={e=>setOld(e.target.value)}/></label>
  <label>Price in the new quote ($)<input type='number' min='0' max='100000' step='0.01' value={quote} onChange={e=>setQuote(e.target.value)}/></label>
  <label>The quote is for…<select value={period} onChange={e=>setPeriod(e.target.value as 'month'|'year')}><option value='year'>A year</option><option value='month'>A month</option></select></label>
  <label>Extra first-year fees ($)<input type='number' min='0' max='100000' step='0.01' value={fees} onChange={e=>setFees(e.target.value)}/></label>
  <label className={styles.confirmRow}><input type='checkbox' checked={same} onChange={e=>setSame(e.target.checked)}/>I compared the same cover or service, and checked what the price is after any deal ends.</label>
  {diff!==null&&<p role='status'><strong>This price is ${Math.abs(diff).toLocaleString('en-AU',{maximumFractionDigits:2})} {diff>=0?'lower':'higher'} in the first year.</strong> This is a price check, not a recommendation to switch or money already saved.</p>}
  <small>For insurance, check limits, exclusions and what you pay for a claim. A lower price may mean less cover.</small>
 </div></details>;
}
`);
edit('app/report/[id]/SimpleSavingsReport.tsx',s=>{
 s=replace(s,'import PlanChecklist from "./PlanChecklist";','import PlanChecklist from "./PlanChecklist";\nimport SavingsTracker from "./SavingsTracker";\nimport QuoteCheck from "./QuoteCheck";\nimport {takeawayMath} from "@/lib/savings-math";\nimport {goalIntro,priorityReason,rankOpportunities} from "@/lib/plan-priority";');
 const a=s.indexOf('  if (op.area === "takeaway") return (');const b=s.indexOf('  if (op.area === "convenience") return (',a);
 if(a<0||b<0)throw new Error('Takeaway view boundary missing');
 s=s.slice(0,a)+String.raw`  if (op.area === "takeaway") {
    const m=takeawayMath(r);
    return <>
      {d.takeawayOrder!==null&&<div className={styles.costLine}><strong>{money(d.takeawayOrder)} <small>/ {d.takeawayAmountPeriod==='week'?'week':'order'}</small></strong><span>Your usual takeaway spending</span></div>}
      {m.weeklyCost!==null&&<p className={styles.costExplanation}>About {money(m.weeklyCost)} each week for {d.takeawayOrdersPerWeek??'your usual'} orders.</p>}
      {m.weeklySaving!==null&&<div className={styles.possible}><strong>Your goal: {money(m.weeklySaving)} less a week</strong><p>Replace {d.takeawaySwapPerWeek} orders. Each meal at home costs {money(d.takeawayReplacementCost??0)} for the same people.</p><p>Your new weekly food cost for these meals would be about {money((m.weeklyCost??0)-m.weeklySaving)}.</p><details><summary>See the yearly example</summary><p>Keeping this change for 52 weeks could save {money(m.annualExample??0)}. Holidays, prices and extra costs may change the result.</p></details><small>This is a goal, not money saved yet.</small></div>}
      {m.weeklySaving===null&&<p className={styles.smallNote}>{d.takeawaySwapPerWeek===0?'You chose not to replace any orders. We have not added a saving.':d.takeawayReplacementCost!==null&&m.orderCost!==null&&d.takeawayReplacementCost>=m.orderCost?'Your home meal costs as much or more than the order. There is no saving from that swap.':'Check both costs for the same people before counting a saving.'}</p>}
    </>;
  }
`+s.slice(b);
 s=s.replace('    if (d.takeawayOrdersPerWeek !== null && d.takeawaySwapPerWeek !== null &&','    if (d.takeawaySwapPerWeek === 0) return ["Keep your meal routine for now.", "Check the full cost, including delivery, before your next order.", "Only change something if it fits your needs and costs less."];\n    if (d.takeawayOrdersPerWeek !== null && d.takeawaySwapPerWeek !== null &&');
 s=s.replace('"Pick " + n + " " + (n === 1 ? "day" : "days") + " next week when you\'d usually order takeaway."','"Mark " + n + " orders next week that you could replace with food from home."');
 s=s.replace('<p>That\'s {money(d.convenienceWeekly - d.convenienceGoalWeekly)} less each week, or up to {money(op.scenarioSaving)} a year if you keep to it.</p>','<p>That is {money(d.convenienceWeekly - d.convenienceGoalWeekly)} less each week.</p><details><summary>See the yearly example</summary><p>That could be {money(op.scenarioSaving)} over 52 weeks if you keep to your goal.</p></details>');
 s=replace(s,'  const ops = analysis.opportunities;','  const ops = rankOpportunities(analysis.opportunities, answers, refinements);');
 s=replace(s,'          <div className={styles.notice}>','          <p>{goalIntro(answers[7])}</p>\n          <div className={styles.notice}>');
 s=replace(s,'      <AreaNumbers op={op} refinements={refinements} />','      <p className={styles.smallNote}>{priorityReason(op, answers, refinements)}</p>\n      <AreaNumbers op={op} refinements={refinements} />');
 s=replace(s,'      <UsefulHelp op={op} r={refinements} />',String.raw`      <UsefulHelp op={op} r={refinements} />
      {op.area==='insurance'&&refinements.insurancePolicies.map((p,i)=><QuoteCheck key={i} label={p.type||'this policy'} currentAnnual={p.premium===null?null:insuranceAnnual(p)}/>)}
      {op.area==='phone'&&refinements.details.mobileMonthly!==null&&<QuoteCheck label='your mobile plan' currentAnnual={refinements.details.mobileMonthly*12}/>}
      {op.area==='phone'&&refinements.details.internetMonthly!==null&&<QuoteCheck label='your internet plan' currentAnnual={refinements.details.internetMonthly*12}/>}
      {op.area==='energy'&&<QuoteCheck label='your energy plan' currentAnnual={null}/>}
`);
 s=replace(s,'        <footer className={styles.footer}>','        <SavingsTracker reportId={reportId} areas={ops.map(op=>({area:op.area,title:op.title}))} />\n        <footer className={styles.footer}>');
 return s;
});
edit('app/report/[id]/simple-report.module.css',s=>s+String.raw`
.trackerForm{display:grid;gap:15px;padding:18px}.trackerForm label{display:grid;gap:7px;font-size:16px;font-weight:650;color:#264631}.trackerForm input:not([type=checkbox]),.trackerForm select{width:100%;max-width:100%;min-height:48px;padding:10px 12px;border:1px solid #bed3c2;border-radius:10px;font:inherit;font-size:16px;background:white}.trackerForm .confirmRow{display:flex;align-items:flex-start;font-size:14px;font-weight:500;line-height:1.55}.confirmRow input{flex:0 0 22px;width:22px;height:22px;margin-top:2px}.resultRow{border:1px solid #d5e5d8;border-radius:12px;padding:18px;margin:14px 0}.resultRow button{background:none;border:1px solid #bdd1c2;border-radius:8px;padding:8px 14px;color:#175d2d;margin-right:10px;font:inherit}.possible details{margin:12px 0;font-size:14px}.possible summary{cursor:pointer;font-weight:700}.trackerForm input:focus-visible,.trackerForm select:focus-visible{outline:3px solid #9acfaa;outline-offset:2px}
`);
edit('app/personalise/personalise.module.css',s=>s+'\nfieldset{min-inline-size:0;}\n'.replace('fieldset',' .fields')+'\n.fields{border:0;padding:0}.field input{min-width:0;max-width:100%;min-height:48px;padding:10px 12px;font:inherit;font-size:16px}.reviewExtra dl{display:grid;gap:8px;margin:12px 0}.reviewExtra dl>div{display:flex;justify-content:space-between;gap:16px}.reviewExtra dt{color:#53665a}.reviewExtra dd{font-weight:750;margin:0;text-align:right}\n');
edit('app/report-preview/page.tsx',s=>s.replace('convenienceWeekly: "100", convenienceGoalWeekly: "70",','convenienceWeekly: "100", convenienceGoalWeekly: "70", convenienceOverlap: "no",').replace('convenienceWeekly: "35", convenienceGoalWeekly: "25"','convenienceWeekly: "35", convenienceGoalWeekly: "25", convenienceOverlap: "no"'));
}
