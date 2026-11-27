"""Isolated actual product and synthetic checkout; never use production services."""
import json,os,subprocess,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];base='http://127.0.0.1:3162'
assert os.environ.get('SPENDSHIFT_PURCHASE_ATTRIBUTION_FIXTURE')=='true'
assert os.environ.get('SUPABASE_SERVICE_ROLE_KEY')=='ci-placeholder-not-a-real-key'
assert os.environ.get('STRIPE_SECRET_KEY')=='sk_test_ci_placeholder'
app=subprocess.Popen(['node','node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3162'],cwd=root)
tag='/?utm_source=instagram&utm_medium=paid_social&utm_campaign=meta_founder_v1&utm_content=creative_01&fbclid=synthetic-never-stored'
answers=['Almost daily','Yes, at least one is unused','Never','Daily',"I honestly don't know","I honestly don't know",'Almost daily','Lower my bills']
notice='[data-ss-privacy-notice="basic"]'
try:
    for _ in range(90):
        try:
            with urllib.request.urlopen(base+'/',timeout=1) as r:
                if r.status==200:break
        except Exception:time.sleep(1)
    else:raise RuntimeError('local app not ready')
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for mode in ['accept','reject','ignore','old_grant','old_basic_off','excluded','withdraw','expired']:
            ctx=browser.new_context(viewport={'width':390,'height':844})
            payloads=[];external=[];events=[]
            if mode in ['old_grant','old_basic_off']:
                pref={'version':'2026-11-v2','basicOff':mode=='old_basic_off','legacyTransition':False,'analytics':'granted','ads':'denied'}
                ctx.add_init_script('if(localStorage.getItem("spendshift_privacy_v2")===null)localStorage.setItem("spendshift_privacy_v2",'+json.dumps(json.dumps(pref))+')')
            def route(r):
                u=r.request.url
                if u==base+'/api/analytics-v2':
                    events.append(r.request.post_data_json);r.fulfill(status=403 if mode=='excluded' else 204)
                elif u==base+'/api/checkout':
                    payloads.append(r.request.post_data_json);r.fulfill(status=200,content_type='application/json',body='{"url":"https://checkout.stripe.com/c/pay/cs_test_synthetic"}')
                elif u=='https://checkout.stripe.com/c/pay/cs_test_synthetic':r.fulfill(status=200,content_type='text/html',body='<h1>Synthetic checkout</h1>')
                elif not u.startswith(base+'/'):external.append(u);r.abort()
                elif r.request.method not in ('GET','HEAD'):r.fulfill(status=204)
                else:r.continue_()
            ctx.route('**/*',route);page=ctx.new_page();page.goto(base+tag,wait_until='domcontentloaded');page.wait_for_timeout(1200)
            assert page.locator('html').get_attribute('data-ss-purchase-attribution')=='v1'
            if mode in ['accept','reject','ignore','excluded','withdraw','expired']:
                n=page.locator(notice);n.wait_for()
                assert 'linking your marketing source to a purchase' in n.inner_text()
                if mode!='ignore':
                    choice='Reject optional cookies' if mode=='reject' else 'Accept optional cookies'
                    n.get_by_role('button',name=choice,exact=True).click();n.wait_for(state='hidden')
            if mode in ['accept','withdraw','expired']:
                page.wait_for_function("sessionStorage.getItem('spendshift_purchase_attribution_context_v1')!==null")
                context=page.evaluate("JSON.parse(sessionStorage.getItem('spendshift_purchase_attribution_context_v1'))")
                assert context['labels']=={'source':'instagram','campaign':'meta_founder_v1','creative':'creative_01'} and 'synthetic-never-stored' not in json.dumps(context)
            else:assert page.evaluate("sessionStorage.getItem('spendshift_purchase_attribution_context_v1')") is None,mode
            page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit');page.get_by_text('Question 1 of 8',exact=True).wait_for()
            for i,answer in enumerate(answers):
                page.get_by_role('button',name=answer,exact=True).click()
                page.get_by_role('button',name='See my free results' if i==7 else 'Next question',exact=True).click()
                if i<7:page.get_by_text('Question '+str(i+2)+' of 8',exact=True).wait_for()
            page.wait_for_url('**/results');offer=page.locator('#unlock-full-report');offer.wait_for()
            if mode=='withdraw':
                page.get_by_role('button',name='Privacy settings',exact=True).click()
                page.get_by_role('button',name='Reject optional cookies',exact=True).click()
                page.locator(notice).wait_for(state='hidden')
            if mode=='expired':page.evaluate("(()=>{const k='spendshift_purchase_attribution_context_v1';const v=JSON.parse(sessionStorage.getItem(k));v.captured=Date.now()-7200001;sessionStorage.setItem(k,JSON.stringify(v))})()")
            offer.scroll_into_view_if_needed();page.locator('input[type=checkbox]').last.check()
            page.get_by_role('button',name='Get my savings plan for A$29').click();page.wait_for_url('https://checkout.stripe.com/**')
            assert len(payloads)==1 and not external,(mode,external)
            label=payloads[0].get('marketingAttribution')
            if mode=='accept':assert label=={'source':'instagram','campaign':'meta_founder_v1','creative':'creative_01','notice':'purchase_attribution_v1'},label
            else:assert label is None,(mode,label)
            assert 'synthetic-never-stored' not in json.dumps(payloads)
            print('PASS actual product attribution: '+mode,flush=True);ctx.close()
        browser.close()
finally:app.terminate();app.wait(timeout=10)
