"use client";
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
  {diff!==null&&<p role='status'><strong>This price is {'$' + Math.abs(diff).toLocaleString('en-AU',{maximumFractionDigits:2})} {diff>=0?'lower':'higher'} in the first year.</strong> This is a price check, not a recommendation to switch or money already saved.</p>}
  <small>For insurance, check limits, exclusions and what you pay for a claim. A lower price may mean less cover.</small>
 </div></details>;
}
