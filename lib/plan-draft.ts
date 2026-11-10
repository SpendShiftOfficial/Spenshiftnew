import {validateAuditAnswers} from './audit-schema';
import {selectPersonalisationAreas, type PersonalisationArea} from './personalisation-questions';
import {emptyRefinements,validateRefinements} from './report-refinements';
import {findAuditConflict} from './plan-conflicts';
export const sectionKeys:Record<PersonalisationArea,string[]>={
 subscriptions:['subscriptionsMonthly','unusedSubscriptionChoice','unusedSubscriptionName','unusedSubscriptionMonthly'],
 takeaway:['takeawayOrder','takeawayAmountPeriod','takeawayOrdersPerWeek','takeawaySwapPerWeek','takeawayReplacementCost','takeawayReason'],
 convenience:['convenienceWeekly','convenienceGoalWeekly','convenienceOverlap'],
 phone:['phoneService','mobileMonthly','internetMonthly'],
 energy:['state','electricityBill','electricityPeriod','hasGas','gasPeriod','gasMonthly'],
 insurance:[],unplanned:['unplannedArea','shoppingTrigger'],
};
export type RawPolicy={type:string;premium:string;paymentPeriod:string;insurer:string;coverDescription:string;renewal:string};
export type RawUnusedSubscription={name:string;monthly:string};
export type PlanDraft={version:1;answers:string[];details:Record<string,string>;insurancePolicies:RawPolicy[];additionalUnusedSubscriptions:RawUnusedSubscription[];additionalArea:string;step:number};
export const emptyPolicy=():RawPolicy=>({type:'',premium:'',paymentPeriod:'year',insurer:'',coverDescription:'',renewal:''});
export function blankDraft(answers:string[]):PlanDraft{
 const details:Record<string,string>={};Object.keys(emptyRefinements().details).forEach(key=>details[key]='');
 details.electricityPeriod='quarter';details.takeawayAmountPeriod='order';details.gasPeriod='month';
 return {version:1,answers:[...answers],details,insurancePolicies:[emptyPolicy()],additionalUnusedSubscriptions:[],additionalArea:'',step:0};
}
function obj(input:unknown):Record<string,unknown>{if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Please check your saved answers.');return input as Record<string,unknown>;}
export function cleanDraft(input:unknown):PlanDraft{
 const d=obj(input);const answers=validateAuditAnswers(d.answers);const out=blankDraft(answers);const raw=obj(d.details||{});
 for(const key of Object.keys(out.details)){const value=raw[key];if(value===null||value===undefined)continue;if(typeof value!=='string'||value.length>160)throw new Error('Please shorten that answer.');out.details[key]=value.replace(/[\u0000-\u001f<>]/g,'');}
 const policies=d.insurancePolicies??[];if(!Array.isArray(policies)||policies.length>6)throw new Error('Use up to six insurance policies.');
 out.insurancePolicies=policies.map(value=>{const p=obj(value);const result=emptyPolicy();for(const key of Object.keys(result) as (keyof RawPolicy)[]){if(p[key]===null||p[key]===undefined)continue;if(typeof p[key]!=='string'||(p[key] as string).length>160)throw new Error('Please shorten that policy detail.');result[key]=(p[key] as string).replace(/[\u0000-\u001f<>]/g,'');}return result;});
 const extras=d.additionalUnusedSubscriptions??[];
 if(!Array.isArray(extras)||extras.length>5)throw new Error('Add up to six unused subscriptions.');
 out.additionalUnusedSubscriptions=extras.map(value=>{
  const item=obj(value),name=item.name??'',monthly=item.monthly??'';
  if(typeof name!=='string'||typeof monthly!=='string'||name.length>160||monthly.length>160)
    throw new Error('Please check the unused subscription details.');
  return {name:name.replace(/[\u0000-\u001f<>]/g,''),monthly:monthly.replace(/[\u0000-\u001f<>]/g,'')};
 });
 const area=d.additionalArea||'';if(typeof area!=='string'||(area&&!Object.hasOwn(sectionKeys,area)))throw new Error('Please choose a listed spending area.');out.additionalArea=area;
 if(typeof d.step!=='number'||!Number.isInteger(d.step)||d.step<0||d.step>8)throw new Error('Please reopen your plan.');out.step=d.step;
 return out;
}
export function selectedDraftAreas(d:PlanDraft):PersonalisationArea[]{const areas=selectPersonalisationAreas(d.answers);if(d.additionalArea&&!areas.includes(d.additionalArea as PersonalisationArea))areas.push(d.additionalArea as PersonalisationArea);return areas;}
export function prepareDraft(d:PlanDraft){
 const conflict=findAuditConflict(d);
 if(conflict) throw new Error(conflict.message);
 const areas=selectedDraftAreas(d);
 if(areas.length===0)throw new Error('Choose at least one area to check before making your plan.');
 const details:Record<string,string>={};
 for(const area of areas)for(const key of sectionKeys[area])details[key]=d.details[key]||'';
 if(details.hasGas==='no'||details.hasGas==='not_sure')details.gasMonthly='';
 if(!['both','mobile','internet'].includes(details.phoneService)){details.mobileMonthly='';details.internetMonthly='';}
 if(details.phoneService==='mobile')details.internetMonthly='';
 if(details.phoneService==='internet')details.mobileMonthly='';
 if(details.unusedSubscriptionChoice!=='yes'){details.unusedSubscriptionMonthly='';details.unusedSubscriptionName='';}
 return validateRefinements({version:1,additionalArea:d.additionalArea||null,details,
  additionalUnusedSubscriptions:areas.includes('subscriptions')&&details.unusedSubscriptionChoice==='yes'?d.additionalUnusedSubscriptions:[],
  insurancePolicies:areas.includes('insurance')?d.insurancePolicies:[]});
}
export function restoreDraft(answers:string[],saved:unknown):PlanDraft{
 if(!saved||typeof saved!=='object')return blankDraft(answers);
 const value=saved as Record<string,unknown>;
 if(value.draft){try{const draft=obj(value.draft);const draftAnswers=Array.isArray(draft.answers)?draft.answers:answers;return cleanDraft({...draft,answers:draftAnswers});}catch{return blankDraft(answers);}}
 const d=blankDraft(answers);const details=value.details as Record<string,unknown>||{};
 for(const key of Object.keys(d.details)){if(typeof details[key]==='string'||typeof details[key]==='number')d.details[key]=String(details[key]);}
 if(d.details.gasMonthly&&!d.details.hasGas)d.details.hasGas='yes';
 if(d.details.unusedSubscriptionMonthly&&!d.details.unusedSubscriptionChoice)d.details.unusedSubscriptionChoice='yes';
 if(Array.isArray(value.insurancePolicies))d.insurancePolicies=value.insurancePolicies.map((p:any)=>({type:p.type||'',premium:p.premium==null?'':String(p.premium),paymentPeriod:p.paymentPeriod||'year',insurer:p.insurer||'',coverDescription:p.coverDescription||'',renewal:p.renewal||''}));
 if(Array.isArray(value.unusedSubscriptions)&&value.unusedSubscriptions.length){
  const saved=value.unusedSubscriptions.filter((p:any)=>p&&typeof p==='object');
  const first=saved[0] as any;
  if(!d.details.unusedSubscriptionName&&!d.details.unusedSubscriptionMonthly&&first){
   d.details.unusedSubscriptionName=typeof first.name==='string'?first.name:'';
   d.details.unusedSubscriptionMonthly=first.monthly==null?'':String(first.monthly);
  }
  d.additionalUnusedSubscriptions=saved.slice(1,6).map((p:any)=>({
   name:typeof p.name==='string'?p.name:'',
   monthly:p.monthly==null?'':String(p.monthly),
  }));
  if(!d.details.unusedSubscriptionChoice)d.details.unusedSubscriptionChoice='yes';
 }
 d.additionalArea=typeof value.additionalArea==='string'?value.additionalArea:'';return d;
}
