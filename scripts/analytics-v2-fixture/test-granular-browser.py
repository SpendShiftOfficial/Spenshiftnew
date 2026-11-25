"""Real localhost browser privacy tests. Inert scripts; no live provider or authentication calls."""
import os, subprocess, time, json, urllib.request, urllib.error
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];origin='http://127.0.0.1:3162'
assert os.environ.get('SPENDSHIFT_ANALYTICS_V2_PROVIDER_FIXTURE')=='true' and os.environ.get('SPENDSHIFT_ANALYTICS_V2_OWNER_FIXTURE')=='true'
assert os.environ.get('SUPABASE_SERVICE_ROLE_KEY')=='ci-placeholder-not-a-real-key' and os.environ.get('STRIPE_SECRET_KEY')=='sk_test_ci_placeholder'
app=subprocess.Popen(['node','node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3162'],cwd=root)
providers={'ss-v2-ga','ss-v2-clarity','ss-v2-meta','ss-v2-tiktok'}
analytic={'ss-v2-ga','ss-v2-clarity'};ads=providers-analytic
def wait_server():
    for _ in range(90):
        try:
            with urllib.request.urlopen(origin+'/',timeout=1) as r:
                if r.status==200:return
        except Exception:time.sleep(1)
    raise RuntimeError('local app not ready')
def current(page):return set(page.evaluate("Array.from(document.querySelectorAll('script[id^=ss-v2-]')).map(x=>x.id)"))
def settle(page,expected):
    page.wait_for_function("(ids)=>JSON.stringify(Array.from(document.querySelectorAll('script[id^=ss-v2-]')).map(x=>x.id).sort())===JSON.stringify(ids)",arg=sorted(expected),timeout=10000)
    page.wait_for_timeout(350)
    assert current(page)==expected
