import {decodePreference,privacyBlocked} from "./privacy-runtime.mjs";
export type OptionalCategory="analytics"|"ads";
type Choice="unset"|"granted"|"denied";
type Permission={analytics:boolean;ads:boolean};
type StorageReader=Pick<Storage,"getItem">;
const off=():Permission=>({analytics:false,ads:false});
export const PREFERENCE_KEY="spendshift_privacy_v2";
export const LEGACY_KEY="spendshift_cookie_consent";
export function optionalPermissions(storage:StorageReader):Permission{
 try{
  if(privacyBlocked())return off();
  const legacy=storage.getItem(LEGACY_KEY),decoded=decodePreference(storage.getItem(PREFERENCE_KEY));
  if(![null,"granted","denied"].includes(legacy)||!decoded.ok)return off();
  return {analytics:decoded.pref===null?legacy==="granted":decoded.pref.analytics==="granted",ads:false};
 }catch{return off();}
}
export function granularMode(){
 return typeof document!=="undefined"&&document.documentElement?.dataset.ssPrivacyMode==="v2";
}
export function optionalAllowed(category:OptionalCategory){
 if(category==='ads')return false;
 try{return optionalPermissions(localStorage)[category];}catch{return false;}
}
// Never let a legacy all-granted choice override a new split/rejection after rollback.
// A fresh visitor never receives a legacy grant from this flow.
export function protectRollback(storage:Pick<Storage,"getItem"|"setItem">,analytics:Choice,ads:Choice){
 if(storage.getItem(LEGACY_KEY)==="granted"&&(analytics!=="granted"||ads!=="granted")){
  storage.setItem(LEGACY_KEY,"denied");if(storage.getItem(LEGACY_KEY)!=="denied")throw Error("privacy choice not saved");
 }
}
