import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire(process.env.PLAYWRIGHT_INSTALL_PATH||process.cwd()+'/package.json')('playwright');
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
   await page.getByText('See an example of what your plan looks like',{exact:true}).click();assert.match(await page.locator('body').innerText(),/EXAMPLE ONLY — NOT YOUR ESTIMATE/);assert.match(await page.locator('body').innerText(),/\$40 less each week/);await page.screenshot({path:'test-artifacts/free-results-'+viewport.width+'.png',fullPage:true});
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
   await page.getByText('Add a checked result',{exact:true}).click();const form=page.locator('form').last();
   await form.locator('select').first().selectOption('subscriptions');await form.getByLabel('What you paid before ($)',{exact:true}).fill('70');await form.getByLabel('What you paid after ($)',{exact:true}).fill('50');await form.getByLabel('Extra fees or costs not included above ($)',{exact:true}).fill('5');await form.locator('input[type=date]').fill('2026-11-01');await form.locator('input[type=checkbox]').check();await form.getByRole('button',{name:'Save this result'}).click();
   assert.match(await page.locator('body').innerText(),/recorded \$15 less/);await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(300);assert.match(await page.locator('body').innerText(),/recorded \$15 less/);
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
