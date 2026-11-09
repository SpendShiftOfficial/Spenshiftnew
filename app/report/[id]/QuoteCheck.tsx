"use client";
import {useState} from "react";
import {quoteDifference} from "@/lib/savings-math";
import styles from "./simple-report.module.css";
export type QuoteKind="insurance"|"mobile"|"internet"|"electricity"|"gas";
type Props={kind:QuoteKind;label:string;currentAnnual:number|null;currentIsEstimate?:boolean};
const notes:Record<QuoteKind,{check:string;disclaimer:string}>={
 insurance:{check:"I checked the same cover, what is not covered and what I'd pay if I claimed.",disclaimer:"A cheaper policy may give you less cover. Check limits and waiting times before changing anything."},
 mobile:{check:"I checked the same data, mobile coverage and full price after any deal.",disclaimer:"Check network coverage, any phone payments and fees before switching."},
 internet:{check:"I checked the same speed, data and connection needs, plus the full price after any deal.",disclaimer:"Check connection, modem or exit costs. A cheaper plan might be slower."},
 electricity:{check:"I compared full yearly costs using the same energy use, including supply charges and fees.",disclaimer:"Power bills change by season. One bill gives only a rough yearly starting cost."},
 gas:{check:"I compared full yearly costs using the same gas use, including supply charges and fees.",disclaimer:"Gas bills change by season. One bill gives only a rough yearly starting cost."},
};
export default function QuoteCheck({kind,label,currentAnnual,currentIsEstimate=false}:Props){
 const [old,setOld]=useState(currentAnnual===null?"":String(Math.round(currentAnnual*100)/100));
 const [quote,setQuote]=useState("");
 const [period,setPeriod]=useState<"month"|"year">("year");
 const [fees,setFees]=useState("0");
 const [same,setSame]=useState(false);
 const advice=notes[kind];
 let diff:number|null=null;
 if(old!==""&&quote!==""&&same){try{diff=quoteDifference(Number(old),Number(quote),period,Number(fees||0));}catch{}}
 const abs=(n:number)=>"$"+Math.abs(n).toLocaleString("en-AU",{maximumFractionDigits:2});
 return (
  <details className={styles.helpDetails}>
   <summary>Compare a price for {label.toLowerCase()}</summary>
   <div className={styles.trackerForm}>
    <p>Use a quote you found. We have not checked a price for you.</p>
    <label>{currentIsEstimate?"Your estimated yearly cost from the bill you entered ($)":"What you pay now for a full year ($)"}
     <input type="number" min="0" max="100000" step="0.01" inputMode="decimal" value={old} onChange={e=>{setOld(e.target.value);setSame(false);}}/>
    </label>
    {currentIsEstimate&&<small>This is a rough starting cost from one bill. For a better check, use bills from a full year.</small>}
    <label>Price in the new quote ($)
     <input type="number" min="0" max="100000" step="0.01" inputMode="decimal" value={quote} onChange={e=>{setQuote(e.target.value);setSame(false);}}/>
    </label>
    <label>The quote covers…
     <select value={period} onChange={e=>{setPeriod(e.target.value as "month"|"year");setSame(false);}}>
      <option value="year">A year</option><option value="month">A month</option>
     </select>
    </label>
    <label>Extra fees in the first year ($)
     <input type="number" min="0" max="100000" step="0.01" inputMode="decimal" value={fees} onChange={e=>{setFees(e.target.value);setSame(false);}}/>
    </label>
    <label className={styles.confirmRow}><input type="checkbox" checked={same} onChange={e=>setSame(e.target.checked)}/>{advice.check}</label>
    {diff!==null&&<p role="status"><strong>The new quote is {abs(diff)} {diff>=0?"less":"more"} in the first year.</strong> This is a price comparison, not money saved yet.</p>}
    <small>{advice.disclaimer}</small>
   </div>
  </details>
 );
}
