import {sydneyDay} from './core.mjs';
export const fields=Object.freeze({stripe:['stripe_paid_orders','gross_cents','refund_cents','payment_failures'],meta:['meta_spend_cents','meta_lpv','meta_outbound_clicks'],ga4:['ga4_sessions']});
const metricFields=Object.values(fields).flat();
function isoDay(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
export function validateDailySource(input,now=new Date()){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==3||!Object.hasOwn(input,'date')||!Object.hasOwn(input,'source')||!Object.hasOwn(input,'values')||!isoDay(input.date)||typeof input.source!=='string'||!Object.hasOwn(fields,input.source))return null;
 const today=sydneyDay(now),oldest=new Date(today+'T00:00:00Z');oldest.setUTCDate(oldest.getUTCDate()-179);
 if(input.date>today||input.date<oldest.toISOString().slice(0,10))return null;
 const v=input.values,keys=fields[input.source];if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==keys.length||!keys.every(k=>Object.hasOwn(v,k)&&Number.isSafeInteger(v[k])&&v[k]>=0&&v[k]<=1000000000000))return null;
 return {date:input.date,source:input.source,values:Object.fromEntries(keys.map(k=>[k,v[k]]))};
}
export function mergeFinancial(operations,finance,range){
 if(!operations||typeof operations!=='object'||!finance||typeof finance!=='object'||Object.keys(finance).length!==2||!Object.hasOwn(finance,'values')||!Object.hasOwn(finance,'coverage'))throw Error('invalid financial source');
 if(!isoDay(range.from)||!isoDay(range.to)||range.from>range.to)throw Error('invalid range');
 const days=1+Math.round((Date.parse(range.to)-Date.parse(range.from))/86400000);if(days<1||days>180)throw Error('invalid range');
 const v=finance.values,c=finance.coverage;
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==metricFields.length||!metricFields.every(k=>Object.hasOwn(v,k)))throw Error('invalid financial totals');
 if(!c||typeof c!=='object'||Object.keys(c).length!==4||c.expected_days!==days||!Object.keys(fields).every(k=>Number.isInteger(c[k])&&c[k]>=0&&c[k]<=days))throw Error('invalid coverage');
 const totals={...operations};
 for(const source of Object.keys(fields))for(const field of fields[source]){
  const value=v[field];if(c[source]!==days){if(value!==null)throw Error('incomplete period total');totals[field]=null;}
  else{if(!Number.isSafeInteger(value)||value<0)throw Error('invalid complete total');totals[field]=value;}
 }
 return {operations:totals,coverage:{expected_days:days,stripe:c.stripe,meta:c.meta,ga4:c.ga4}};
}
