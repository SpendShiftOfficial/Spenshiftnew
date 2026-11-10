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
check('weekly amount is never read as one order',()=>{const r=validateRefinements({details:{takeawayOrder:'120',takeawayAmountPeriod:'week',takeawayOrdersPerWeek:'6',takeawaySwapPerWeek:'2',takeawayReplacementCost:'10'}});assert.deepEqual(takeawayMath(r),{orderCost:20,weeklyCost:120,weeklySaving:20,annualExample:1040});});
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
 const weeklyText=makeReportMarkdown(a,weekly,analyseSavings(a,weekly));assert.match(weeklyText,/Your usual takeaway spending: \$120 for a whole week/);
 assert.doesNotMatch(weeklyText,/Your usual takeaway order: \$120/);
 const order=validateRefinements({details:{takeawayAmountPeriod:'order',takeawayOrder:'30',takeawayOrdersPerWeek:'6'}});
 const orderText=makeReportMarkdown(a,order,analyseSavings(a,order));assert.match(orderText,/Your usual takeaway spending: \$30 for one order/);
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
  assert.match(report,/gasMonthly\*12/);
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
  assert.match(results,/See an example of what your plan looks like/);
  assert.match(results,/areas\.slice\(3\)/);
});

check('mobile input and private layout fixes have appropriate CSS specificity',()=>{
 const form=fs.readFileSync('app/personalise/personalise.module.css','utf8');
 const report=fs.readFileSync('app/report/[id]/simple-report.module.css','utf8');
 const header=fs.readFileSync('components/Header.tsx','utf8');
 const styles=fs.readFileSync('app/globals.css','utf8');
 assert.match(form,/\.field \.moneyInput input\\s*\\{\\s*padding-left: 48px/);
 assert.match(form,/\.optionalDetails \\+ \.progressTop/);
 assert.match(report,/\.lastCard > \.helpDetails \\+ \.checkNote/);
 assert.doesNotMatch(report,/margin: -7px 0 18px/);
 assert.match(header,/simple \\? "logo" : "logo reveal-left"/);
 assert.match(styles,/\.topbar\\.topbar-simple/);
});

console.log('Phase 1 package: '+cases+' test groups passed.');
