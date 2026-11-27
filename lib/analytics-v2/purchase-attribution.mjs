// Candidate only. Never enable before specific privacy review, revised policies and SQL approval.
import {sourceCategory} from './core.mjs';

import {releaseCapabilities} from './release-config.mjs';
export const PURCHASE_ATTRIBUTION_AUTHORIZED=false;
export const NOTICE='purchase_attribution_v1';
export const SOURCES=Object.freeze(['instagram','facebook','tiktok','google','other_search','other_social','other_referral']);
export const CREATIVES=Object.freeze(['none_or_unknown',...Array.from({length:8},(_,i)=>'creative_'+String(i+1).padStart(2,'0'))]);
export const CAMPAIGNS=Object.freeze(['none_or_unknown','meta_founder_v1']);
export const MAX_AGE_MS=2*60*60*1000;
export function schemaReady(env){
 return env.VERCEL_ENV==='production'&&env.VERCEL==='1'&&env.SPENDSHIFT_PURCHASE_ATTRIBUTION_SCHEMA_READY==='true'&&releaseCapabilities(env).read;
}
export function purchaseAttributionEnabled(env,approved=PURCHASE_ATTRIBUTION_AUTHORIZED){
 return approved===true&&schemaReady(env)&&releaseCapabilities(env).collect&&env.SPENDSHIFT_PURCHASE_ATTRIBUTION_ENABLED==='true';
}
export function parseLabels(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join(',')!=='campaign,creative,source'||!SOURCES.includes(x.source)||!CAMPAIGNS.includes(x.campaign)||!CREATIVES.includes(x.creative))return null;
 if(x.campaign==='none_or_unknown'&&x.creative!=='none_or_unknown')return null;
 if(x.campaign==='meta_founder_v1'&&!['instagram','facebook'].includes(x.source))return null;
 return {source:x.source,campaign:x.campaign,creative:x.creative};
}
function one(p,k){const keys=[...p.keys()].filter(v=>v.toLowerCase()===k);return keys.length===1&&keys[0]===k?p.get(k):null;}
export function landingLabels(ref,origin,search){
 try{
  if(typeof search!=='string'||search.length>4096)return null;
  const source=sourceCategory(ref,origin,search);if(!SOURCES.includes(source))return null;
  const p=new URLSearchParams(search);
  // Require explicit paid tags; an ordinary social referral is never promoted into a paid campaign.
  const campaign=['instagram','facebook'].includes(source)&&one(p,'utm_campaign')==='meta_founder_v1'&&one(p,'utm_medium')==='paid_social'?'meta_founder_v1':'none_or_unknown';
  const content=one(p,'utm_content');
  const creative=campaign==='meta_founder_v1'&&CREATIVES.includes(content)?content:'none_or_unknown';
  return parseLabels({source,campaign,creative});
 }catch{return null;}
}
export function checkoutLabels(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join(',')!=='campaign,creative,notice,source'||x.notice!==NOTICE)return null;
 return parseLabels({source:x.source,campaign:x.campaign,creative:x.creative});
}
export function parseContext(raw,now=Date.now()){
 try{
  const x=JSON.parse(raw);if(!x||Object.keys(x).sort().join(',')!=='captured,labels'||!Number.isSafeInteger(x.captured)||x.captured>now||now-x.captured>MAX_AGE_MS)return null;
  return parseLabels(x.labels);
 }catch{return null;}
}
export function validatedReport(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join(',')!=='attributed,groups,total_orders,unattributed'||![x.total_orders,x.attributed,x.unattributed].every(n=>Number.isSafeInteger(n)&&n>=0)||x.attributed+x.unattributed!==x.total_orders||!Array.isArray(x.groups)||x.groups.length>160)return null;
 const seen=new Set();let sum=0;const groups=[];
 for(const row of x.groups){if(!row||Object.keys(row).sort().join(',')!=='campaign,count,creative,source'||!Number.isSafeInteger(row.count)||row.count<=0)return null;const l=parseLabels({source:row.source,campaign:row.campaign,creative:row.creative});if(!l)return null;const key=JSON.stringify(l);if(seen.has(key))return null;seen.add(key);sum+=row.count;groups.push({...l,count:row.count});}
 if(sum!==x.attributed)return null;
 return {total_orders:x.total_orders,attributed:x.attributed,unattributed:x.unattributed,groups};
}
