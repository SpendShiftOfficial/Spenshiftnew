"use client";
import {useEffect,useState} from 'react';
import Header from '@/components/Header';
import SimpleSavingsReport from '@/app/report/[id]/SimpleSavingsReport';
import {cleanDraft,prepareDraft,type PlanDraft} from '@/lib/plan-draft';
import {analyseSavings} from '@/lib/savings-engine';
export default function DemoPlan(){const [draft,setDraft]=useState<PlanDraft|null>(null);useEffect(()=>{try{setDraft(cleanDraft(JSON.parse(sessionStorage.getItem('spendshift_demo_plan')||'null')));}catch{}},[]);if(!draft)return <p style={{padding:30}}>Open the test questionnaire first.</p>;const r=prepareDraft(draft);return <><Header simple/><p style={{padding:20,textAlign:'center'}}>Test plan only. No payment. No customer record saved.</p><SimpleSavingsReport reportId='demo-custom' answers={draft.answers} refinements={r} analysis={analyseSavings(draft.answers,r)}/></>;}
