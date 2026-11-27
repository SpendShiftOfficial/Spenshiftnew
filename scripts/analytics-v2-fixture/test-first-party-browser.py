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
def open_settings(page):
    notice=page.locator('[data-ss-privacy-notice="basic"]')
    if notice.is_visible():
        button=notice.get_by_role('button',name='Privacy settings',exact=True)
        if button.get_attribute('aria-expanded')!='true':button.click()
    else:
        trigger=page.get_by_role('button',name='Privacy settings',exact=True)
        if trigger.is_visible():trigger.click()
        else:page.get_by_role('link',name='Cookie settings',exact=True).click()
    notice.get_by_role('button',name='Turn off basic statistics',exact=True).wait_for()
    return notice
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
        # Homepage-only aggregate exposure: offscreen sections, repeat scroll and trusted activation.
        ctx,page,external,basic,old,requests=setup()
        open_page(page,'/')
        page.wait_for_timeout(1800)
        assert not any(x['event']=='home_section_final_seen' for x in basic),basic
        page.locator('[data-ss-home-section="final"]').evaluate("(e)=>e.scrollIntoView({block:'center',behavior:'instant'})")
        page.wait_for_timeout(2300)
        assert sum(x['event']=='home_section_final_seen' for x in basic)==1,basic
        page.evaluate("window.scrollTo(0,0)");page.wait_for_timeout(700)
        page.locator('[data-ss-home-section="final"]').evaluate("(e)=>e.scrollIntoView({block:'center',behavior:'instant'})")
        page.wait_for_timeout(1800)
        assert sum(x['event']=='home_section_final_seen' for x in basic)==1,basic
        page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit');page.wait_for_timeout(500)
        assert sum(x['event']=='home_cta_hero_impression' for x in basic)==1 and sum(x['event']=='home_cta_hero_click' for x in basic)==1,basic
        assert all(set(x)=={'v','event'} for x in basic if x['event'].startswith('home_')),basic
        assert not external
        ctx.close();cases+=1
        ctx,page,external,basic,old,requests=setup(preference=json.dumps(pref('denied','denied',True)))
        open_page(page,'/')
        page.locator('[data-ss-home-section="final"]').evaluate("(e)=>e.scrollIntoView({block:'center',behavior:'instant'})")
        page.wait_for_timeout(1800)
        assert not basic and not external
        ctx.close();cases+=1
        scenarios=[(None,None,True,False),('granted',None,False,True),('denied',None,False,False),(None,json.dumps(pref('granted','granted')),True,True),(None,json.dumps(pref('denied','granted')),True,False),('granted',json.dumps(pref('denied','denied')),False,False),(None,json.dumps(pref('granted','granted',True)),False,True),('granted','bad-json',False,False)]
        for legacy,preference,expect_basic,expect_old in scenarios:
            ctx,page,external,basic,old,requests=setup(legacy,preference)
            open_page(page,'/?utm_source=instagram&utm_campaign=meta_founder_v1&fbclid=synthetic_click')
            notice=page.locator('[data-ss-privacy-notice="basic"]')
            if preference and preference!='bad-json':
                assert not notice.count()
                assert not any(x['event']=='privacy_notice_shown' for x in basic)
            else:notice.wait_for()
            assert bool(basic)==expect_basic,(legacy,preference,basic)
            if expect_basic:assert next(x for x in basic if x['event']=='site_entry')['source']=='instagram'
            assert not external
            page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit');page.get_by_text('Question 1 of 8',exact=True).wait_for();page.wait_for_timeout(700)
            no_trackers(page);assert bool(old)==expect_old,(legacy,preference,old)
            assert not external and 'synthetic_click' not in json.dumps(basic)
            ctx.close();cases+=1
        ctx,page,external,basic,old,requests=setup()
        open_page(page,'/')
        page.get_by_role('button',name='Accept optional cookies',exact=True).click()
        page.locator('[data-ss-privacy-notice="basic"]').wait_for(state='hidden')
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
        assert not other.locator('[data-ss-privacy-notice="basic"]').count()
        assert other.evaluate("localStorage.getItem('spendshift_free_draft_v2')")==draft
        # CSP must enforce denial of external scripts and connections on public pages.
        result=other.evaluate("""async()=>{
          const seen=[];document.addEventListener('securitypolicyviolation',e=>seen.push(e.effectiveDirective));
          const script=document.createElement('script');script.src='https://measurement.invalid/probe.js';document.head.append(script);
          try{await fetch('https://measurement.invalid/probe',{mode:'no-cors'});}catch{}
          await new Promise(r=>setTimeout(r,350));script.remove();return seen;
        }""")
        assert any(x.startswith('script-src') for x in result) and 'connect-src' in result,result
        assert not external,external
        # Separate basic and optional withdrawal must propagate across tabs and preserve the saved draft.
        open_settings(other)
        other.get_by_role('button',name='Turn off basic statistics',exact=True).click()
        assert other.evaluate("JSON.parse(localStorage.getItem('spendshift_privacy_v2')).analytics")=='granted'
        other.get_by_role('button',name='Reject optional cookies',exact=True).click();other.wait_for_timeout(500)
        page.wait_for_timeout(500);n,m=len(basic),len(old)
        page.get_by_role('button',name='Yes, at least one is unused',exact=True).click();page.get_by_role('button',name='Next question',exact=True).click();page.get_by_text('Question 3 of 8',exact=True).wait_for();page.wait_for_timeout(700)
        assert (len(basic),len(old))==(n,m),(basic,old)
        assert 'Almost daily' not in json.dumps(basic) and 'Almost daily' not in json.dumps(old)
        no_trackers(other);no_trackers(page);assert not external
        # A new audit document in the other tab must also send neither class of counters.
        open_page(other,'/audit');other.get_by_text('Question 3 of 8',exact=True).wait_for();other.wait_for_timeout(500)
        assert (len(basic),len(old))==(n,m),(basic,old)
        ctx.close();cases+=1
        ctx,page,external,basic,old,requests=setup('granted')
        open_page(page,'/');page.get_by_role('button',name='Reject optional cookies',exact=True).click()
        assert page.evaluate("localStorage.getItem('spendshift_cookie_consent')")=='denied'
        open_settings(page)
        page.get_by_role('button',name='Explicitly enable basic statistics',exact=True).click();page.wait_for_timeout(700)
        assert basic and not old
        no_trackers(page);ctx.close();cases+=1
        # Reproduce the live complaint: either optional choice dismisses the
        # banner, including after reload, navigation and reopening from the footer.
        for choice in ['Accept optional cookies','Reject optional cookies']:
            ctx,page,external,basic,old,requests=setup()
            open_page(page,'/')
            page.get_by_role('button',name=choice,exact=True).click()
            notice=page.locator('[data-ss-privacy-notice="basic"]')
            notice.wait_for(state='hidden')
            saved=page.evaluate("JSON.parse(localStorage.getItem('spendshift_privacy_v2'))")
            assert saved['basicOff'] is False and saved['analytics']==('granted' if choice.startswith('Accept') else 'denied')
            n=len(basic);open_page(page,'/');assert not notice.count()
            assert any(x['event']=='site_entry' for x in basic[n:]) and not any(x['event']=='privacy_notice_shown' for x in basic[n:])
            open_page(page,'/pricing');assert not notice.count()
            open_settings(page)
            page.get_by_role('button',name='Turn off basic statistics',exact=True).click()
            assert page.evaluate("JSON.parse(localStorage.getItem('spendshift_privacy_v2')).basicOff") is True
            assert 'off or unavailable' in notice.inner_text()
            page.get_by_role('button',name='Reject optional cookies',exact=True).click()
            notice.wait_for(state='hidden')
            open_page(page,'/');assert not notice.count()
            n,m=len(basic),len(old)
            page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit')
            page.get_by_text('Question 1 of 8',exact=True).wait_for()
            page.wait_for_timeout(700);assert not notice.count() and (len(basic),len(old))==(n,m)
            open_settings(page)
            page.get_by_role('button',name='Explicitly enable basic statistics',exact=True).click()
            page.wait_for_timeout(800);assert any(x['event']=='audit_arrival' for x in basic[n:])
            assert not external
            ctx.close();cases+=1
        print('PASS accept/reject dismissal, persisted choices, footer reopening, audit access, and returning visitor measurement')
        # Browser measurement: new visitor on mobile, compact default with equally sized choices.
        for width,height in [(320,568),(375,667),(390,844),(430,932),(1280,900)]:
            ctx,page,external,basic,old,requests=setup()
            page.set_viewport_size({'width':width,'height':height})
            open_page(page,'/?utm_source=instagram&fbclid=synthetic_click')
            page.evaluate('document.fonts.ready')
            notice=page.locator('[data-ss-privacy-notice="basic"]');box=notice.bounding_box()
            accept=notice.get_by_role('button',name='Accept optional cookies',exact=True);reject=notice.get_by_role('button',name='Reject optional cookies',exact=True)
            a,b=accept.bounding_box(),reject.bounding_box()
            # Owner accepted the 184.25px / 667px (27.6%) compact-notice exception
            # for the final approved wording. Retain all interaction and privacy assertions.
            target=0.33 if width==320 else 0.30 if width==375 and height==667 else 0.25
            assert box and box['height']<=height*target,(width,height,box)
            assert abs(a['width']-b['width'])<=1 and min(a['height'],b['height'])>=44,(width,a,b)
            assert not notice.get_by_role('button',name='Turn off all statistics',exact=True).is_visible()
            assert notice.get_by_role('button',name='Privacy settings',exact=True).is_visible()
            assert 'We use basic website statistics to improve your experience with SpendShift, not to build personal profiles. These statistics may continue if you reject optional cookies.' in notice.inner_text()
            assert notice.locator('[data-ss-privacy-actions] button').count()==2
            assert notice.evaluate('(el)=>el.scrollWidth<=el.clientWidth+1') and box['x']>=0 and box['x']+box['width']<=width+1
            assert notice.evaluate("(el)=>!['fixed','sticky'].includes(getComputedStyle(el).position)")
            cta=page.locator('[data-ss-cta=hero]');cta.scroll_into_view_if_needed()
            assert cta.evaluate("(el)=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));}")
            settings=notice.get_by_role('button',name='Privacy settings',exact=True)
            settings.click();assert settings.get_attribute('aria-expanded')=='true'
            assert notice.get_by_role('button',name='Turn off all statistics',exact=True).count()==0
            assert notice.get_by_role('button',name='Turn off basic statistics',exact=True).is_visible()
            assert notice.get_by_role('link',name='Privacy Policy',exact=True).is_visible()
            assert notice.get_by_role('link',name='Cookie Policy',exact=True).is_visible()
            settings.click();assert settings.get_attribute('aria-expanded')=='false'
            assert not notice.get_by_role('button',name='Turn off all statistics',exact=True).is_visible()
            assert not external
            print(f'PASS compact notice {width}x{height}: {box["height"]:.0f}px ({100*box["height"]/height:.1f}% of viewport); equal 44px+ choices; CTA reachable')
            ctx.close();cases+=1
        # Source recognition with empty referrer, conflicts and adversarial labels.
        for query,expected in [('utm_source=facebook','facebook'),('utm_source=IG','instagram'),('utm_source=tiktok','tiktok'),('utm_source=google','google'),('utm_source=instagram&utm_source=facebook','direct_or_unknown'),('utm_source=synthetic%40example.invalid','direct_or_unknown'),('utm_source=meta','direct_or_unknown'),('fbclid=synthetic_click','direct_or_unknown')]:
            ctx,page,external,basic,old,requests=setup()
            open_page(page,'/?'+query)
            entry=next(x for x in basic if x['event']=='site_entry')
            assert entry['source']==expected,(query,entry)
            assert 'synthetic' not in json.dumps(entry) and set(entry)=={'v','event','page','source','campaign','device','browser'}
            assert not external;ctx.close();cases+=1
        print('PASS 8 browser UTM attribution cases; raw tags and click IDs absent')
        # An actually hidden or offscreen disclosure must not trigger measurement;
        # after the disclosure and controls are visible, preserve measurement during scroll.
        for mode in ['hidden','offscreen','occluded']:
            ctx,page,external,basic,old,requests=setup()
            page.add_init_script("(()=>{const mode="+json.dumps(mode)+";const apply=()=>{if(!document.head||sessionStorage.getItem('synthetic_privacy_obstruction_done')==='1')return;const s=document.createElement('style');s.id='synthetic-privacy-obstruction';s.textContent=mode==='hidden'?'[data-ss-privacy-notice]{visibility:hidden!important}':mode==='offscreen'?'[data-ss-privacy-notice]{transform:translateY(-2000px)!important}':'[data-ss-privacy-notice]::after{content:\"\";position:absolute;inset:0;background:white;z-index:999999}';document.head.append(s);};if(document.head)apply();else new MutationObserver((_,o)=>{if(document.head){apply();o.disconnect();}}).observe(document,{childList:true,subtree:true});})()")
            open_page(page,'/?utm_source=instagram')
            assert not basic,(mode,basic)
            page.evaluate("sessionStorage.setItem('synthetic_privacy_obstruction_done','1');document.getElementById('synthetic-privacy-obstruction').remove()")
            page.wait_for_function("document.querySelector('[data-ss-disclosure]')?.getBoundingClientRect().height>0")
            page.wait_for_timeout(900)
            assert any(x['event']=='site_entry' for x in basic),(mode,basic)
            page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit')
            page.wait_for_timeout(500);assert any(x['event']=='audit_arrival' for x in basic)
            assert not external;ctx.close();cases+=1
        # Previous disabled-stage accept and reject both retain basic-off on active build.
        for a in ['granted','denied']:
            ctx,page,external,basic,old,requests=setup(None,json.dumps(pref(a,'denied',True)))
            open_page(page,'/')
            assert not basic and not page.locator('[data-ss-privacy-notice="basic"]').count()
            open_settings(page)
            assert 'off' in page.locator('[data-ss-disclosure]').inner_text().lower()
            page.get_by_role('button',name='Accept optional cookies',exact=True).click()
            page.wait_for_timeout(600);assert not basic
            open_settings(page)
            page.get_by_role('button',name='Explicitly enable basic statistics',exact=True).click()
            page.wait_for_timeout(900);assert any(x['event']=='site_entry' for x in basic)
            assert not external;ctx.close();cases+=1
        # Simulate quota, denied legacy downgrade, silently lost writes and read failure
        # after a genuine prior grant. Do not clear the synthetic saved draft.
        for failure in ['quota','legacy','silent','read']:
            ctx,page,external,basic,old,requests=setup('granted' if failure=='legacy' else None,json.dumps(pref('granted','denied')))
            open_page(page,'/')
            page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit')
            page.get_by_text('Question 1 of 8',exact=True).wait_for()
            page.wait_for_timeout(600)
            page.evaluate("""mode=>{
              const p=Storage.prototype;const put=p.setItem,get=p.getItem;
              window.__restorePrivacyStorage=()=>{p.setItem=put;p.getItem=get;};
              p.setItem=function(k,v){
                if(this===localStorage&&(k==='spendshift_privacy_v2'||k==='spendshift_cookie_consent')){
                  if(mode==='quota'||mode==='legacy')throw new DOMException('synthetic quota','QuotaExceededError');
                  if(mode==='silent')return;
                }return put.call(this,k,v);
              };
              if(mode==='read')p.getItem=function(k){if(this===localStorage&&(k==='spendshift_privacy_v2'||k==='spendshift_cookie_consent'))throw new DOMException('synthetic denied','SecurityError');return get.call(this,k);};
            }""",failure)
            open_settings(page)
            page.get_by_role('button',name='Reject optional cookies',exact=True).click()
            page.get_by_role('status').filter(has_text='Statistics stopped here').wait_for()
            page.evaluate("window.__restorePrivacyStorage()")
            page.wait_for_timeout(500);n,m=len(basic),len(old)
            page.get_by_role('button',name='Almost daily',exact=True).click()
            page.get_by_role('button',name='Next question',exact=True).click()
            page.get_by_text('Question 2 of 8',exact=True).wait_for();page.wait_for_timeout(700)
            assert (len(basic),len(old))==(n,m),(failure,basic,old)
            assert page.evaluate("sessionStorage.getItem('spendshift_privacy_save_failed')")=='1'
            assert 'Almost daily' in page.evaluate("localStorage.getItem('spendshift_free_draft_v2')")
            # Same-tab reload with a still-readable grant stays blocked until verified retry.
            open_page(page,'/audit');page.get_by_text('Question 2 of 8',exact=True).wait_for()
            page.wait_for_timeout(500);assert (len(basic),len(old))==(n,m)
            open_settings(page)
            page.get_by_role('button',name='Turn off basic statistics',exact=True).click()
            page.get_by_role('status').filter(has_text='Preferences saved').wait_for()
            saved=page.evaluate("JSON.parse(localStorage.getItem('spendshift_privacy_v2'))")
            assert saved['basicOff'] is True and saved['analytics']=='denied'
            assert page.evaluate("sessionStorage.getItem('spendshift_privacy_save_failed')") is None
            assert (len(basic),len(old))==(n,m)
            assert not external;ctx.close();cases+=1
        # Even if sessionStorage cannot save the failure marker, both live counters
        # remain blocked in this document via the shared in-memory guard.
        ctx,page,external,basic,old,requests=setup(None,json.dumps(pref('granted','denied')))
        open_page(page,'/');page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit')
        page.get_by_text('Question 1 of 8',exact=True).wait_for();page.wait_for_timeout(600)
        page.evaluate("""()=>{const put=Storage.prototype.setItem;window.__restoreBoth=()=>{Storage.prototype.setItem=put;};Storage.prototype.setItem=function(k,v){if(k==='spendshift_privacy_v2'||k==='spendshift_privacy_save_failed')throw new DOMException('synthetic quota','QuotaExceededError');return put.call(this,k,v);};}""")
        open_settings(page)
        page.get_by_role('button',name='Reject optional cookies',exact=True).click()
        page.get_by_role('status').filter(has_text='Statistics stopped here').wait_for()
        page.evaluate("window.__restoreBoth()");page.wait_for_timeout(400);n,m=len(basic),len(old)
        page.get_by_role('button',name='Almost daily',exact=True).click();page.get_by_role('button',name='Next question',exact=True).click()
        page.wait_for_timeout(700);assert (len(basic),len(old))==(n,m)
        assert page.evaluate("sessionStorage.getItem('spendshift_privacy_save_failed')") is None
        page.get_by_role('button',name='Reject optional cookies',exact=True).click()
        page.get_by_role('status').filter(has_text='Preferences saved').wait_for()
        assert page.evaluate("JSON.parse(localStorage.getItem('spendshift_privacy_v2')).basicOff") is True
        assert not external;ctx.close();cases+=1
        # An invalid prior preference must be repairable without the combined button.
        ctx,page,external,basic,old,requests=setup(None,'bad-json')
        open_page(page,'/')
        assert not basic
        open_settings(page)
        page.get_by_role('button',name='Turn off basic statistics',exact=True).click()
        page.get_by_role('status').filter(has_text='Preferences saved').wait_for()
        saved=page.evaluate("JSON.parse(localStorage.getItem('spendshift_privacy_v2'))")
        assert saved['basicOff'] is True and saved['analytics']=='denied'
        assert not basic and not external
        ctx.close();cases+=1
        print('PASS disabled-choice transition, actual viewport presentation, separate privacy controls, failed writes and same-tab reload safeguards')
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
