/** Only public brochure pages may load optional third-party measurement. */
export const publicMarketingPaths=['/','/pricing','/whats-included','/how-it-works','/save-money-australia'];
export function isMarketingPath(path:string){return publicMarketingPaths.includes(path.replace(/\/$/,'')||'/');}
export function canTrack(){
 if(typeof window==='undefined'||!isMarketingPath(window.location.pathname)||window.location.search||window.location.hash) return false;
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
