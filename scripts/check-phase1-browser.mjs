import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire(process.env.PLAYWRIGHT_INSTALL_PATH||process.cwd()+'/package.json')('playwright');
const base='http://127.0.0.1:3000';
const server=spawn('npm',['run','start','--','--hostname','127.0.0.1'],{stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'3000'}});
let logs='';for(const stream of [server.stdout,server.stderr])stream.on('data',x=>{logs+=x.toString();if(logs.length>120000)logs=logs.slice(-120000);});
fs.mkdirSync('test-artifacts',{recursive:true});
const high=['Almost daily','10+','Never','Daily',"I honestly don't know","I honestly don't know",'Almost daily','Lower my bills'];
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
   const example=page.getByLabel('Example of a possible savings action');assert.match(await example.innerText(),/EXAMPLE ONLY — NOT YOUR ESTIMATE/);assert.doesNotMatch(await example.innerText(),/\$40 less each week/);await page.screenshot({path:'test-artifacts/free-results-'+viewport.width+'.png',fullPage:true});
  });
  await test('checkout rejects bad input without creating a payment '+viewport.width,async()=>{
   for(const body of [{answers:[]},{answers:high,acceptedTerms:false,termsVersion:'2026-11-phase1',checkoutRequestId:'11111111-1111-4111-8111-111111111111'}]){const response=await page.request.post(base+'/api/checkout',{data:body});assert.equal(response.status(),400);}
   const paused=await page.request.post(base+'/api/checkout',{data:{answers:high,acceptedTerms:true,termsVersion:'2026-11-phase1',checkoutRequestId:'11111111-1111-4111-8111-111111111111'}});assert.equal(paused.status(),403);
  });
  await test('mobile money fields, progress spacing and visible logo '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('all-seven');
   const logo=page.locator('header.topbar .logo');
   await logo.waitFor({state:'visible'});
   const opacity=await logo.evaluate(node=>Number(getComputedStyle(node).opacity));
   assert.ok(opacity>=0.99,'The SpendShift logo must not be hidden by entrance animations');
   const hint=page.getByText('No bank login needed',{exact:true});
   const logoRect=await logo.boundingBox(),hintRect=await hint.boundingBox();
   assert.ok(logoRect&&hintRect&&logoRect.x+logoRect.width+6<hintRect.x,'Logo and privacy hint must not overlap');
   assert.equal(await page.getByText('Check or change my first answers',{exact:true}).count(),0);
   const previous=page.getByRole('button',{name:'Previous question',exact:true});
   assert.equal(await previous.count(),1);
   const heading=await page.getByRole('heading',{name:'Make your plan fit you.'}).boundingBox();
   const progress=await page.getByText('Area 1 of 7',{exact:true}).boundingBox();
   assert.ok(heading&&progress&&progress.y>heading.y+heading.height,'Progress must sit below the introduction');
   async function assertCurrencySpacing(selector){
    const metrics=await page.locator(selector).evaluate(input=>{
     const icon=input.previousElementSibling;
     const left=input.getBoundingClientRect().left;
     return {paddingLeft:parseFloat(getComputedStyle(input).paddingLeft),prefixGap:left+parseFloat(getComputedStyle(input).paddingLeft)-icon.getBoundingClientRect().right};
    });
    assert.ok(metrics.paddingLeft>=44 && metrics.prefixGap>=12,selector+' must not overlap its dollar prefix');
   }
   await assertCurrencySpacing('#takeawayOrder');
   await page.locator('#takeawayOrder').fill('32.50');
   await assertCurrencySpacing('#takeawayOrder');
   await next(page);
   await page.locator('#subscriptionsMonthly').waitFor();
   await assertCurrencySpacing('#subscriptionsMonthly');
   await noOverflow(page);
  });
  await test('savings tracker help has breathing room '+viewport.width,async()=>{
   await go(page,'/report-preview?customer=all-seven');
   const details=page.locator('details').filter({has:page.getByText("I've made a change — compare my costs",{exact:true})}).first();
   assert.equal(await details.getAttribute('open'),null);
   assert.match(await page.locator('body').innerText(),/This is for later/);
   assert.match(await page.locator('body').innerText(),/Nothing recorded yet/);
   assert.match(await page.locator('body').innerText(),/If you cancel a \$20-a-month subscription/);
   const note=page.getByText(/saved only in this browser, not on other devices/i);
   const a=await details.boundingBox(),b=await note.boundingBox();
   assert.ok(a&&b&&b.y-(a.y+a.height)>=14,'Saved results note must sit below its button without overlap');
   await noOverflow(page);
  });
  await test('multiple unused subscriptions reach the same complete report '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('subscriptions-insurance');
   assert.equal(await page.locator('section h2').first().innerText(),'Subscriptions');
   await page.locator('#subscriptionsMonthly').fill('80');
   await page.locator('#unusedSubscriptionChoice').selectOption('yes');
   await page.locator('#unusedSubscriptionName').fill('Stan');
   await page.locator('#unusedSubscriptionMonthly').fill('20');
   await page.getByRole('button',{name:'Add another unused subscription'}).click();
   await page.locator('#unused-name-0').fill('Netflix');
   await page.locator('#unused-monthly-0').fill('15');
   await next(page);await next(page);
   const review=await page.locator('body').innerText();
   assert.match(review,/Stan/);assert.match(review,/Netflix/);
   await page.getByRole('button',{name:'Make my plan',exact:true}).click();
   await page.waitForURL('**/plan-preview');
   const subscriptions=page.locator('#area-subscriptions');
   if(!await subscriptions.isVisible())await page.locator('details').filter({has:subscriptions}).locator('summary').first().click();
   const result=await subscriptions.innerText();
   assert.match(result,/Possible yearly saving: \$420/);
   assert.match(result,/Stan/);assert.match(result,/Netflix/);
   assert.match(result,/haven't saved this money yet/);
   await noOverflow(page);
  });
  await test('unused subscriptions disappear when the customer says all are used '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('subscriptions-insurance');
   await page.locator('#unusedSubscriptionChoice').selectOption('yes');
   await page.locator('#unusedSubscriptionName').fill('Stan');
   await page.locator('#unusedSubscriptionMonthly').fill('20');
   await page.getByRole('button',{name:'Add another unused subscription'}).click();
   await page.locator('#unused-name-0').fill('Netflix');
   await page.locator('#unused-monthly-0').fill('15');
   await page.locator('#unusedSubscriptionChoice').selectOption('no');
   assert.equal(await page.locator('#unused-name-0').count(),0);
   await page.locator('#unusedSubscriptionChoice').selectOption('yes');
   assert.equal(await page.locator('#unusedSubscriptionName').inputValue(),'');
   assert.equal(await page.locator('#unusedSubscriptionMonthly').inputValue(),'');
   assert.equal(await page.locator('#unused-name-0').count(),0);
   await noOverflow(page);
  });
  await test('takeaway wording supports skipping unknown home meal cost '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('takeaway-convenience');
   assert.match(await page.locator('section').first().innerText(),/About how much do you spend on one takeaway or eating-out meal/);
   assert.equal(await page.locator('#takeawayAmountPeriod').count(),0);
   await page.locator('#takeawayOrder').fill('22');await page.getByRole('button',{name:'I only know my weekly total'}).click();assert.equal(await page.locator('#takeawayOrder').inputValue(),'');await page.getByRole('button',{name:'Use the cost of one meal instead'}).click();assert.equal(await page.locator('#takeawayOrder').inputValue(),'');
   await page.locator('#takeawayOrder').fill('30');
   await page.locator('#takeawayOrdersPerWeek').fill('4');
   await page.locator('#takeawaySwapPerWeek').fill('1');
   assert.match(await page.locator('section').first().innerText(),/If you made one of those meals at home/);
   assert.match(await page.locator('section').first().innerText(),/Without it, we won't guess a saving/);
   assert.equal(await page.locator('#takeawayReplacementCost').inputValue(),'');
   await next(page);await next(page);
   assert.match(await page.locator('body').innerText(),/You can leave it blank/);
   await page.getByRole('button',{name:'Make my plan',exact:true}).click();
   await page.waitForURL('**/plan-preview');
   const takeaway=page.locator('#area-takeaway');
   if(!await takeaway.isVisible())await page.locator('details').filter({has:takeaway}).locator('summary').first().click();
   const report=await takeaway.innerText();
   assert.match(report,/Check both costs for the same people before counting a saving/);
   assert.doesNotMatch(report,/Your goal:.*less a week/);
   await noOverflow(page);
  });
  await test('insurance renewal and optional cover details have clear meanings '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('subscriptions-insurance');
   await next(page);
   const screen=page.locator('section').first();
   assert.match(await screen.innerText(),/When is this policy due for renewal/);
   assert.match(await screen.innerText(),/It is different from how often you pay/);
   await page.getByText('Add insurer and cover details (optional)',{exact:true}).click();
   const cover=page.getByPlaceholder('e.g. comprehensive car cover');
   await cover.waitFor({state:'visible'});
   assert.match(await screen.innerText(),/The insurance type above is the category/);
   const dimensions=await cover.evaluate(el=>({field:el.getBoundingClientRect().width,parent:el.parentElement.getBoundingClientRect().width}));
   assert.ok(dimensions.field>=dimensions.parent-3,'Optional cover input should fill its field');
   await noOverflow(page);
  });
  await test('previous question opens one free answer without showing a large accordion '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('all-seven');
   assert.equal(await page.getByText('Check or change my first answers',{exact:true}).count(),0);
   await page.getByRole('button',{name:'Previous question',exact:true}).click();
   assert.match(await page.locator('h1').innerText(),/What would help you most/);
   await page.getByRole('button',{name:'Previous question',exact:true}).click();
   assert.match(await page.locator('h1').innerText(),/didn't plan to buy/);
   await page.getByRole('button',{name:'Next question',exact:true}).click();
   await page.getByRole('button',{name:'Back to my plan',exact:true}).click();
   assert.match(await page.locator('h1').innerText(),/Make your plan fit you/);
   await noOverflow(page);
  });
  await test('guided all-seven questionnaire and report '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('all-seven');
   for(let step=0;step<7;step++){
    const heading=await page.locator('section h2').innerText();
    if(heading==='Takeaway and eating out'){assert.equal(await page.locator('#takeawayAmountPeriod').count(),0);await page.getByRole('button',{name:'I only know my weekly total'}).click();await page.locator('#takeawayOrder').fill('120');await page.locator('#takeawayOrdersPerWeek').fill('6');await page.locator('#takeawaySwapPerWeek').fill('2');await page.locator('#takeawayReplacementCost').fill('10');}
    if(heading==='Subscriptions'){await page.locator('#subscriptionsMonthly').fill('70');await page.locator('#unusedSubscriptionChoice').selectOption('no');assert.equal(await page.locator('#unusedSubscriptionMonthly').count(),0);}
    if(heading==='Small everyday buys'){await page.locator('#convenienceWeekly').fill('100');assert.equal(await page.locator('#convenienceOverlap').count(),0);assert.match(await page.locator('section').first().innerText(),/Do not include takeaway, restaurant meals or lunch/);await page.locator('#convenienceGoalWeekly').fill('70');}
    if(heading==='Insurance'){assert.match(await page.locator('section').first().innerText(),/Which insurance policies do you pay for/);assert.ok((await page.locator('#policy-period-0').boundingBox()).y < (await page.locator('#policy-cost-0').boundingBox()).y);await page.locator('#policy-type-0').selectOption('Car');await page.locator('#policy-period-0').selectOption('fortnight');await page.locator('#policy-cost-0').fill('70');await page.locator('#policy-renewal-0').selectOption('soon');assert.match(await page.locator('section').first().innerText(),/Combined yearly cost so far: \$1,820/);await page.getByRole('button',{name:'Add another policy'}).click();await page.locator('#policy-type-1').selectOption('CTP / Green Slip');await page.locator('#policy-period-1').selectOption('quarter');assert.match(await page.locator('section').first().innerText(),/covers only the 1 policy with a price/);await page.locator('#policy-cost-1').fill('250');assert.match(await page.locator('section').first().innerText(),/Combined yearly cost so far: \$2,820/);}
    if(heading==='Phone and internet'){await page.locator('input[name=phoneService][value=both]').check();await page.locator('#mobileMonthly').fill('55');await page.locator('#internetMonthly').fill('90');await page.locator('input[name=phoneService][value=not_sure]').check();assert.equal(await page.locator('#mobileMonthly').count(),0);assert.equal(await page.locator('#internetMonthly').count(),0);await page.locator('input[name=phoneService][value=mobile]').check();assert.equal(await page.locator('#mobileMonthly').inputValue(),'');await page.locator('#mobileMonthly').fill('55');assert.equal(await page.locator('#internetMonthly').count(),0);}
    if(heading==='Power and gas'){await page.locator('#state').selectOption('NSW');assert.ok((await page.locator('#electricityPeriod').boundingBox()).y < (await page.locator('#electricityBill').boundingBox()).y);await page.locator('#electricityBill').fill('520');await page.locator('#hasGas').selectOption('yes');assert.ok((await page.locator('#gasPeriod').boundingBox()).y < (await page.locator('#gasMonthly').boundingBox()).y);await page.locator('#gasPeriod').selectOption('quarter');await page.locator('#gasMonthly').fill('300');}
    if(heading==='Unplanned shopping'){await page.locator('#unplannedArea').selectOption('Online shopping');await page.locator('#shoppingTrigger').selectOption('Social media');}
    await noOverflow(page);await next(page);
   }
   await page.getByRole('button',{name:'Make my plan',exact:true}).click();await page.waitForURL('**/plan-preview');
   await page.waitForSelector('h1');const body=await page.locator('body').innerText();assert.match(body,/7 areas to check/);assert.match(body,/Your goal is to lower your bills/);
   const first=await page.locator('article h2').first().innerText();assert.equal(first,'Insurance');
   const subs=page.locator('#area-subscriptions');if(!await subs.isVisible())await page.locator('details').filter({has:subs}).locator('summary').first().click();assert.match(await subs.innerText(),/Keep the services you use/);
   const takeaway=page.locator('#area-takeaway');if(!await takeaway.isVisible())await page.locator('details').filter({has:takeaway}).locator('summary').first().click();assert.match(await takeaway.innerText(),/\$120\s*\/ week/);assert.match(await takeaway.innerText(),/\$20 less a week/);
   const insuranceCard=page.locator('#area-insurance');assert.match(await insuranceCard.innerText(),/\$2,820/);
   const energyCard=page.locator('#area-energy');assert.match(await energyCard.innerText(),/\$300 \/ 3 months/);
   await noOverflow(page);await page.screenshot({path:'test-artifacts/seven-area-plan-'+viewport.width+'.png',fullPage:true});
  });
  await test('checked savings are retained and not forecast totals '+viewport.width,async()=>{
   await page.getByText("I've made a change — compare my costs",{exact:true}).click();const form=page.locator('form').last();
   await form.locator('select').first().selectOption('subscriptions');await form.getByLabel('What you paid before ($)',{exact:true}).fill('70');await form.getByLabel('What you paid after ($)',{exact:true}).fill('50');await form.getByLabel('Extra fees or costs not included above ($)',{exact:true}).fill('5');await form.locator('input[type=date]').fill('2026-11-01');await form.locator('input[type=checkbox]').check();await form.getByRole('button',{name:'Save this result'}).click();
   assert.match(await page.locator('body').innerText(),/recorded \$15 less/);await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(300);assert.match(await page.locator('body').innerText(),/recorded \$15 less/);
  });
  await test('electricity price comparison labels one bill as a rough estimate '+viewport.width,async()=>{
   await go(page,'/report-preview?customer=household-bills');
   const section=page.locator('details').filter({has:page.getByText('Compare a price for your electricity plan',{exact:true})});
   await section.locator('summary').click();
   assert.match(await section.innerText(),/Electricity use changes across seasons/);
   await section.getByLabel('Price from the new quote ($)').fill('1200');
   await section.getByLabel('I compared the same electricity usage, supply charges and fees.').check();
   assert.match(await section.innerText(),/Rough estimate: the new quote could be/);
   await section.getByLabel('I checked this yearly cost against 12 months of electricity bills.').check();
   assert.doesNotMatch(await section.innerText(),/Rough estimate: the new quote could be/);
  });
  await test('no-opportunity paid draft must choose one area before generating '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('few-opportunities');
   assert.match(await page.locator('body').innerText(),/Choose one area to check/);
   assert.equal(await page.getByRole('button',{name:'Make my plan'}).isDisabled(),true);
   await page.locator('#required-area').selectOption('phone');
   await page.locator('input[name=phoneService][value=mobile]').check();
   await page.locator('#mobileMonthly').fill('40');
   await next(page);
   await page.getByRole('button',{name:'Make my plan'}).click();
   await page.waitForURL('**/plan-preview');
   assert.match(await page.locator('h1').last().innerText(),/1 area to check/);
   const tasks=page.locator('section').filter({has:page.getByRole('heading',{name:'Your 3 things to do first'})});
   assert.equal(await tasks.locator('input[type=checkbox]').count(),3);
   await noOverflow(page);
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
  assert.equal(await page.getByText('Check or change my first answers',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Previous question',exact:true}).click();
  assert.match(await page.locator('h1').innerText(),/What would help you most/);
  for(let i=0;i<7;i++)await page.getByRole('button',{name:'Previous question',exact:true}).click();
  assert.match(await page.locator('h1').innerText(),/takeaway or eat out/i);
  await page.getByRole('button',{name:'Never',exact:true}).click();
  await page.waitForTimeout(1300);assert.equal(saved.answers[0],'Never');
  for(let i=0;i<7;i++)await page.getByRole('button',{name:'Next question',exact:true}).click();
  await page.getByRole('button',{name:'Back to my plan',exact:true}).click();
  assert.match(await page.locator('h1').innerText(),/Make your plan/);
 });
 await test('revision conflicts show a clear error',async()=>{revision='2026-11-10T10:00:00.000Z';await page.getByRole('button',{name:'Previous question',exact:true}).click();
  await page.getByRole('button',{name:'Reduce stress',exact:true}).click();
  await page.waitForTimeout(1300);assert.match(await page.locator('p[role="alert"]').innerText(),/another tab/);});
 await context.close();

 // One fully unattended, first-time customer walkthrough. The payment screen
 // and provider API replies are SIMULATED. No card, real payment or email is used.
 const buyerContext=await browser.newContext({viewport:{width:375,height:812}});
 const buyer=await buyerContext.newPage();
 buyer.setDefaultTimeout(12000);buyer.setDefaultNavigationTimeout(16000);
 const customerSession='cs_test_firsttimecustomerfixture20261110';
 const finalReportId='rpt_firsttimecustomerfixture20261110';
 let customerRevision='2026-11-10T00:00:00.000Z';
 let customerDraft=null;
 let customerWrites=0;
 let customerCheckout=0;
 await buyer.route('**/api/checkout',async route=>{
  customerCheckout++;
  const request=route.request().postDataJSON();
  assert.equal(request.answers.length,8);
  assert.equal(request.acceptedTerms,true);
  await route.fulfill({json:{url:'https://checkout.stripe.com/c/pay/phase1_test_customer'}});
 });
 await buyer.route('https://checkout.stripe.com/**',route=>route.fulfill({
  status:200,contentType:'text/html',
  body:'<!doctype html><html lang="en"><title>Simulated test checkout</title><body><h1>Test checkout only — no card charged</h1><button onclick="location.href=\''+base+'/success?session_id='+customerSession+'\'">Complete test payment</button></body></html>',
 }));
 await buyer.route('**/api/payment-status?**',route=>route.fulfill({
  json:{paid:true,answers:customerDraft?.answers||high,status:'awaiting_details',reportId:null,
   refinements:customerDraft?{version:1,draft:customerDraft}:null,revision:customerRevision},
 }));
 await buyer.route('**/api/personalisation/draft',async route=>{
  const payload=route.request().postDataJSON();
  if(payload.revision!==customerRevision){
   await route.fulfill({status:409,json:{error:'This plan changed in another tab. Reload before editing.'}});
   return;
  }
  customerDraft=payload.draft;
  customerWrites++;
  customerRevision=new Date(Date.UTC(2026,10,10,0,0,customerWrites)).toISOString();
  await route.fulfill({json:{saved:true,revision:customerRevision}});
 });
 await buyer.route('**/api/create-report',route=>route.fulfill({json:{status:'ready',reportId:finalReportId}}));
 await buyer.route('**/report/'+finalReportId,route=>route.fulfill({
  status:302,headers:{location:base+'/plan-preview'},
 }));
 await test('uncoached first-time customer: audit to simulated upgrade to personalised report',async()=>{
  await go(buyer,'/audit');
  for(let i=0;i<high.length;i++){
   await buyer.getByRole('button',{name:high[i],exact:true}).click();
   await buyer.getByRole('button',{name:i===7?'See my free results':'Next question',exact:true}).click();
  }
  await buyer.waitForURL('**/results');
  const freeText=await buyer.locator('body').innerText();
  assert.match(freeText,/We found 7 places to check/);
  assert.match(freeText,/Also worth checking/);
  assert.doesNotMatch(freeText,/1,300|3,200/);
  await buyer.locator('input[type=checkbox]').check();
  await buyer.getByRole('button',{name:/Get my savings plan/}).click();
  await buyer.waitForURL('https://checkout.stripe.com/**');
  assert.match(await buyer.locator('body').innerText(),/Test checkout only/);
  await buyer.getByRole('button',{name:'Complete test payment'}).click();
  await buyer.waitForURL('**/personalise?**');
  for(let i=0;i<7;i++){
   const heading=await buyer.locator('section h2').first().innerText();
   if(heading==='Takeaway and eating out'){
    await buyer.locator('#takeawayOrder').fill('120');
    await buyer.getByRole('button',{name:'I only know my weekly total'}).click();
    await buyer.locator('#takeawayOrdersPerWeek').fill('6');
    await buyer.locator('#takeawaySwapPerWeek').fill('2');
    await buyer.locator('#takeawayReason').selectOption('busy');
    await buyer.locator('#takeawayReplacementCost').fill('10');
   }
   if(heading==='Subscriptions'){
    await buyer.locator('#subscriptionsMonthly').fill('70');
    await buyer.locator('#unusedSubscriptionChoice').selectOption('no');
   }
   if(heading==='Insurance'){
    await buyer.locator('#policy-type-0').selectOption('Car');
    await buyer.locator('#policy-cost-0').fill('1800');
    await buyer.locator('#policy-renewal-0').selectOption('soon');
   }
   if(heading==='Small everyday buys'){
    await buyer.locator('#convenienceWeekly').fill('100');
    assert.equal(await buyer.locator('#convenienceOverlap').count(),0);
    await buyer.locator('#convenienceGoalWeekly').fill('70');
   }
   if(heading==='Phone and internet'){
    await buyer.locator('input[name=phoneService][value=mobile]').check();
    await buyer.locator('#mobileMonthly').fill('55');
   }
   if(heading==='Power and gas'){
    await buyer.locator('#state').selectOption('NSW');
    await buyer.locator('#electricityBill').fill('520');
    await buyer.locator('#hasGas').selectOption('no');
   }
   if(heading==='Unplanned shopping'){
    await buyer.locator('#unplannedArea').selectOption('Online shopping');
    await buyer.locator('#shoppingTrigger').selectOption('Social media');
   }
   await buyer.getByRole('button',{name:'Next',exact:true}).click();
   // Save happens asynchronously; never read a previous question as the next one.
   await buyer.waitForFunction(previous=>{
     const h=document.querySelector('section h2');
     return Boolean(h && h.textContent?.trim()!==previous);
   },heading,{timeout:16000});
  }
  assert.match(await buyer.locator('body').innerText(),/nearly done/i);
  assert.ok(customerWrites>=7);
  // The same calculation and report renderer used by the real product now
  // receive the exact draft from this simulated paid journey.
  await buyer.evaluate(d=>sessionStorage.setItem('spendshift_demo_plan',JSON.stringify(d)),customerDraft);
  await buyer.getByRole('button',{name:'Make my plan',exact:true}).click();
  await buyer.waitForURL('**/plan-preview');
  const takeawayCard=buyer.locator('#area-takeaway');
  if(!await takeawayCard.isVisible()){
   await buyer.locator('details').filter({has:takeawayCard}).locator('summary').first().click();
  }
  const report=await buyer.locator('body').innerText();
  assert.match(report,/Your 7 areas to check/);
  assert.match(report,/Insurance/);
  assert.match(report,/about \$120 each week/i);
  assert.match(report,/not much time|quickly|busy nights/i);
  assert.match(report,/\$20 less a week/);
  assert.match(report,/Track money you've actually saved/);
  assert.equal(customerCheckout,1);
  await noOverflow(buyer);
  await buyer.screenshot({path:'test-artifacts/first-time-customer-full-journey.png',fullPage:true});
 });
 await buyerContext.close();
 console.log('Browser checks: '+tests+' groups passed. Provider payment/draft replies were mocked; no real Stripe payment or email was sent.');
 fs.writeFileSync('test-artifacts/browser-summary.json',JSON.stringify({groupsPassed:tests,desktopWidth:1280,mobileWidth:375,providerMode:'mocked',realStripePaymentTested:false,emailDeliveryTested:false},null,2));
}catch(error){fs.writeFileSync('test-artifacts/server-log.txt',logs);console.error(error);process.exitCode=1;}finally{await browser?.close().catch(()=>{});server.kill('SIGTERM');process.exit(process.exitCode || 0);}