def pref(a,b):return {'version':'2026-11-v2','basicOff':False,'legacyTransition':False,'analytics':a,'ads':b}
try:
    wait_server()
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True);cases=0
        def setup(a=None,b=None,legacy=None,malformed=False):
            ctx=browser.new_context(viewport={'width':390,'height':844})
            if a is not None or legacy is not None or malformed:
                state={'pref':'bad-json' if malformed else json.dumps(pref(a,b)) if a is not None else None,'legacy':legacy}
                ctx.add_init_script(script="(()=>{const x="+json.dumps(state)+"; if(x.pref!==null&&localStorage.getItem('spendshift_privacy_v2')===null)localStorage.setItem('spendshift_privacy_v2',x.pref);if(x.legacy!==null&&localStorage.getItem('spendshift_cookie_consent')===null)localStorage.setItem('spendshift_cookie_consent',x.legacy);})()")
            blocked=[];loads=[];basic=[];old=[]
            def route(r):
                u=r.request.url
                if not u.startswith(origin+'/'):blocked.append(u);r.abort()
                elif '/analytics-provider-fixture/' in u:loads.append(u);r.fulfill(status=200,content_type='application/javascript',body='/* inert provider fixture */')
                elif '/api/analytics-v2' in u:basic.append(r.request.post_data_json);r.fulfill(status=204)
                elif '/api/audit-metric' in u:old.append(r.request.post_data_json);r.fulfill(status=204)
                else:r.continue_()
            ctx.route('**/*',route)
            return ctx,ctx.new_page(),blocked,loads,basic,old
        for a,b,expected in [('granted','denied',analytic),('denied','granted',ads),('granted','granted',providers),('denied','denied',set()),('unset','unset',set())]:
            ctx,page,blocked,loads,basic,old=setup(a,b)
            page.goto(origin+'/?utm_source=instagram&utm_campaign=meta_founder_v1&fbclid=syntheticsecret')
            page.get_by_text('Test environment only — privacy choices').wait_for();settle(page,expected)
            assert not blocked and set(u.rsplit('/',1)[-1][:-3] for u in loads)==expected,(a,b,loads,blocked)
            if expected:assert 'syntheticsecret' not in page.url
            if 'ss-v2-ga' in expected:
                state=page.evaluate("Array.from(window.dataLayer||[]).map(a=>Array.from(a))")
                consent=next(x[2] for x in state if x[0]=='consent');assert consent['ad_storage']=='denied' and consent['analytics_storage']=='granted'
                config=next(x[2] for x in state if x[0]=='config');assert config['allow_google_signals'] is False and config['allow_ad_personalization_signals'] is False
                assert page.evaluate("window.clarity.q[0][1].ad_Storage")=='denied'
            page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit');page.get_by_text('Question 1 of 8',exact=True).wait_for();settle(page,set())
            assert len(loads)==len(expected) and not blocked
            assert bool(old)==(a=='granted'),(a,b,old)
            ctx.close();cases+=1
        for legacy,malformed,expected in [('denied',False,set()),('granted',False,providers),('granted',True,set()),(None,False,set())]:
            ctx,page,blocked,loads,basic,old=setup(legacy=legacy,malformed=malformed);page.goto(origin+'/');page.get_by_text('Test environment only — privacy choices').wait_for();settle(page,expected)
            assert not blocked;ctx.close();cases+=1
        ctx,page,blocked,loads,basic,old=setup()
        page.goto(origin+'/');page.get_by_text('Test environment only — privacy choices').wait_for();settle(page,set())
        page.get_by_text('Separate optional preferences').click();page.get_by_label('Optional website analytics',exact=True).check();settle(page,analytic)
        if not page.get_by_label('Optional advertising',exact=True).is_visible():page.get_by_text('Separate optional preferences').click()
        page.get_by_label('Optional advertising',exact=True).check();page.wait_for_timeout(600);settle(page,providers)
        other=ctx.new_page();other.goto(origin+'/');other.get_by_text('Test environment only — privacy choices').wait_for();settle(other,providers)
        page.get_by_role('button',name='Reject optional',exact=True).click();page.wait_for_timeout(800);settle(page,set());settle(other,set())
        page.get_by_role('button',name='Turn off basic statistics').click();page.wait_for_timeout(350);n=len(basic)
        page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit');page.get_by_text('Question 1 of 8',exact=True).wait_for();page.wait_for_timeout(500);assert len(basic)==n and not blocked
        ctx.close();cases+=1
        ctx,page,blocked,loads,basic,old=setup(legacy='granted')
        page.goto(origin+'/');settle(page,providers);page.get_by_role('button',name='Reject optional',exact=True).click();page.wait_for_timeout(600);settle(page,set())
        assert page.evaluate("localStorage.getItem('spendshift_cookie_consent')")=='denied'
        ctx.close();cases+=1
        ctx,page,blocked,loads,basic,old=setup('granted','granted');page.goto(origin+'/?report_id=syntheticprivate');page.get_by_text('Test environment only — privacy choices').wait_for();settle(page,set());assert not loads and not blocked;ctx.close();cases+=1
        print('PASS '+str(cases)+' real local granular provider/withdrawal/private-route browser cases (inert scripts only)')
        ctx,page,blocked,loads,basic,old=setup('granted','granted')
        page.goto(origin+'/internal/analytics/access');page.get_by_role('heading',name='Owner sign-in').wait_for()
        assert page.get_by_label('Email',exact=True).is_visible() and page.get_by_label('Password',exact=True).is_visible()
        assert not page.get_by_role('heading',name='Acquisition funnel').count()
        assert not loads and not basic and not blocked
        assert not page.evaluate("Object.keys(localStorage).some(k=>k.includes('auth')||k.includes('owner'))||Object.keys(sessionStorage).some(k=>k.includes('auth')||k.includes('owner'))")
        response=ctx.request.get(origin+'/internal/analytics?format=json&period=today');assert response.status==401 and response.text()==''
        response=ctx.request.post(origin+'/internal/analytics/finance',data={'date':'2026-11-25','source':'ga4','values':{'ga4_sessions':1}});assert response.status==404
        ctx.close();browser.close()
        print('PASS owner interface renders without exposing data; unauthenticated read denied, production import locked; no provider calls')
finally:app.terminate();app.wait(timeout=10)
