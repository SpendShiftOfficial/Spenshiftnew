"""Read-only browser smoke test against current production. Intercept ALL POSTs; never send statistics or create a checkout."""
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
base='https://www.spendshift.com.au'
answers=['Almost daily','Yes, at least one is unused','Never','Daily',"I honestly don't know","I honestly don't know",'Almost daily','Lower my bills']
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for width,height in [(390,844),(320,568),(1280,900)]:
        ctx=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
        seen=[];outside=[]
        def route(r):
            url=urlsplit(r.request.url)
            if url.hostname!='www.spendshift.com.au':outside.append(url.hostname);r.abort()
            elif r.request.method not in ('GET','HEAD'):
                if url.path=='/api/analytics-v2':seen.append(r.request.post_data_json)
                r.fulfill(status=204)
            else:r.continue_()
        ctx.route('**/*',route);page=ctx.new_page()
        page.goto(base+'/?utm_source=instagram&utm_medium=paid_social&utm_campaign=meta_founder_v1&utm_content=creative_01',wait_until='domcontentloaded')
        page.locator('[data-ss-privacy-notice="basic"]').wait_for();page.wait_for_timeout(1200)
        page.get_by_role('button',name='Reject optional cookies',exact=True).click()
        page.locator('[data-ss-privacy-notice="basic"]').wait_for(state='hidden')
        page.locator('[data-ss-cta=hero]').click();page.wait_for_url('**/audit');page.get_by_text('Question 1 of 8',exact=True).wait_for()
        for i,answer in enumerate(answers):
            page.get_by_role('button',name=answer,exact=True).click()
            page.get_by_role('button',name='See my free results' if i==7 else 'Next question',exact=True).click()
            if i<7:page.get_by_text('Question '+str(i+2)+' of 8',exact=True).wait_for()
        page.wait_for_url('**/results');offer=page.locator('#unlock-full-report');offer.wait_for();page.wait_for_timeout(900)
        before=sum(x['event']=='upgrade_offer_view' for x in seen)
        rect=offer.bounding_box()
        if rect and rect['y']>=height:assert before==0,(width,before,rect)
        assert any(x['event']=='results_view' for x in seen),(width,'results not emitted')
        offer.locator('h2').scroll_into_view_if_needed();page.wait_for_timeout(1200)
        assert sum(x['event']=='upgrade_offer_view' for x in seen)==1,(width,'visible offer not recorded',seen)
        page.evaluate('window.scrollTo(0,0)');offer.locator('h2').scroll_into_view_if_needed();page.wait_for_timeout(700)
        assert sum(x['event']=='upgrade_offer_view' for x in seen)==1,(width,'duplicate')
        entry=next(x for x in seen if x['event']=='site_entry')
        assert entry['source']=='instagram' and entry['campaign']=='meta_founder_v1',entry
        assert not outside,outside
        print('PASS live offer '+str(width)+'x'+str(height)+': view emitted once when visible; acquisition labels recognised; all POSTs intercepted',flush=True)
        ctx.close()
    browser.close()
