"use client";
import {useEffect,useState} from 'react';
import Header from '@/components/Header';
import {auditQuestions,validateAuditAnswers} from '@/lib/audit-schema';
import styles from './audit.module.css';
const key='spendshift_free_draft_v2';
export default function Audit(){
 const [index,setIndex]=useState(0);const [answers,setAnswers]=useState<string[]>([]);const [loaded,setLoaded]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&Array.isArray(saved.answers)&&saved.answers.length<=8&&saved.answers.every((a:unknown,i:number)=>typeof a==='string'&&(auditQuestions[i].options.includes(a)||(i===0&&a==='Less than once a week')))){setAnswers(saved.answers.map((a:string,i:number)=>i===0&&a==='Less than once a week'?'Rarely':a));setIndex(Math.max(0,Math.min(7,Number(saved.index)||0)));}}catch{}setLoaded(true);},[]);
 useEffect(()=>{if(loaded){try{localStorage.setItem(key,JSON.stringify({answers,index}));}catch{}}},[answers,index,loaded]);
 function choose(value:string){setAnswers(prev=>{const next=[...prev];next[index]=value;return next;});setError('');}
 function next(){if(!answers[index])return;if(index<7){setIndex(index+1);return;}try{const valid=validateAuditAnswers(answers);let saved=false;try{localStorage.setItem('spendshift_answers',JSON.stringify(valid));localStorage.removeItem(key);saved=true;}catch{}if(!saved){try{sessionStorage.setItem('spendshift_answers',JSON.stringify(valid));saved=true;}catch{}}if(!saved){setError('Your browser is blocking saved answers. Allow website storage to view your free results.');return;}window.location.assign('/results');}catch(e){setError(e instanceof Error?e.message:'Please check your answers.');}}
 const q=auditQuestions[index];const visibleOptions=q.options.filter(a=>a!=='Never / not sure'||answers[index]===a);
 return <div className={styles.page}><Header simple/><main className={styles.wrap}>
  <p className={styles.progress}>Question {index+1} of 8</p><div className={styles.track} role='progressbar' aria-label='Your free check' aria-valuenow={Math.round(index/8*100)} aria-valuemin={0} aria-valuemax={100}><span style={{width:index/8*100+'%'}}/></div>
  <h1>{q.q}</h1><p>{index===0?"Count takeaway, delivery and meals at cafés or restaurants. Don't count coffee or snacks on their own.":index===3?"Count coffee, snacks and small treats — not full meals.":"Choose the answer that fits you best."}</p>
  <div className={styles.options} role='group' aria-label={q.q}>{visibleOptions.map(a=><button key={a} type='button' aria-pressed={answers[index]===a} onClick={()=>choose(a)}>{a}</button>)}</div>
  <div className={styles.actions}>{index>0?<button type='button' onClick={()=>setIndex(index-1)}>Previous question</button>:<a href='/'>Back home</a>}<button className={styles.next} type='button' disabled={!answers[index]} onClick={next}>{index===7?'See my free results':'Next question'}</button></div>
  {error&&<p role='alert'>{error}</p>}<p className={styles.small}>No bank login. No payment for your free results.</p>
  <button className={styles.reset} type='button' onClick={()=>{setAnswers([]);setIndex(0);setError('');try{localStorage.removeItem(key);}catch{}}}>Start a new check</button>
 </main></div>;
}
