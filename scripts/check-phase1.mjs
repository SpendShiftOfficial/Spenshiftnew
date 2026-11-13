import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
function loadTs(file) {
  const filename = path.resolve(file.endsWith(".ts") ? file : file + ".ts");
  if (cache.has(filename)) return cache.get(filename).exports;
  const code = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  cache.set(filename, module);
  const localRequire = (request) => {
    if (!request.startsWith(".")) return nativeRequire(request);
    return loadTs(path.resolve(path.dirname(filename), request));
  };
  new Function("require", "module", "exports", compiled)(localRequire, module, module.exports);
  return module.exports;
}


const {validateAuditAnswers,auditQuestions}=loadTs('lib/audit-schema');
const {selectPersonalisationAreas,previewProfiles,reasonForArea}=loadTs('lib/personalisation-questions');
const {validateRefinements,emptyRefinements}=loadTs('lib/report-refinements');
const {blankDraft,cleanDraft,prepareDraft,restoreDraft,selectedDraftAreas}=loadTs('lib/plan-draft');
const {analyseSavings}=loadTs('lib/savings-engine');
const {takeawayMath,checkedDifference,quoteDifference}=loadTs('lib/savings-math');
const {rankOpportunities,goalIntro,priorityReason}=loadTs('lib/plan-priority');
const {makeReportMarkdown}=loadTs('lib/report-writing');
const {safeEventParams,isMarketingPath}=loadTs('lib/privacy');
let cases=0;function check(name,fn){fn();cases++;console.log('PASS '+name);}
const sample=previewProfiles['subscriptions-insurance'].answers;
const high=previewProfiles['all-seven'].answers;
const policies=[{type:'Car',premium:'1800',paymentPeriod:'year',renewal:'later'},{type:'Home or contents',premium:'240',paymentPeriod:'month',renewal:'soon'},{type:'Health',premium:'250',paymentPeriod:'month',renewal:'not_sure'}];
const areas=new Set(['takeaway','subscriptions','insurance','convenience','phone','energy','unplanned']);
check('strict eight-answer schema',()=>{assert.deepEqual(validateAuditAnswers(sample),sample);assert.throws(()=>validateAuditAnswers([]));assert.throws(()=>validateAuditAnswers([...sample,'extra']));assert.throws(()=>validateAuditAnswers('[]'));const wrong=[...sample];wrong[1]='999 subscriptions';assert.throws(()=>validateAuditAnswers(wrong));assert.equal(auditQuestions.length,8);});
check('old apostrophe forms stay readable',()=>{const old=['Never','0–2','I don’t currently have insurance','Rarely','I don’t pay either of these bills','I don’t pay these bills','Rarely','Save more money'];assert.equal(validateAuditAnswers(old)[4],"I don't pay either of these bills");assert.deepEqual(selectPersonalisationAreas(validateAuditAnswers(old)),[]);});
check('all seven concerns survive selection',()=>{assert.equal(selectPersonalisationAreas(high).length,7);assert.deepEqual(new Set(selectPersonalisationAreas(high)),areas);assert.deepEqual(selectPersonalisationAreas(sample),['subscriptions','insurance']);});
check('no clear area does not invent a problem',()=>{const none=previewProfiles['few-opportunities'].answers;assert.deepEqual(selectPersonalisationAreas(none),[]);assert.equal(analyseSavings(none,emptyRefinements()).estimatedAnnualScenario,null);});
check('unknown answers use natural copy',()=>{assert.match(reasonForArea('energy',high),/not sure/);assert.doesNotMatch(reasonForArea('phone',high),/price i honestly/);});
const refs=validateRefinements({details:{subscriptionsMonthly:'120',unusedSubscriptionChoice:'not_sure'},insurancePolicies:policies});
const base=analyseSavings(sample,refs);
check('insurance bills are accurate costs, never savings',()=>{assert.equal(base.opportunities.find(o=>o.area==='insurance').annualSpend,7680);assert.equal(base.opportunities.find(o=>o.area==='insurance').scenarioSaving,null);assert.equal(base.opportunities.find(o=>o.area==='subscriptions').annualSpend,1440);assert.equal(base.estimatedAnnualScenario,null);});
check('renewal urgency is first even with habit goals',()=>{const goals=[...high];goals[7]='Save more money';const ranked=analyseSavings(goals,validateRefinements({details:{takeawayOrder:'120',takeawayOrdersPerWeek:'7',takeawaySwapPerWeek:'3',takeawayReplacementCost:'40'},insurancePolicies:policies}));assert.equal(ranked.opportunities[0].area,'insurance');assert.match(priorityReason(ranked.opportunities[0],goals,refs),/renews/);});
check('customer goal changes order, not promised dollars',()=>{const bills=[...high];bills[7]='Lower my bills';const habits=[...high];habits[7]='Stop money disappearing so fast';const a=analyseSavings(bills,emptyRefinements());const b=analyseSavings(habits,emptyRefinements());assert.notDeepEqual(a.opportunities.map(x=>x.area),b.opportunities.map(x=>x.area));assert.equal(a.estimatedAnnualScenario,null);assert.notEqual(goalIntro(bills[7]),goalIntro(habits[7]));});
check('used subscriptions do not produce cancellation savings',()=>{const r=validateRefinements({details:{subscriptionsMonthly:'70',unusedSubscriptionChoice:'no'}});const a=analyseSavings(sample,r);assert.equal(a.opportunities.find(o=>o.area==='subscriptions').scenarioSaving,null);assert.match(a.opportunities.find(o=>o.area==='subscriptions').assumption,/won't tell you to cancel/);});
check('known unused service is conditional, not confirmed',()=>{const r=validateRefinements({details:{subscriptionsMonthly:'70',unusedSubscriptionChoice:'yes',unusedSubscriptionName:'Old app',unusedSubscriptionMonthly:'15'}});assert.equal(analyseSavings(sample,r).opportunities.find(o=>o.area==='subscriptions').scenarioSaving,180);});
check('unnamed subscription cannot create an estimated saving',()=>{const r=validateRefinements({details:{subscriptionsMonthly:'70',unusedSubscriptionChoice:'yes',unusedSubscriptionMonthly:'15'}});const op=analyseSavings(sample,r).opportunities.find(o=>o.area==='subscriptions');assert.equal(op.scenarioSaving,null);assert.match(op.assumption,/not the name/);});
check('using every subscription moves other bill checks ahead',()=>{const r=validateRefinements({details:{unusedSubscriptionChoice:'no'}});const ops=analyseSavings(high,r).opportunities.map(x=>x.area);assert.ok(ops.indexOf('phone')<ops.indexOf('subscriptions'));assert.ok(ops.indexOf('energy')<ops.indexOf('subscriptions'));});
check('subscription cross-field limits',()=>{assert.throws(()=>validateRefinements({details:{subscriptionsMonthly:'70',unusedSubscriptionChoice:'yes',unusedSubscriptionMonthly:'75'}}));assert.throws(()=>validateRefinements({details:{unusedSubscriptionChoice:'no',unusedSubscriptionMonthly:'10'}}));assert.throws(()=>validateRefinements({details:{subscriptionsMonthly:'-1'}}));});
const meal=validateRefinements({details:{takeawayOrder:'120',takeawayAmountPeriod:'order',takeawayOrdersPerWeek:'7',takeawaySwapPerWeek:'3',takeawayReplacementCost:'40'}});
check('net meal maths uses the same group and replacement costs',()=>{const m=takeawayMath(meal);assert.equal(m.weeklyCost,840);assert.equal(m.weeklySaving,240);assert.equal(m.annualExample,12480);});
check('weekly amount is never read as one order',()=>{const r=validateRefinements({details:{takeawayOrder:'120',takeawayAmountPeriod:'week',takeawayOrdersPerWeek:'6',takeawaySwapPerWeek:'2',takeawayReplacementCost:'10'}});const m=takeawayMath(r);assert.equal(m.orderCost,20);assert.equal(m.weeklyCost,120);assert.equal(m.weeklySaving,20);assert.equal(m.annualExample,1040);assert.equal(m.parts[0].type,'combined');});
check('unknown replacement, zero swaps, higher cost give no saving',()=>{for(const patch of [{takeawayReplacementCost:''},{takeawaySwapPerWeek:'0'},{takeawayReplacementCost:'130'}]){const r=validateRefinements({details:{takeawayOrder:'120',takeawayOrdersPerWeek:'7',takeawaySwapPerWeek:'3',takeawayReplacementCost:'40',...patch}});assert.equal(takeawayMath(r).weeklySaving,null);}});
check('reject impossible weekly targets',()=>{assert.throws(()=>validateRefinements({details:{takeawayOrdersPerWeek:'3',takeawaySwapPerWeek:'4'}}));assert.throws(()=>validateRefinements({details:{takeawayOrdersPerWeek:'2.5'}}));assert.throws(()=>validateRefinements({details:{takeawayOrdersPerWeek:'22'}}));assert.throws(()=>validateRefinements({details:{convenienceWeekly:'50',convenienceGoalWeekly:'60'}}));});
check('overlapping small buys are not added',()=>{for(const overlap of ['','yes','not_sure']){const r=validateRefinements({details:{...meal.details,convenienceWeekly:100,convenienceGoalWeekly:70,convenienceOverlap:overlap}});const a=analyseSavings(high,r);assert.equal(a.opportunities.find(o=>o.area==='convenience').scenarioSaving,null);assert.equal(a.estimatedAnnualScenario,12480);}});
check('separate known weekly goals can be calculated',()=>{const r=validateRefinements({details:{...meal.details,convenienceWeekly:100,convenienceGoalWeekly:70,convenienceOverlap:'no'}});const a=analyseSavings(high,r);assert.equal(a.opportunities.find(o=>o.area==='convenience').scenarioSaving,1560);assert.equal(a.opportunities.find(o=>o.area==='unplanned').scenarioSaving,null);});
check('unchanged weekly goal never becomes a reduction',()=>{const r=validateRefinements({details:{convenienceWeekly:50,convenienceGoalWeekly:50,convenienceOverlap:'no'}});const op=analyseSavings(high,r).opportunities.find(o=>o.area==='convenience');assert.equal(op.scenarioSaving,null);assert.match(op.assumption,/same as what you spend/);});
check('raw drafts save incomplete amounts but finalisation validates',()=>{const d=blankDraft(high);d.details.takeawayOrdersPerWeek='2.5';d.step=2;assert.equal(cleanDraft(d).step,2);assert.throws(()=>prepareDraft(d));assert.throws(()=>cleanDraft({...d,step:999}));assert.throws(()=>cleanDraft({...d,details:{takeawayOrder:'x'.repeat(200)}}));});
check('changing original answers masks stale areas',()=>{const d=blankDraft(high);d.details.takeawayOrder='120';d.answers[0]='Never';const r=prepareDraft(d);assert.equal(r.details.takeawayOrder,null);assert.equal(analyseSavings(d.answers,r).opportunities.some(o=>o.area==='takeaway'),false);});
check('adaptive fields discard hidden values',()=>{const d=blankDraft(high);d.details.hasGas='no';d.details.gasMonthly='99';d.details.phoneService='mobile';d.details.internetMonthly='100';d.details.mobileMonthly='25';d.details.unusedSubscriptionChoice='no';d.details.unusedSubscriptionMonthly='10';const r=prepareDraft(d);assert.equal(r.details.gasMonthly,null);assert.equal(r.details.internetMonthly,null);assert.equal(r.details.mobileMonthly,25);assert.equal(r.details.unusedSubscriptionMonthly,null);});
check('draft restoration covers new and old purchases',()=>{const d=blankDraft(high);d.details.takeawayOrder='120';d.step=4;assert.deepEqual(restoreDraft(high,{version:1,draft:d}),d);const restored=restoreDraft(sample,{version:1,details:{subscriptionsMonthly:70,unusedSubscriptionMonthly:15}});assert.equal(restored.details.unusedSubscriptionChoice,'yes');assert.equal(restored.details.unusedSubscriptionMonthly,'15');});
check('all seven report areas remain in plain-text output',()=>{const a=analyseSavings(high,validateRefinements({details:meal.details,insurancePolicies:policies}));const text=makeReportMarkdown(high,validateRefinements({details:meal.details,insurancePolicies:policies}),a);for(const op of a.opportunities)assert.ok(text.includes(op.title));assert.match(text,/not money saved yet|not checked live prices|do not count bills as money saved/i);});
check('initial report gives actions before the long area cards',()=>{const text=fs.readFileSync('app/report/[id]/SimpleSavingsReport.tsx','utf8');assert.ok(text.indexOf('<h2>Your 3 things to do first</h2>')<text.indexOf('{first.length > 0 && <section'));});
check('hidden phone bills cannot survive an unsure or neither answer',()=>{
 for(const choice of ['not_sure','neither']){
  const d=blankDraft(high);d.details.phoneService=choice;d.details.mobileMonthly='55';d.details.internetMonthly='90';
  const result=prepareDraft(d);assert.equal(result.details.mobileMonthly,null);assert.equal(result.details.internetMonthly,null);
  const direct=validateRefinements({details:{phoneService:choice,mobileMonthly:'55',internetMonthly:'90'}});
  assert.equal(direct.details.mobileMonthly,null);assert.equal(direct.details.internetMonthly,null);
 }
 const d=blankDraft(high);d.details.phoneService='mobile';d.details.mobileMonthly='40';d.details.internetMonthly='70';
 const result=prepareDraft(d);assert.equal(result.details.mobileMonthly,40);assert.equal(result.details.internetMonthly,null);
 const legacy=validateRefinements({details:{mobileMonthly:'40',internetMonthly:'70'}});
 assert.equal(legacy.details.mobileMonthly,40);assert.equal(legacy.details.internetMonthly,70);
});
check('a paid plan requires at least one area after changing audit answers',()=>{
 const none=previewProfiles['few-opportunities'].answers;
 assert.throws(()=>prepareDraft(blankDraft(none)),/Choose at least one area/);
 const d=blankDraft(none);d.additionalArea='phone';
 assert.equal(prepareDraft(d).additionalArea,'phone');
 const ui=fs.readFileSync('app/personalise/PersonaliseClient.tsx','utf8');
 assert.match(ui,/Choose one area to check/);assert.match(ui,/disabled={submitting\|\|areas.length===0}/);
});
check('three report actions are drawn from the same category steps in text and UI',()=>{
 const {checklistTasks,firstSteps}=loadTs('lib/report-steps');
 const one=analyseSavings(previewProfiles['household-bills'].answers,emptyRefinements()).opportunities.slice(0,1);
 const oneTasks=checklistTasks(one,emptyRefinements());assert.equal(oneTasks.length,3);assert.deepEqual(oneTasks,firstSteps(one[0],emptyRefinements()));
 const refs=validateRefinements({details:{subscriptionsMonthly:'70',unusedSubscriptionChoice:'no'},insurancePolicies:policies});
 const analysis=analyseSavings(high,refs);const tasks=checklistTasks(analysis.opportunities,refs);
 assert.equal(tasks.length,3);assert.equal(new Set(tasks).size,3);
 const doc=makeReportMarkdown(high,refs,analysis);
 for(const task of tasks)assert.ok(doc.includes('- '+task));
 const ui=fs.readFileSync('app/report/[id]/SimpleSavingsReport.tsx','utf8');assert.match(ui,/checklistTasks\(first, refinements\)/);
});
check('takeaway stored text labels weekly and per-order costs correctly',()=>{
 const a=previewProfiles['takeaway-convenience'].answers;
 const weekly=validateRefinements({details:{takeawayAmountPeriod:'week',takeawayOrder:'120',takeawayOrdersPerWeek:'6'}});
 const weeklyText=makeReportMarkdown(a,weekly,analyseSavings(a,weekly));assert.match(weeklyText,/Takeaway and eating out:/);assert.match(weeklyText,/Usual spending: \$120 per week/);
 assert.doesNotMatch(weeklyText,/Your usual takeaway order: \$120/);
 const order=validateRefinements({details:{takeawayAmountPeriod:'order',takeawayOrder:'30',takeawayOrdersPerWeek:'6'}});
 const orderText=makeReportMarkdown(a,order,analyseSavings(a,order));assert.match(orderText,/Usual spending: \$30 per meal/);
});
check('electricity quote marks one-bill annualisation as an estimate',()=>{
 const src=fs.readFileSync('app/report/[id]/QuoteCheck.tsx','utf8');
 assert.match(src,/Electricity use changes across seasons/);assert.match(src,/12 months of electricity bills/);
 assert.match(src,/Rough estimate: the new quote could be/);assert.match(src,/annualCostVerified/);
 const report=fs.readFileSync('app/report/[id]/SimpleSavingsReport.tsx','utf8');assert.match(report,/electricityBillPeriod={refinements.details.electricityPeriod}/);
});

check('checked results subtract fees and preserve losses',()=>{assert.equal(checkedDifference(100,70,5),25);assert.equal(checkedDifference(70,100,5),-35);assert.equal(checkedDifference(0,0,0),0);assert.throws(()=>checkedDifference(10,Infinity,0));assert.throws(()=>checkedDifference(10,-1,0));});
check('equal quote and tracker results never say lower',()=>{assert.match(fs.readFileSync('app/report/[id]/QuoteCheck.tsx','utf8'),/Both prices are the same/);assert.match(fs.readFileSync('app/report/[id]/SavingsTracker.tsx','utf8'),/no change in cost/);});
check('quote comparison is first-year only',()=>{assert.equal(quoteDifference(1200,80,'month',20),220);assert.equal(quoteDifference(1200,1300,'year',0),-100);});
check('analytics excludes access IDs, URLs and private fields',()=>{assert.deepEqual(safeEventParams({session_id:'cs_test_secret',report_id:'rpt_secret',transaction_id:'cs_test_secret',page_location:'https://x/report/rpt_secret',email:'x@example.com',answers:high,currency:'AUD',value:39}),{currency:'AUD'});for(const p of ['/audit','/results','/success','/personalise','/report/rpt_private','/plan-preview'])assert.equal(isMarketingPath(p),false);assert.equal(isMarketingPath('/pricing'),true);});
check('private layout does not load measurement scripts',()=>{const layout=fs.readFileSync('app/layout.tsx','utf8');assert.doesNotMatch(layout,/googletagmanager\.com|connect\.facebook|clarity\.ms\/tag|ttq\.load/);const csp=fs.readFileSync('next.config.ts','utf8');assert.match(csp,/connect-src 'self'/);assert.match(csp,/plan-preview/);assert.match(fs.readFileSync('components/PublicAnalytics.tsx','utf8'),/isMarketingPath/);});
check('checkout validates before calling Stripe and does not leak provider errors',()=>{const route=fs.readFileSync('app/api/checkout/route.ts','utf8');assert.ok(route.indexOf('validateAuditAnswers(data.answers)')<route.indexOf('.checkout.sessions.create'));assert.match(route,/acceptedTerms/);assert.match(route,/idempotencyKey/);assert.doesNotMatch(route,/error: e\.message/);});
check('checkout pause does not block existing paid access',()=>{assert.doesNotMatch(fs.readFileSync('lib/paid-orders.ts','utf8'),/SPENDSHIFT_ALLOW_PREVIEW_PAYMENTS/);});
check('recovery leaves unpaid and unfinished drafts untouched',()=>{const cron=fs.readFileSync('app/api/cron/recover-paid-reports/route.ts','utf8');assert.match(cron,/refinements->>completed/);assert.match(cron,/completed===true/);assert.match(fs.readFileSync('lib/report-fulfillment.ts','utf8'),/Please finish or skip the questions/);});
check('optimistic draft writes cannot silently overwrite another tab',()=>{const api=fs.readFileSync('app/api/personalisation/draft/route.ts','utf8');assert.match(api,/body\.revision\s*!==\s*order\.updated_at/);assert.match(api,/\.eq\(["']updated_at["'],\s*body\.revision\)/);assert.match(api,/409/);});
check('marketing reflects implemented product',()=>{for(const file of ['app/homePageClient.tsx','app/pricing/page.tsx','app/whats-included/page.tsx','app/how-it-works/page.tsx','components/SavingsOffer.tsx'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/3,050|1,300|30-day action plan|AI Powered|AI-powered/);assert.match(fs.readFileSync('components/SavingsOffer.tsx','utf8'),/A\$39/);});
check('post-report corrections require payment and preserve revision history',()=>{const code=fs.readFileSync('app/api/report/revise/route.ts','utf8');assert.match(code,/paidSession\(data\.sessionId\)/);assert.match(code,/spendshift_update_report_revision/);assert.match(code,/p_expected_updated_at/);const migration=fs.readFileSync('supabase/migrations/20261110_phase1_report_revisions.sql','utf8');assert.match(migration,/SECURITY DEFINER/);assert.match(migration,/REVOKE ALL ON FUNCTION/);});
const {findAuditConflict}=loadTs('lib/plan-conflicts');
check('audit and detailed takeaway answers must agree',()=>{
  const d=blankDraft(high);
  d.details.takeawayOrdersPerWeek='0';
  assert.equal(findAuditConflict(d)?.area,'takeaway');
  assert.throws(()=>prepareDraft(d),/do not match/);
  d.details.takeawayOrdersPerWeek='6';
  assert.equal(findAuditConflict(d),null);
});
check('insurance and household bill contradictions are caught',()=>{
  const d=blankDraft(high);
  d.answers[2]='I don’t currently have insurance';
  d.additionalArea='insurance';
  d.insurancePolicies=[{type:'Car',premium:'1800',paymentPeriod:'year',insurer:'',coverDescription:'',renewal:''}];
  assert.equal(findAuditConflict(d)?.area,'insurance');
  const d2=blankDraft(high);
  d2.answers[4]="I don't pay either of these bills";
  d2.additionalArea='phone';d2.details.phoneService='mobile';
  assert.equal(findAuditConflict(d2)?.area,'phone');
  const d3=blankDraft(high);
  d3.answers[5]="I don't pay these bills";
  d3.additionalArea='energy';d3.details.electricityBill='220';
  assert.equal(findAuditConflict(d3)?.area,'energy');
});
check('unused takeaway barrier is validated and used in personal steps',()=>{
  const d=validateRefinements({details:{takeawayReason:'busy'}});
  assert.equal(d.details.takeawayReason,'busy');
  assert.throws(()=>validateRefinements({details:{takeawayReason:'never_cook_again'}}),/Invalid/);
  const src=fs.readFileSync('lib/report-steps.ts','utf8');
  assert.match(src,/d.takeawayReason === "busy"/);
  assert.match(src,/d.takeawayReason === "tired"/);
  assert.match(src,/d.takeawayReason === "enjoy"/);
});
check('skipping a question does not throw away already entered amounts',()=>{
  const src=fs.readFileSync('app/personalise/PersonaliseClient.tsx','utf8');
  assert.match(src,/Leave it blank and tap Next/);
  assert.doesNotMatch(src,/snapshot\.details\[key\]=''/);
  assert.match(src,/Remove the extra area/);
  assert.match(src,/nearly done/i);
});
check('each kind of bill uses a suitable quote check and known costs',()=>{
  const quote=fs.readFileSync('app/report/[id]/QuoteCheck.tsx','utf8');
  const report=fs.readFileSync('app/report/[id]/SimpleSavingsReport.tsx','utf8');
  for(const kind of ['insurance','mobile','internet','electricity','gas']){
    assert.match(quote,new RegExp(kind));
  }
  assert.match(report,/kind="electricity"/);
  assert.match(report,/kind="gas"/);
  assert.match(report,/electricityBill\*\(refinements.details.electricityPeriod/);
  assert.ok(report.includes('annualisePayment(refinements.details.gasMonthly, refinements.details.gasPeriod)'));
});
check('savings records use per-bill labels, local dates, and do not change checklist ticks',()=>{
  const tracker=fs.readFileSync('app/report/[id]/SavingsTracker.tsx','utf8');
  const checklist=fs.readFileSync('app/report/[id]/PlanChecklist.tsx','utf8');
  assert.match(tracker,/todayHere/);
  assert.match(tracker,/label: options.find/);
  assert.match(tracker,/entry\.label/);
  assert.match(tracker,/key: itemKey/);
  assert.match(checklist,/JSON\.stringify\(saved\.items\) === JSON\.stringify\(items\)/);
});
check('report revisions require a paid session and store history atomically',()=>{
  const api=fs.readFileSync('app/api/report/revise/route.ts','utf8');
  const sql=fs.readFileSync('supabase/migrations/20261110_phase1_report_revisions.sql','utf8');
  assert.match(api,/await paidSession\(data\.sessionId\)/);
  assert.match(api,/spendshift_update_report_revision/);
  assert.match(sql,/FOR UPDATE/);
  assert.match(sql,/revision_history/);
  assert.match(sql,/REVOKE ALL/);
  assert.match(sql,/service_role/);
});
check('free sample shows a calculation without claiming the customer savings',()=>{
  const results=fs.readFileSync('app/results/page.tsx','utf8');
  assert.match(results,/EXAMPLE ONLY — NOT YOUR ESTIMATE/);
  assert.match(results,/previewExamples/);assert.match(results,/analyseSavings\(answers, emptyRefinements\(\)\)/);assert.match(results,/Possible \$420 less in one year/);
  assert.match(results,/areas\.slice\(3\)/);
});

check('mobile input and private layout fixes have appropriate CSS specificity',()=>{
 const form=fs.readFileSync('app/personalise/personalise.module.css','utf8');
 const report=fs.readFileSync('app/report/[id]/simple-report.module.css','utf8');
 const header=fs.readFileSync('components/Header.tsx','utf8');
 const styles=fs.readFileSync('app/globals.css','utf8');
 assert.ok(form.includes('.field .moneyInput input {'));
 assert.ok(form.includes('padding-left: 48px;'));
 assert.ok(form.includes('.introPanel'));
 assert.ok(report.includes('.lastCard > .helpDetails + .checkNote'));
 assert.ok(!report.includes('margin: -7px 0 18px'));
 assert.ok(header.includes('simple ? "logo" : "logo reveal-left"'));
 assert.ok(styles.includes('.topbar.topbar-simple'));
});

check('insurance and gas support every approved payment frequency',()=>{
 const {annualisePayment,periodLabel,isPaymentPeriod,paymentPeriodOptions}=loadTs('lib/payment-periods');
 const payments={week:52,fortnight:26,month:12,quarter:4,half_year:2,year:1};
 assert.equal(paymentPeriodOptions.length,6);
 for(const [period,expected] of Object.entries(payments)){
  assert.equal(isPaymentPeriod(period),true);
  assert.equal(annualisePayment(100,period),expected*100);
  assert.ok(periodLabel(period));
 }
 assert.equal(isPaymentPeriod('daily'),false);
 assert.equal(annualisePayment(50.45,'fortnight'),1311.7);
});
check('mixed insurance payments are annualised and retained in saved report',()=>{
 const policies=[
  {type:'Car',premium:'70',paymentPeriod:'fortnight',renewal:'soon'},
  {type:'CTP / Green Slip',premium:'250',paymentPeriod:'quarter',renewal:'later'},
  {type:'Health',premium:'30',paymentPeriod:'week',renewal:''},
  {type:'Home or contents',premium:'1200',paymentPeriod:'year',renewal:''},
  {type:'Pet',premium:'100',paymentPeriod:'month',renewal:''},
  {type:'Travel',premium:'600',paymentPeriod:'half_year',renewal:''},
 ];
 const r=validateRefinements({insurancePolicies:policies});
 const a=analyseSavings(high,r);
 const insurance=a.opportunities.find(o=>o.area==='insurance');
 assert.equal(insurance.annualSpend,7980);
 assert.equal(insurance.scenarioSaving,null);
 assert.equal(a.opportunities[0].area,'insurance');
 const markdown=makeReportMarkdown(high,r,a);
 assert.match(markdown,/Car: \$70 per fortnight/);
 assert.match(markdown,/CTP \/ Green Slip: \$250 per 3 months/);
 assert.match(markdown,/Combined yearly insurance cost: \$7,980/);
});
check('partial premiums do not create a misleading complete insurance total',()=>{
 const r=validateRefinements({insurancePolicies:[{type:'Car',premium:'70',paymentPeriod:'fortnight'},{type:'Health',premium:'',paymentPeriod:'month'}]});
 const a=analyseSavings(high,r);assert.equal(a.opportunities.find(o=>o.area==='insurance').annualSpend,null);
 const markdown=makeReportMarkdown(high,r,a);
 assert.match(markdown,/Yearly cost for policies with prices: \$1,820/);
 assert.doesNotMatch(markdown,/Combined yearly insurance cost/);
});
check('legacy billing data stays monthly for gas, yearly for missing insurance periods',()=>{
 const legacy=validateRefinements({details:{gasMonthly:'85'},insurancePolicies:[{type:'Car',premium:'1800'}]});
 assert.equal(legacy.details.gasPeriod,'month');assert.equal(legacy.insurancePolicies[0].paymentPeriod,'year');
 assert.equal(analyseSavings(high,legacy).opportunities.find(o=>o.area==='energy').annualSpend,1020);
 const oldDraft=blankDraft(high);oldDraft.details.gasMonthly='85';oldDraft.details.hasGas='yes';oldDraft.details.gasPeriod='month';
 const restored=restoreDraft(high,{version:1,draft:oldDraft});
 assert.equal(restored.details.gasPeriod,'month');
 assert.throws(()=>validateRefinements({details:{gasPeriod:'daily'}}),/gas payment frequency/);
 assert.throws(()=>validateRefinements({insurancePolicies:[{type:'Car',premium:'50',paymentPeriod:'daily'}]}),/insurance payment frequency/);
});
check('quarterly gas bills affect yearly cost and all written report labels',()=>{
 const r=validateRefinements({details:{hasGas:'yes',gasPeriod:'quarter',gasMonthly:'300',electricityBill:'400',electricityPeriod:'quarter'}});
 const energy=analyseSavings(high,r).opportunities.find(o=>o.area==='energy');
 assert.equal(energy.annualSpend,2800);
 const markdown=makeReportMarkdown(high,r,analyseSavings(high,r));
 assert.match(markdown,/Gas bill: \$300 per 3 months/);
 const report=fs.readFileSync('app/report/[id]/SimpleSavingsReport.tsx','utf8');
 assert.match(report,/annualisePayment\(refinements\.details\.gasMonthly, refinements\.details\.gasPeriod\)/);
});
check('questionnaire asks the time period before the bill amount',()=>{
 const ui=fs.readFileSync('app/personalise/PersonaliseClient.tsx','utf8');
 assert.ok(ui.includes("I only know my weekly total"));assert.doesNotMatch(ui,/choice\('takeawayAmountPeriod'/);
 assert.ok(ui.indexOf("choice('electricityPeriod'")<ui.indexOf("amount('electricityBill'"));
 assert.ok(ui.indexOf("choice('gasPeriod'")<ui.indexOf("amount('gasMonthly'"));
 assert.ok(ui.indexOf("htmlFor={'policy-period-'+i}")<ui.indexOf("htmlFor={'policy-cost-'+i}"));
 assert.match(ui,/What insurance do you pay for/);
 assert.doesNotMatch(ui,/Does this amount also include takeaway food/);assert.match(ui,/Do not count takeaway or restaurant meals here/);
 assert.doesNotMatch(ui,/takeaway you already listed/);
});

check('multiple named unused subscriptions produce one conditional yearly amount',()=>{
 const r=validateRefinements({details:{subscriptionsMonthly:'80',unusedSubscriptionChoice:'yes',unusedSubscriptionName:'Stan',unusedSubscriptionMonthly:'20'},additionalUnusedSubscriptions:[{name:'Netflix',monthly:'15'}]});
 assert.equal(r.unusedSubscriptions.length,2);
 const a=analyseSavings(sample,r);
 const subs=a.opportunities.find(o=>o.area==='subscriptions');
 assert.equal(subs.scenarioSaving,420);
 assert.equal(subs.annualSpend,960);
 assert.match(subs.assumption,/not money saved yet/);
 const text=makeReportMarkdown(sample,r,a);
 assert.ok(text.includes('Stan')&&text.includes('Netflix'));
 assert.ok(text.includes('Possible')||text.includes('could save'));
 const again=validateRefinements(r);
 assert.equal(again.unusedSubscriptions.length,2);
 assert.equal(analyseSavings(sample,again).opportunities.find(o=>o.area==='subscriptions').scenarioSaving,420);
});
check('incomplete additional subscriptions cannot be counted as savings',()=>{
 const r=validateRefinements({details:{subscriptionsMonthly:'80',unusedSubscriptionChoice:'yes',unusedSubscriptionName:'Stan',unusedSubscriptionMonthly:'20'},additionalUnusedSubscriptions:[{name:'Netflix',monthly:''},{name:'',monthly:'12'}]});
 const sub=analyseSavings(sample,r).opportunities.find(o=>o.area==='subscriptions');
 assert.equal(sub.scenarioSaving,240);
 assert.match(sub.assumption,/not included/);
 assert.equal(r.unusedSubscriptions.length,3);
});
check('duplicate names and totals exceeding the real subscription bill are rejected',()=>{
 const base={subscriptionsMonthly:'30',unusedSubscriptionChoice:'yes',unusedSubscriptionName:'Stan',unusedSubscriptionMonthly:'20'};
 assert.throws(()=>validateRefinements({details:base,additionalUnusedSubscriptions:[{name:' stan ',monthly:'5'}]}),/only once/);
 assert.throws(()=>validateRefinements({details:base,additionalUnusedSubscriptions:[{name:'Netflix',monthly:'15'}]}),/cannot cost more/);
 assert.throws(()=>validateRefinements({details:{...base,unusedSubscriptionChoice:'no'},additionalUnusedSubscriptions:[{name:'Netflix',monthly:'15'}]}));
 assert.throws(()=>validateRefinements({details:{...base,subscriptionsMonthly:'100'},additionalUnusedSubscriptions:Array.from({length:6},(_,i)=>({name:'Extra'+i,monthly:'1'}))}),/six/);
});
check('multiple entries in paid drafts survive save restore and revisions',()=>{
 const d=blankDraft(sample);d.details.subscriptionsMonthly='80';d.details.unusedSubscriptionChoice='yes';d.details.unusedSubscriptionName='Stan';d.details.unusedSubscriptionMonthly='20';
 d.additionalUnusedSubscriptions=[{name:'Netflix',monthly:'15'}];
 const saved=cleanDraft(d);assert.deepEqual(saved.additionalUnusedSubscriptions,d.additionalUnusedSubscriptions);
 assert.deepEqual(restoreDraft(sample,{version:1,draft:saved}).additionalUnusedSubscriptions,d.additionalUnusedSubscriptions);
 const normal=prepareDraft(saved);
 assert.deepEqual(normal.unusedSubscriptions.map(s=>s.name),['Stan','Netflix']);
 const restored=restoreDraft(sample,normal);
 assert.deepEqual(restored.additionalUnusedSubscriptions,d.additionalUnusedSubscriptions);
 assert.equal(prepareDraft(restored).unusedSubscriptions.length,2);
 restored.details.unusedSubscriptionChoice='no';
 assert.equal(prepareDraft(restored).unusedSubscriptions.length,0);
 const noArea=blankDraft(sample);noArea.details.unusedSubscriptionChoice='no';noArea.additionalUnusedSubscriptions=[{name:'Netflix',monthly:'15'}];
 assert.equal(prepareDraft(noArea).unusedSubscriptions.length,0);
});
check('source offers relevant bill-finding help without adding more compulsory questions',()=>{
 const ui=fs.readFileSync('app/personalise/PersonaliseClient.tsx','utf8');
 assert.ok(ui.includes('About how much do you spend on coffee, snacks and small treats each week?'));
 for(const hint of ['bank app','receipts','company app','renewal email','rough guess']) assert.match(ui,new RegExp(hint,'i'));
 assert.ok(ui.includes('Add another unused subscription'));
 assert.ok(ui.includes('Remove unused subscription'));
});

check('plain-language questions distinguish costs, renewal and optional cover',()=>{
 const form=fs.readFileSync('app/personalise/PersonaliseClient.tsx','utf8');
 const tracker=fs.readFileSync('app/report/[id]/SavingsTracker.tsx','utf8');
 const css=fs.readFileSync('app/personalise/personalise.module.css','utf8');
 assert.ok(form.includes('Which kinds of meals do you buy?'));assert.ok(form.includes('restaurantOrdersPerWeek'));
 assert.ok(form.includes('About how much would it cost to make one of these meals at home?'));
 assert.match(form,/guess your saving/);
 assert.ok(form.includes('When does this insurance renew?'));
 assert.ok(form.includes('even if you pay monthly'));
 assert.ok(form.includes('What does your insurance cover? (optional)'));
 assert.ok(css.includes('.optionalInner label input'));
 assert.ok(tracker.includes('This is for later.'));
 assert.ok(tracker.includes('compare what you paid before and after'));
 assert.ok(tracker.includes('Nothing recorded yet?'));
 assert.ok(tracker.includes('Saved only in this browser')||tracker.includes('saved only in this browser'));
});

check('free audit separates meals from small treats, and goal drives free ordering',()=>{
 const audit=fs.readFileSync('lib/audit-schema.ts','utf8');
 const areas=fs.readFileSync('lib/personalisation-questions.ts','utf8');
 const results=fs.readFileSync('app/results/page.tsx','utf8');
 assert.match(audit,/How often do you buy takeaway or go out for a meal/);
 assert.match(audit,/coffee, snacks or other small treats/);
 assert.match(areas,/You get takeaway or eat out/);
 assert.match(results,/analyseSavings\(answers, emptyRefinements\(\)\)/);
 const bill=[...high];bill[7]='Lower my bills';
 const habits=[...high];habits[7]='Stop money disappearing so fast';
 assert.notDeepEqual(analyseSavings(bill,emptyRefinements()).opportunities.map(o=>o.area),analyseSavings(habits,emptyRefinements()).opportunities.map(o=>o.area));
});
check('paid first step explains why and has no Previous or free-audit escape',()=>{
 const ui=fs.readFileSync('app/personalise/PersonaliseClient.tsx','utf8');
 assert.doesNotMatch(ui,/Check or change my first answers/);
 assert.doesNotMatch(ui,/auditReviewIndex|setAuditReviewIndex/);
 assert.doesNotMatch(ui,/import \{auditQuestions,/);
 assert.match(ui,/A few more details\. A plan made for you\./);
 assert.match(ui,/Your first 8 answers showed us where to start/);
 assert.match(ui,/A rough guess is fine/);
 assert.match(ui,/There is no extra charge/);
 assert.match(ui,/draft\.step===0&&!review/);
 assert.match(ui,/draft\.step>0&&<button className=\{styles\.secondary\} type='button' onClick=\{previous\}>Previous question/);
 assert.match(ui,/function previous\(\)\{if\(draft\.step===0\)return;/);
 const bill=blankDraft(high);bill.details.phoneService='both';bill.details.mobileMonthly='35';bill.details.internetMonthly='70';
 const clean=prepareDraft(bill);assert.equal(clean.details.mobileMonthly,35);assert.equal(clean.details.internetMonthly,70);
});

check('small buys only count separately and old overlapping values remain safe',()=>{
 const ui=fs.readFileSync('app/personalise/PersonaliseClient.tsx','utf8');
 assert.ok(ui.includes("convenienceWeekly'?{convenienceOverlap:''}"));
 assert.ok(ui.includes("choice('convenienceOverlap'"));
 const overlap=validateRefinements({details:{convenienceWeekly:'80',convenienceGoalWeekly:'60',convenienceOverlap:'yes'}});
 assert.equal(analyseSavings(high,overlap).opportunities.find(o=>o.area==='convenience').scenarioSaving,null);
 const separate=validateRefinements({details:{convenienceWeekly:'80',convenienceGoalWeekly:'60',convenienceOverlap:'no'}});
 assert.equal(analyseSavings(high,separate).opportunities.find(o=>o.area==='convenience').scenarioSaving,1040);
});
check('visible phone choices only expose matching bill amounts',()=>{
 const ui=fs.readFileSync('app/personalise/PersonaliseClient.tsx','utf8');
 assert.ok(ui.includes('name="phoneService"'));
 assert.ok(ui.includes('Mobile phone only'));
 assert.ok(ui.includes('Home internet only'));
 assert.ok(ui.includes('Both mobile and home internet'));
 const draft=blankDraft(high);draft.details.phoneService='not_sure';draft.details.mobileMonthly='45';draft.details.internetMonthly='70';
 const clean=prepareDraft(draft);assert.equal(clean.details.mobileMonthly,null);assert.equal(clean.details.internetMonthly,null);
});

check('takeaway and restaurant prices are separate and both appear in the saved report',()=>{
 const r=validateRefinements({details:{takeawayMealMode:'both',takeawayOrder:'25',takeawayOrdersPerWeek:'2',takeawaySwapPerWeek:'1',takeawayReplacementCost:'10',restaurantOrder:'90',restaurantOrdersPerWeek:'1',restaurantSwapPerWeek:'1',restaurantReplacementCost:'20'}});
 const m=takeawayMath(r);
 assert.equal(m.parts.length,2);
 assert.equal(m.parts[0].weeklyCost,50);assert.equal(m.parts[1].weeklyCost,90);
 assert.equal(m.parts[0].netWeeklySaving,15);assert.equal(m.parts[1].netWeeklySaving,70);
 assert.equal(m.weeklyCost,140);assert.equal(m.weeklySaving,85);assert.equal(m.annualExample,4420);
 const a=analyseSavings(previewProfiles['takeaway-convenience'].answers,r);
 assert.equal(a.opportunities.find(o=>o.area==='takeaway').scenarioSaving,4420);
 assert.equal(a.opportunities.find(o=>o.area==='takeaway').annualSpend,7280);
 const doc=makeReportMarkdown(previewProfiles['takeaway-convenience'].answers,r,a);
 assert.match(doc,/Takeaway or delivery:/);assert.match(doc,/Cafés and restaurants:/);
 assert.match(doc,/Combined weekly meal cost: \$140/);assert.match(doc,/Possible weekly reduction from the selected meal changes: \$85/);
});
check('restaurant-only meals never use stale takeaway bills',()=>{
 const r=validateRefinements({details:{takeawayMealMode:'restaurant',takeawayOrder:'60',takeawayOrdersPerWeek:'3',takeawaySwapPerWeek:'2',takeawayReplacementCost:'10',restaurantOrder:'90',restaurantOrdersPerWeek:'1',restaurantSwapPerWeek:'1',restaurantReplacementCost:'20'}});
 assert.equal(r.details.takeawayOrder,null);assert.equal(r.details.takeawayOrdersPerWeek,null);
 assert.equal(takeawayMath(r).weeklyCost,90);assert.equal(takeawayMath(r).weeklySaving,70);assert.equal(takeawayMath(r).annualExample,3640);
});
check('unknown restaurant replacement costs block false combined saving',()=>{
 const r=validateRefinements({details:{takeawayMealMode:'both',takeawayOrder:'25',takeawayOrdersPerWeek:'2',takeawaySwapPerWeek:'1',takeawayReplacementCost:'10',restaurantOrder:'90',restaurantOrdersPerWeek:'1',restaurantSwapPerWeek:'1',restaurantReplacementCost:''}});
 assert.equal(takeawayMath(r).weeklyCost,140);assert.equal(takeawayMath(r).weeklySaving,null);
 const onlyTakeaway=validateRefinements({details:{takeawayMealMode:'both',takeawayOrder:'25',takeawayOrdersPerWeek:'2',takeawaySwapPerWeek:'1',takeawayReplacementCost:'10',restaurantOrder:'',restaurantOrdersPerWeek:'',restaurantSwapPerWeek:'0'}});
 assert.equal(takeawayMath(onlyTakeaway).weeklyCost,null);assert.equal(takeawayMath(onlyTakeaway).weeklySaving,15);
});
check('a restaurant home meal costing more cannot inflate combined savings',()=>{
 const r=validateRefinements({details:{takeawayMealMode:'both',takeawayOrder:'25',takeawayOrdersPerWeek:'2',takeawaySwapPerWeek:'1',takeawayReplacementCost:'10',restaurantOrder:'90',restaurantOrdersPerWeek:'1',restaurantSwapPerWeek:'1',restaurantReplacementCost:'130'}});
 assert.equal(takeawayMath(r).weeklySaving,null);
 assert.throws(()=>validateRefinements({details:{takeawayMealMode:'both',restaurantOrdersPerWeek:'1',restaurantSwapPerWeek:'2'}}),/replace more restaurant meals/);
});
check('old combined meal drafts remain valid and new separate values survive revision',()=>{
 const d=blankDraft(high);
 d.details.takeawayMealMode='both';d.details.takeawayOrder='25';d.details.takeawayOrdersPerWeek='2';d.details.takeawaySwapPerWeek='1';d.details.takeawayReplacementCost='10';d.details.restaurantOrder='90';d.details.restaurantOrdersPerWeek='4';d.details.restaurantSwapPerWeek='1';d.details.restaurantReplacementCost='20';
 const a=prepareDraft(d);assert.equal(a.details.restaurantOrder,90);assert.equal(a.details.takeawayMealMode,'both');
 const restored=restoreDraft(high,a);assert.equal(prepareDraft(restored).details.restaurantOrder,90);
 const old=validateRefinements({details:{takeawayOrder:'30',takeawayOrdersPerWeek:'4',takeawaySwapPerWeek:'2',takeawayReplacementCost:'10'}});
 assert.equal(old.details.takeawayMealMode,'combined');assert.equal(takeawayMath(old).weeklySaving,40);
 assert.equal(prepareDraft(restoreDraft(high,old)).details.takeawayMealMode,'combined');
});
check('free audit frequency checks combined weekly takeaway and restaurant visits',()=>{
 const d=blankDraft(high);d.answers[0]='1–2 times/week';d.details.takeawayMealMode='both';d.details.takeawayOrdersPerWeek='2';d.details.restaurantOrdersPerWeek='3';
 assert.equal(findAuditConflict(d)?.area,'takeaway');
 const okay=blankDraft(high);okay.details.takeawayMealMode='both';okay.details.takeawayOrdersPerWeek='2';okay.details.restaurantOrdersPerWeek='3';assert.equal(findAuditConflict(okay),null);
 const missing=blankDraft(high);missing.details.takeawayMealMode='both';missing.details.takeawayOrdersPerWeek='2';assert.equal(findAuditConflict(missing),null);
});
check('free results offer three main actions and relevant worked examples',()=>{
 const results=fs.readFileSync('app/results/page.tsx','utf8');
 assert.match(results,/firstChecks\[area\]/);assert.match(results,/previewExamples\[areas\[0\]\]/);
 assert.match(results,/EXAMPLE ONLY — NOT YOUR ESTIMATE/);
 assert.match(results,/Possible \$200 first-year price difference/);
 assert.match(results,/Possible \$40 less each week/);
 assert.match(results,/In your paid plan: clear steps and useful links/);
 assert.doesNotMatch(results,/What the customer would do:/);
 assert.doesNotMatch(results,/steps:\[/);
 assert.match(results,/areas\.slice\(0,3\)/);assert.match(results,/areas\.slice\(3\)/);
});

check('paid questions use plain, specific wording and treat all figures as estimates',()=>{
 const ui=fs.readFileSync('app/personalise/PersonaliseClient.tsx','utf8');
 for(const phrase of [
  'About how much do you usually pay for one takeaway order?',
  'Count the whole order',
  'About how much do you usually pay when you eat out?',
  'Count the whole bill for everyone you pay for',
  'About how many takeaway orders do you buy in a week?',
  'How many times could you eat at home instead each week?',
  'About how much do you pay for all your subscriptions each month?',
  'Do you still pay for any subscriptions you don\'t use?',
  'About how much do you spend on coffee, snacks and small treats each week?',
  'About how much do you pay for your mobile each month?',
  'About how much was your last power bill?',
  'How often do you pay for this insurance?',
  'What does your insurance cover? (optional)',
  'What do you often buy without planning to?',
 ]) assert.ok(ui.includes(phrase),'Missing clear customer question: '+phrase);
 assert.ok(ui.includes('A rough guess is fine.'));
 assert.match(ui,/count=\(key:string,label:string,hint=''/);
});

check('occasional takeaway buyers can give a truthful answer',()=>{
 const optional='Less than once a week';
 assert.ok(auditQuestions[0].options.includes(optional));
 const answers=[optional,'0–2','Within 6 months','Rarely','Within 6 months','Within 6 months','Rarely','Save more money'];
 assert.deepEqual(validateAuditAnswers(answers),answers);
 assert.equal(selectPersonalisationAreas(answers).includes('takeaway'),false);
 const d=blankDraft(answers);d.additionalArea='takeaway';d.details.takeawayMealMode='takeaway';d.details.takeawayOrdersPerWeek='0';
 assert.equal(findAuditConflict(d),null);
});
check('new bill amounts require a confirmed payment period',()=>{
 const draft=blankDraft(high);
 assert.equal(draft.details.electricityPeriod,'');
 assert.equal(draft.details.gasPeriod,'');
 assert.equal(draft.insurancePolicies[0].paymentPeriod,'');
 draft.details.electricityBill='400';
 assert.throws(()=>prepareDraft(draft),/power bill covers/);
 draft.details.electricityPeriod='quarter';
 draft.details.hasGas='yes';
 draft.details.gasMonthly='100';
 assert.throws(()=>prepareDraft(draft),/gas bill/);
 draft.details.gasPeriod='month';
 draft.insurancePolicies=[{type:'Car',premium:'120',paymentPeriod:'',insurer:'',coverDescription:'',renewal:''}];
 assert.throws(()=>prepareDraft(draft),/insurance policy/);
 draft.insurancePolicies[0].paymentPeriod='month';
 const refined=prepareDraft(draft);
 const analysed=analyseSavings(high,refined);
 assert.equal(analysed.opportunities.find(op=>op.area==='energy').annualSpend,2800);
 assert.equal(analysed.opportunities.find(op=>op.area==='insurance').annualSpend,1440);
 const older=restoreDraft(high,{details:{electricityBill:100,electricityPeriod:'quarter',gasMonthly:75,gasPeriod:'month'},insurancePolicies:[{type:'Car',premium:120,paymentPeriod:'year'}]});
 assert.equal(older.details.electricityPeriod,'quarter');
 assert.equal(older.details.gasPeriod,'month');
 assert.equal(older.insurancePolicies[0].paymentPeriod,'year');
});
check('small-buy overlap must be explicitly checked',()=>{
 const ui=fs.readFileSync('app/personalise/PersonaliseClient.tsx','utf8');
 assert.match(ui,/choice\('convenienceOverlap'/);
 assert.doesNotMatch(ui,/convenienceOverlap:'no'/);
 const unknown=validateRefinements({details:{...meal.details,convenienceWeekly:100,convenienceGoalWeekly:70,convenienceOverlap:''}});
 const op=analyseSavings(high,unknown).opportunities.find(x=>x.area==='convenience');
 assert.equal(op.scenarioSaving,null);
 assert.match(op.assumption,/may include takeaway/i);
 const verified=validateRefinements({details:{...meal.details,convenienceWeekly:100,convenienceGoalWeekly:70,convenienceOverlap:'no'}});
 assert.equal(analyseSavings(high,verified).opportunities.find(x=>x.area==='convenience').scenarioSaving,1560);
});
check('tracker only subtracts costs from a matching period',()=>{
 const tracker=fs.readFileSync('app/report/[id]/SavingsTracker.tsx','utf8');
 assert.match(tracker,/Extra costs for that same week, month or year/);
 assert.match(tracker,/For a one-off switching fee, choose Year/);
 assert.equal(checkedDifference(1200,900,50),250);
});

console.log('Phase 1 package: '+cases+' test groups passed.');
