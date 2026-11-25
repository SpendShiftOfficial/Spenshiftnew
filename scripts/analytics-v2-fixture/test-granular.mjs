import assert from 'node:assert/strict';
import {optionalPermissions,protectRollback} from '../../lib/analytics-v2/optional.ts';
const key='spendshift_privacy_v2',legacy='spendshift_cookie_consent';let n=0;
const storage=(old=null,pref=null)=>{const map=new Map();if(old!==null)map.set(legacy,old);if(pref!==null)map.set(key,pref);return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};};
function check(actual,expected){assert.deepEqual(actual,expected);n++;}
const pref=(analytics,ads,basicOff=false,legacyTransition=false)=>JSON.stringify({version:'2026-11-v2',basicOff,legacyTransition,analytics,ads});
check(optionalPermissions(storage()),{analytics:false,ads:false});
check(optionalPermissions(storage('granted')),{analytics:true,ads:true});
check(optionalPermissions(storage('denied')),{analytics:false,ads:false});
for(const a of ['unset','granted','denied'])for(const b of ['unset','granted','denied'])for(const off of [true,false])check(optionalPermissions(storage('granted',pref(a,b,off))),{analytics:a==='granted',ads:b==='granted'});
for(const malformed of ['{}','null','bad','[]',JSON.stringify({version:'old',analytics:'granted',ads:'granted',basicOff:false,legacyTransition:true}),pref('granted','unexpected')])check(optionalPermissions(storage('granted',malformed)),{analytics:false,ads:false});
check(optionalPermissions({getItem(){throw Error('blocked')}}),{analytics:false,ads:false});
check(optionalPermissions(storage('unknown',pref('granted','granted'))),{analytics:false,ads:false});
const old=storage('granted');protectRollback(old,'granted','denied');check(old.getItem(legacy),'denied');
const fresh=storage();protectRollback(fresh,'granted','granted');check(fresh.getItem(legacy),null);
const prior=storage('denied');protectRollback(prior,'granted','granted');check(prior.getItem(legacy),'denied');
const both=storage('granted');protectRollback(both,'granted','granted');check(both.getItem(legacy),'granted');
console.log('PASS '+n+' granular permission and rollback tests');
