import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';

const {chromium}=createRequire(process.env.PLAYWRIGHT_INSTALL_PATH||process.cwd()+'/package.json')('playwright');
const base='http://127.0.0.1:3159';
const port='3159';
const analyticsDomains=/^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|connect\.facebook\.net|analytics\.tiktok\.com)\//;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',port,'-H','127.0.0.1'],{
 env:{...process.env,PORT:port,VERCEL_ENV:'production',SPENDSHIFT_AGGREGATE_METRICS_ENABLED:'false'},
 stdio:['ignore','pipe','pipe'],
});
let logs='';for(const stream of [server.stdout,server.stderr])stream.on('data',v=>{logs=(logs+v.toString()).slice(-9000);});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser,passes=0;
async function test(label,fn){await fn();passes++;console.log('PASS '+label);}
async function makePage(consent='granted',width=375){
 const ctx=await browser.newContext({viewport:{width,height:812}});
 await ctx.addInitScript(choice=>{
  if(choice!=='unset')localStorage.setItem('spendshift_cookie_consent',choice);
 },consent);
 const page=await ctx.newPage();
 const requests=[];
 page.on('request',r=>{if(analyticsDomains.test(r.url()))requests.push(r.url());});
 await ctx.route(analyticsDomains,route=>route.fulfill({
   status:200,contentType:'application/javascript',body:'/* inert analytics test stub */'
 }));
 return {ctx,page,requests};
}
async function expectGoogleAndClarity(page,requests){
 await page.waitForFunction(()=>window.__spendshiftPublicTracking===true,null,{timeout:12000});
 await page.waitForFunction(()=>
   !!document.querySelector('script[src*="googletagmanager.com/gtag/js"]') &&
   !!document.querySelector('script[src*="clarity.ms/tag/"]'),null,{timeout:15000});
 assert.ok(requests.some(x=>x.includes('googletagmanager.com/gtag/js')),'GA4 script must load');
 assert.ok(requests.some(x=>x.includes('clarity.ms/tag/')),'Clarity script must load');
}
try{
 let ready=false;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw Error('Next stopped: '+logs);
  try{const response=await fetch(base+'/');if(response.ok){ready=true;break;}}catch{}
  await sleep(250);
 }
 assert.ok(ready,'Isolated production-mode server did not start: '+logs);
 browser=await chromium.launch({headless:true});
 for(const width of [375,1280]){
  await test('consented Facebook homepage ad loads GA4 and Clarity at width '+width,async()=>{
   const {ctx,page,requests}=await makePage('granted',width);
   try{
    await page.goto(base+'/?utm_source=facebook&utm_medium=paid_social&fbclid=syntheticClick123',{waitUntil:'domcontentloaded'});
    await expectGoogleAndClarity(page,requests);
    const state=await page.evaluate(()=>({
      search:location.search,href:location.href,publicTracking:window.__spendshiftPublicTracking,
      scriptIds:[...document.scripts].map(s=>s.id),
      gaConfigured:Array.from(window.dataLayer||[]).some(x=>Array.from(x)[0]==='config'&&Array.from(x)[1]==='G-MEHDG2Y7T2'),
    }));
    assert.equal(state.search,'?utm_source=facebook&utm_medium=paid_social');
    assert.equal(state.publicTracking,true);
    assert.ok(!state.href.includes('syntheticClick123'),'Meta click ID must be removed before trackers load');
    assert.ok(state.gaConfigured,'Google Analytics page-view config must be issued');
    assert.ok(requests.every(x=>!x.includes('syntheticClick123')),'Do not send click ID in third-party requests');
   }finally{await ctx.close();}
  });
 }
 await test('first-time visitor can accept analytics on a Facebook homepage link',async()=>{
   const {ctx,page,requests}=await makePage('unset');
   try{
     await page.goto(base+'/?utm_source=instagram&fbclid=syntheticNewUser',{waitUntil:'networkidle'});
     assert.equal(requests.length,0,'No external tracking before consent');
     await page.getByRole('button',{name:'Accept optional cookies'}).click();
     await expectGoogleAndClarity(page,requests);
     assert.equal(new URL(page.url()).search,'?utm_source=instagram');
     assert.ok(requests.every(x=>!x.includes('syntheticNewUser')));
   }finally{await ctx.close();}
 });
 await test('consent denied blocks every marketing tracker',async()=>{
   const {ctx,page,requests}=await makePage('denied');
   try{
     await page.goto(base+'/?utm_source=facebook&fbclid=syntheticDenied',{waitUntil:'networkidle'});
     assert.equal(requests.length,0);
     assert.notEqual(await page.evaluate(()=>window.__spendshiftPublicTracking),true);
   }finally{await ctx.close();}
 });
 await test('private and unknown URLs never load third-party trackers',async()=>{
   const {ctx,page,requests}=await makePage('granted');
   try{
    for(const url of ['/audit?utm_source=facebook&fbclid=syntheticPrivate',
      '/results','/personalise','/?session_id=cs_test_sensitive']){
      await page.goto(base+url,{waitUntil:'networkidle'});
      await page.waitForTimeout(200);
      assert.equal(requests.length,0,'Unexpected trackers on '+url+': '+requests.join(', '));
      assert.notEqual(await page.evaluate(()=>window.__spendshiftPublicTracking),true);
    }
   }finally{await ctx.close();}
 });
 await test('moving from a tracked public page to the private audit unloads trackers',async()=>{
   const {ctx,page,requests}=await makePage('granted');
   try{
     await page.goto(base+'/?fbclid=syntheticLanding',{waitUntil:'domcontentloaded'});
     await expectGoogleAndClarity(page,requests);
     assert.equal(new URL(page.url()).search,'','Click ID is removed on Facebook-only URLs');
     requests.length=0;
     const auditLink=page.locator('a[href="/audit"]:visible').first();
     assert.ok(await auditLink.count()>0,'Home CTA should remain available');
     await auditLink.click();
     await page.waitForURL('**/audit',{timeout:10000});
     await page.waitForLoadState('networkidle');
     assert.equal(requests.length,0,'Third-party scripts must not load on the private audit');
     assert.notEqual(await page.evaluate(()=>window.__spendshiftPublicTracking),true);
   }finally{await ctx.close();}
 });
 console.log('PASS all '+passes+' isolated, production-mode marketing-tracking browser tests');
}catch(error){console.error(error);console.error('NEXT LOGS: '+logs.slice(-5000));process.exitCode=1;}
finally{await browser?.close().catch(()=>{});server.kill('SIGTERM');process.exit(process.exitCode||0);}
