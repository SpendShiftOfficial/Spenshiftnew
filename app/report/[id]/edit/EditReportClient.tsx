"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {auditQuestions} from "@/lib/audit-schema";
import {blankDraft,cleanDraft,prepareDraft,restoreDraft,selectedDraftAreas,emptyPolicy,type PlanDraft,type RawPolicy} from "@/lib/plan-draft";
import {areaNames,type PersonalisationArea} from "@/lib/personalisation-questions";
import {analyseSavings} from "@/lib/savings-engine";
import styles from "./correction.module.css";

type Props={reportId:string;revision:number;answers:string[];refinements:unknown};
type NameAndValue=[string,string];
const money=(v:string)=>v===""?"Not entered":"$"+Number(v).toLocaleString("en-AU",{maximumFractionDigits:2});
export default function EditReportClient({reportId,revision,answers,refinements}:Props){
 const [draft,setDraft]=useState<PlanDraft>(()=>restoreDraft(answers,refinements));
 const [loaded,setLoaded]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [confirmed,setConfirmed]=useState(false);
 const key="spendshift_unsaved_report_edit_"+reportId+"_"+revision;
 const areas=selectedDraftAreas(draft);
 const d=draft.details;
 useEffect(()=>{
  try{const saved=sessionStorage.getItem(key);if(saved){
    const restored=cleanDraft(JSON.parse(saved));
    if(JSON.stringify(restored.answers).length&&restored.version===1)setDraft(restored);
  }}catch{}
  setLoaded(true);
 },[key]);
 useEffect(()=>{if(!loaded)return;try{sessionStorage.setItem(key,JSON.stringify(draft));}catch{}},[draft,loaded,key]);
 function change(field:string,value:string){setError("");setConfirmed(false);setDraft(prev=>({...prev,details:{...prev.details,[field]:value}}));}
 function patchPolicy(index:number,change:Partial<RawPolicy>){setConfirmed(false);setDraft(prev=>({...prev,insurancePolicies:prev.insurancePolicies.map((p,i)=>i===index?{...p,...change}:p)}));}
 function select(label:string,id:string,options:NameAndValue[]){
  return <label className={styles.field}>{label}<select value={d[id]||""} onChange={e=>change(id,e.target.value)}><option value="">Not sure / skip</option>{options.map(([value,title])=><option value={value} key={value}>{title}</option>)}</select></label>;
 }
 const nums=(field:string,label:string)=> <label className={styles.field}>{label}<input type="number" min="0" max="100000" step="0.01" inputMode="decimal" placeholder="Not sure" value={d[field]||""} onChange={e=>change(field,e.target.value)}/></label>;
 const count=(field:string,label:string)=> <label className={styles.field}>{label}<input type="number" min="0" max="21" step="1" inputMode="numeric" placeholder="Not sure" value={d[field]||""} onChange={e=>change(field,e.target.value)}/></label>;
 async function submit(){
  if(!confirmed||saving)return;
  let clean:PlanDraft;
  try{clean=cleanDraft(draft);prepareDraft(clean);}catch(e){setError(e instanceof Error?e.message:"Check the amounts you changed.");return;}
  setSaving(true);setError("");
  try{
   const response=await fetch("/api/report-corrections",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reportId,revision,draft:clean})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"We couldn't save your changes.");
   try{sessionStorage.removeItem(key);}catch{}
   window.location.replace("/report/"+encodeURIComponent(reportId)+"?updated=1");
  }catch(e){setError(e instanceof Error?e.message:"Your changes couldn't be saved. Your old plan is safe.");setSaving(false);}
 }
 if(!loaded)return <div className={styles.page}><Header simple/><main className={styles.wrap}><h1>Opening your answers…</h1></main></div>;
 return <div className={styles.page}><Header simple/><main className={styles.wrap}>
  <span className={styles.kicker}>YOUR SAVED SPENDSHIFT PLAN</span>
  <h1>Fix an answer</h1>
  <p className={styles.lead}>Change what you need. We'll use the new figures to update the plan you already bought. There is no new charge.</p>
  <p className={styles.caution}>Keep your report link private. Anyone with the link can read your plan and request a correction.</p>
  <Link className={styles.back} href={"/report/"+encodeURIComponent(reportId)}>Back to my plan</Link>

  <details className={styles.group}>
   <summary>Check my first eight answers</summary>
   <div className={styles.fields}>
    {auditQuestions.map((question,index)=><label className={styles.field} key={question.q}>
     {question.q}
     <select value={draft.answers[index]} onChange={e=>{setConfirmed(false);setDraft(prev=>({...prev,answers:prev.answers.map((a,i)=>i===index?e.target.value:a)}));}}>
      {question.options.map(option=><option value={option} key={option}>{option}</option>)}
     </select>
    </label>)}
   </div>
  </details>
  {areas.map(area=><details className={styles.group} key={area}>
   <summary>{areaNames[area]}</summary>
   <div className={styles.fields}>
    {area==="subscriptions"&&<>
     {nums("subscriptionsMonthly","Your total monthly subscriptions ($)")}
     {select("Do you pay for a subscription you no longer use?","unusedSubscriptionChoice",[["yes","Yes"],["no","No — I use them all"],["not_sure","Not sure"]])}
     {d.unusedSubscriptionChoice==="yes"&&<>
      <label className={styles.field}>Which subscription?<input type="text" maxLength={60} value={d.unusedSubscriptionName||""} onChange={e=>change("unusedSubscriptionName",e.target.value)}/></label>
      {nums("unusedSubscriptionMonthly","That one subscription each month ($)")}
     </>}
    </>}
    {area==="takeaway"&&<>
     {nums("takeawayOrder","Your usual takeaway cost ($)")}
     {select("That cost is…","takeawayAmountPeriod",[["order","For one order"],["week","For one week"]])}
     {count("takeawayOrdersPerWeek","Orders you buy in a week")}
     {count("takeawaySwapPerWeek","Orders you could replace each week")}
     {Number(d.takeawaySwapPerWeek)>0&&<>
      {select("Why do you buy takeaway?","takeawayReason",[["busy","I have little time"],["tired","I feel too tired"],["family","I feed other people"],["enjoy","I enjoy takeaway"],["other","Another reason"]])}
      {nums("takeawayReplacementCost","Food at home for the same people ($)")}
     </>}
    </>}
    {area==="convenience"&&<>
     {nums("convenienceWeekly","Small everyday buys each week ($)")}
     {areas.includes("takeaway")&&select("Does that include your takeaway food?","convenienceOverlap",[["no","No"],["yes","Yes"],["not_sure","Not sure"]])}
     {d.convenienceOverlap!=="yes"&&nums("convenienceGoalWeekly","Your new weekly goal ($)")}
    </>}
    {area==="phone"&&<>
     {select("Which bills do you pay?","phoneService",[["both","Mobile and home internet"],["mobile","Mobile only"],["internet","Home internet only"],["neither","Neither"],["not_sure","Not sure"]])}
     {["both","mobile"].includes(d.phoneService)&&nums("mobileMonthly","Your mobile cost each month ($)")}
     {["both","internet"].includes(d.phoneService)&&nums("internetMonthly","Your internet cost each month ($)")}
    </>}
    {area==="energy"&&<>
     {select("State or territory","state",["NSW","VIC","QLD","SA","WA","TAS","ACT","NT"].map(x=>[x,x]))}
     {nums("electricityBill","Your latest electricity bill ($)")}
     {select("That bill covers…","electricityPeriod",[["month","One month"],["quarter","Three months"]])}
     {select("Do you pay a gas bill?","hasGas",[["yes","Yes"],["no","No"],["not_sure","Not sure"]])}
     {d.hasGas==="yes"&&nums("gasMonthly","Your gas cost each month ($)")}
    </>}
    {area==="insurance"&&<>
     {draft.insurancePolicies.map((p,index)=><div className={styles.policy} key={index}>
      <strong>Policy {index+1}</strong>
      <label className={styles.field}>Insurance type<select value={p.type} onChange={e=>patchPolicy(index,{type:e.target.value})}>
       <option value="">Not sure</option>{["Car","Home or contents","Health","Life or income protection","Pet","Travel","Other"].map(x=><option key={x}>{x}</option>)}
      </select></label>
      <label className={styles.field}>What do you pay? ($)<input type="number" min="0" max="100000" step="0.01" inputMode="decimal" value={p.premium} onChange={e=>patchPolicy(index,{premium:e.target.value})}/></label>
      <label className={styles.field}>How often?<select value={p.paymentPeriod} onChange={e=>patchPolicy(index,{paymentPeriod:e.target.value})}>
       <option value="year">Each year</option><option value="month">Each month</option>
      </select></label>
      <label className={styles.field}>Renewal date<select value={p.renewal} onChange={e=>patchPolicy(index,{renewal:e.target.value})}>
       <option value="">Not sure</option><option value="soon">In the next 3 months</option><option value="later">Later</option>
      </select></label>
      <details className={styles.inner}><summary>Company and cover (optional)</summary>
       <label className={styles.field}>Company<input maxLength={80} value={p.insurer} onChange={e=>patchPolicy(index,{insurer:e.target.value})}/></label>
       <label className={styles.field}>Type of cover<input maxLength={120} value={p.coverDescription} onChange={e=>patchPolicy(index,{coverDescription:e.target.value})}/></label>
      </details>
      <button className={styles.back} type="button" onClick={()=>{setConfirmed(false);setDraft(prev=>({...prev,insurancePolicies:prev.insurancePolicies.filter((_,i)=>i!==index)}));}}>Remove this policy</button>
     </div>)}
     {draft.insurancePolicies.length<6&&<button className={styles.outline} type="button" onClick={()=>{setConfirmed(false);setDraft(p=>({...p,insurancePolicies:[...p.insurancePolicies,emptyPolicy()]}));}}>Add another policy</button>}
    </>}
    {area==="unplanned"&&<>
     {select("What do you buy?","unplannedArea",["Online shopping","Clothes or accessories","Entertainment or hobbies","Other purchases"].map(x=>[x,x]))}
     {select("What makes you shop?","shoppingTrigger",["Sales or deals","Boredom","Social media","Other","Not sure"].map(x=>[x,x]))}
    </>}
   </div>
  </details>)}
  {areas.length<7&&<div className={styles.extra}>
   <label className={styles.field}>Want to check another area?
    <select value={draft.additionalArea||""} onChange={e=>{setConfirmed(false);setDraft(prev=>({...prev,additionalArea:e.target.value}));}}>
     <option value="">No extra area</option>
     {Object.entries(areaNames).filter(([key])=>!areas.includes(key as PersonalisationArea)||key===draft.additionalArea).map(([key,label])=><option value={key} key={key}>{label}</option>)}
    </select>
   </label>
  </div>}
  <section className={styles.finish}>
   <h2>Check your changes</h2>
   <p>We'll update your existing report and keep a copy of its earlier answers. Your private link will stay the same.</p>
   <label className={styles.confirm}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I've checked the answers I changed.</label>
   {error&&<p className={styles.error} role="alert">{error}</p>}
   <button className={styles.primary} type="button" onClick={submit} disabled={!confirmed||saving}>{saving?"Saving your changes…":"Update my savings plan"}</button>
   <p className={styles.note}>Your unfinished edits stay in this browser tab. Only the final saved version changes your report.</p>
  </section>
 </main></div>;
}
