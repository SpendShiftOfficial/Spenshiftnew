import type {SavingsOpportunity} from './savings-engine';
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
