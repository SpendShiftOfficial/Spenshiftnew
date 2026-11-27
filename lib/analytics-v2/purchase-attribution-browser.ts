// Only bounded labels; never store full URLs, identifiers or click IDs.
import {NOTICE,landingLabels,parseContext} from "./purchase-attribution.mjs";
import {optionalAllowed} from "./optional";
import {decodePreference,privacyBlocked} from "./privacy-runtime.mjs";
import {basicAllowed,sourceCategory} from "./core.mjs";
export const ATTR_PERMISSION="spendshift_purchase_attribution_permission_v1";
const CONTEXT="spendshift_purchase_attribution_context_v1";
const enabled=()=>document.documentElement.dataset.ssPurchaseAttribution==="v1";
export function clearAttributionContext(){try{sessionStorage.removeItem(CONTEXT);}catch{}}
export function attributionPermitted(){
 try{
  if(!enabled()||privacyBlocked()||!optionalAllowed("analytics")||localStorage.getItem(ATTR_PERMISSION)!==NOTICE)return false;
  const pref=decodePreference(localStorage.getItem("spendshift_privacy_v2"));
  const legacy=localStorage.getItem("spendshift_cookie_consent");
  return pref.ok&&pref.pref?.analytics==="granted"&&basicAllowed({enabled:true,noticeVisible:true,storageOK:pref.ok,legacy,pref:pref.pref});
 }catch{return false;}
}
export function saveAttributionChoice(granted:boolean){
 try{
  clearAttributionContext();
  if(!enabled()||!granted){localStorage.removeItem(ATTR_PERMISSION);return;}
  localStorage.setItem(ATTR_PERMISSION,NOTICE);
  if(localStorage.getItem(ATTR_PERMISSION)!==NOTICE)clearAttributionContext();
 }catch{clearAttributionContext();}
}
export function beginAttributionDocument(){
 try{if(enabled()&&sourceCategory(document.referrer,location.origin,location.search)!==null)clearAttributionContext();}catch{clearAttributionContext();}
}
export function rememberAttributionLanding(){
 try{
  if(!attributionPermitted()){clearAttributionContext();return;}
  const labels=landingLabels(document.referrer,location.origin,location.search);
  if(labels)sessionStorage.setItem(CONTEXT,JSON.stringify({captured:Date.now(),labels}));
 }catch{clearAttributionContext();}
}
export function readPurchaseAttribution(){
 try{
  if(!attributionPermitted()){clearAttributionContext();return null;}
  const labels=parseContext(sessionStorage.getItem(CONTEXT));
  if(!labels){clearAttributionContext();return null;}
  return {...labels,notice:NOTICE};
 }catch{return null;}
}
