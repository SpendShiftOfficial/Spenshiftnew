"""Real local Next.js pages, real disposable PostgreSQL, fake checkout. No live credentials."""
import os, subprocess, time, json, base64, urllib.request, urllib.error
from collections import Counter
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
origin='http://127.0.0.1:3162'
assert os.environ.get('PGHOST')=='127.0.0.1' and os.environ.get('PGDATABASE')=='analytics_v2_test'
assert os.environ.get('SPENDSHIFT_ANALYTICS_V2_FIXTURE')=='true'
assert os.environ.get('SUPABASE_SERVICE_ROLE_KEY')=='ci-placeholder-not-a-real-key'
assert os.environ.get('STRIPE_SECRET_KEY')=='sk_test_ci_placeholder'
bridge=subprocess.Popen(['node','scripts/analytics-v2-fixture/db-bridge.mjs'],cwd=root)
app=subprocess.Popen(['node','node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3162'],cwd=root)
count=0
def wait_server():
    for _ in range(90):
        try:
            with urllib.request.urlopen(origin+'/',timeout=1) as r:
                if r.status==200:return
        except Exception:time.sleep(1)
    raise RuntimeError('local app not ready')
def sql(q):
    return subprocess.check_output(['psql','-X','-qAt','-v','ON_ERROR_STOP=1','-c',q],text=True).strip()
def totals():
    return json.loads(sql("SELECT COALESCE(json_object_agg(metric_code,event_count),'{}'::json) FROM public.spendshift_metrics_v2_daily WHERE dimension_code='all'"))
def http(path,auth=False):
    req=urllib.request.Request(origin+path,headers={'Authorization':'Basic '+base64.b64encode(b'fixture:synthetic-only').decode()} if auth else {})
    try:
        with urllib.request.urlopen(req,timeout=5) as r:return r.status,r.read().decode(),r.headers
    except urllib.error.HTTPError as e:return e.code,e.read().decode(),e.headers
