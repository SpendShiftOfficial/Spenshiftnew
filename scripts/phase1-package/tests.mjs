import {read,write} from './io.mjs';
export default function tests(){
const old=read('scripts/check-phase1.mjs');const at=old.indexOf('const { selectPersonalisationAreas');if(at<0)throw new Error('Unit test loader boundary missing');
write('scripts/check-phase1.mjs',old.slice(0,at)+String.raw`
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
`);
write('scripts/check-phase1-browser.mjs',String.raw`import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const base='http://127.0.0.1:3000';
const server=spawn('npm',['run','start','--','--hostname','127.0.0.1'],{stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'3000'}});
let logs='';for(const stream of [server.stdout,server.stderr])stream.on('data',x=>{logs+=x.toString();if(logs.length>120000)logs=logs.slice(-120000);});
fs.mkdirSync('test-artifacts',{recursive:true});
const high=['Almost daily','10+','Never / not sure','Daily',"I honestly don't know","I honestly don't know",'Almost daily','Lower my bills'];
const getAnswers=()=>high.slice();
let tests=0;let browser;
async function test(name,fn){await fn();tests++;console.log('PASS '+name);}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Page overflows the viewport');}
async function go(page,url){await page.goto(base+url,{waitUntil:'networkidle'});}
async function next(page){await page.getByRole('button',{name:'Next',exact:true}).click();await page.waitForTimeout(180);}
try{
 for(let i=0;i<90;i++){try{const r=await fetch(base+'/');if(r.ok)break;}catch{}if(i===89)throw new Error('Local app did not start: '+logs.slice(-3000));await new Promise(r=>setTimeout(r,1000));}
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1280,height:900},{width:375,height:812}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
  await test('truthful public pages '+viewport.width,async()=>{
   for(const route of ['/','/pricing','/whats-included','/how-it-works']){await go(page,route);const text=await page.locator('body').innerText();assert.ok(!/3,050|30-day action plan|AI Powered/.test(text));await noOverflow(page);}
  });
  await test('free eight-question journey '+viewport.width,async()=>{
   await go(page,'/audit');
   for(let i=0;i<high.length;i++){await page.getByRole('button',{name:high[i],exact:true}).click();await page.getByRole('button',{name:i===7?'See my free results':'Next question',exact:true}).click();}
   await page.waitForURL('**/results');assert.match(await page.locator('body').innerText(),/7 places to check/);await noOverflow(page);
   await page.screenshot({path:'test-artifacts/free-results-'+viewport.width+'.png',fullPage:true});
  });
  await test('checkout rejects bad input without creating a payment '+viewport.width,async()=>{
   for(const body of [{answers:[]},{answers:high,acceptedTerms:false,termsVersion:'2026-11-phase1',checkoutRequestId:'11111111-1111-4111-8111-111111111111'}]){const response=await page.request.post(base+'/api/checkout',{data:body});assert.equal(response.status(),400);}
   const paused=await page.request.post(base+'/api/checkout',{data:{answers:high,acceptedTerms:true,termsVersion:'2026-11-phase1',checkoutRequestId:'11111111-1111-4111-8111-111111111111'}});assert.equal(paused.status(),403);
  });
  await test('guided all-seven questionnaire and report '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('all-seven');
   for(let step=0;step<7;step++){
    const heading=await page.locator('section h2').innerText();
    if(heading==='Takeaway food'){await page.locator('#takeawayOrder').fill('120');await page.locator('#takeawayAmountPeriod').selectOption('week');await page.locator('#takeawayOrdersPerWeek').fill('6');await page.locator('#takeawaySwapPerWeek').fill('2');await page.locator('#takeawayReplacementCost').fill('10');}
    if(heading==='Subscriptions'){await page.locator('#subscriptionsMonthly').fill('70');await page.locator('#unusedSubscriptionChoice').selectOption('no');assert.equal(await page.locator('#unusedSubscriptionMonthly').count(),0);}
    if(heading==='Small everyday buys'){await page.locator('#convenienceWeekly').fill('100');await page.locator('#convenienceOverlap').selectOption('no');await page.locator('#convenienceGoalWeekly').fill('70');}
    if(heading==='Insurance'){await page.locator('#policy-type-0').selectOption('Car');await page.locator('#policy-cost-0').fill('1800');await page.locator('#policy-renewal-0').selectOption('soon');}
    if(heading==='Phone and internet'){await page.locator('#phoneService').selectOption('mobile');await page.locator('#mobileMonthly').fill('55');assert.equal(await page.locator('#internetMonthly').count(),0);}
    if(heading==='Power and gas'){await page.locator('#state').selectOption('NSW');await page.locator('#electricityBill').fill('520');await page.locator('#hasGas').selectOption('no');assert.equal(await page.locator('#gasMonthly').count(),0);}
    if(heading==='Unplanned shopping'){await page.locator('#unplannedArea').selectOption('Online shopping');await page.locator('#shoppingTrigger').selectOption('Social media');}
    await noOverflow(page);await next(page);
   }
   await page.getByRole('button',{name:'Make my plan',exact:true}).click();await page.waitForURL('**/plan-preview');
   await page.waitForSelector('h1');const body=await page.locator('body').innerText();assert.match(body,/7 areas to check/);assert.match(body,/Your goal is to lower your bills/);
   const first=await page.locator('article h2').first().innerText();assert.equal(first,'Insurance');
   const subs=page.locator('#area-subscriptions');if(!await subs.isVisible())await page.locator('details').filter({has:subs}).locator('summary').first().click();assert.match(await subs.innerText(),/Keep the services you use/);
   const takeaway=page.locator('#area-takeaway');if(!await takeaway.isVisible())await page.locator('details').filter({has:takeaway}).locator('summary').first().click();assert.match(await takeaway.innerText(),/\$120\s*\/ week/);assert.match(await takeaway.innerText(),/\$20 less a week/);
   await noOverflow(page);await page.screenshot({path:'test-artifacts/seven-area-plan-'+viewport.width+'.png',fullPage:true});
  });
  await test('checked savings are retained and not forecast totals '+viewport.width,async()=>{
   await page.getByText('Add or update a checked result',{exact:true}).click();const form=page.locator('form').last();
   await form.locator('select').first().selectOption('subscriptions');await form.getByLabel('What you paid before ($)',{exact:true}).fill('70');await form.getByLabel('What you paid after ($)',{exact:true}).fill('50');await form.getByLabel('Extra costs or fees not already included ($)',{exact:true}).fill('5');await form.locator('input[type=date]').fill('2026-11-01');await form.locator('input[type=checkbox]').check();await form.getByRole('button',{name:'Save checked result'}).click();
   assert.match(await page.locator('body').innerText(),/reported \$15 less/);await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(300);assert.match(await page.locator('body').innerText(),/reported \$15 less/);
  });
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:375,height:812}});const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
 const privateRequests=[];context.on('request',request=>{if(/google-analytics|googletagmanager|clarity\.ms|connect\.facebook|analytics\.tiktok/.test(request.url()))privateRequests.push(request.url());});
 await context.addInitScript(()=>localStorage.setItem('spendshift_cookie_consent','granted'));
 await test('private pages stay tracker-free even with consent',async()=>{for(const route of ['/audit','/results','/personalise','/report-preview?customer=all-seven']){const response=await page.goto(base+route,{waitUntil:'networkidle'});const headers=response.headers();assert.match(headers['content-security-policy']||'',/connect-src 'self'/);await page.waitForTimeout(150);}assert.deepEqual(privateRequests,[]);});
 let revision='2026-11-09T10:00:00.000Z';let saved=null;let calls=0;
 const session='cs_test_automated_private_fixture12345';
 await page.route('**/api/payment-status?**',route=>route.fulfill({json:{paid:true,answers:saved?.answers||getAnswers(),status:'awaiting_details',reportId:null,refinements:saved?{version:1,draft:saved}:null,revision}}));
 await page.route('**/api/personalisation/draft',async route=>{const body=route.request().postDataJSON();if(body.revision!==revision){await route.fulfill({status:409,json:{error:'This plan changed in another tab. Reload before editing.'}});return;}saved=body.draft;calls++;revision=new Date(Date.UTC(2026,10,9,10,0,calls)).toISOString();await route.fulfill({json:{saved:true,revision}});});
 await test('paid drafts save, reload and edit safely using mocked providers',async()=>{
  await go(page,'/success?session_id='+session);await page.waitForURL('**/personalise?**');await page.locator('#takeawayOrder').fill('120');
  await page.waitForTimeout(1300);await page.getByRole('status').filter({hasText:'Saved.'}).waitFor();assert.equal(saved.details.takeawayOrder,'120');
  await page.reload({waitUntil:'networkidle'});await page.waitForSelector('#takeawayOrder');assert.equal(await page.locator('#takeawayOrder').inputValue(),'120');
  await page.getByText('Check or change my first answers',{exact:true}).click();await page.locator('#audit-edit-0').selectOption('Never');await page.waitForTimeout(1300);assert.equal(saved.answers[0],'Never');assert.match(await page.locator('h1').innerText(),/Make your plan/);
 });
 await test('revision conflicts show a clear error',async()=>{revision='2026-11-10T10:00:00.000Z';await page.locator('#audit-edit-7').selectOption('Reduce stress');await page.waitForTimeout(1300);assert.match(await page.locator('p[role="alert"]').innerText(),/another tab/);});
 await context.close();
 console.log('Browser checks: '+tests+' groups passed. Provider payment/draft replies were mocked; no real Stripe payment or email was sent.');
 fs.writeFileSync('test-artifacts/browser-summary.json',JSON.stringify({groupsPassed:tests,desktopWidth:1280,mobileWidth:375,providerMode:'mocked',realStripePaymentTested:false,emailDeliveryTested:false},null,2));
}catch(error){fs.writeFileSync('test-artifacts/server-log.txt',logs);console.error(error);process.exitCode=1;}finally{await browser?.close().catch(()=>{});server.kill('SIGTERM');process.exit(process.exitCode || 0);}
`);
}
