// Simulated browser globals and intercepted fetch. No browser, network or credentials.
import assert from 'node:assert/strict';
import {browserCollector} from '../../lib/analytics-v2/browser.mjs';
import {privacyBlocked,decodePreference} from '../../lib/analytics-v2/privacy-runtime.mjs';
let passes=0;const check=(condition,label)=>{assert.ok(condition,label);passes++;};
function setup(legacy=null,raw=null,{enabled=true,visible=true,storageOK=true}={}){
 const data=new Map();if(legacy!==null)data.set('spendshift_cookie_consent',legacy);if(raw!==null)data.set('spendshift_privacy_v2',raw);const storage={getItem(k){if(!storageOK)throw Error('storage unavailable');return data.get(k)??null;},setItem(k,v){if(!storageOK)throw Error('storage unavailable');data.set(k,v);}};const sent=[];
 globalThis.window={localStorage:storage};globalThis.localStorage=storage;globalThis.document={visibilityState:visible?'visible':'hidden',prerendering:false,referrer:'https://l.instagram.com/private?report=secret'};globalThis.location={pathname:'/',origin:'http://127.0.0.1:1234',search:'?utm_campaign=meta_founder_v1&fbclid=secret'};globalThis.innerWidth=390;Object.defineProperty(globalThis,'navigator',{value:{userAgent:'Chrome/123'},configurable:true});globalThis.fetch=(url,options)=>{sent.push({url,...options,body:JSON.parse(options.body)});return Promise.resolve({status:204});};
 return {collector:browserCollector({enabled,noticeVisible:()=>visible}),data,sent};
}
for(const choice of ['granted','denied','unset']){const {collector:c,sent,data}=setup();c.entry();c.entry();check(sent.length===2,'entry dedup');check(c.choose({analytics:choice,ads:choice}),'optional preference');const run=c.audit();run.arrive();run.arrive();for(let q=1;q<=8;q++){run.see(q);run.see(q);run.choose(q);run.advance(q);run.advance(q);}run.complete();run.complete();check(sent.filter(x=>x.body.event==='audit_start').length===1,'start');check(sent.filter(x=>x.body.event==='audit_question_seen').length===8,'seen');check(sent.filter(x=>x.body.event==='audit_question_advanced').length===8,'advanced');check(sent.filter(x=>x.body.event==='audit_complete').length===1,'complete');check(sent.every(x=>x.url==='/api/analytics-v2'&&x.credentials==='omit'&&x.referrerPolicy==='no-referrer'&&x.redirect==='error'&&x.keepalive),'network options');check(!JSON.stringify(sent).includes('secret'),'no raw IDs');check(data.size===1,'only preference');run.reset();run.arrive();run.see(1);run.choose(1);c.entry();check(sent.filter(x=>x.body.event==='audit_start').length===2,'reset new run');check(sent.filter(x=>x.body.event==='site_entry').length===1,'reset does not reset entry');c.choose({analytics:choice,ads:choice,basicOff:true});const before=sent.length;c.choose({analytics:'granted',ads:'granted'});run.advance(1);c.entry();check(sent.length===before,'optional acceptance cannot undo basic opt-out');}
for(const legacy of ['denied','granted']){const {collector:c,sent,data}=setup(legacy);c.entry();c.choose({analytics:'denied',ads:'denied'});c.entry();check(sent.length===0,'legacy choice preserved');check(data.get('spendshift_cookie_consent')===legacy,'legacy storage untouched');c.choose({analytics:'denied',ads:'denied',basicOff:false,transition:true});c.entry();check(sent.length===2,'explicit basic transition');}
for(const opts of [{enabled:false},{visible:false},{storageOK:false}]){const {collector:c,sent}=setup(null,null,opts);c.entry();const run=c.audit();run.arrive();run.see(1);run.choose(1);check(sent.length===0,'fail closed');}
{const {collector:c,sent}=setup(null,'bad-json');c.entry();check(!c.choose({analytics:'granted',ads:'granted'}),'malformed state blocked');check(sent.length===0,'no events malformed');}
{const {collector:c,sent}=setup();const run=c.audit();run.arrive();run.see(7);run.advance(7);check(sent.every(x=>x.body.event!=='audit_start'),'resumed audit');}
{
 const {collector:c,sent}=setup();document.referrer="";location.search="?utm_source=instagram&utm_campaign=meta_founder_v1&fbclid=private_click";
 c.entry();const entry=sent.find(x=>x.body.event==="site_entry");check(entry?.body.source==="instagram","collector recognises approved UTM without referrer");check(!JSON.stringify(sent).includes("private_click"),"collector omits click ID");
}
// Real collector on a shared synthetic browser across disabled and active modes.
for(const optional of ['granted','denied','unset']){
 const {collector:off,data,sent}=setup(null,null,{enabled:false});
 check(off.choose({analytics:optional,ads:'denied'}),'disabled stage saves optional choice');
 check(JSON.parse(data.get('spendshift_privacy_v2')).basicOff===true,'disabled choice preserves basic off');
 const on=browserCollector({enabled:true,noticeVisible:()=>true});on.entry();
 check(sent.length===0,'activation cannot override disabled choice');
 check(on.choose({analytics:optional,ads:'denied',basicOff:false,transition:true}),'explicit enable after disclosure');
 on.entry();check(sent.length===2,'explicit enable resumes existing events');
 check(off.choose({analytics:optional,ads:'denied'}),'disabled rollback choice saved');
 const restart=browserCollector({enabled:true,noticeVisible:()=>true});restart.entry();
 check(sent.length===2,'restart preserves choice under disabled notice');
}
{
 const {collector:c,sent,data}=setup();let shown=false;
 const x=browserCollector({enabled:true,noticeVisible:()=>shown});
 x.entry();check(!sent.length,'not displayed means no measurement');
 check(x.choose({analytics:'denied',ads:'denied'}),'optional choice before presentation');
 check(JSON.parse(data.get('spendshift_privacy_v2')).basicOff,'early choice cannot silently enable basic');
 shown=true;x.entry();check(!sent.length,'later presentation does not override early choice');
 check(x.choose({analytics:'denied',ads:'denied',basicOff:false,transition:true}),'explicit after presentation');
 x.entry();check(sent.length===2,'presented explicit basic resumes');
}
for(const raw of ['null','{}','[]','"granted"','bad-json','{"version":"2026-11-v2","basicOff":false,"legacyTransition":false,"analytics":"denied","analytics":"granted","ads":"denied"}']){
 const {collector:c,sent}=setup('granted',raw);c.entry();
 check(!sent.length&&!c.state().storageOK,'malformed stored choice fails closed: '+raw);
 check(c.choose({analytics:'denied',ads:'denied',basicOff:true}),'explicit all-off repairs malformed choice safely');check(!c.allowed(),'repaired choice stays off');
}
for(const mode of ['throw','silent','read']){
 const {collector:c,sent,data}=setup();
 const ss=new Map();window.sessionStorage={getItem:k=>ss.get(k)??null,setItem:(k,v)=>ss.set(k,v),removeItem:k=>ss.delete(k)};
 check(c.choose({analytics:'granted',ads:'denied'}),'seed valid choice');
 c.entry();const n=sent.length;
 const store=window.localStorage,originalSet=store.setItem,originalGet=store.getItem;
 if(mode==='throw')store.setItem=()=>{throw Error('quota');};
 if(mode==='silent')store.setItem=()=>{};
 if(mode==='read')store.getItem=()=>{throw Error('access blocked');};
 check(!c.choose({analytics:'denied',ads:'denied',basicOff:true}),'failed write not reported saved '+mode);
 check(privacyBlocked(),'shared document blocked '+mode);
 c.audit().arrive();check(sent.length===n,'no new basic after failure '+mode);
 store.setItem=originalSet;store.getItem=originalGet;
 // Recreating a collector or reloading same tab cannot undo failed-save marker.
 const next=browserCollector({enabled:true,noticeVisible:()=>true});next.entry();
 check(sent.length===n,'new collector cannot bypass failure '+mode);
 globalThis.document={visibilityState:'visible',prerendering:false,referrer:''};
 check(privacyBlocked(),'same-tab marker survives document replacement '+mode);
 check(next.choose({analytics:'denied',ads:'denied',basicOff:true}),'retry all-off saves');
 check(!privacyBlocked()&&JSON.parse(data.get('spendshift_privacy_v2')).basicOff,'verified save clears transient failure only');
 next.entry();check(sent.length===n,'persisted denial remains off');
}
console.log('PASS '+passes+' simulated browser-client assertions; disabled activation, malformed preferences and failed writes');
