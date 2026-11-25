"""No real provider connections or credentials. Test first-party-only candidate on loopback."""
import os, subprocess, time, json, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];origin='http://127.0.0.1:3162'
assert os.environ.get('SPENDSHIFT_ANALYTICS_V2_FIXTURE')=='true'
assert os.environ.get('SPENDSHIFT_ANALYTICS_V2_OWNER_FIXTURE')=='true'
assert os.environ.get('SUPABASE_SERVICE_ROLE_KEY')=='ci-placeholder-not-a-real-key' and os.environ.get('STRIPE_SECRET_KEY')=='sk_test_ci_placeholder'
app=subprocess.Popen(['node','node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3162'],cwd=root)
def wait_server():
    for _ in range(90):
        try:
            with urllib.request.urlopen(origin+'/',timeout=1) as r:
                if r.status==200:return
        except Exception:time.sleep(1)
    raise RuntimeError('local app not ready')
def pref(a,b,off=False):return {'version':'2026-11-v2','basicOff':off,'legacyTransition':False,'analytics':a,'ads':b}
def no_trackers(page):
    assert not page.locator('script[id^=ss-v2-]').count()
    assert not page.evaluate("Array.from(document.scripts).some(s=>s.src && new URL(s.src,location.href).origin!==location.origin)")
    assert page.evaluate('window.__syntheticVendorCalls||0')==0
def open_page(page,path):
    resp=page.goto(origin+path,wait_until='domcontentloaded')
    assert resp and resp.status==200,(path,resp.status if resp else None)
    csp=resp.headers.get('content-security-policy','')
    assert "script-src 'self'" in csp and "connect-src 'self'" in csp and "frame-src 'none'" in csp,(path,csp)
    page.wait_for_timeout(700);no_trackers(page)
    return csp
