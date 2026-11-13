/** Shared, server-validated audit choices. Keep old paid answers readable. */
export const auditQuestions = [
 {q:'How often do you buy takeaway or go out for a meal?', options:['Never','Rarely','1–2 times/week','3–5 times/week','Almost daily']},
 {q:'How many subscriptions do you pay for?', options:['None','1–2','3–5','6–10','10+','Not sure']},
 {q:'When did you last check your insurance price?', options:['I don’t currently have insurance','Within 6 months','6–12 months ago','1–2 years ago','Over 2 years ago','Never','Not sure','Never / not sure']},
 {q:'How often do you buy coffee, snacks or other small treats?', options:['Rarely','1–2 times/week','3–5 times/week','Daily']},
 {q:'When did you last check your phone or internet price?', options:['Within 6 months','6-12 months ago','Over a year ago',"I honestly don't know","I don't pay either of these bills"]},
 {q:'When did you last check your power or gas price?', options:['Within 6 months','6-12 months ago','Over a year ago',"I honestly don't know","I don't pay these bills"]},
 {q:"How often do you buy things you didn't plan to buy?", options:['Rarely','1–2 times/week','3–5 times/week','Almost daily']},
 {q:'What would help you most right now?', options:['Lower my bills','Save more money','Reduce stress','Stop money disappearing so fast','Feel more financially in control']},
];
const normal = (s:string) => s.replace(/[‘’]/g,"'").replace(/[–—]/g,'-').trim();
export function validateAuditAnswers(input:unknown):string[]{
 if(!Array.isArray(input)||input.length!==auditQuestions.length) throw new Error('Please answer all eight questions.');
 return input.map((answer,index)=>{
  if(typeof answer!=='string'||answer.length>160) throw new Error('Please check question '+(index+1)+'.');
  const found=auditQuestions[index].options.find(option=>normal(option)===normal(answer));
  // Older saved purchases can still contain the original wording.
  if(!found && index===0 && normal(answer)==='Less than once a week') return 'Less than once a week';
  // Older saved purchases may use the previous combined 0–2 choice.
  if(!found && index===1 && normal(answer)==='0-2') return '0–2';
  if(!found) throw new Error('Please check question '+(index+1)+'.');
  return found;
 });
}
export const PLAN_PRICE_CENTS=2900;
/** Keep older A$39 orders valid; only new checkouts use the current price. */
export const LEGACY_PLAN_PRICE_CENTS=3900;
export function isAcceptedPlanPaymentAmount(amount: unknown): amount is number {
 return amount===PLAN_PRICE_CENTS || amount===LEGACY_PLAN_PRICE_CENTS;
}
export const TERMS_VERSION='2026-11-phase1';
