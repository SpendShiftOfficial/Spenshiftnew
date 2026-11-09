"use client";
import {useEffect,useState} from "react";
import {checkedDifference} from "@/lib/savings-math";
import styles from "./simple-report.module.css";

type Period="week"|"month"|"year";
type Entry={id:string;area:string;name:string;before:number;after:number;fees:number;period:Period;date:string};
const localToday=()=>{const d=new Date();const n=(v:number)=>String(v).padStart(2,"0");return d.getFullYear()+"-"+n(d.getMonth()+1)+"-"+n(d.getDate());};
const amount=(n:number)=>"$"+Math.abs(n).toLocaleString("en-AU",{maximumFractionDigits:2});
export default function SavingsTracker({reportId,areas}:{reportId:string;areas:{area:string;title:string}[]}){
 const [entries,setEntries]=useState<Entry[]>([]);
 const [loaded,setLoaded]=useState(false);
 const [area,setArea]=useState(areas[0]?.area||"");
 const [name,setName]=useState("");
 const [before,setBefore]=useState("");
 const [after,setAfter]=useState("");
 const [fees,setFees]=useState("0");
 const [period,setPeriod]=useState<Period>("month");
 const [date,setDate]=useState("");
 const [confirmed,setConfirmed]=useState(false);
 const [editId,setEditId]=useState("");
 const [message,setMessage]=useState("");
 const [today,setToday]=useState("");
 const key="spendshift_checked_results_v2_"+reportId;
 const oldKey="spendshift_checked_results_v1_"+reportId;
 useEffect(()=>{
  setToday(localToday());
  try{
   const previous=JSON.parse(localStorage.getItem(key)||"null");
   const legacy=JSON.parse(localStorage.getItem(oldKey)||"[]");
   const list:Array<Entry>=Array.isArray(previous)?previous:
     Array.isArray(legacy)?legacy.map((x:Entry,i:number)=>({...x,id:"old-"+i,name:"Previous "+(areas.find(a=>a.area===x.area)?.title||"change")})):[];
   const clean=list.filter(e=>e&&typeof e.id==="string"&&typeof e.name==="string"&&
     areas.some(a=>a.area===e.area)&&["week","month","year"].includes(e.period)&&
     [e.before,e.after,e.fees].every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=100000)).slice(0,40);
   setEntries(clean);
   if(!Array.isArray(previous)&&clean.length)localStorage.setItem(key,JSON.stringify(clean));
  }catch{}
  setLoaded(true);
 },[key,oldKey]);
 function save(next:Entry[]){
  try{localStorage.setItem(key,JSON.stringify(next));setEntries(next);setMessage("Saved on this device.");return true;}
  catch{setMessage("This browser could not save the result. Please write it down.");return false;}
 }
 function edit(e:Entry){
  setArea(e.area);setName(e.name);setBefore(String(e.before));setAfter(String(e.after));setFees(String(e.fees));setPeriod(e.period);setDate(e.date);setEditId(e.id);setConfirmed(false);
  setMessage("Check the details, tick the box, then save.");
 }
 function submit(event:React.FormEvent){
  event.preventDefault();
  if(!confirmed||!name.trim()||!date||before===""||after===""){setMessage("Add a name, both costs and a date. Then tick the box.");return;}
  const entry:Entry={id:editId||crypto.randomUUID(),area,name:name.trim().slice(0,60),before:Number(before),after:Number(after),fees:Number(fees||0),period,date};
  try{checkedDifference(entry.before,entry.after,entry.fees);}catch(e){setMessage(e instanceof Error?e.message:"Check your amounts.");return;}
  if(date>localToday()){setMessage("Choose today or an earlier date.");return;}
  if(entries.find(e=>e.area===entry.area&&e.name.toLowerCase()===entry.name.toLowerCase()&&e.id!==entry.id)){
   setMessage("You've already recorded this bill. Edit that result instead of adding it again.");return;
  }
  if(entries.length>=40&&!editId){setMessage("You can keep 40 results here. Edit an old result to continue.");return;}
  const next=editId?entries.map(e=>e.id===editId?entry:e):[...entries,entry];
  if(save(next)){setEditId("");setName("");setBefore("");setAfter("");setFees("0");setDate("");setConfirmed(false);}
 }
 return <section className={styles.lastCard}>
  <h2>Savings you've recorded</h2>
  <p>Add a result after checking a real bill or statement. These are your records, not savings verified by SpendShift.</p>
  {loaded&&entries.map(e=>{
   const diff=checkedDifference(e.before,e.after,e.fees);
   return <article className={styles.resultRow} key={e.id}>
    <strong>{e.name}</strong>
    <p>{areas.find(a=>a.area===e.area)?.title}: You recorded {amount(diff)} {diff>=0?"less":"more"} for this {e.period}, after extra costs. Checked {e.date}.</p>
    <button type="button" onClick={()=>edit(e)}>Edit</button>
    <button type="button" onClick={()=>{save(entries.filter(x=>x.id!==e.id));if(editId===e.id)setEditId("");}}>Remove</button>
   </article>;
  })}
  {areas.length>0&&<details className={styles.helpDetails}>
   <summary>{editId?"Edit this result":"Add a checked result"}</summary>
   <form className={styles.trackerForm} onSubmit={submit}>
    <label>Spending area<select value={area} onChange={e=>{setArea(e.target.value);setConfirmed(false);}}>
     {areas.map(a=><option key={a.area} value={a.area}>{a.title}</option>)}
    </select></label>
    <label>Which bill or change? (e.g. car insurance)
     <input type="text" required maxLength={60} placeholder="Name this bill or change" value={name} onChange={e=>{setName(e.target.value);setConfirmed(false);}}/>
    </label>
    <label>Both amounts cover the same…<select value={period} onChange={e=>{setPeriod(e.target.value as Period);setConfirmed(false);}}>
     <option value="week">Week</option><option value="month">Month</option><option value="year">Year</option>
    </select></label>
    <label>Old cost ($)<input type="number" min="0" max="100000" step="0.01" inputMode="decimal" required value={before} onChange={e=>{setBefore(e.target.value);setConfirmed(false);}}/></label>
    <label>New cost ($)<input type="number" min="0" max="100000" step="0.01" inputMode="decimal" required value={after} onChange={e=>{setAfter(e.target.value);setConfirmed(false);}}/></label>
    <label>Extra fees not already included ($)<input type="number" min="0" max="100000" step="0.01" inputMode="decimal" required value={fees} onChange={e=>{setFees(e.target.value);setConfirmed(false);}}/></label>
    <label>Date you checked<input type="date" required max={today||undefined} value={date} onChange={e=>{setDate(e.target.value);setConfirmed(false);}}/></label>
    <label className={styles.confirmRow}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I checked both costs for the same people or service. I haven't recorded this change twice.</label>
    <button type="submit" className={styles.copyButton} disabled={!confirmed}>{editId?"Update this result":"Save checked result"}</button>
    {editId&&<button type="button" className={styles.copyButton} onClick={()=>{setEditId("");setConfirmed(false);}}>Cancel editing</button>}
   </form>
  </details>}
  <p className={styles.checkNote}>Saved only on this device. Each bill or change has its own record. We don't add weekly, monthly and yearly results together.</p>
  <p role="status" aria-live="polite">{message}</p>
 </section>;
}
