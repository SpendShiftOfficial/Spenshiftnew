/** Only public brochure pages may load optional third-party measurement. */
export const publicMarketingPaths=['/','/pricing','/whats-included','/how-it-works','/why-spendshift','/services','/save-money-australia','/reduce-electricity-bill-australia','/cancel-unused-subscriptions-australia'];
export function isMarketingPath(path:string){return publicMarketingPaths.includes(path.replace(/\/$/,'')||'/');}
// Only public campaign fields are allowed to remain in a tracked URL. Remove
// ad click IDs before loading ANY third-party script; never pass IDs or unknown
// query fields (which might contain private report/payment data) to trackers.
const campaignFields=new Set(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id']);
const removableClickIds=new Set(['fbclid','gclid','gbraid','wbraid','ttclid','msclkid','igshid']);
export function cleanPublicMarketingQuery(search:string):{allowed:boolean;sanitizedSearch:string}{
 if(!search)return {allowed:true,sanitizedSearch:''};
 if(search.length>4096)return {allowed:false,sanitizedSearch:''};
 const params=new URLSearchParams(search);
 const safe=new URLSearchParams();
 const seen=new Set<string>();
 for(const [key,value] of params){
  if(seen.has(key))return {allowed:false,sanitizedSearch:''};
  seen.add(key);
  if(campaignFields.has(key)){
   // Marketing labels only: no free text, URLs, emails or report/payment tokens.
   if(!/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,79}$/.test(value)||
      /(?:rpt_|cs_(?:test|live)_|sk_(?:test|live)_)/i.test(value)){
    return {allowed:false,sanitizedSearch:''};
   }
   safe.append(key,value);
  }else if(removableClickIds.has(key)){
   if(!value||value.length>2048)return {allowed:false,sanitizedSearch:''};
  }else return {allowed:false,sanitizedSearch:''};
 }
 const query=safe.toString();
 return {allowed:true,sanitizedSearch:query?'?'+query:''};
}
export function canTrack(){
 if(typeof window==='undefined'||!isMarketingPath(window.location.pathname)||window.location.hash)return false;
 // The URL must already have been cleaned before scripts or CTA events run.
 const query=cleanPublicMarketingQuery(window.location.search);
 if(!query.allowed||query.sanitizedSearch!==window.location.search)return false;
 try{return localStorage.getItem('spendshift_cookie_consent')==='granted'&&(window as any).__spendshiftPublicTracking===true;}catch{return false;}
}
export function safeEventParams(params:Record<string,unknown>={}){
 const out:Record<string,string|number|boolean>={};
 if(params.currency==='AUD') out.currency='AUD';
 for(const key of ['question_number','sections_presented','insurance_policies']) if(typeof params[key]==='number'&&Number.isFinite(params[key])) out[key]=params[key] as number;
 if(typeof params.extra_area_selected==='boolean') out.extra_area_selected=params.extra_area_selected;
 // No URLs, access IDs, email addresses, free text, financial answers or report content.
 return out;
}
