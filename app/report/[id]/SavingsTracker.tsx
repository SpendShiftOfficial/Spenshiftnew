"use client";
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
