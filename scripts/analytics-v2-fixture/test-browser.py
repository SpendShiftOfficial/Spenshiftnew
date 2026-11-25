"""Local synthetic browser integration, not a real SpendShift product flow."""
import json, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
server=subprocess.Popen(['node','scripts/analytics-v2-fixture/browser-server.mjs'],cwd=root,stdout=subprocess.PIPE,text=True)
try:
    origin='http://127.0.0.1:'+server.stdout.readline().strip()
    count=0
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        def case(legacy=None, disabled=False, invalid=False):
            ctx=browser.new_context(viewport={'width':390,'height':844})
            if legacy is not None:ctx.add_init_script(f'localStorage.setItem("spendshift_cookie_consent",{json.dumps(legacy)})')
            if invalid:ctx.add_init_script('localStorage.setItem("spendshift_privacy_v2","bad-json")')
            page=ctx.new_page(); sent=[]; external=[]
            def intercept(route):
                if not route.request.url.startswith(origin+'/'):
                    external.append(route.request.url);route.abort()
                else:route.continue_()
            page.route('**/*',intercept)
            page.on('request',lambda r:sent.append(r.post_data_json) if r.method=='POST' and r.url==origin+'/api/analytics-v2' else None)
            page.goto(origin+'/?utm_campaign=meta_founder_v1&fbclid=syntheticprivate'+('&disabled=1' if disabled else ''));page.wait_for_function('window.testCollector !== undefined');page.wait_for_timeout(180)
            return ctx,page,sent,external
        for choice in ['accept','reject',None]:
            ctx,page,sent,external=case();assert [x['event'] for x in sent]==['site_entry','public_page_view'];assert sent[0]['campaign']=='meta_founder_v1';assert 'syntheticprivate' not in json.dumps(sent);count+=3
            if choice:page.click('#'+choice)
            page.click('#audit');
            for _ in range(8):page.click('#next')
            page.wait_for_timeout(250)
            assert sum(x['event']=='audit_question_seen' for x in sent)==8;assert sum(x['event']=='audit_question_advanced' for x in sent)==8;assert sum(x['event']=='audit_complete' for x in sent)==1;assert sum(x['event']=='audit_start' for x in sent)==1;assert sum(x['event']=='results_view' for x in sent)==1;assert not external;count+=6
            page.click('#reset');page.click('#next');page.wait_for_timeout(180);assert sum(x['event']=='audit_start' for x in sent)==2;count+=1
            page.click('#off');before=len(sent);page.click('#next');page.wait_for_timeout(180);assert len(sent)==before;count+=1;ctx.close()
        for legacy in ['denied','granted']:
            ctx,page,sent,external=case(legacy);assert not sent;page.click('#reject');page.click('#audit');page.click('#next');page.wait_for_timeout(180);assert not sent;assert page.evaluate('localStorage.getItem("spendshift_cookie_consent")')==legacy;count+=3;page.click('#transition');page.wait_for_timeout(180);assert any(x['event']=='site_entry' for x in sent);count+=1;ctx.close()
        for opts in [{'disabled':True},{'invalid':True}]:
            ctx,page,sent,external=case(**opts);page.click('#audit');page.click('#next');page.wait_for_timeout(180);assert not sent;assert page.locator('#question').inner_text()=='Question 2';count+=2;ctx.close()
        browser.close()
    print(f'PASS {count} synthetic real Chromium assertions')
finally:server.terminate();server.wait(timeout=5)
