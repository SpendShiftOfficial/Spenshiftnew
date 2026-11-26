import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire(process.env.PLAYWRIGHT_INSTALL_PATH||process.cwd()+'/package.json')('playwright');
const base='http://127.0.0.1:3000';
const server=spawn('npm',['run','start','--','--hostname','127.0.0.1'],{stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'3000'}});
let logs='';for(const stream of [server.stdout,server.stderr])stream.on('data',x=>{logs+=x.toString();if(logs.length>120000)logs=logs.slice(-120000);});
fs.mkdirSync('test-artifacts',{recursive:true});
const high=['Almost daily','Yes — at least one unused','Never','Daily',"I honestly don't know","I honestly don't know",'Almost daily','Lower my bills'];
const getAnswers=()=>high.slice();
const auditLabel=answer=>answer==='Yes — at least one unused'?'Yes, at least one is unused':answer==='No — I use them all'?'No, I use them all':answer;
let tests=0;let browser;
async function test(name,fn){await fn();tests++;console.log('PASS '+name);}
async function noOverflow(page){const details=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,oversized:[...document.querySelectorAll('*')].map(el=>({tag:el.tagName,cls:typeof el.className==='string'?el.className.slice(0,75):'',right:Math.round(el.getBoundingClientRect().right),left:Math.round(el.getBoundingClientRect().left)})).filter(x=>x.right>innerWidth+2||x.left < -2).slice(0,12)}));assert.ok(details.scrollWidth<=details.width+2,'Page overflows the viewport at '+page.url()+' '+JSON.stringify(details));}
async function go(page,url){await page.goto(base+url,{waitUntil:'networkidle'});}
async function next(page){await page.getByRole('button',{name:'Next',exact:true}).click();await page.waitForTimeout(180);}
try{
 for(let i=0;i<90;i++){try{const r=await fetch(base+'/');if(r.ok)break;}catch{}if(i===89)throw new Error('Local app did not start: '+logs.slice(-3000));await new Promise(r=>setTimeout(r,1000));}
 browser=await chromium.launch({headless:true});

 await test('disabled private analytics endpoints return empty, no-store replies',async()=>{
  // Preview uses placeholder credentials, so no real customer data can be touched.
  for(const [endpoint,payload] of [
    ['/api/audit-metric',{event:'audit_start'}],
    ['/api/report-metric',{event:'report_open',reportId:'rpt_ANONTESTREPORT012345'}],
  ]){
    const response=await fetch(base+endpoint,{
      method:'POST',
      headers:{'content-type':'application/json','origin':base},
      body:JSON.stringify(payload),
    });
    assert.equal(response.status,204,endpoint+' must stay disabled in preview');
    assert.match(response.headers.get('cache-control')||'',/no-store/);
    assert.equal(await response.text(),'');
  }
 });
 await test('disabled-collection fallback privacy notice is compact and truthful',async()=>{
  for(const [width,height] of [[320,568],[375,667],[390,844],[1280,900]]){
   const ctx=await browser.newContext({viewport:{width,height}}),page=await ctx.newPage();
   const thirdParty=[],v2=[];page.on('request',req=>{if(/googletagmanager|google-analytics|clarity\.ms|connect\.facebook|analytics\.tiktok/.test(req.url()))thirdParty.push(req.url());if(req.url().endsWith('/api/analytics-v2'))v2.push(req.url());});
   try{
    await go(page,'/');await page.evaluate(()=>document.fonts.ready);
    const notice=page.locator('[data-ss-privacy-notice="fallback"]');await notice.waitFor();
    assert.match(await notice.innerText(),/Basic statistics are off/);
    const box=await notice.boundingBox();assert.ok(box&&box.height<=height*(width===320?.33:.25),'Fallback size '+JSON.stringify({width,height,box}));
    const accept=notice.getByRole('button',{name:'Accept optional',exact:true}),reject=notice.getByRole('button',{name:'Reject optional',exact:true});
    const a=await accept.boundingBox(),b=await reject.boundingBox();
    assert.ok(a&&b&&Math.abs(a.width-b.width)<=1&&Math.min(a.height,b.height)>=44);
    assert.ok(await notice.evaluate(el=>el.scrollWidth<=el.clientWidth+1&&!['fixed','sticky'].includes(getComputedStyle(el).position)));
    const settings=notice.getByRole('button',{name:'Privacy settings',exact:true});
    await settings.click();assert.equal(await settings.getAttribute('aria-expanded'),'true');assert.ok(await notice.getByRole('link',{name:'Cookie Policy',exact:true}).isVisible());
    await settings.click();await reject.click();assert.equal(await notice.count(),0);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('spendshift_privacy_v2')));
    assert.equal(saved.analytics,'denied');assert.equal(saved.ads,'denied');
    assert.equal(await page.evaluate(()=>localStorage.getItem('spendshift_cookie_consent')),null);
    await page.evaluate(()=>window.dispatchEvent(new Event('open-cookie-settings')));await notice.waitFor();assert.ok(await notice.getByRole('link',{name:'Privacy Policy',exact:true}).isVisible());
    assert.deepEqual(thirdParty,[]);assert.deepEqual(v2,[]);console.log('PASS fallback notice '+width+'x'+height+': '+Math.round(box.height)+'px');
   }finally{await ctx.close();}
  }
 });
 await test('direct audit arrivals are consent-gated, anonymous and deduplicated',async()=>{
   for(const consent of ['unset','denied','granted']){
     const ctx=await browser.newContext({viewport:{width:375,height:812}});
     await ctx.addInitScript(choice=>{if(choice!=='unset')localStorage.setItem('spendshift_cookie_consent',choice);},consent);
     const visit=await ctx.newPage();
     const posted=[];const thirdParty=[];
     visit.on('request',req=>{
       if(/googletagmanager|google-analytics|clarity[.]ms|connect[.]facebook|analytics[.]tiktok/.test(req.url()))thirdParty.push(req.url());
     });
     await visit.route('**/api/audit-metric',async route=>{
       posted.push({url:route.request().url(),data:route.request().postDataJSON()});
       await route.fulfill({status:204,headers:{'Cache-Control':'no-store'}});
     });
     await visit.goto(base+'/audit?utm_source=facebook&fbclid=synthetic_ad_click',{waitUntil:'networkidle'});
     assert.deepEqual(posted.map(x=>x.data),consent==='granted'?[{event:'audit_arrival'}]:[],
       'Only consented visitors should generate the first-party arrival event');
     assert.deepEqual(thirdParty,[],'No third-party tracking on private audit even with ad query parameters');
     assert.equal(await visit.getByRole('heading',{name:'How often do you buy takeaway or go out for a meal?'}).count(),1);
     await visit.reload({waitUntil:'networkidle'});
     assert.equal(posted.length,consent==='granted'?1:0,'Reloads in one tab must not inflate arrivals');
     const startReply=consent==='granted'?visit.waitForResponse(res=>
       new URL(res.url()).pathname==='/api/audit-metric' &&
       res.request().postDataJSON()?.event==='audit_start'
     ):null;
     await visit.getByRole('button',{name:'Never',exact:true}).click();
     if(startReply)await startReply;
     assert.deepEqual(posted.map(x=>x.data),consent==='granted'?
       [{event:'audit_arrival'},{event:'audit_start'}]:[],
       'Arrival counts separately from answering the first question');
     for(const item of posted){
       assert.equal(new URL(item.url).pathname,'/api/audit-metric');
       assert.equal(new URL(item.url).search,'','Never send the ad query or click id');
       assert.deepEqual(Object.keys(item.data),['event'],'No spending answers or identifiers');
     }
     await ctx.close();
   }
 });
 await test('quick report generation cycles loading steps without artificial waiting',async()=>{
  const context=await browser.newContext({viewport:{width:375,height:812}});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(16000);
  const reportId='rpt_fastloadingfixture';
  let createCalls=0;
  await page.route('**/api/payment-status?**',route=>route.fulfill({
   json:{paid:true,answers:high,status:'awaiting_details',reportId:null,refinements:null,revision:'2026-11-14T00:00:00.000Z'},
  }));
  await page.route('**/api/create-report',async route=>{
   createCalls++;
   await new Promise(resolve=>setTimeout(resolve,5800));
   await route.fulfill({json:{status:'ready',reportId}});
  });
  await page.route('**/report/'+reportId,route=>route.fulfill({status:302,headers:{location:base+'/plan-preview'}}));
  await page.goto(base+'/success?session_id=cs_test_fast_loading_fixture&generate=1',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Making your savings plan'}).waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('.reportStep.done').length>=3,null,{timeout:6000});
  const description=await page.locator('.analysisCard .mini').innerText();
  assert.match(description,/steps are a guide/i);
  await page.waitForURL('**/plan-preview',{timeout:16000});
  assert.equal(createCalls,1,'Report generation should only run once');
  await context.close();
 });
 await test('search sitemap and branded social image',async()=>{
  const response=await fetch(base+'/sitemap.xml');
  assert.equal(response.status,200);
  const xml=await response.text();
  for(const slug of ['/reduce-electricity-bill-australia','/cancel-unused-subscriptions-australia','/save-money-australia']){
   assert.ok(xml.includes('https://www.spendshift.com.au'+slug),'Missing article in sitemap: '+slug);
  }
  assert.ok(!xml.includes('www.spendshift.com.au/audit<'),'Private free audit should not be in sitemap');
  assert.ok(!xml.includes('www.spendshift.com.au/results<'),'Private results should not be in sitemap');
  assert.ok(xml.includes('<lastmod>2026-11-14</lastmod>'),'Sitemap should use actual update dates');
  const og=await fetch(base+'/opengraph-image');
  assert.equal(og.status,200,'Open Graph image route is not ready');
  assert.match(og.headers.get('content-type')||'',/image\/png/);
  const bytes=new Uint8Array(await og.arrayBuffer());
  assert.equal(bytes[0],137,'Expected PNG image');
  assert.equal(bytes[1],80);
 });
 for(const viewport of [{width:1280,height:900},{width:375,height:812}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
  await test('nine public pages, SEO and mobile layout '+viewport.width,async()=>{
   const routes=['/','/pricing','/whats-included','/how-it-works','/why-spendshift','/services','/save-money-australia','/reduce-electricity-bill-australia','/cancel-unused-subscriptions-australia'];
   for(const route of routes){
    await go(page,route);
    const body=await page.locator('body').innerText();
    assert.doesNotMatch(body,/A\$39|30.day savings action plan|AI Powered|AI-powered savings insights/i,'Outdated marketing claim on '+route);
    if(route!=='/save-money-australia')assert.match(body,/A\$29/,'A$29 missing on '+route);
    assert.ok(await page.getByRole('link',{name:'Start my free savings check'}).count()>0,'Free audit CTA missing on '+route);
    assert.ok(await page.locator('a[href="/audit"]').count()>0,'Free audit link broken on '+route);
    const brand=page.locator('header.topbar .logo');
    assert.equal(await brand.isVisible(),true,'Header logo not visible on '+route);
    assert.ok(await brand.evaluate(el=>Number(getComputedStyle(el).opacity)>=0.99),'Header logo faded on '+route);
    const footer=page.locator('footer .footerGrid');
    assert.ok(await footer.evaluate(el=>Number(getComputedStyle(el).opacity)>=0.99),'Footer hidden on '+route);
    const title=await page.title();
    assert.match(title,/SpendShift/,'Page title missing on '+route);
    const description=await page.locator('meta[name="description"]').getAttribute('content');
    assert.ok(description&&description.length>35,'Description missing on '+route);
    const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
    assert.equal((canonical||'').replace(/\/$/,''),('https://www.spendshift.com.au'+route).replace(/\/$/,''),'Canonical incorrect on '+route);
    if(route==='/'){
     assert.match(await page.title(),/Free Savings Check for Australians/);
     assert.match((await page.locator('meta[property="og:image"]').getAttribute('content'))||'',/\/opengraph-image/);
    }
    if(route==='/save-money-australia'){
     assert.match(body,/Last reviewed: 14 November 2026/);
     assert.ok(await page.locator('nav.jumpNav a').filter({hasText:'Household bills'}).count()>0,'Descriptive navigation missing');
     assert.ok(await page.locator('a[href="/reduce-electricity-bill-australia"]').count()>0,'Electricity guide link missing');
     assert.ok(await page.locator('a[href="/cancel-unused-subscriptions-australia"]').count()>0,'Subscription guide link missing');
    }
    if(route==='/reduce-electricity-bill-australia'){
     assert.match(body,/Energy Made Easy/);
     assert.match(body,/3,500/);
    }
    if(route==='/cancel-unused-subscriptions-australia'){
     assert.match(body,/Google Play/);
     assert.match(body,/A\$179.88/);
    }
    assert.equal(await page.locator('a[href="/#services"]').count(),0,'Outdated footer anchor on '+route);
    await noOverflow(page);
    await page.screenshot({path:'test-artifacts/marketing-'+(route==='/'?'home':route.slice(1))+'-'+viewport.width+'.png',fullPage:true});
   }
   if(viewport.width<600){
    await go(page,'/');
    const menu=page.getByRole('button',{name:'Open menu'});
    await menu.click();
    assert.equal(await page.getByRole('button',{name:'Close menu'}).getAttribute('aria-expanded'),'true');
    assert.ok(await page.locator('#site-mobile-nav a[href="/pricing"]').isVisible());
    await page.getByRole('button',{name:'Close menu'}).click();
   }
  });
  await test('legal documents and phone readability '+viewport.width,async()=>{
   const docs=[
    ['/terms-and-conditions',['AUD $29','no subscription','Last updated: 14 November 2026']],
    ['/privacy-policy',['Microsoft Clarity','Meta Pixel','TikTok Pixel','daily counts','does not load those scripts','Draft prepared: 25 November 2026']],
    ['/refund-policy',['30-day money-back guarantee','AUD $29','Last updated: 14 November 2026']],
    ['/financial-information-ai-disclaimer',['conditional calculations','Anthropic Claude','Last updated: 14 November 2026']],
    ['/cookies',['Google Analytics','Microsoft Clarity','Meta Pixel','TikTok Pixel','first-party','Not active in this version','Draft prepared: 25 November 2026']],
   ];
   for(const [route,phrases] of docs){
    await go(page,route);
    const body=await page.locator('body').innerText();
    for(const phrase of phrases)assert.ok(body.includes(phrase),'Missing disclosure '+phrase+' on '+route);
    assert.doesNotMatch(body,/AUD \$39|30-day action plan/i,'Obsolete paid product on '+route);
    await noOverflow(page);
    await page.screenshot({path:'test-artifacts/legal-'+route.slice(1)+'-'+viewport.width+'.png',fullPage:true});
   }
  });
  await test('marketing header has clean spacing at desktop and phone widths '+viewport.width,async()=>{
   const widths=viewport.width>600?[1600,1440,1366,1280,1150,1100,1025]:[1024,768,390,375];
   for(const width of widths){
    await page.setViewportSize({width,height:900});
    await go(page,'/');
    const layout=await page.evaluate(()=>{
     const header=document.querySelector('header.topbar:not(.topbar-simple)');
     const logo=header?.querySelector('.logo');
     const nav=header?.querySelector('nav.nav.desktop-only');
     const cta=header?.querySelector('a.btn.desktop-only');
     const menu=header?.querySelector('button.hamburger-btn');
     const rect=el=>{const r=el?.getBoundingClientRect();return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom}:null;};
     return {
      viewport:innerWidth,
      pageScrollWidth:document.documentElement.scrollWidth,
      logo:rect(logo),nav:rect(nav),cta:rect(cta),
      navVisible:!!nav&&getComputedStyle(nav).display!=='none',
      ctaVisible:!!cta&&getComputedStyle(cta).display!=='none',
      menuVisible:!!menu&&getComputedStyle(menu).display!=='none',
      links:[...(nav?.querySelectorAll('a')||[])].map(el=>({text:el.textContent?.trim(),rect:rect(el),nowrap:getComputedStyle(el).whiteSpace==='nowrap'})),
      ctaNoWrap:!!cta&&getComputedStyle(cta).whiteSpace==='nowrap'
     };
    });
    assert.ok(layout.pageScrollWidth<=width+2,'Header/page overflows at '+width+': '+JSON.stringify(layout));
    assert.ok(layout.logo,'Logo missing at '+width);
    if(width>=1025){
     assert.ok(layout.navVisible&&layout.ctaVisible&&!layout.menuVisible,'Desktop header missing navigation at '+width+': '+JSON.stringify(layout));
     assert.equal(layout.links.length,5,'Desktop navigation count at '+width);
     assert.ok(layout.links.every(l=>l.nowrap),'A navigation label can wrap at '+width);
     assert.ok(layout.ctaNoWrap,'Main header CTA can wrap at '+width);
     assert.ok(layout.logo.right+8<=layout.links[0].rect.left,'Logo and first link too close at '+width+': '+JSON.stringify(layout));
     assert.ok(layout.links.at(-1).rect.right+8<=layout.cta.left,'Last link and CTA too close at '+width+': '+JSON.stringify(layout));
     assert.ok(layout.cta.right<=width-12,'CTA extends beyond screen at '+width);
     const mid=layout.links.map(x=>(x.rect.top+x.rect.bottom)/2);
     assert.ok(Math.max(...mid)-Math.min(...mid)<=2,'Links are not on one row at '+width);
    }else{
     assert.ok(!layout.navVisible&&!layout.ctaVisible&&layout.menuVisible,'Phone/tablet header did not switch to menu at '+width+': '+JSON.stringify(layout));
    }
    await page.screenshot({path:'test-artifacts/header-'+width+'.png',clip:{x:0,y:0,width,height:110}});
   }
   await page.setViewportSize(viewport);
  });
  await test('free eight-question journey '+viewport.width,async()=>{
   await go(page,'/audit');
   for(let i=0;i<high.length;i++){await page.getByRole('button',{name:auditLabel(high[i]),exact:true}).click();await page.getByRole('button',{name:i===7?'See my free results':'Next question',exact:true}).click();}
   await page.waitForURL('**/results');const freeText=await page.locator('body').innerText();assert.match(freeText,/7 places to check/);assert.match(freeText,/Get my savings plan for A\$29/);assert.doesNotMatch(freeText,/A\$39/);await noOverflow(page);
   assert.equal(await page.locator('#optional-extra-area').count(),0,'Seven flagged areas must not show an extra dropdown');
   assert.equal(await page.getByRole('button',{name:'Want to check another area?'}).count(),0,'Seven flagged areas must not show the optional link');
   const preview=page.locator('#plan-example');
   assert.equal(await preview.getAttribute('open'),null,'Illustration should not push the upgrade button below the fold');
   assert.equal(await page.getByLabel('Example of a possible savings action').isVisible(),false,'Illustration starts collapsed');
   await preview.locator('summary').click();
   const example=page.getByLabel('Example of a possible savings action');
   assert.match(await example.innerText(),/EXAMPLE ONLY. NOT YOUR ESTIMATE/);assert.doesNotMatch(await example.innerText(),/\$40 less each week/);
   assert.match(await example.innerText(),/In your paid plan: clear steps and useful links/);
   assert.equal(await example.locator('ol').count(),0,'The free example must not give away the full three-step guide');
   await noOverflow(page);
   await page.screenshot({path:'test-artifacts/free-results-'+viewport.width+'.png',fullPage:true});
  });
  await test('free-to-paid decision shows value, price and terms clearly '+viewport.width,async()=>{
   await go(page,'/results');
   const nudge=page.getByLabel('Optional paid savings plan');
   assert.match(await nudge.innerText(),/A\$29 once/);
   assert.match(await nudge.innerText(),/No subscription/);
   const jump=nudge.getByRole('link',{name:"See what's included"});
   assert.equal(await jump.getAttribute('href'),'#unlock-full-report');
   await jump.click();
   assert.ok(page.url().endsWith('#unlock-full-report'),'Upgrade shortcut must scroll to the full offer, not charge the customer');
   const offer=page.locator('#unlock-full-report');
   const copy=await offer.innerText();
   for(const phrase of ['Your top 3 actions','Clear steps for each area','Help comparing costs','optional savings tracker','What happens after payment?','A$29','no subscription','Payment handled by Stripe']){
    assert.ok(copy.includes(phrase),'Missing upgrade reassurance: '+phrase);
   }
   const buy=offer.getByRole('button',{name:'Get my savings plan for A$29'});
   assert.equal(await buy.isDisabled(),true,'Checkout must require accepted terms');
   await offer.locator('input[type=checkbox]').check();
   assert.equal(await buy.isEnabled(),true,'Terms acceptance must enable checkout');
   assert.equal(await page.locator('#plan-example').getAttribute('open'),null,'Example should not bury price and checkout');
   await noOverflow(page);
  });
  await test('one to six flagged areas reveal only missing choices on request '+viewport.width,async()=>{
   const context=await browser.newContext({viewport});const choicePage=await context.newPage();
   await choicePage.goto(base+'/audit',{waitUntil:'networkidle'});
   await choicePage.evaluate(()=>localStorage.setItem('spendshift_answers',JSON.stringify(['Never','6–10','Over 2 years ago','Rarely','Within 6 months','Within 6 months','Rarely','Lower my bills'])));
   await choicePage.goto(base+'/results',{waitUntil:'networkidle'});
   assert.match(await choicePage.locator('body').innerText(),/2 places to check/);
   assert.equal(await choicePage.locator('#optional-extra-area').count(),0);
   const show=choicePage.getByRole('button',{name:'Want to check another area?',exact:true});
   assert.equal(await show.count(),1);
   await show.click();
   const select=choicePage.locator('#optional-extra-area');
   assert.equal(await select.count(),1);
   const options=await select.locator('option').allTextContents();
   assert.deepEqual(options,['No extra area','Takeaway and eating out','Small everyday buys','Phone and internet','Power and gas','Unplanned shopping']);
   await select.selectOption('phone');
   assert.equal(await select.inputValue(),'phone');
   assert.equal(await show.count(),0,'The link is replaced by the revealed selector');
   assert.equal(await choicePage.getByRole('heading',{name:'Turn your checks into a plan you can use.'}).count(),1);
   await noOverflow(choicePage);
   await context.close();
  });
  await test('unplanned shopping keeps four choices and a clear example '+viewport.width,async()=>{
    await go(page,'/audit');
    await page.getByRole('button',{name:'Start a new check'}).click();
    const answers=['Never',"I don't have any subscriptions",'Within 6 months','Rarely','Within 6 months','Within 6 months','Rarely','Save more money'];
    for(let i=0;i<answers.length;i++){
      if(i===6){
        const boldQuestion=page.getByRole('heading',{level:1});
        assert.equal(await boldQuestion.innerText(),"How often do you buy things you didn't plan to buy, like clothes or online orders?");
        assert.ok(await boldQuestion.evaluate(el=>Number(getComputedStyle(el).fontWeight)>=800),'The shopping examples must be in the bold headline');
        assert.match(await page.locator('main').innerText(),/Don't count coffee, snacks or small treats. We asked about those earlier./);
        assert.equal(await page.getByRole('button',{name:'1–2 times/month',exact:true}).count(),0);
        const choices=await page.locator('[role="group"] button').allTextContents();
        assert.deepEqual(choices,['Rarely','1–2 times/week','3–5 times/week','Almost daily']);
      }
      await page.getByRole('button',{name:answers[i],exact:true}).click();
      await page.getByRole('button',{name:i===7?'See my free results':'Next question',exact:true}).click();
    }
    await page.waitForURL('**/results');
    assert.match(await page.locator('body').innerText(),/don't recommend paying based on these answers alone/i);
    await go(page,'/audit');
    await page.evaluate(()=>localStorage.setItem('spendshift_free_draft_v2',JSON.stringify({
      answers:['Never',"I don't have any subscriptions",'Within 6 months','Rarely','Within 6 months','Within 6 months','1–2 times/month'],
      index:6,
    })));
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.getByRole('button',{name:'Rarely',exact:true}).getAttribute('aria-pressed'),'true');
    assert.equal(await page.getByRole('button',{name:'1–2 times/month',exact:true}).count(),0);
    await page.getByRole('button',{name:'Start a new check'}).click();
    assert.equal(await page.getByText('Question 1 of 8',{exact:true}).count(),1);
    await noOverflow(page);
   });
   await test('monthly takeaway buyers can complete the free check '+viewport.width,async()=>{
   await go(page,'/audit');
   assert.equal(await page.getByRole('button',{name:'Less than once a week',exact:true}).count(),0);
   await page.getByRole('button',{name:'Rarely',exact:true}).click();
   await page.getByRole('button',{name:'Next question',exact:true}).click();
   for(const value of ["I don't have any subscriptions",'Within 6 months','Rarely','Within 6 months','Within 6 months','Rarely','Save more money']){
     await page.getByRole('button',{name:value,exact:true}).click();
     await page.getByRole('button',{name:value==='Save more money'?'See my free results':'Next question',exact:true}).click();
   }
   await page.waitForURL('**/results');
   assert.equal(await page.locator('#optional-extra-area').count(),1,'No flagged areas should show the manual choice immediately');
   assert.match(await page.locator('body').innerText(),/don't recommend paying based on these answers alone/);
   await page.locator('#optional-extra-area').selectOption('subscriptions');
   assert.match(await page.locator('body').innerText(),/You chose Subscriptions to check/);
   assert.match(await page.locator('body').innerText(),/We have not confirmed a problem/);
   await noOverflow(page);
  });
  await test('one unused subscription appears in free results without invented savings '+viewport.width,async()=>{
   const context=await browser.newContext({viewport});const free=await context.newPage();
   await free.goto(base+'/audit',{waitUntil:'networkidle'});
   const answers=['Never','Yes — at least one unused','Within 6 months','Rarely','Within 6 months','Within 6 months','Rarely','Save more money'];
   for(let i=0;i<answers.length;i++){
    await free.getByRole('button',{name:auditLabel(answers[i]),exact:true}).click();
    await free.getByRole('button',{name:i===7?'See my free results':'Next question',exact:true}).click();
   }
   await free.waitForURL('**/results');
   const body=await free.locator('body').innerText();
   assert.match(body,/We found 1 place to check/);
   assert.match(body,/at least one subscription goes unused/);
   assert.match(body,/Your goal: Save more money/);
   assert.match(body,/we can't rank these by dollars saved/);
   assert.match(body,/Check the latest charge for the unused subscription/);
   assert.doesNotMatch(body,/Your estimated savings: \$[0-9]/);
   await noOverflow(free);await context.close();
  });
  await test('light spending and used subscriptions do not trigger a paid recommendation '+viewport.width,async()=>{
   const context=await browser.newContext({viewport});const free=await context.newPage();
   await free.goto(base+'/audit',{waitUntil:'networkidle'});
   const answers=['1–2 times/week','No — I use them all','Within 6 months','1–2 times/week','Within 6 months','Within 6 months','1–2 times/week','Save more money'];
   for(let i=0;i<answers.length;i++){
    await free.getByRole('button',{name:auditLabel(answers[i]),exact:true}).click();
    await free.getByRole('button',{name:i===7?'See my free results':'Next question',exact:true}).click();
   }
   await free.waitForURL('**/results');
   const body=await free.locator('body').innerText();
   assert.match(body,/We didn't find a clear place to start/);
   assert.match(body,/We don't recommend paying based on these answers alone/);
   assert.equal(await free.locator('#optional-extra-area').count(),1);
   await noOverflow(free);await context.close();
  });
  await test('older saved free answers reopen as Rarely '+viewport.width,async()=>{
   await go(page,'/audit');
   await page.evaluate(()=>localStorage.setItem('spendshift_free_draft_v2',JSON.stringify({answers:['Less than once a week'],index:0})));
   await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.getByRole('button',{name:'Rarely',exact:true}).getAttribute('aria-pressed'),'true');
   assert.equal(await page.getByRole('button',{name:'Less than once a week',exact:true}).count(),0);
   await noOverflow(page);
  });
  await test('subscription choice directly identifies unused services and reopens old drafts '+viewport.width,async()=>{
   await go(page,'/audit');
   await page.getByRole('button',{name:'Never',exact:true}).click();
   await page.getByRole('button',{name:'Next question',exact:true}).click();
   const choices=await page.locator('[role="group"] button').allTextContents();
   assert.deepEqual(choices,["I don't have any subscriptions","Yes, at least one is unused","No, I use them all","Not sure"]);
   assert.match(await page.locator('body').innerText(),/paid apps, streaming services and memberships/);
   await page.getByRole('button',{name:'Yes, at least one is unused',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Yes, at least one is unused',exact:true}).getAttribute('aria-pressed'),'true');
   await page.evaluate(()=>localStorage.setItem('spendshift_free_draft_v2',JSON.stringify({answers:['Never','0–2'],index:1})));
   await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.getByRole('button',{name:'0–2',exact:true}).getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'No, I use them all',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'0–2',exact:true}).count(),0);
   assert.equal(await page.getByRole('button',{name:'No, I use them all',exact:true}).getAttribute('aria-pressed'),'true');
   await page.evaluate(()=>localStorage.setItem('spendshift_free_draft_v2',JSON.stringify({answers:['Never','3–5'],index:1})));
   await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.getByRole('button',{name:'3–5',exact:true}).getAttribute('aria-pressed'),'true');
   await noOverflow(page);
  });
  await test('checkout rejects bad input without creating a payment '+viewport.width,async()=>{
   for(const body of [{answers:[]},{answers:high,acceptedTerms:false,termsVersion:'2026-11-phase1',checkoutRequestId:'11111111-1111-4111-8111-111111111111'}]){const response=await page.request.post(base+'/api/checkout',{data:body});assert.equal(response.status(),400);}
   const paused=await page.request.post(base+'/api/checkout',{data:{answers:high,acceptedTerms:true,termsVersion:'2026-11-phase1',checkoutRequestId:'11111111-1111-4111-8111-111111111111'}});assert.equal(paused.status(),403);
    const no=['Never','None','Within 6 months','Rarely','Within 6 months','Within 6 months','Rarely','Save more money'];
    const requestId='11111111-1111-4111-8111-111111111111';
    const missing=await page.request.post(base+'/api/checkout',{data:{answers:no,acceptedTerms:true,termsVersion:'2026-11-phase1',checkoutRequestId:requestId}});assert.equal(missing.status(),400);
    const invalid=await page.request.post(base+'/api/checkout',{data:{answers:no,additionalArea:'__proto__',acceptedTerms:true,termsVersion:'2026-11-phase1',checkoutRequestId:requestId}});assert.equal(invalid.status(),400);
    const chosen=await page.request.post(base+'/api/checkout',{data:{answers:no,additionalArea:'subscriptions',acceptedTerms:true,termsVersion:'2026-11-phase1',checkoutRequestId:requestId}});assert.equal(chosen.status(),403);
  });
  await test('chosen overlooked area survives a simulated paid resume '+viewport.width,async()=>{
    const extraContext=await browser.newContext({viewport});
    const chosenPage=await extraContext.newPage();
    const answers=['Never','None','Within 6 months','Rarely','Within 6 months','Within 6 months','Rarely','Save more money'];
    const selectedDraft={version:1,answers,details:{},insurancePolicies:[],additionalUnusedSubscriptions:[],additionalArea:'subscriptions',step:0};
    await chosenPage.route('**/api/payment-status?**',route=>route.fulfill({json:{paid:true,answers,status:'awaiting_details',reportId:null,refinements:{version:1,draft:selectedDraft},revision:'2026-11-13T00:00:00.000Z'}}));
    await chosenPage.goto(base+'/personalise?session_id=cs_test_selectedarea00000000000',{waitUntil:'networkidle'});
    assert.match(await chosenPage.locator('body').innerText(),/Area 1 of 1/);
    assert.match(await chosenPage.locator('body').innerText(),/Subscriptions/);
    await noOverflow(chosenPage);
    await extraContext.close();
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
   assert.equal(await previous.count(),0);
   const intro=page.locator('[aria-label="Before you start"]');
   assert.equal((await intro.innerText()).trim(),"Answer a few more questions. Skip any amount you don't know. We'll save your answers as you go.");
   assert.equal(await intro.locator('h2').count(),0,'Do not repeat the heading');
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
   await page.locator('input[name=takeawayMealMode][value=takeaway]').check();
   await assertCurrencySpacing('#takeawayOrder');
   await page.locator('#takeawayOrder').fill('32.50');
   await assertCurrencySpacing('#takeawayOrder');
   await next(page);
   await page.locator('#subscriptionsMonthly').waitFor();
   await assertCurrencySpacing('#subscriptionsMonthly');
   await noOverflow(page);
  });
  await test('feedback follows the paid plan, welcomes criticism and never sends from demos '+viewport.width,async()=>{
   await go(page,'/report-preview?customer=all-seven');
   const feedback=page.getByRole('region',{name:'How was your plan?'});
   await feedback.waitFor({state:'visible'});
   assert.equal(await feedback.getByRole('radio').count(),2);
   assert.equal(await feedback.getByRole('button',{name:'Send feedback'}).isDisabled(),true);
   assert.match(await feedback.innerText(),/Good or bad/);
   assert.match(await feedback.innerText(),/won't publish it without asking/);
   assert.equal(await feedback.getByRole('textbox',{name:'Tell us more (optional)'}).count(),1);
   await feedback.getByRole('radio',{name:'Needs work'}).check();
   await feedback.getByRole('textbox',{name:'Tell us more (optional)'}).fill('I would like clearer examples.');
   assert.equal(await feedback.getByRole('button',{name:'Send feedback'}).isEnabled(),true);
   let attemptedNetwork=false;
   await page.route('**/api/report-feedback',route=>{attemptedNetwork=true;return route.abort();});
   await feedback.getByRole('button',{name:'Send feedback'}).click();
   assert.match(await feedback.getByRole('alert').innerText(),/sample report\. No feedback was sent/);
   assert.equal(attemptedNetwork,false);
   const invalid=await page.request.post(base+'/api/report-feedback',{data:{reportId:'demo-test',rating:'helpful',comment:''}});
   assert.equal(invalid.status(),400,'Demo reports may never send customer feedback');
   const wrongRating=await page.request.post(base+'/api/report-feedback',{data:{reportId:'rpt_1234567890',rating:'fake',comment:''}});
   assert.equal(wrongRating.status(),400,'Invalid rating is rejected before email');
   await noOverflow(page);
  });
  await test('optional tracker stays compact until opened and has good spacing '+viewport.width,async()=>{
   await go(page,'/report-preview?customer=all-seven');
   const tracker=page.getByRole('region',{name:'See what your changes are worth'});
   assert.equal(await tracker.locator('form').count(),0,'Cost entry must be collapsed until requested');
   assert.match(await tracker.innerText(),/This is for later/);
   assert.match(await tracker.innerText(),/Nothing recorded yet/);
   assert.equal(await tracker.getByText(/subscription you cancelled went from/).count(),0,'Example lives inside the optional form');
   const button=tracker.getByRole('button',{name:'Record my first change'});
   const note=tracker.getByText(/Saved only in this browser/i);
   const top=await button.boundingBox(),bottom=await note.boundingBox();
   assert.ok(top&&bottom&&bottom.y-(top.y+top.height)>=14,'Privacy note must sit below the optional action with breathing room');
   await noOverflow(page);
  });
  await test('multiple unused subscriptions reach the same complete report '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('subscriptions-insurance');
   assert.equal(await page.locator('section h2').last().innerText(),'Subscriptions');
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
   assert.match(await page.locator('section').last().innerText(),/Which kinds of meals do you buy/);
   await page.locator('input[name=takeawayMealMode][value=takeaway]').check();
   assert.equal(await page.locator('#takeawayAmountPeriod').count(),0);
   await page.locator('#takeawayOrder').fill('22');await page.getByRole('button',{name:'I only know my weekly total'}).click();assert.equal(await page.locator('#takeawayOrder').inputValue(),'');await page.getByRole('button',{name:'Use the cost of one meal instead'}).click();assert.equal(await page.locator('#takeawayOrder').inputValue(),'');
   await page.locator('#takeawayOrder').fill('30');
   await page.locator('#takeawayOrdersPerWeek').fill('4');
   await page.locator('#takeawaySwapPerWeek').fill('1');
   assert.equal(await page.locator('#takeawayReplacementCost').isVisible(),false,'Home-meal cost must not be a visible compulsory question');
   assert.match(await page.locator('section').last().innerText(),/Know what a home meal costs\? \(optional\)/);
   await page.locator('#takeaway-home-cost summary').click();
   assert.equal(await page.locator('#takeawayReplacementCost').isVisible(),true);
   assert.equal(await page.locator('#takeawayReplacementCost').inputValue(),'');
   assert.match(await page.locator('section').last().innerText(),/we won't guess a saving/i);
   await next(page);await next(page);
   assert.match(await page.locator('body').innerText(),/You can skip the home-meal cost/);
   await page.getByRole('button',{name:'Make my plan',exact:true}).click();
   await page.waitForURL('**/plan-preview');
   const takeaway=page.locator('#area-takeaway');
   if(!await takeaway.isVisible())await page.locator('details').filter({has:takeaway}).locator('summary').first().click();
   const report=await takeaway.innerText();
   assert.match(report,/Enter the cost of the meals you plan to replace and food at home/);
   assert.doesNotMatch(report,/Your goal:.*less a week/);
   await noOverflow(page);
  });
  await test('restaurant-only entry clears hidden takeaway amounts '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('takeaway-convenience');
   await page.locator('input[name=takeawayMealMode][value=both]').check();
   await page.locator('#takeawayOrder').fill('30');
   await page.locator('#restaurantOrder').fill('90');
   await page.locator('input[name=takeawayMealMode][value=restaurant]').check();
   assert.equal(await page.locator('#takeawayOrder').count(),0);
   assert.equal(await page.locator('#restaurantOrder').inputValue(),'90');
   await page.locator('#restaurantOrdersPerWeek').fill('5');
   await page.locator('#restaurantSwapPerWeek').fill('2');
   await page.locator('#restaurant-home-cost summary').click();await page.locator('#restaurantReplacementCost').fill('20');
   await next(page);await next(page);
   await page.getByRole('button',{name:'Make my plan',exact:true}).click();
   await page.waitForURL('**/plan-preview');
   const meal=page.locator('#area-takeaway');
   if(!await meal.isVisible())await page.locator('details').filter({has:meal}).locator('summary').first().click();
   assert.match(await meal.innerText(),/Cafés and restaurants/);
   assert.match(await meal.innerText(),/Possible total reduction: \$140 a week/);
   assert.doesNotMatch(await meal.innerText(),/Takeaway or delivery/);
   await noOverflow(page);
  });
  await test('paid money arrows move by a dollar and exact cents are retained '+viewport.width,async()=>{
    await go(page,'/personalise');
    await page.locator('#demo').selectOption('takeaway-convenience');
    await next(page);
    const weekly=page.locator('#convenienceWeekly');
    assert.equal(await weekly.getAttribute('step'),'1');
    await weekly.fill('25');
    await weekly.press('ArrowUp');
    assert.equal(await weekly.inputValue(),'26');
    await weekly.fill('26.75');
    await page.locator('#convenienceGoalWeekly').fill('20.50');
    await next(page);
    assert.match(await page.locator('body').innerText(),/\$26\.75 a week/);
    await page.getByRole('button',{name:'Check or edit small everyday buys'}).click();
    assert.equal(await page.locator('#convenienceWeekly').inputValue(),'26.75');

    await go(page,'/personalise');
    await page.locator('#demo').selectOption('subscriptions-insurance');
    await next(page);
    const premium=page.locator('#policy-cost-0');
    assert.equal(await premium.getAttribute('step'),'1');
    await page.locator('#policy-type-0').selectOption('Life or income protection');
    await page.locator('#policy-period-0').selectOption('month');
    await premium.fill('82.45');
    await next(page);
    assert.match(await page.locator('body').innerText(),/\$82\.45 per month/);
    await noOverflow(page);
   });
   await test('insurance renewal and optional cover details have clear meanings '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('subscriptions-insurance');
   await next(page);
   const screen=page.locator('section').first();
   assert.match(await screen.innerText(),/When does this insurance renew/);
   assert.match(await screen.innerText(),/even if you pay monthly/);
   await page.getByText('Add insurer and cover details (optional)',{exact:true}).click();
   const cover=page.getByPlaceholder('e.g. comprehensive car cover');
   await cover.waitFor({state:'visible'});
   assert.match(await screen.innerText(),/This is not the insurance type you chose above/);
   const dimensions=await cover.evaluate(el=>({field:el.getBoundingClientRect().width,parent:el.parentElement.getBoundingClientRect().width}));
   assert.ok(dimensions.field>=dimensions.parent-3,'Optional cover input should fill its field');
   await noOverflow(page);
  });
  await test('paid questions remember unused services and warn without blocking report '+viewport.width,async()=>{
   const extraContext=await browser.newContext({viewport});const paid=await extraContext.newPage();
   const answers=['Never','Yes — at least one unused','Within 6 months','Rarely','Within 6 months','Within 6 months','Rarely','Save more money'];
   await paid.goto(base+'/audit',{waitUntil:'networkidle'});
   await paid.evaluate(answers=>localStorage.setItem('spendshift_answers',JSON.stringify(answers)),answers);
   await paid.goto(base+'/personalise',{waitUntil:'networkidle'});
   await paid.getByRole('heading',{name:'Subscriptions'}).waitFor();
   assert.equal(await paid.locator('#unusedSubscriptionChoice').inputValue(),'yes','Free answer should already be selected');
   assert.match(await paid.locator('body').innerText(),/You mentioned an unused subscription\. Is that still right\?/);
   assert.match(await paid.locator('body').innerText(),/Skip any amount you don't know/);
   await paid.getByRole('button',{name:'Next',exact:true}).click();
   await paid.getByRole('heading',{name:"You're nearly done"}).waitFor();
   assert.match(await paid.locator('body').innerText(),/Its name and monthly price would help us calculate a possible saving/);
   assert.equal(await paid.getByRole('button',{name:'Make my plan'}).isEnabled(),true,'Unknown amounts must remain optional');
   await noOverflow(paid);
   await extraContext.close();
  });
  await test('next paid area remains in view after a long insurance form '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('subscriptions-insurance');
   await next(page);
   await page.getByRole('heading',{name:'Insurance',exact:true}).waitFor();
   for(let i=0;i<4;i++)await page.getByRole('button',{name:'Add another policy'}).click();
   await page.getByRole('button',{name:'Next',exact:true}).click();
   const heading=page.getByRole('heading',{name:"You're nearly done"});
   await heading.waitFor();
   await page.waitForTimeout(120);
   const box=await heading.boundingBox();
   assert.ok(box&&box.y>=-2&&box.y<viewport.height/2,'After a long area the review heading must be visible on screen: '+JSON.stringify(box));
   await noOverflow(page);
  });
  await test('meal motivation is neutral and does not assume overspending '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('takeaway-convenience');
   await page.locator('input[name=takeawayMealMode][value=takeaway]').check();
   assert.equal(await page.getByLabel('What is the main reason you choose these meals?').count(),1);
   assert.equal(await page.getByText('What makes it hard to eat out less?',{exact:true}).count(),0);
   await page.locator('#takeawayReason').selectOption('enjoy');
   assert.equal(await page.locator('#takeawayReason').inputValue(),'enjoy');
   await next(page);
   await noOverflow(page);
  });
  await test('first paid area has no Previous; later Previous stays in the paid form '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('all-seven');
   assert.equal(await page.getByRole('button',{name:'Previous question',exact:true}).count(),0);
   assert.equal(await page.getByText('Check or change my first answers',{exact:true}).count(),0);
   assert.match(await page.locator('body').innerText(),/Answer a few more questions/);
   await page.locator('input[name=takeawayMealMode][value=takeaway]').check();
   await page.locator('#takeawayOrder').fill('32');
   await page.locator('#takeawayOrdersPerWeek').fill('6');
   await next(page);
   assert.equal(await page.locator('section h2').last().innerText(),'Subscriptions');
   assert.equal(await page.getByRole('button',{name:'Previous question',exact:true}).count(),1);
   await page.getByRole('button',{name:'Previous question',exact:true}).click();
   assert.equal(await page.locator('section h2').last().innerText(),'Takeaway and eating out');
   assert.equal(await page.locator('#takeawayOrder').inputValue(),'32');
   assert.equal(await page.getByRole('button',{name:'Previous question',exact:true}).count(),0);
   assert.match(await page.locator('body').innerText(),/Skip any amount you don't know/);
   await noOverflow(page);
  });
  await test('guided all-seven questionnaire and report '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('all-seven');
   for(let step=0;step<7;step++){
    const heading=await page.locator('section h2').last().innerText();
    if(heading==='Takeaway and eating out'){
      await page.locator('input[name=takeawayMealMode][value=both]').check();
      await page.locator('#takeawayOrder').fill('30');
      await page.locator('#takeawayOrdersPerWeek').fill('4');
      await page.locator('#takeawaySwapPerWeek').fill('1');
      await page.locator('#takeaway-home-cost summary').click();await page.locator('#takeawayReplacementCost').fill('10');
      await page.locator('#restaurantOrdersPerWeek').fill('2');
      await page.locator('#restaurantOrder').fill('80');
      await page.locator('#restaurantSwapPerWeek').fill('1');
      await page.locator('#restaurant-home-cost summary').click();await page.locator('#restaurantReplacementCost').fill('20');
    }
    if(heading==='Subscriptions'){await page.locator('#subscriptionsMonthly').fill('70');await page.locator('#unusedSubscriptionChoice').selectOption('no');assert.equal(await page.locator('#unusedSubscriptionMonthly').count(),0);}
    if(heading==='Small everyday buys'){await page.locator('#convenienceWeekly').fill('100');assert.equal(await page.locator('#convenienceOverlap').count(),1);await page.locator('#convenienceOverlap').selectOption('no');assert.match(await page.locator('section').last().innerText(),/Do not count takeaway or restaurant meals here/);await page.locator('#convenienceGoalWeekly').fill('70');}
    if(heading==='Insurance'){assert.match(await page.locator('section').last().innerText(),/What insurance do you pay for/);assert.ok((await page.locator('#policy-period-0').boundingBox()).y < (await page.locator('#policy-cost-0').boundingBox()).y);await page.locator('#policy-type-0').selectOption('Car');await page.locator('#policy-period-0').selectOption('fortnight');await page.locator('#policy-cost-0').fill('70');await page.locator('#policy-renewal-0').selectOption('soon');assert.match(await page.locator('section').first().innerText(),/Combined yearly cost so far: \$1,820/);await page.getByRole('button',{name:'Add another policy'}).click();await page.locator('#policy-type-1').selectOption('CTP / Green Slip');await page.locator('#policy-period-1').selectOption('quarter');assert.match(await page.locator('section').first().innerText(),/covers only the 1 policy with a price/);await page.locator('#policy-cost-1').fill('250');assert.match(await page.locator('section').first().innerText(),/Combined yearly cost so far: \$2,820/);}
    if(heading==='Phone and internet'){await page.locator('input[name=phoneService][value=both]').check();await page.locator('#mobileMonthly').fill('55');await page.locator('#internetMonthly').fill('90');await page.locator('input[name=phoneService][value=not_sure]').check();assert.equal(await page.locator('#mobileMonthly').count(),0);assert.equal(await page.locator('#internetMonthly').count(),0);await page.locator('input[name=phoneService][value=mobile]').check();assert.equal(await page.locator('#mobileMonthly').inputValue(),'');await page.locator('#mobileMonthly').fill('55');assert.equal(await page.locator('#internetMonthly').count(),0);}
    if(heading==='Power and gas'){await page.locator('#state').selectOption('NSW');assert.ok((await page.locator('#electricityPeriod').boundingBox()).y < (await page.locator('#electricityBill').boundingBox()).y);await page.locator('#electricityPeriod').selectOption('quarter');await page.locator('#electricityBill').fill('520');await page.locator('#hasGas').selectOption('yes');assert.ok((await page.locator('#gasPeriod').boundingBox()).y < (await page.locator('#gasMonthly').boundingBox()).y);await page.locator('#gasPeriod').selectOption('quarter');await page.locator('#gasMonthly').fill('300');}
    if(heading==='Unplanned shopping'){await page.locator('#unplannedArea').selectOption('Online shopping');await page.locator('#shoppingTrigger').selectOption('I enjoy shopping');assert.equal(await page.locator('#shoppingTrigger').inputValue(),'I enjoy shopping');}
    await noOverflow(page);await next(page);
   }
   assert.equal(await page.getByRole('button',{name:'Previous question',exact:true}).count(),0,'Final review has no Previous question');
   assert.equal(await page.getByRole('button',{name:/^Check or edit /}).count(),7,'Seven review areas remain editable');
   await page.getByRole('button',{name:'Make my plan',exact:true}).click();await page.waitForURL('**/plan-preview');
   await page.waitForSelector('h1');const body=await page.locator('body').innerText();assert.match(body,/7 areas to check/);assert.match(body,/Your goal is to lower your bills/);
   const first=await page.locator('article h2').first().innerText();assert.equal(first,'Insurance');
   const subs=page.locator('#area-subscriptions');if(!await subs.isVisible())await page.locator('details').filter({has:subs}).locator('summary').first().click();assert.match(await subs.innerText(),/You pay about \$70 a month for subscriptions/);
   const takeaway=page.locator('#area-takeaway');if(!await takeaway.isVisible())await page.locator('details').filter({has:takeaway}).locator('summary').first().click();assert.match(await takeaway.innerText(),/Total usual weekly cost for the meals you listed: \$280/);assert.match(await takeaway.innerText(),/Possible total reduction: \$80 a week/);assert.match(await takeaway.innerText(),/Cafés and restaurants/);
   const shoppingCard=page.locator('#area-unplanned');if(!await shoppingCard.isVisible())await page.locator('details').filter({has:shoppingCard}).locator('summary').first().click();assert.match(await shoppingCard.innerText(),/fine to enjoy shopping/i);
   const insuranceCard=page.locator('#area-insurance');assert.match(await insuranceCard.innerText(),/\$2,820/);
   const energyCard=page.locator('#area-energy');assert.match(await energyCard.innerText(),/\$300 \/ 3 months/);
   await noOverflow(page);await page.screenshot({path:'test-artifacts/seven-area-plan-'+viewport.width+'.png',fullPage:true});
  });
  await test('optional tracker shows verified progress, prevents duplicates, and restores edits '+viewport.width,async()=>{
   const tracker=page.getByRole('region',{name:'See what your changes are worth'});
   assert.equal(await tracker.locator('form').count(),0,'Optional tracker must start compact');
   assert.match(await tracker.innerText(),/Nothing recorded yet/);
   await tracker.getByRole('button',{name:'Record my first change'}).click();
   let form=tracker.locator('#savings-progress-form');
   await form.getByLabel('Which part of your plan changed?').selectOption('subscriptions');
   await form.getByLabel('Before ($)',{exact:true}).fill('70');
   await form.getByLabel('Now ($)',{exact:true}).fill('50');
   await form.getByLabel('One-off switching or cancellation fees ($), if any').fill('5');
   await form.locator('input[type=date]').fill('2026-11-01');
   await form.locator('input[type=checkbox]').check();
   await form.getByRole('button',{name:'Save my change'}).click();
   assert.equal(await tracker.locator('form').count(),0,'Form collapses after a saved result');
   let totals=await tracker.locator('[aria-label="Your recorded spending changes"]').innerText();
   assert.match(totals,/\$20 less/,'Ongoing monthly reduction must exclude a one-off fee');
   assert.match(totals,/\$235 less/,'First-year illustration must include the one-off fee exactly once');
   assert.match(await tracker.innerText(),/not money already in your bank/);
   await page.reload({waitUntil:'networkidle'});
   const restored=page.getByRole('region',{name:'See what your changes are worth'});
   await restored.getByRole('button',{name:'Update my progress'}).waitFor();
   totals=await restored.locator('[aria-label="Your recorded spending changes"]').innerText();
   assert.match(totals,/\$235 less/,'Existing saved changes survive reload');
   await restored.getByRole('button',{name:'Update my progress'}).click();
   form=restored.locator('#savings-progress-form');
   await form.getByLabel('Which part of your plan changed?').selectOption('subscriptions');
   await form.getByLabel('Before ($)',{exact:true}).fill('70');
   await form.getByLabel('Now ($)',{exact:true}).fill('30');
   await form.locator('input[type=checkbox]').check();
   await form.getByRole('button',{name:'Save my change'}).click();
   assert.match(await form.getByRole('alert').innerText(),/already track this area/,'Must prevent double counting');
   await restored.getByRole('button',{name:'Close tracker form'}).click();
   await restored.getByRole('button',{name:'Edit'}).click();
   form=restored.locator('#savings-progress-form');
   await form.getByLabel('Now ($)',{exact:true}).fill('40');
   await form.locator('input[type=checkbox]').check();
   await form.getByRole('button',{name:'Save updated result'}).click();
   totals=await restored.locator('[aria-label="Your recorded spending changes"]').innerText();
   assert.match(totals,/\$30 less/);
   assert.match(totals,/\$355 less/);
   await noOverflow(page);
  });
  await test('one-off shopping stays separate from recurring savings '+viewport.width,async()=>{
   const c=await browser.newContext({viewport});const shopping=await c.newPage();
   await go(shopping,'/report-preview?customer=all-seven');
   const tracker=shopping.getByRole('region',{name:'See what your changes are worth'});
   await tracker.getByRole('button',{name:'Record my first change'}).click();
   let form=tracker.locator('#savings-progress-form');
   await form.getByLabel('Which part of your plan changed?').selectOption('unplanned');
   assert.equal(await form.getByLabel('How often are these costs paid?').count(),0,'One-off shopping must not ask for a recurring frequency');
   await form.getByLabel('Price of the purchase ($)').fill('60');
   await form.getByLabel('What you spent instead ($)').fill('0');
   await form.getByLabel('Other one-off costs ($), if any').fill('0');
   await form.locator('input[type=date]').fill('2026-11-01');
   await form.locator('input[type=checkbox]').check();
   await form.getByRole('button',{name:'Save my change'}).click();
   const oneOff=tracker.getByLabel('One-time spending change');
   assert.match(await oneOff.innerText(),/\$60 less/);
   assert.match(await oneOff.innerText(),/Not projected into monthly or yearly totals/);
   assert.equal(await tracker.getByLabel('Your recorded spending changes').count(),0,'One purchase must not display a false recurring total');
   await shopping.reload({waitUntil:'networkidle'});
   const restored=shopping.getByRole('region',{name:'See what your changes are worth'});
   assert.match(await restored.getByLabel('One-time spending change').innerText(),/\$60 less/,'One-time entries survive reload');
   await restored.getByRole('button',{name:'Update my progress'}).click();
   form=restored.locator('#savings-progress-form');
   await form.getByLabel('Which part of your plan changed?').selectOption('subscriptions');
   await form.getByLabel('Before ($)',{exact:true}).fill('70');
   await form.getByLabel('Now ($)',{exact:true}).fill('50');
   await form.locator('input[type=checkbox]').check();
   await form.getByRole('button',{name:'Save my change'}).click();
   const totals=await restored.getByLabel('Your recorded spending changes').innerText();
   assert.match(totals,/\$20 less/);
   assert.match(totals,/\$240 less/,'First-year total must include only recurring spending');
   assert.match(await restored.getByLabel('One-time spending change').innerText(),/\$60 less/);
   await noOverflow(shopping);
   await c.close();
  });
  await test('paid tracker excludes bills a buyer explicitly does not pay '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('household-bills');
   await page.locator('input[name=phoneService][value=mobile]').check();
   await page.locator('#mobileMonthly').fill('45');
   await next(page);
   await page.locator('#electricityPeriod').selectOption('quarter');
   await page.locator('#electricityBill').fill('400');
   await page.locator('#hasGas').selectOption('no');
   await next(page);
   await page.getByRole('button',{name:'Make my plan',exact:true}).click();
   await page.waitForURL('**/plan-preview');
   const tracker=page.getByRole('region',{name:'See what your changes are worth'});
   await tracker.getByRole('button',{name:/^(Record my first change|Update my progress)$/}).click();
   const opts=await tracker.getByLabel('Which part of your plan changed?').locator('option').allTextContents();
   assert.ok(opts.includes('Mobile phone')&&opts.includes('Electricity'));
   assert.equal(opts.includes('Home internet'),false,'Mobile-only customers should not see internet tracking');
   assert.equal(opts.includes('Gas'),false,'Customers who do not pay gas should not see gas tracking');
   await noOverflow(page);
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
  await test('unconfirmed small-buy overlap is not called a saving '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('takeaway-convenience');
   await page.locator('input[name=takeawayMealMode][value=takeaway]').check();
   await page.locator('#takeawayOrder').fill('30');
   await page.locator('#takeawayOrdersPerWeek').fill('4');
   await page.locator('#takeawaySwapPerWeek').fill('1');
   await page.locator('#takeaway-home-cost summary').click();await page.locator('#takeawayReplacementCost').fill('10');
   await next(page);
   assert.equal(await page.locator('#convenienceOverlap').inputValue(),'');
   await page.locator('#convenienceWeekly').fill('100');
   await page.locator('#convenienceGoalWeekly').fill('70');
   await page.locator('#convenienceOverlap').selectOption('yes');
   await next(page);
   assert.match(await page.locator('body').innerText(),/small-buy total leaves out takeaway/);
   await page.getByRole('button',{name:'Make my plan',exact:true}).click();
   await page.waitForURL('**/plan-preview');
   const card=page.locator('#area-convenience');
   if(!await card.isVisible())await page.locator('details').filter({has:card}).locator('summary').first().click();
   assert.match(await card.innerText(),/haven't added a saving for small buys/);
   assert.doesNotMatch(await card.innerText(),/Your goal:.*less each week/);
   await noOverflow(page);
  });
  await test('new insurance and power costs ask for payment periods '+viewport.width,async()=>{
   await go(page,'/personalise');await page.locator('#demo').selectOption('household-bills');
   await next(page);
   assert.equal(await page.locator('#electricityPeriod').inputValue(),'');
   await page.locator('#electricityBill').fill('500');
   await page.getByRole('button',{name:'Next',exact:true}).click();
   assert.match(await page.locator('p[role="alert"]').innerText(),/power bill covers/);
   await page.locator('#electricityPeriod').selectOption('quarter');
   await next(page);
   await go(page,'/personalise');await page.locator('#demo').selectOption('subscriptions-insurance');
   await next(page);
   assert.equal(await page.locator('#policy-period-0').inputValue(),'');
   await page.locator('#policy-type-0').selectOption('Car');
   await page.locator('#policy-cost-0').fill('100');
   await page.getByRole('button',{name:'Next',exact:true}).click();
   assert.match(await page.locator('p[role="alert"]').innerText(),/insurance policy/);
   await page.locator('#policy-period-0').selectOption('month');
   await next(page);
   await noOverflow(page);
  });
  await test('known bills and missing amounts get useful paid actions '+viewport.width,async()=>{
    await go(page,'/report-preview?customer=household-bills');
    const known=await page.locator('body').innerText();
    assert.match(known,/mobile at \$44\.9 a month and home internet at \$79\.95 a month/);
    assert.match(known,/latest power bill was \$425\.5 for 3 months/);
    await go(page,'/personalise');await page.locator('#demo').selectOption('household-bills');
    await next(page);await next(page);
    await page.getByRole('button',{name:'Make my plan',exact:true}).click();
    await page.waitForURL('**/plan-preview');
    const sparse=await page.locator('body').innerText();
    assert.match(sparse,/Don't know your bill amounts\?/);
    assert.match(sparse,/provider's app or latest bill/);
    assert.match(sparse,/units used \(kWh for power or MJ for gas\)/);
    await noOverflow(page);
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
 await test('paid drafts save, reload and go back within paid questions',async()=>{
  await go(page,'/success?session_id='+session);await page.waitForURL('**/personalise?**');
  assert.match(await page.locator('body').innerText(),/You've already paid\. No extra charge/);
  assert.equal(await page.getByRole('button',{name:'Previous question',exact:true}).count(),0);
  await page.locator('input[name=takeawayMealMode][value=takeaway]').check();
  await page.locator('#takeawayOrder').fill('120');
  await page.waitForTimeout(1300);
  await page.getByRole('status').filter({hasText:'Saved.'}).waitFor();
  assert.equal(saved.details.takeawayOrder,'120');
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#takeawayOrder');
  assert.equal(await page.locator('#takeawayOrder').inputValue(),'120');
  assert.equal(await page.getByRole('button',{name:'Previous question',exact:true}).count(),0);
  await next(page);
  assert.equal(await page.locator('section h2').last().innerText(),'Subscriptions');
  assert.equal(await page.getByRole('button',{name:'Previous question',exact:true}).count(),1);
  await page.getByRole('button',{name:'Previous question',exact:true}).click();
  assert.equal(await page.locator('#takeawayOrder').inputValue(),'120');
  assert.equal(await page.getByRole('button',{name:'Previous question',exact:true}).count(),0);
  await next(page);
  assert.equal(await page.locator('section h2').last().innerText(),'Subscriptions');
 });
 await test('paid Next is immediate even when saving is blocked, and answers survive reload',async()=>{
  const slowContext=await browser.newContext({viewport:{width:375,height:812}});
  const slowPage=await slowContext.newPage();
  slowPage.setDefaultTimeout(10000);
  const slowSession='cs_test_slow_draft_navigation_fixture';
  let slowRevision='2026-11-14T12:00:00.000Z',slowSaved=null,slowWrites=0;
  let releaseFirstSave=()=>{};
  const firstSaveGate=new Promise(resolve=>{releaseFirstSave=resolve;});
  await slowPage.route('**/api/payment-status?**',route=>route.fulfill({json:{
   paid:true,answers:getAnswers(),status:'awaiting_details',reportId:null,
   refinements:slowSaved?{version:1,draft:slowSaved}:null,revision:slowRevision,
  }}));
  await slowPage.route('**/api/personalisation/draft',async route=>{
   const body=route.request().postDataJSON();
   if(body.revision!==slowRevision){
    await route.fulfill({status:409,json:{error:'This plan changed in another tab. Reload before editing.'}});
    return;
   }
   slowWrites++;
   if(slowWrites===1)await firstSaveGate;
   slowSaved=body.draft;
   slowRevision=new Date(Date.UTC(2026,10,14,12,0,slowWrites)).toISOString();
   await route.fulfill({json:{saved:true,revision:slowRevision}});
  });
  try{
   await go(slowPage,'/personalise?session_id='+slowSession);
   await slowPage.locator('input[name=takeawayMealMode][value=takeaway]').check();
   await slowPage.locator('#takeawayOrder').fill('120');
   await slowPage.getByRole('button',{name:'Next',exact:true}).click();
   await slowPage.locator('#subscriptionsMonthly').waitFor({timeout:1500});
   assert.equal(slowSaved,null,'Question navigation must not wait for a network save');
   await slowPage.locator('#subscriptionsMonthly').fill('75');
   await slowPage.getByRole('button',{name:'Next',exact:true}).click();
   await slowPage.locator('#convenienceWeekly').waitFor({timeout:1500});
   assert.equal(slowSaved,null,'A second Next must also work while the first save is pending');
   releaseFirstSave();
   await slowPage.getByRole('status').filter({hasText:'Saved.'}).waitFor({timeout:12000});
   assert.equal(slowSaved.details.takeawayOrder,'120');
   assert.equal(slowSaved.details.subscriptionsMonthly,'75');
   assert.equal(slowSaved.step,2);
   await slowPage.reload({waitUntil:'networkidle'});
   await slowPage.locator('#convenienceWeekly').waitFor();
   await slowPage.getByRole('button',{name:'Previous question',exact:true}).click();
   assert.equal(await slowPage.locator('#subscriptionsMonthly').inputValue(),'75');
   await slowPage.getByRole('button',{name:'Previous question',exact:true}).click();
   assert.equal(await slowPage.locator('#takeawayOrder').inputValue(),'120');
  }finally{releaseFirstSave();await slowContext.close();}
 });
 await test('revision conflicts show a clear error',async()=>{
  revision='2026-11-10T10:00:00.000Z';
  await page.locator('#subscriptionsMonthly').fill('70');
  await page.waitForTimeout(1300);
  assert.match(await page.locator('p[role="alert"]').innerText(),/another tab/);
 });
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
   assert.equal(request.additionalArea,null);
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
   await buyer.getByRole('button',{name:auditLabel(high[i]),exact:true}).click();
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
   const heading=await buyer.locator('section h2').last().innerText();
   if(heading==='Takeaway and eating out'){
    await buyer.locator('input[name=takeawayMealMode][value=both]').check();
    await buyer.locator('#takeawayOrder').fill('30');
    await buyer.locator('#takeawayOrdersPerWeek').fill('4');
    await buyer.locator('#takeawaySwapPerWeek').fill('1');
    await buyer.locator('#takeaway-home-cost summary').click();await buyer.locator('#takeawayReplacementCost').fill('10');
    await buyer.locator('#restaurantOrdersPerWeek').fill('2');
    await buyer.locator('#restaurantOrder').fill('80');
    await buyer.locator('#restaurantSwapPerWeek').fill('1');
    await buyer.locator('#restaurant-home-cost summary').click();await buyer.locator('#restaurantReplacementCost').fill('20');
    await buyer.locator('#takeawayReason').selectOption('busy');
   }
   if(heading==='Subscriptions'){
    assert.equal(await buyer.locator('#unusedSubscriptionChoice').inputValue(),'yes','A free unused-service answer should carry into the paid questions without a second decision');
    await buyer.locator('#subscriptionsMonthly').fill('70');
    await buyer.locator('#unusedSubscriptionChoice').selectOption('no');
   }
   if(heading==='Insurance'){
    await buyer.locator('#policy-type-0').selectOption('Car');
    await buyer.locator('#policy-period-0').selectOption('year');await buyer.locator('#policy-cost-0').fill('1800');
    await buyer.locator('#policy-renewal-0').selectOption('soon');
   }
   if(heading==='Small everyday buys'){
    await buyer.locator('#convenienceWeekly').fill('100');
    assert.equal(await buyer.locator('#convenienceOverlap').count(),1);
    await buyer.locator('#convenienceOverlap').selectOption('no');await buyer.locator('#convenienceGoalWeekly').fill('70');
   }
   if(heading==='Phone and internet'){
    await buyer.locator('input[name=phoneService][value=mobile]').check();
    await buyer.locator('#mobileMonthly').fill('55');
   }
   if(heading==='Power and gas'){
    await buyer.locator('#state').selectOption('NSW');
    await buyer.locator('#electricityPeriod').selectOption('quarter');await buyer.locator('#electricityBill').fill('520');
    await buyer.locator('#hasGas').selectOption('no');
   }
   if(heading==='Unplanned shopping'){
    await buyer.locator('#unplannedArea').selectOption('Online shopping');
    await buyer.locator('#shoppingTrigger').selectOption('Social media');
   }
   await buyer.getByRole('button',{name:'Next',exact:true}).click();
   // Save happens asynchronously; never read a previous question as the next one.
   await buyer.waitForFunction(previous=>{
     const heads=document.querySelectorAll('section h2');
     const h=heads[heads.length-1];
     return Boolean(h && h.textContent?.trim()!==previous);
   },heading,{timeout:16000});
  }
  assert.match(await buyer.locator('body').innerText(),/nearly done/i);
  assert.ok(customerWrites>=7);
   assert.equal(await buyer.getByRole('button',{name:'Previous question',exact:true}).count(),0,'Paid review has no Previous button');
   assert.equal(await buyer.getByRole('button',{name:/^Check or edit /}).count(),7,'Paid review areas remain editable');
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
  assert.match(report,/Total usual weekly cost for the meals you listed: \$280/i);
  assert.match(report,/not much time|quickly|busy nights/i);
  assert.match(report,/Possible total reduction: \$80 a week/);
  assert.match(report,/See what your changes are worth/);
  assert.match(report,/Record my first change/);
  assert.equal(customerCheckout,1);
  await noOverflow(buyer);
  await buyer.screenshot({path:'test-artifacts/first-time-customer-full-journey.png',fullPage:true});
 });
 await buyerContext.close();
 console.log('Browser checks: '+tests+' groups passed. Provider payment/draft replies were mocked; no real Stripe payment or email was sent.');
 fs.writeFileSync('test-artifacts/browser-summary.json',JSON.stringify({groupsPassed:tests,desktopWidth:1280,mobileWidth:375,providerMode:'mocked',realStripePaymentTested:false,emailDeliveryTested:false},null,2));
}catch(error){fs.writeFileSync('test-artifacts/server-log.txt',logs);console.error(error);process.exitCode=1;}finally{await browser?.close().catch(()=>{});server.kill('SIGTERM');process.exit(process.exitCode || 0);}