try:
    wait_server()
    unauth=http('/internal/analytics');assert unauth[0]==401,('dashboard authentication',unauth[0],unauth[1][:200])
    invalid=http('/internal/analytics?period=invalid',True);assert invalid[0]==400,('dashboard period',invalid[0])
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        def setup(legacy=None):
            ctx=browser.new_context(viewport={'width':390,'height':844})
            if legacy:ctx.add_init_script('if(localStorage.getItem("spendshift_cookie_consent")===null)localStorage.setItem("spendshift_cookie_consent",'+json.dumps(legacy)+')')
            sent=[]; replies=[]; external=[]
            def intercept(route):
                url=route.request.url
                if url.startswith(origin+'/api/checkout') and route.request.method=='POST':
                    route.fulfill(status=200,content_type='application/json',body=json.dumps({'url':'https://checkout.stripe.com/c/pay/cs_test_synthetic'}))
                elif url=='https://checkout.stripe.com/c/pay/cs_test_synthetic':
                    route.fulfill(status=200,content_type='text/html',body='<h1>Synthetic Stripe checkout</h1>')
                elif not url.startswith(origin+'/'):
                    external.append(url);route.abort()
                else:route.continue_()
            ctx.route('**/*',intercept)
            def on_request(req):
                if req.url==origin+'/api/analytics-v2' and req.method=='POST':sent.append(req.post_data_json)
            def on_response(res):
                if res.url==origin+'/api/analytics-v2':replies.append(res.status)
            page=ctx.new_page();page.on('request',on_request);page.on('response',on_response)
            return ctx,page,sent,replies,external
        for choice in ['Accept optional','Reject optional',None]:
            before=totals()
            ctx,page,sent,replies,external=setup()
            page.goto(origin+'/?utm_source=instagram&utm_campaign=meta_founder_v1&fbclid=syntheticprivate')
            page.locator('[data-ss-privacy-notice="basic"]').wait_for()
            page.wait_for_timeout(1300)
            if choice:page.get_by_role('button',name=choice,exact=True).click()
            page.locator('[data-ss-cta=hero]').click()
            page.wait_for_url('**/audit')
            page.get_by_text('Question 1 of 8',exact=True).wait_for()
            page.wait_for_timeout(400)
            answers=['Almost daily','Yes, at least one is unused','Never','Daily',"I honestly don't know","I honestly don't know",'Almost daily','Lower my bills']
            for i,answer in enumerate(answers):
                page.get_by_role('button',name=answer,exact=True).click()
                page.get_by_role('button',name='See my free results' if i==7 else 'Next question',exact=True).click()
                if i<7:page.get_by_text('Question '+str(i+2)+' of 8',exact=True).wait_for()
            page.wait_for_url('**/results');page.locator('#unlock-full-report').wait_for();page.locator('#unlock-full-report').scroll_into_view_if_needed();page.wait_for_timeout(500)
            page.locator('input[type=checkbox]').last.check()
            page.get_by_role('button',name='Get my savings plan for A$29').click()
            page.wait_for_url('https://checkout.stripe.com/**')
            page.wait_for_timeout(1000)
            c=Counter(x['event'] for x in sent)
            for e in ['site_entry','public_cta_click','audit_arrival','audit_start','audit_complete','results_view','upgrade_cta_click','checkout_opened']:assert c[e]==1,(choice,e,c,sent)
            assert c['audit_question_seen']==8 and c['audit_question_advanced']==8,(choice,c)
            assert c['upgrade_offer_view']==1,(choice,c)
            entry=next(x for x in sent if x['event']=='site_entry');assert entry['source']=='instagram' and entry['campaign']=='meta_founder_v1',entry
            assert all(s==204 for s in replies),(choice,replies)
            assert 'syntheticprivate' not in json.dumps(sent) and 'Almost daily' not in json.dumps(sent)
            assert not external,external
            after=totals()
            for e in ['site_entry','audit_arrival','audit_start','audit_complete','results_view','checkout_opened']:assert after.get(e,0)-before.get(e,0)==1,(choice,e,after,before)
            ctx.close();count+=1
        for legacy in ['denied','granted']:
            ctx,page,sent,replies,external=setup(legacy)
            page.goto(origin+'/');page.wait_for_timeout(900);assert not sent
            page.get_by_role('button',name='Reject optional',exact=True).click();page.wait_for_timeout(700);assert not sent
            page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit');page.wait_for_timeout(600);assert not sent
            assert page.evaluate('localStorage.getItem("spendshift_cookie_consent")')=='denied'
            page.get_by_role('button',name='Privacy settings',exact=True).click()
            page.get_by_role('button',name='Explicitly enable basic statistics').click();page.wait_for_timeout(700);assert any(x['event']=='audit_arrival' for x in sent)
            page.get_by_role('button',name='Turn off basic statistics').click();page.wait_for_timeout(400);n=len(sent)
            page.get_by_role('button',name='Almost daily',exact=True).click();page.get_by_role('button',name='Next question',exact=True).click();page.wait_for_timeout(500)
            assert len(sent)==n and page.get_by_text('Question 2 of 8',exact=True).is_visible()
            ctx.close();count+=1
        ctx,page,sent,replies,external=setup()
        page.goto(origin+'/results');page.wait_for_timeout(700)
        assert not any(x['event']=='results_view' for x in sent)
        assert page.get_by_role('heading',name="Let's start with your free check.").is_visible()
        ctx.close();count+=1
        browser.close()
    status,body,headers=http('/internal/analytics?period=today',True)
    assert status==200 and 'SYNTHETIC DATA ONLY' in body and 'Website arrivals' in body
    assert 'no-store' in headers.get('Cache-Control','') and 'noindex' in headers.get('X-Robots-Tag','')
    assert 'Question breakdown suppressed' in body
    assert 'Refund-adjusted gross (not profit)' in body and '$97.00' in body
    assert 'Stripe paid orders' in body and '$126.00' in body
    print('PASS '+str(count)+' real local product browser journeys with database persistence; protected dashboard and sparse-cell suppression')
finally:
    app.terminate();bridge.terminate()
    app.wait(timeout=10);bridge.wait(timeout=10)
