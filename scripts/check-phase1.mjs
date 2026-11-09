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
check('subscription cross-field limits',()=>{assert.throws(()=>validateRefinements({details:{subscriptionsMonthly:'70',unusedSubscriptionChoice:'yes',unusedSubscriptionMonthly:'75'}}));assert.throws(()=>validateRefinements({details:{unusedSubscriptionChoice:'no',unusedSubscriptionMonthly:'10'}}));assert.throws(()=>validateRefinements({details:{subscriptionsMonthly:'-1'}}));});
const meal=validateRefinements({details:{takeawayOrder:'120',takeawayAmountPeriod:'order',takeawayOrdersPerWeek:'7',takeawaySwapPerWeek:'3',takeawayReplacementCost:'40'}});
check('net meal maths uses the same group and replacement costs',()=>{const m=takeawayMath(meal);assert.equal(m.weeklyCost,840);assert.equal(m.weeklySaving,240);assert.equal(m.annualExample,12480);});
check('weekly amount is never read as one order',()=>{const r=validateRefinements({details:{takeawayOrder:'120',takeawayAmountPeriod:'week',takeawayOrdersPerWeek:'6',takeawaySwapPerWeek:'2',takeawayReplacementCost:'10'}});assert.deepEqual(takeawayMath(r),{orderCost:20,weeklyCost:120,weeklySaving:20,annualExample:1040});});
check('unknown replacement, zero swaps, higher cost give no saving',()=>{for(const patch of [{takeawayReplacementCost:''},{takeawaySwapPerWeek:'0'},{takeawayReplacementCost:'130'}]){const r=validateRefinements({details:{takeawayOrder:'120',takeawayOrdersPerWeek:'7',takeawaySwapPerWeek:'3',takeawayReplacementCost:'40',...patch}});assert.equal(takeawayMath(r).weeklySaving,null);}});
check('reject impossible weekly targets',()=>{assert.throws(()=>validateRefinements({details:{takeawayOrdersPerWeek:'3',takeawaySwapPerWeek:'4'}}));assert.throws(()=>validateRefinements({details:{takeawayOrdersPerWeek:'2.5'}}));assert.throws(()=>validateRefinements({details:{takeawayOrdersPerWeek:'22'}}));assert.throws(()=>validateRefinements({details:{convenienceWeekly:'50',convenienceGoalWeekly:'60'}}));});
check('overlapping small buys are not added',()=>{for(const overlap of ['','yes','not_sure']){const r=validateRefinements({details:{...meal.details,convenienceWeekly:100,convenienceGoalWeekly:70,convenienceOverlap:overlap}});const a=analyseSavings(high,r);assert.equal(a.opportunities.find(o=>o.area==='convenience').scenarioSaving,null);assert.equal(a.estimatedAnnualScenario,12480);}});
check('separate known weekly goals can be calculated',()=>{const r=validateRefinements({details:{...meal.details,convenienceWeekly:100,convenienceGoalWeekly:70,convenienceOverlap:'no'}});const a=analyseSavings(high,r);assert.equal(a.opportunities.find(o=>o.area==='convenience').scenarioSaving,1560);assert.equal(a.opportunities.find(o=>o.area==='unplanned').scenarioSaving,null);});
check('raw drafts save incomplete amounts but finalisation validates',()=>{const d=blankDraft(high);d.details.takeawayOrdersPerWeek='2.5';d.step=2;assert.equal(cleanDraft(d).step,2);assert.throws(()=>prepareDraft(d));assert.throws(()=>cleanDraft({...d,step:999}));assert.throws(()=>cleanDraft({...d,details:{takeawayOrder:'x'.repeat(200)}}));});
check('changing original answers masks stale areas',()=>{const d=blankDraft(high);d.details.takeawayOrder='120';d.answers[0]='Never';const r=prepareDraft(d);assert.equal(r.details.takeawayOrder,null);assert.equal(analyseSavings(d.answers,r).opportunities.some(o=>o.area==='takeaway'),false);});
check('adaptive fields discard hidden values',()=>{const d=blankDraft(high);d.details.hasGas='no';d.details.gasMonthly='99';d.details.phoneService='mobile';d.details.internetMonthly='100';d.details.mobileMonthly='25';d.details.unusedSubscriptionChoice='no';d.details.unusedSubscriptionMonthly='10';const r=prepareDraft(d);assert.equal(r.details.gasMonthly,null);assert.equal(r.details.internetMonthly,null);assert.equal(r.details.mobileMonthly,25);assert.equal(r.details.unusedSubscriptionMonthly,null);});
check('draft restoration covers new and old purchases',()=>{const d=blankDraft(high);d.details.takeawayOrder='120';d.step=4;assert.deepEqual(restoreDraft(high,{version:1,draft:d}),d);const restored=restoreDraft(sample,{version:1,details:{subscriptionsMonthly:70,unusedSubscriptionMonthly:15}});assert.equal(restored.details.unusedSubscriptionChoice,'yes');assert.equal(restored.details.unusedSubscriptionMonthly,'15');});
check('all seven report areas remain in plain-text output',()=>{const a=analyseSavings(high,validateRefinements({details:meal.details,insurancePolicies:policies}));const text=makeReportMarkdown(high,validateRefinements({details:meal.details,insurancePolicies:policies}),a);for(const op of a.opportunities)assert.ok(text.includes(op.title));assert.match(text,/not money saved yet|not checked live prices|do not count bills as money saved/i);});
check('checked results subtract fees and preserve losses',()=>{assert.equal(checkedDifference(100,70,5),25);assert.equal(checkedDifference(70,100,5),-35);assert.equal(checkedDifference(0,0,0),0);assert.throws(()=>checkedDifference(10,Infinity,0));assert.throws(()=>checkedDifference(10,-1,0));});
check('quote comparison is first-year only',()=>{assert.equal(quoteDifference(1200,80,'month',20),220);assert.equal(quoteDifference(1200,1300,'year',0),-100);});
check('analytics excludes access IDs, URLs and private fields',()=>{assert.deepEqual(safeEventParams({session_id:'cs_test_secret',report_id:'rpt_secret',transaction_id:'cs_test_secret',page_location:'https://x/report/rpt_secret',email:'x@example.com',answers:high,currency:'AUD',value:39}),{currency:'AUD'});for(const p of ['/audit','/results','/success','/personalise','/report/rpt_private','/plan-preview'])assert.equal(isMarketingPath(p),false);assert.equal(isMarketingPath('/pricing'),true);});
check('private layout does not load measurement scripts',()=>{const layout=fs.readFileSync('app/layout.tsx','utf8');assert.doesNotMatch(layout,/googletagmanager\.com|connect\.facebook|clarity\.ms\/tag|ttq\.load/);const csp=fs.readFileSync('next.config.ts','utf8');assert.match(csp,/connect-src 'self'/);assert.match(csp,/plan-preview/);assert.match(fs.readFileSync('components/PublicAnalytics.tsx','utf8'),/isMarketingPath/);});
check('checkout validates before calling Stripe and does not leak provider errors',()=>{const route=fs.readFileSync('app/api/checkout/route.ts','utf8');assert.ok(route.indexOf('validateAuditAnswers(data.answers)')<route.indexOf('.checkout.sessions.create'));assert.match(route,/acceptedTerms/);assert.match(route,/idempotencyKey/);assert.doesNotMatch(route,/error: e\.message/);});
check('checkout pause does not block existing paid access',()=>{assert.doesNotMatch(fs.readFileSync('lib/paid-orders.ts','utf8'),/SPENDSHIFT_ALLOW_PREVIEW_PAYMENTS/);});
check('recovery leaves unpaid and unfinished drafts untouched',()=>{const cron=fs.readFileSync('app/api/cron/recover-paid-reports/route.ts','utf8');assert.match(cron,/refinements->>completed/);assert.match(cron,/completed===true/);assert.match(fs.readFileSync('lib/report-fulfillment.ts','utf8'),/Please finish or skip the questions/);});
check('optimistic draft writes cannot silently overwrite another tab',()=>{const api=fs.readFileSync('app/api/personalisation/draft/route.ts','utf8');assert.match(api,/body\.revision!==order\.updated_at/);assert.match(api,/\.eq\('updated_at',body\.revision\)/);assert.match(api,/409/);});
check('marketing reflects implemented product',()=>{for(const file of ['app/homePageClient.tsx','app/pricing/page.tsx','app/whats-included/page.tsx','app/how-it-works/page.tsx','components/SavingsOffer.tsx'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/3,050|1,300|30-day action plan|AI Powered|AI-powered/);assert.match(fs.readFileSync('components/SavingsOffer.tsx','utf8'),/A\$39/);});
console.log('Phase 1 package: '+cases+' test groups passed.');