try:
    wait_server()
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True);cases=0
        def setup(legacy=None,preference=None):
            ctx=browser.new_context(viewport={'width':390,'height':844})
            state={'legacy':legacy,'pref':preference}
            ctx.add_init_script(script="(()=>{const x="+json.dumps(state)+"; if(x.pref!==null&&localStorage.getItem('spendshift_privacy_v2')===null)localStorage.setItem('spendshift_privacy_v2',x.pref);if(x.legacy!==null&&localStorage.getItem('spendshift_cookie_consent')===null)localStorage.setItem('spendshift_cookie_consent',x.legacy);window.__syntheticVendorCalls=0;const spy=()=>window.__syntheticVendorCalls++;window.gtag=spy;window.fbq=spy;window.clarity=spy;window.ttq={track:spy,page:spy};window.__spendshiftPublicTracking=true;window.__ssV2Providers={analytics:true,ads:true};})()")
            external=[];basic=[];old=[];all_requests=[]
            def route(r):
                u=r.request.url;all_requests.append(u)
                if not u.startswith(origin+'/'):external.append(u);r.abort()
                elif '/api/analytics-v2' in u:basic.append(r.request.post_data_json);r.fulfill(status=204)
                elif '/api/audit-metric' in u:old.append(r.request.post_data_json);r.fulfill(status=204)
                else:r.continue_()
            ctx.route('**/*',route)
            return ctx,ctx.new_page(),external,basic,old,all_requests
        scenarios=[(None,None,True,False),('granted',None,False,True),('denied',None,False,False),(None,json.dumps(pref('granted','granted')),True,True),(None,json.dumps(pref('denied','granted')),True,False),('granted',json.dumps(pref('denied','denied')),False,False),(None,json.dumps(pref('granted','granted',True)),False,True),('granted','bad-json',False,False)]
        for legacy,preference,expect_basic,expect_old in scenarios:
            ctx,page,external,basic,old,requests=setup(legacy,preference)
            open_page(page,'/?utm_source=instagram&utm_campaign=meta_founder_v1&fbclid=synthetic_click')
            page.get_by_text('Test environment only — privacy choices').wait_for()
            assert bool(basic)==expect_basic,(legacy,preference,basic)
            assert not external
            page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit');page.get_by_text('Question 1 of 8',exact=True).wait_for();page.wait_for_timeout(700)
            no_trackers(page);assert bool(old)==expect_old,(legacy,preference,old)
            assert not external and 'synthetic_click' not in json.dumps(basic)
            ctx.close();cases+=1
        ctx,page,external,basic,old,requests=setup()
        open_page(page,'/')
        page.get_by_role('button',name='Accept optional',exact=True).click()
        page.wait_for_timeout(400)
        saved=page.evaluate("JSON.parse(localStorage.getItem('spendshift_privacy_v2'))")
        assert saved['analytics']=='granted' and saved['ads']=='denied' and page.evaluate("localStorage.getItem('spendshift_cookie_consent')") is None
        page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit')
        page.get_by_role('button',name='Almost daily',exact=True).click();page.get_by_role('button',name='Next question',exact=True).click();page.get_by_text('Question 2 of 8',exact=True).wait_for()
        page.wait_for_timeout(500)
        # Verify an actual saved synthetic draft is still present. No storage purge.
        draft=page.evaluate("localStorage.getItem('spendshift_free_draft_v2')")
        assert draft and 'Almost daily' in draft,draft
        other=ctx.new_page();open_page(other,'/')
        assert other.evaluate("localStorage.getItem('spendshift_free_draft_v2')")==draft
        # CSP must enforce denial of external scripts and connections on public pages.
        result=other.evaluate("""async()=>{
          const seen=[];document.addEventListener('securitypolicyviolation',e=>seen.push(e.effectiveDirective));
          const script=document.createElement('script');script.src='https://measurement.invalid/probe.js';document.head.append(script);
          try{await fetch('https://measurement.invalid/probe',{mode:'no-cors'});}catch{}
          await new Promise(r=>setTimeout(r,350));return seen;
        }""")
        assert any(x.startswith('script-src') for x in result) and 'connect-src' in result,result
        assert not external,external
        # All-off must propagate across tabs and block both v1 and v2 without affecting the saved draft.
        other.get_by_role('button',name='Turn off all statistics',exact=True).click();other.wait_for_timeout(500)
        page.wait_for_timeout(500);n,m=len(basic),len(old)
        page.get_by_role('button',name='Yes, at least one is unused',exact=True).click();page.get_by_role('button',name='Next question',exact=True).click();page.get_by_text('Question 3 of 8',exact=True).wait_for();page.wait_for_timeout(700)
        assert (len(basic),len(old))==(n,m),(basic,old)
        assert 'Almost daily' not in json.dumps(basic) and 'Almost daily' not in json.dumps(old)
        no_trackers(other);no_trackers(page);assert not external
        ctx.close();cases+=1
        ctx,page,external,basic,old,requests=setup('granted')
        open_page(page,'/');page.get_by_role('button',name='Reject optional',exact=True).click()
        assert page.evaluate("localStorage.getItem('spendshift_cookie_consent')")=='denied'
        page.get_by_role('button',name='Explicitly enable basic statistics',exact=True).click();page.wait_for_timeout(700)
        assert basic and not old
        no_trackers(page);ctx.close();cases+=1
        # Public guides and legal pages also have the site-wide policy, not just the audit.
        ctx,page,external,basic,old,requests=setup('granted')
        for path in ['/pricing','/how-it-works','/whats-included','/why-spendshift','/services','/save-money-australia','/reduce-electricity-bill-australia','/cancel-unused-subscriptions-australia','/privacy-policy','/cookies','/results','/personalise']:
            csp=open_page(page,path);assert 'https://isbmbayaorsfujexejku.supabase.co' not in csp
        assert not external
        ctx.close();cases+=1
        ctx,page,external,basic,old,requests=setup('granted')
        csp=open_page(page,'/internal/analytics/access')
        assert "connect-src 'self' https://isbmbayaorsfujexejku.supabase.co" in csp
        page.get_by_role('heading',name='Owner sign-in').wait_for()
        assert page.get_by_label('Email',exact=True).is_visible() and page.get_by_label('Password',exact=True).is_visible()
        assert not page.get_by_role('heading',name='Acquisition funnel').count()
        assert not basic and not old and not external
        for path in ['/internal/analytics','/internal/analytics?format=json&period=today']:
            response=ctx.request.get(origin+path);assert response.status==401 and response.text()==''
            response=ctx.request.get(origin+path,headers={'Authorization':'Bearer invalid'});assert response.status==401 and response.text()==''
            assert 'no-store' in response.headers.get('cache-control','')
        response=ctx.request.post(origin+'/internal/analytics/finance',data={'date':'2026-11-25','source':'ga4','values':{'ga4_sessions':1}});assert response.status==404
        assert not page.evaluate("Object.keys(localStorage).some(k=>k.includes('auth')||k.includes('owner'))||Object.keys(sessionStorage).some(k=>k.includes('auth')||k.includes('owner'))")
        ctx.close();browser.close();cases+=1
        print('PASS '+str(cases)+' first-party-only real browser cases: old choices, saved draft, CSP denial, cross-tab opt-out, public/private pages and locked owner interface')
finally:app.terminate();app.wait(timeout=10)
