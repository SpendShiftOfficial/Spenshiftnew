import assert from 'node:assert/strict';
import {optionalPermissions,protectRollback} from '../../lib/analytics-v2/optional.ts';
import {stopPrivacyDocument,clearPrivacyFailureAfterSave,privacyBlocked} from '../../lib/analytics-v2/privacy-runtime.mjs';
import {browserCollector} from '../../lib/analytics-v2/browser.mjs';
const key='spendshift_privacy_v2',legacy='spendshift_cookie_consent';let n=0;
const storage=(old=null,pref=null)=>{const map=new Map();if(old!==null)map.set(legacy,old);if(pref!==null)map.set(key,pref);return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};};
function check(actual,expected){assert.deepEqual(actual,expected);n++;}
const pref=(analytics,ads,basicOff=false,legacyTransition=false)=>JSON.stringify({version:'2026-11-v2',basicOff,legacyTransition,analytics,ads});
check(optionalPermissions(storage()),{analytics:false,ads:false});
check(optionalPermissions(storage('granted')),{analytics:true,ads:false});
check(optionalPermissions(storage('denied')),{analytics:false,ads:false});
for(const a of ['unset','granted','denied'])for(const b of ['unset','granted','denied'])for(const off of [true,false])check(optionalPermissions(storage('granted',pref(a,b,off))),{analytics:a==='granted',ads:false});
for(const malformed of ['{}','null','bad','[]',JSON.stringify({version:'old',analytics:'granted',ads:'granted',basicOff:false,legacyTransition:true}),pref('granted','unexpected')])check(optionalPermissions(storage('granted',malformed)),{analytics:false,ads:false});
check(optionalPermissions({getItem(){throw Error('blocked')}}),{analytics:false,ads:false});
check(optionalPermissions(storage('unknown',pref('granted','granted'))),{analytics:false,ads:false});
const old=storage('granted');protectRollback(old,'granted','denied');check(old.getItem(legacy),'denied');
const fresh=storage();protectRollback(fresh,'granted','granted');check(fresh.getItem(legacy),null);
const prior=storage('denied');protectRollback(prior,'granted','granted');check(prior.getItem(legacy),'denied');
const both=storage('granted');protectRollback(both,'granted','granted');check(both.getItem(legacy),'granted');
for(const mode of ['write','rollback','silent','read']){
 const s=storage('granted',pref('granted','denied')),session=new Map();
 globalThis.document={};globalThis.window={localStorage:s,sessionStorage:{getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)}};
 globalThis.localStorage=s;
 const c=browserCollector({enabled:true,noticeVisible:()=>true});
 check(optionalPermissions(s),{analytics:true,ads:false});
 const original=s.setItem,get=s.getItem;
 if(mode==='write')s.setItem=()=>{throw Error('quota');};
 if(mode==='silent')s.setItem=()=>{};
 if(mode==='read')s.getItem=()=>{throw Error('blocked');};
 if(mode==='rollback'){s.setItem=()=>{throw Error('quota');};try{protectRollback(s,'denied','denied');assert.fail('expected failure');}catch{stopPrivacyDocument();}}
 else check(c.choose({analytics:'denied',ads:'denied',basicOff:true}),false);
 check(privacyBlocked(),true);
 // Even when the earlier grant is still readable, neither category is permitted.
 s.setItem=original;s.getItem=get;
 check(optionalPermissions(s),{analytics:false,ads:false});
 check(c.allowed(),false);
 globalThis.document={};check(optionalPermissions(s),{analytics:false,ads:false});
 check(c.choose({analytics:'denied',ads:'denied',basicOff:true}),true);
 check(optionalPermissions(s),{analytics:false,ads:false});check(privacyBlocked(),false);
}
delete globalThis.document;delete globalThis.window;delete globalThis.localStorage;
console.log('PASS '+n+' granular permission, failed-write and rollback tests');
