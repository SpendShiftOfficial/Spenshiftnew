"use client";
import {useEffect,useRef,useState} from 'react';
import Header from '@/components/Header';
import {useRouter} from 'next/navigation';
import {auditQuestions,validateAuditAnswers} from '@/lib/audit-schema';
import {areaNames,previewProfiles,type PersonalisationArea} from '@/lib/personalisation-questions';
import {blankDraft,cleanDraft,restoreDraft,selectedDraftAreas,prepareDraft,sectionKeys,emptyPolicy,type PlanDraft,type RawPolicy,type RawUnusedSubscription} from '@/lib/plan-draft';
import styles from './personalise.module.css';
import {paymentPeriodOptions,annualisePayment,isPaymentPeriod,periodLabel} from '@/lib/payment-periods';
export default function PersonaliseClient({allowDemo,hasPaidSession}:{allowDemo:boolean;hasPaidSession:boolean}){
 const router=useRouter();const [sessionId,setSessionId]=useState('');const [isRevision,setIsRevision]=useState(false);const [draft,setDraft]=useState<PlanDraft>(blankDraft(previewProfiles['subscriptions-insurance'].answers));
 const [ready,setReady]=useState(false);const [error,setError]=useState('');const [saving,setSaving]=useState('');const [submitting,setSubmitting]=useState(false);const [moving,setMoving]=useState(false);const [reportId,setReportId]=useState('');const [showExtra,setShowExtra]=useState(false);const [auditReviewIndex,setAuditReviewIndex]=useState<number|null>(null);
 const revision=useRef('');const lastSaved=useRef('');const queue=useRef<Promise<void>>(Promise.resolve());const latest=useRef(draft);latest.current=draft;
 const signature=JSON.stringify(draft);const areas=selectedDraftAreas(draft);const review=draft.step>=areas.length;const area=areas[draft.step];const d=draft.details;
 const mealMode=d.takeawayMealMode||(d.takeawayOrder||d.takeawayOrdersPerWeek?'combined':'');
 const listedPolicies=draft.insurancePolicies.filter(p=>p.type||p.premium||p.insurer||p.coverDescription);
 const pricedPolicies=listedPolicies.filter(p=>p.premium.trim()!==''&&/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(p.premium)&&isPaymentPeriod(p.paymentPeriod));
 const combinedInsuranceAnnual=pricedPolicies.reduce((total,p)=>total+annualisePayment(Number(p.premium),p.paymentPeriod as import('@/lib/payment-periods').PaymentPeriod),0);
 useEffect(()=>{let active=true;const id=new URLSearchParams(location.search).get('session_id')||'';setSessionId(id);
  if(!id){if(!allowDemo){setError('Open the private link from your purchase.');return;}try{const a=validateAuditAnswers(JSON.parse(localStorage.getItem('spendshift_answers')||'null'));setDraft(blankDraft(a));}catch{}setReady(true);return;}
  fetch('/api/payment-status?session_id='+encodeURIComponent(id),{cache:'no-store'}).then(async r=>{const p=await r.json();if(!r.ok||!p.paid)throw new Error('We could not open this purchase. Use your original purchase link.');if(!active)return;const correcting=new URLSearchParams(location.search).get('revise')==='1';if(p.reportId&&!correcting){setReportId(p.reportId);setReady(true);return;}if(p.status==='processing'){router.replace('/success?session_id='+encodeURIComponent(id)+'&generate=1');return;}if(correcting&&!p.reportId)throw new Error('Your plan is not ready to edit yet.');if(correcting)setIsRevision(true);const original=correcting&&p.refinements?.editDraft?{version:1,draft:p.refinements.editDraft}:p.refinements;const restored=restoreDraft(validateAuditAnswers(p.answers),original);if(correcting&&!p.refinements?.editDraft)restored.step=selectedDraftAreas(restored).length;revision.current=p.revision;lastSaved.current=JSON.stringify(restored);setDraft(restored);setReady(true);setSaving(correcting?'You can update your answers without paying again.':'Your saved place is ready.');}).catch(e=>active&&setError(e.message));
  return()=>{active=false;};
 },[allowDemo,router]);
 function persist(snapshot:PlanDraft,complete=false){
  if(!sessionId)return Promise.resolve();
  const operation=queue.current.catch(()=>{}).then(async()=>{if(!complete&&JSON.stringify(snapshot)===lastSaved.current)return;setSaving('Saving…');
   const r=await fetch('/api/personalisation/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,revision:revision.current,draft:snapshot,complete,revise:isRevision})});const p=await r.json();if(!r.ok){setSaving('Not saved. Keep this page open.');throw new Error(p.error||'Could not save. Please try again.');}revision.current=p.revision;lastSaved.current=JSON.stringify(snapshot);setSaving('Saved. You can return with your purchase link.');});queue.current=operation;return operation;
 }
 useEffect(()=>{if(!ready||!sessionId||reportId||submitting||signature===lastSaved.current)return;setSaving('Changes not saved yet…');const timer=setTimeout(()=>persist(latest.current).catch(e=>setError(e.message)),800);return()=>clearTimeout(timer);},[signature,ready,sessionId,reportId,submitting]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(ready&&sessionId&&!reportId&&JSON.stringify(latest.current)!==lastSaved.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[ready,sessionId,reportId]);
 function update(key:string,value:string){setError('');setDraft(prev=>({...prev,details:{...prev.details,[key]:value,...(key==='unusedSubscriptionChoice'&&value!=='yes'?{unusedSubscriptionMonthly:'',unusedSubscriptionName:''}:{}),...(key==='hasGas'&&value!=='yes'?{gasMonthly:''}:{}),...(key==='convenienceWeekly'?{convenienceOverlap:'no'}:{}),...(key==='phoneService'?(value==='both'?{}:value==='mobile'?{internetMonthly:''}:value==='internet'?{mobileMonthly:''}:{mobileMonthly:'',internetMonthly:''}):{})},additionalUnusedSubscriptions:key==='unusedSubscriptionChoice'&&value!=='yes'?[]:prev.additionalUnusedSubscriptions}));}
 function updateExtra(index:number,patch:Partial<RawUnusedSubscription>){setError('');setDraft(prev=>({...prev,additionalUnusedSubscriptions:prev.additionalUnusedSubscriptions.map((item,i)=>i===index?{...item,...patch}:item)}));}
 function setMealMode(value:string){
  setError('');
  setDraft(prev=>{
   const d=prev.details;
   const previous=d.takeawayMealMode||(d.takeawayOrder||d.takeawayOrdersPerWeek?'combined':'');
   const oldCombined=previous==='combined'&&value!=='combined';
   return {...prev,details:{
    ...d,takeawayMealMode:value,
    ...((oldCombined||value==='restaurant'||value==='')?{takeawayOrder:'',takeawayOrdersPerWeek:'',takeawaySwapPerWeek:'',takeawayReplacementCost:''}:{}),
    ...(!['restaurant','both'].includes(value)?{restaurantOrder:'',restaurantOrdersPerWeek:'',restaurantSwapPerWeek:'',restaurantReplacementCost:''}:{})
   }};
  });
 }
 function changeTakeawayUnit(){setError('');setDraft(prev=>({...prev,details:{...prev.details,takeawayAmountPeriod:prev.details.takeawayAmountPeriod==='week'?'order':'week',takeawayOrder:''}}));}
 function previous(){setError('');if(draft.step>0)setDraft(prev=>({...prev,step:prev.step-1}));else setAuditReviewIndex(7);}
 function policy(index:number,patch:Partial<RawPolicy>){setDraft(prev=>({...prev,insurancePolicies:prev.insurancePolicies.map((p,i)=>i===index?{...p,...patch}:p)}));}
 function checkCurrent(){try{const test=cleanDraft(draft);const others=areas.filter(a=>a!==area);for(const a of others)for(const key of sectionKeys[a])test.details[key]='';if(area!=='insurance')test.insurancePolicies=[];if(area!=='subscriptions')test.additionalUnusedSubscriptions=[];prepareDraft(test);return '';}catch(e){return e instanceof Error?e.message:'Please check these amounts.';}}
 async function next(){if(moving||submitting)return;setError('');const snapshot=cleanDraft(draft);const issue=checkCurrent();if(issue){setError(issue);return;}snapshot.step=Math.min(snapshot.step+1,areas.length);setMoving(true);try{await persist(snapshot);setDraft(snapshot);}catch(e){setError(e instanceof Error?e.message:'Your answers were not saved.');}finally{setMoving(false);}}
 async function finish(){setError('');let snapshot:PlanDraft;try{snapshot=cleanDraft(draft);prepareDraft(snapshot);}catch(e){setError(e instanceof Error?e.message:'Please check your answers.');return;}setSubmitting(true);try{
    if(isRevision&&sessionId){
      await persist(snapshot);
      const response=await fetch('/api/report/revise',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,revision:revision.current,draft:snapshot})});
      const result=await response.json();
      if(!response.ok||typeof result.reportId!=='string')throw new Error(result.error||'Your old report is safe. Please try again.');
      sessionStorage.setItem('spendshift_edit_session_'+result.reportId,sessionId);
      router.replace('/report/'+encodeURIComponent(result.reportId));
    }else{
      await persist(snapshot,true);
      if(sessionId){router.push('/success?session_id='+encodeURIComponent(sessionId)+'&generate=1');}
      else{sessionStorage.setItem('spendshift_demo_plan',JSON.stringify(snapshot));router.push('/plan-preview');}
    }
   }catch(e){setError(e instanceof Error?e.message:'Please try again.');setSubmitting(false);}}
 function missingDetail(a:PersonalisationArea):string {
   if(a==='subscriptions'){
     const entries=[{name:d.unusedSubscriptionName,monthly:d.unusedSubscriptionMonthly},...draft.additionalUnusedSubscriptions];
     return d.unusedSubscriptionChoice==='yes'&&entries.some(p=>(p.name||p.monthly)&&(!p.name.trim()||!p.monthly))
       ? 'Add a service name and monthly price for each unused subscription you want counted in a possible saving.'
       : !d.unusedSubscriptionChoice ? 'Check your bank statements or app subscriptions if you are unsure.' : '';
   }
   if(a==='takeaway'){
     const mode=d.takeawayMealMode||(d.takeawayOrder||d.takeawayOrdersPerWeek?'combined':'');
     if(!mode)return 'Choose the kind of meals you pay for. You can still skip amounts you do not know.';
     const groups=[
      ...(['takeaway','both','combined'].includes(mode)?[{name:'takeaway',cost:d.takeawayOrder,count:d.takeawayOrdersPerWeek,swap:d.takeawaySwapPerWeek,home:d.takeawayReplacementCost}]:[]),
      ...(['restaurant','both'].includes(mode)?[{name:'restaurant',cost:d.restaurantOrder,count:d.restaurantOrdersPerWeek,swap:d.restaurantSwapPerWeek,home:d.restaurantReplacementCost}]:[]),
     ];
     if(groups.some(g=>Number(g.swap)>0&&!g.home))return 'A home-meal cost is missing. Without it we cannot calculate a saving for that kind of meal, but you can still make your plan.';
     if(groups.some(g=>!g.cost||!g.count))return 'Add the cost of each type of meal and how often you buy it for a more personal plan.';
     return '';
   }
   if(a==='convenience')return !d.convenienceWeekly||!d.convenienceGoalWeekly
     ? 'Add your weekly spending and goal for a clear target.' : '';
   if(a==='phone')return d.phoneService==='both'||d.phoneService==='mobile'||d.phoneService==='internet'
     ? (!d.mobileMonthly&&!d.internetMonthly?'Add a bill amount so we know your starting price.':'')
     : 'Not sure what you pay? We can still show the steps to find it.';
   if(a==='energy')return !d.electricityBill&&!d.gasMonthly
     ? 'Add a bill amount to make the comparison easier.' : '';
   if(a==='insurance')return !draft.insurancePolicies.some(p=>p.type&&p.premium)
     ? 'Add a policy type and cost to show your current spending.' : '';
   return !d.shoppingTrigger?'Tell us what leads to an extra buy for more useful steps.':'';
 }
 function reviewFacts(a:PersonalisationArea):[string,string][]{
   const money=(v:string,unit:string)=>v!==''?'$'+Number(v).toLocaleString('en-AU',{maximumFractionDigits:2})+' '+unit:'Not provided';
   if(a==='subscriptions'){
     const entries=[{name:d.unusedSubscriptionName,monthly:d.unusedSubscriptionMonthly},...draft.additionalUnusedSubscriptions]
       .filter(item=>item.name||item.monthly);
     return [
       ['Total',money(d.subscriptionsMonthly,'a month')],
       ['Unused services?',d.unusedSubscriptionChoice==='no'?'No — I use them all':d.unusedSubscriptionChoice==='yes'?'Yes':'Not sure'],
       ...(d.unusedSubscriptionChoice==='yes'
         ? entries.map(item=>[item.name||'Name missing',money(item.monthly,'a month')] as [string,string])
         : []),
     ];
   }
   if(a==='takeaway'){
     const mode=d.takeawayMealMode||(d.takeawayOrder||d.takeawayOrdersPerWeek?'combined':'');
     const facts:[string,string][]=[];
     if(['takeaway','both','combined'].includes(mode))facts.push(
      [mode==='combined'?'Earlier combined meal cost':'Takeaway cost',money(d.takeawayOrder,d.takeawayAmountPeriod==='week'?'a week':'per meal')],
      [mode==='combined'?'Meals out each week':'Takeaways each week',d.takeawayOrdersPerWeek||'Not provided'],
      ['Takeaways or meals to replace',d.takeawaySwapPerWeek||'Not provided'],
      ['Home cost for these meals',money(d.takeawayReplacementCost,'per meal')]
     );
     if(['restaurant','both'].includes(mode))facts.push(
      ['Restaurant meal cost',money(d.restaurantOrder,'per meal')],
      ['Restaurant visits each week',d.restaurantOrdersPerWeek||'Not provided'],
      ['Restaurant visits to replace',d.restaurantSwapPerWeek||'Not provided'],
      ['Home cost for restaurant meals',money(d.restaurantReplacementCost,'per meal')]
     );
     facts.push(['Main challenge',({busy:'Not much time',tired:'Too tired to cook',enjoy:'I enjoy eating out',family:'Cooking for other people',other:'Other'})[d.takeawayReason]||'Not provided']);
     return facts;
   }
   if(a==='convenience')return [['Current cost',money(d.convenienceWeekly,'a week')],['Weekly goal',money(d.convenienceGoalWeekly,'a week')],['Includes takeaway?',d.convenienceOverlap==='no'?'No':d.convenienceOverlap==='yes'?'Yes':'Not sure']];
   if(a==='phone')return [['Bills',d.phoneService||'Not provided'],['Mobile',money(d.mobileMonthly,'a month')],['Internet',money(d.internetMonthly,'a month')]];
   if(a==='energy')return [['State',d.state||'Not provided'],['Power',money(d.electricityBill,d.electricityPeriod==='month'?'a month':'for 3 months')],['Gas',d.hasGas==='no'?'No gas bill':money(d.gasMonthly,'per '+periodLabel(isPaymentPeriod(d.gasPeriod)?d.gasPeriod:'month'))]];
   if(a==='insurance')return draft.insurancePolicies.filter(p=>p.type||p.premium).map(p=>[p.type||'Insurance',money(p.premium,'per '+periodLabel(isPaymentPeriod(p.paymentPeriod)?p.paymentPeriod:'year'))]);
   return [['Shopping',d.unplannedArea||'Not provided'],['What triggers it',d.shoppingTrigger||'Not provided']];
 }
 const choice=(key:string,label:string,options:[string,string][],hint='')=> <div className={styles.field}><label htmlFor={key}>{label}</label><select id={key} value={d[key]||''} onChange={e=>update(key,e.target.value)}><option value=''>Not sure / skip</option>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>{hint&&<small>{hint}</small>}</div>;
 const amount=(key:string,label:string,hint='')=><div className={styles.field}><label htmlFor={key}>{label}</label><div className={styles.moneyInput}><span aria-hidden='true'>$</span><input id={key} type='number' min='0' max='100000' step='0.01' inputMode='decimal' value={d[key]||''} placeholder='Not sure' onChange={e=>update(key,e.target.value)}/></div>{hint&&<small>{hint}</small>}</div>;
 const count=(key:string,label:string)=> <div className={styles.field}><label htmlFor={key}>{label}</label><input id={key} type='number' min='0' max='21' step='1' inputMode='numeric' value={d[key]||''} placeholder='Not sure' onChange={e=>update(key,e.target.value)}/></div>;
 if(!ready)return <div className={styles.page}><Header simple/><main className={styles.wrap}><h1>{error?'We could not open your plan':'Opening your plan'}</h1><p role={error?'alert':undefined}>{error||'Checking your purchase…'}</p></main></div>;
 if(reportId)return <div className={styles.page}><Header simple/><main className={styles.wrap}><h1>Your plan is ready.</h1><a className={styles.primary} href={'/report/'+encodeURIComponent(reportId)}>Open my plan</a></main></div>;
 if(auditReviewIndex!==null){
  const q=auditQuestions[auditReviewIndex];
  return <div className={styles.page}><Header simple/><main className={styles.wrap}>
   <p className={styles.reviewIntro}>Your first answers — question {auditReviewIndex+1} of 8</p>
   <section className={styles.panel} aria-label="Review a free-audit answer">
    <h1>{q.q}</h1>
    <p className={styles.intro}>Choose an answer or keep the one you picked. Your plan is still yours. You won't pay again.</p>
    <div className={styles.auditOptions} role="group" aria-label={q.q}>
      {q.options.filter(a=>a!=='Never / not sure'||draft.answers[auditReviewIndex]===a).map(answer=>
       <button type="button" key={answer} aria-pressed={draft.answers[auditReviewIndex]===answer}
        onClick={()=>{setError('');setDraft(prev=>({...prev,step:0,answers:prev.answers.map((a,i)=>i===auditReviewIndex?answer:a)}));}}>{answer}</button>)}
    </div>
    <div className={styles.actions}>
      <button type="button" className={styles.secondary} onClick={()=>{setError('');if(auditReviewIndex>0)setAuditReviewIndex(auditReviewIndex-1);else setAuditReviewIndex(null);}}>
        {auditReviewIndex===0?'Back to my plan':'Previous question'}
      </button>
      <button type="button" className={styles.primary} onClick={()=>{setError('');if(auditReviewIndex<7)setAuditReviewIndex(auditReviewIndex+1);else setAuditReviewIndex(null);}}>
        {auditReviewIndex===7?'Back to my plan':'Next question'}
      </button>
    </div>
    {error&&<p role="alert" className={styles.submitError}>{error}</p>}
   </section>
  </main></div>;
 }

 return <div className={styles.page}><Header simple/><main className={styles.wrap}><fieldset className={styles.journeyFieldset} disabled={moving||submitting}>
  <h1>{isRevision?'Fix an answer in your plan.':'Make your plan fit you.'}</h1>{isRevision&&<p>The old report stays safe until you save your changes. You will not pay again.</p>}<p className={styles.intro}>{areas.length===0?'Your updated answers no longer point to a clear area. Choose one area you would like help checking so your paid plan stays useful.':areas.length+' areas to check. We’ll save what you enter. Skip any amount you don’t know.'}</p>
  {sessionId&&<p role='status' aria-live='polite' className={styles.selectionNote}>{saving}</p>}
  {!sessionId&&<div className={styles.demoPanel}><label htmlFor='demo'>Test customer — no payment or saved customer data</label><select id='demo' onChange={e=>setDraft(blankDraft(previewProfiles[e.target.value].answers))}>{Object.entries(previewProfiles).map(([key,p])=><option key={key} value={key}>{p.label}</option>)}</select></div>}
  
  <div className={styles.progressTop}><strong>{review?'Check your answers':'Area '+(draft.step+1)+' of '+areas.length}</strong></div><div className={styles.track} role='progressbar' aria-label='Your progress' aria-valuenow={review?100:Math.round(draft.step/areas.length*100)} aria-valuemin={0} aria-valuemax={100}><div style={{width:(review?100:draft.step/areas.length*100)+'%'}}/></div>
  <section className={styles.panel}>
   {review?<><h2>You're nearly done</h2><p>{areas.length===0?'Your first answers no longer show a clear place to start. Choose one area below and we will make a focused plan for it. There is no extra charge.':'We can make your plan with what you shared. Adding a missing amount may make it more useful. You can still skip anything you don\'t know.'}</p>{areas.map((a,i)=><div className={styles.reviewExtra} key={a}><strong>{areaNames[a]}</strong>{missingDetail(a)&&<p className={styles.reviewHint}>{missingDetail(a)}</p>}<dl>{reviewFacts(a).map(([label,value],n)=><div key={n}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><button className={styles.extraLink} type='button' onClick={()=>setDraft(p=>({...p,step:i}))}>Check or edit {areaNames[a].toLowerCase()}</button></div>)}
    {draft.additionalArea&&<button type='button' className={styles.extraLink} onClick={()=>{setShowExtra(false);setDraft(p=>({...p,additionalArea:'',step:selectedDraftAreas({...p,additionalArea:''}).length}));}}>Remove the extra area</button>}
    {areas.length===0&&!draft.additionalArea&&<div className={styles.field}><label htmlFor='required-area'>Choose one area to check</label><select id='required-area' defaultValue='' onChange={e=>{if(e.target.value)setDraft(p=>({...p,additionalArea:e.target.value,step:0}));}}><option value=''>Choose an area</option>{Object.entries(areaNames).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></div>}
    {areas.length>0&&areas.length<7&&!draft.additionalArea&&<><button className={styles.extraLink} type='button' onClick={()=>setShowExtra(!showExtra)}>Want to check another area?</button>{showExtra&&<select aria-label='Extra area' defaultValue='' onChange={e=>setDraft(p=>({...p,additionalArea:e.target.value,step:areas.length}))}><option value=''>Choose an area</option>{Object.entries(areaNames).filter(([key])=>!areas.includes(key as PersonalisationArea)).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select>}</>}
    <div className={styles.actions}><button type="button" className={styles.secondary} onClick={previous}>Previous question</button><button className={styles.primary} type='button' disabled={submitting||areas.length===0} onClick={finish}>{submitting?'Saving your plan…':isRevision?'Save my updated plan':'Make my plan'}</button></div></>:
    <><h2>{areaNames[area]}</h2><div className={styles.fields}>
     {area==='subscriptions'&&<>
      {amount('subscriptionsMonthly','What do all your subscriptions cost each month?','Not sure? Check bank transactions, app subscriptions or email receipts. A rough total is fine.')}
      {choice('unusedSubscriptionChoice','Do you pay for a subscription you no longer use?',[['yes','Yes'],['no','No — I use them all'],['not_sure','Not sure']])}
      {d.unusedSubscriptionChoice==='yes'&&<>
        <div className={styles.field}><label htmlFor='unusedSubscriptionName'>Unused subscription 1 — service name</label><input id='unusedSubscriptionName' maxLength={60} placeholder='e.g. Stan' value={d.unusedSubscriptionName||''} onChange={e=>update('unusedSubscriptionName',e.target.value)}/></div>
        {amount('unusedSubscriptionMonthly','What does this service cost each month?','Check your bank transactions, app subscriptions or a recent receipt. Leave blank if unsure.')}
        {draft.additionalUnusedSubscriptions.map((item,i)=><div className={styles.unusedCard} key={i}>
          <strong>Unused subscription {i+2}</strong>
          <div className={styles.field}><label htmlFor={'unused-name-'+i}>Service name</label><input id={'unused-name-'+i} maxLength={60} placeholder='e.g. Netflix' value={item.name} onChange={e=>updateExtra(i,{name:e.target.value})}/></div>
          <div className={styles.field}><label htmlFor={'unused-monthly-'+i}>What does it cost each month?</label><div className={styles.moneyInput}><span aria-hidden='true'>$</span><input id={'unused-monthly-'+i} type='number' min='0' max='100000' step='0.01' inputMode='decimal' placeholder='Not sure' value={item.monthly} onChange={e=>updateExtra(i,{monthly:e.target.value})}/></div></div>
          <button className={styles.extraLink} type='button' onClick={()=>setDraft(prev=>({...prev,additionalUnusedSubscriptions:prev.additionalUnusedSubscriptions.filter((_,j)=>i!==j)}))}>Remove unused subscription {i+2}</button>
        </div>)}
        {draft.additionalUnusedSubscriptions.length<5&&<button className={styles.addPolicy} type='button' onClick={()=>setDraft(p=>({...p,additionalUnusedSubscriptions:[...p.additionalUnusedSubscriptions,{name:'',monthly:''}]}))}>Add another unused subscription</button>}
        <small>List each service only once. We calculate possible savings only for named services with a known monthly price. Check that charges stop before counting actual savings.</small>
      </>}
      {d.unusedSubscriptionChoice==='no'&&<p>We will help you check prices, not tell you to cancel services you use.</p>}
    </>}
     {area==='takeaway'&&<>
      <fieldset className={styles.billChoices}>
        <legend>Which meals do you usually buy?</legend>
        <p>Pick the answer that fits you. Takeaway and restaurant meals can cost different amounts.</p>
        {([['takeaway','Takeaway or food delivery'],['restaurant','Meals at cafés or restaurants'],['both','Both types']] as [string,string][]).map(([value,label])=>
          <label className={styles.billChoice} key={value}>
            <input type="radio" name="takeawayMealMode" value={value} checked={d.takeawayMealMode===value} onChange={()=>setMealMode(value)}/>
            <span>{label}</span>
          </label>)}
        {(d.takeawayMealMode==='combined'||(!d.takeawayMealMode&&(d.takeawayOrder||d.takeawayOrdersPerWeek)))&&
          <label className={styles.billChoice}>
            <input type="radio" name="takeawayMealMode" value="combined" checked={mealMode==='combined'} onChange={()=>setMealMode('combined')}/>
            <span>My earlier combined meals (from my saved plan)</span>
          </label>}
      </fieldset>
      {mealMode==='combined'&&<p className={styles.reviewHint}>Your earlier answers used one average for takeaway and eating out. You can keep that method, or choose a meal type above to enter separate costs.</p>}
      {['takeaway','both','combined'].includes(mealMode)&&
        <div className={styles.mealGroup}>
          <h3>{mealMode==='combined'?'Earlier combined meals':'Takeaway or food delivery'}</h3>
          {amount('takeawayOrder',d.takeawayAmountPeriod==='week'?'About how much do you spend on these meals in a week?':'About how much does one of these meals cost?','Check a recent payment in your bank app, or give a rough amount.')}
          <button type="button" className={styles.unitSwitch} onClick={changeTakeawayUnit}>
            {d.takeawayAmountPeriod==='week'?'Use the cost of one meal instead':'I only know my weekly total'}
          </button>
          {count('takeawayOrdersPerWeek',mealMode==='combined'?'How many meals out do you buy each week?':'How many times do you buy takeaway each week?')}
          {count('takeawaySwapPerWeek','How many of these meals could you replace at home each week?')}
          {Number(d.takeawaySwapPerWeek)>0&&amount('takeawayReplacementCost','About how much would one home meal cost for the same people? (optional)','Include groceries for everyone eating. If unsure, leave blank. We will not guess your saving.')}
        </div>}
      {['restaurant','both'].includes(mealMode)&&
        <div className={styles.mealGroup}>
          <h3>Meals at cafés or restaurants</h3>
          {count('restaurantOrdersPerWeek','How many times do you eat at a café or restaurant each week?')}
          {amount('restaurantOrder','About how much do you spend each time?','Include everyone you pay for and any drinks. Check a recent payment or use a rough amount.')}
          {count('restaurantSwapPerWeek','How many of these meals could you replace at home each week?')}
          {Number(d.restaurantSwapPerWeek)>0&&amount('restaurantReplacementCost','About how much would a home meal cost for the same people? (optional)','Include groceries for everyone eating. If unsure, leave blank. We will not guess your saving.')}
        </div>}
      {mealMode&&choice('takeawayReason','What makes cutting back on these meals hard?',[['busy','I do not have much time'],['tired','I feel too tired to cook'],['enjoy','I enjoy eating out'],['family','Cooking for other people is hard'],['other','Something else']])}
      <small>Only count each meal once. We'll use your separate costs and home-meal prices to calculate a possible saving.</small>
    </>}
     {area==='convenience'&&<>
      {amount('convenienceWeekly','About how much do coffee, snacks and other small buys cost you each week?','Only count small buys here. Do not include takeaway, restaurant meals or lunch. Check your bank app or use a rough amount.')}
      {['yes','not_sure'].includes(d.convenienceOverlap)&&<p className={styles.reviewHint}>Your earlier answer may have included meals. Update the amount above so it only covers small buys.</p>}
      {amount('convenienceGoalWeekly','What could you aim to spend each week?','Pick a goal you can stick to. Leave it blank if you are not sure.')}
    </>}
     {area==='phone'&&<>
      <fieldset className={styles.billChoices}>
        <legend>Which bills do you pay?</legend>
        <p>Select one. We only ask about bills you pay yourself.</p>
        {([['mobile','Mobile phone only'],['internet','Home internet only'],['both','Both mobile and home internet'],['neither',"I don't pay either bill"],['not_sure',"I'm not sure"]] as [string,string][]).map(([value,label])=>
          <label key={value} className={styles.billChoice}>
            <input type="radio" name="phoneService" value={value} checked={d.phoneService===value} onChange={()=>update('phoneService',value)}/>
            <span>{label}</span>
          </label>)}
      </fieldset>
      {['both','mobile'].includes(d.phoneService)&&amount('mobileMonthly','About how much is your mobile phone bill each month?','Find your latest bill in your email or provider app. A rough amount is fine.')}
      {['both','internet'].includes(d.phoneService)&&amount('internetMonthly','About how much is your home internet bill each month?','Check your provider app or email bill. You can leave this blank if unsure.')}
      {d.phoneService==='not_sure'&&<p className={styles.reviewHint}>You can check later. Your plan will show you how to find your bills.</p>}
    </>}
     {area==='energy'&&<>{choice('state','Your state or territory',['NSW','VIC','QLD','SA','WA','TAS','ACT','NT'].map(s=>[s,s]))}{choice('electricityPeriod','How long does your latest power bill cover?',[['quarter','Three months'],['month','One month']])}{amount('electricityBill','About how much is that power bill?','Check your latest electricity bill in your email or provider app, or estimate.')}{choice('hasGas','Do you pay a gas bill?',[['yes','Yes'],['no','No'],['not_sure','Not sure']])}{d.hasGas==='yes'&&<>{choice('gasPeriod','How often do you pay your gas bill?',paymentPeriodOptions.map(p=>[p.value,p.label]))}{amount('gasMonthly','About how much is each gas payment?','Check your latest gas bill in your email or provider app. A rough amount is fine.')}</>}</>}
     {area==='insurance'&&<><p className={styles.sectionQuestion}>Which insurance policies do you pay for?</p><p className={styles.policyHint}>Add each policy separately. Rough costs are fine. We'll work out the combined yearly cost for you. Skip any amount you don't know.</p>{draft.insurancePolicies.map((p,i)=><div className={styles.policyCard} key={i}><strong>Policy {i+1}</strong><div className={styles.field}><label htmlFor={'policy-type-'+i}>What type of insurance is this?</label><select id={'policy-type-'+i} value={p.type} onChange={e=>policy(i,{type:e.target.value})}><option value=''>Choose a type / not sure</option>{['Car','Home or contents','Health','Life or income protection','CTP / Green Slip','Pet','Travel','Other'].map(t=><option key={t}>{t}</option>)}</select></div><div className={styles.field}><label htmlFor={'policy-period-'+i}>How often do you pay for this policy?</label><select id={'policy-period-'+i} value={p.paymentPeriod} onChange={e=>policy(i,{paymentPeriod:e.target.value})}>{paymentPeriodOptions.map(({value,label})=><option key={value} value={value}>{label}</option>)}</select></div><div className={styles.field}><label htmlFor={'policy-cost-'+i}>About how much is each payment?</label><input id={'policy-cost-'+i} type='number' min='0' max='100000' step='0.01' inputMode='decimal' placeholder='Not sure' value={p.premium} onChange={e=>policy(i,{premium:e.target.value})}/><small>Check your renewal email, insurer app or bank transactions. A rough payment amount is fine.</small></div><div className={styles.field}><label htmlFor={'policy-renewal-'+i}>When is this policy due for renewal?</label><select id={'policy-renewal-'+i} value={p.renewal} onChange={e=>policy(i,{renewal:e.target.value})}><option value=''>Not sure / skip</option><option value='soon'>In the next 3 months</option><option value='later'>Later</option></select><small>Renewal is when your insurer offers you a new term or price. It is different from how often you pay. Check your renewal email if unsure.</small></div><details className={styles.optionalDetails}><summary>Add insurer and cover details (optional)</summary><div className={styles.optionalInner}><label>Insurance company<input maxLength={80} placeholder='e.g. NRMA' value={p.insurer} onChange={e=>policy(i,{insurer:e.target.value})}/></label><label>Any extra cover details? (optional)<input maxLength={120} placeholder='e.g. comprehensive car cover' value={p.coverDescription} onChange={e=>policy(i,{coverDescription:e.target.value})}/></label><small>The insurance type above is the category. This box is only for details such as comprehensive car cover or basic hospital cover. Skip it if unsure. No policy or account numbers.</small></div></details><button type='button' className={styles.extraLink} onClick={()=>setDraft(prev=>({...prev,insurancePolicies:prev.insurancePolicies.filter((_,j)=>i!==j)}))}>Remove policy {i+1}</button></div>)}{draft.insurancePolicies.length<6&&<button type='button' className={styles.addPolicy} onClick={()=>setDraft(p=>({...p,insurancePolicies:[...p.insurancePolicies,emptyPolicy()]}))}>Add another policy</button>}<div className={styles.insuranceTotal} aria-live='polite'><strong>{pricedPolicies.length?'Combined yearly cost so far: $'+combinedInsuranceAnnual.toLocaleString('en-AU',{maximumFractionDigits:2}):'Combined yearly cost: Not calculated yet'}</strong><small>{pricedPolicies.length===0?'Add a payment amount to see your yearly total.':pricedPolicies.length<listedPolicies.length?'This covers only the '+pricedPolicies.length+' '+(pricedPolicies.length===1?'policy':'policies')+' with a price. Add other costs for a complete total.':'Based on the policies and payment amounts you entered. This is spending, not money saved.'}</small></div></>}
     {area==='unplanned'&&<>{choice('unplannedArea','What do you tend to buy?',['Online shopping','Clothes or accessories','Entertainment or hobbies','Other purchases'].map(x=>[x,x]))}{choice('shoppingTrigger','What makes you want to buy it?',['Sales or deals','Boredom','Social media','Other','Not sure'].map(x=>[x,x]))}</>}
    </div><div className={styles.actions}><button className={styles.secondary} type='button' onClick={previous}>Previous question</button><button className={styles.primary} type='button' onClick={()=>next()}>Next</button>{isRevision&&<button className={styles.secondary} type='button' onClick={()=>setDraft(p=>({...p,step:areas.length}))}>Back to review</button>}</div><p className={styles.footnote}>Don't know an amount? Leave it blank and tap Next. We'll keep what you entered.</p></>}
   {error&&<p role='alert' className={styles.submitError}>{error}</p>}
  </section></fieldset><p className={styles.footnote}>No bank login, policy numbers or passwords needed.</p>
 </main></div>;
}
