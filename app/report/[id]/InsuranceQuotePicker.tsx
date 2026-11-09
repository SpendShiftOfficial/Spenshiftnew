"use client";
import {useState} from "react";
import type {InsuranceRefinement} from "@/lib/report-refinements";
import QuoteCheck from "./QuoteCheck";
import styles from "./simple-report.module.css";
export default function InsuranceQuotePicker({policies}:{policies:InsuranceRefinement[]}){
 const [index,setIndex]=useState(0);
 if(!policies.length)return null;
 const p=policies[index]??policies[0];
 const amount=p.premium===null?null:p.premium*(p.paymentPeriod==="month"?12:1);
 return <div className={styles.insurancePicker}>
  <label htmlFor="policy-to-compare">Choose a policy to compare</label>
  <select id="policy-to-compare" value={String(index)} onChange={e=>setIndex(Number(e.target.value))}>
   {policies.map((policy,i)=><option value={String(i)} key={i}>{policy.type||"Insurance policy "+(i+1)}{policy.insurer?" — "+policy.insurer:""}</option>)}
  </select>
  <QuoteCheck key={index} kind="insurance" label={p.type||"this insurance policy"} currentAnnual={amount}/>
 </div>;
}
