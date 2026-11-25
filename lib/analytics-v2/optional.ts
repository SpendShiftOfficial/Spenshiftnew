export type OptionalCategory="analytics"|"ads";
type Choice="unset"|"granted"|"denied";
type Permission={analytics:boolean;ads:boolean};
type StorageReader=Pick<Storage,"getItem">;
const off=():Permission=>({analytics:false,ads:false});
const choices=["unset","granted","denied"];
export const PREFERENCE_KEY="spendshift_privacy_v2";
export const LEGACY_KEY="spendshift_cookie_consent";
export function optionalPermissions(storage:StorageReader):Permission{
 try{
  const legacy=storage.getItem(LEGACY_KEY),raw=storage.getItem(PREFERENCE_KEY);
  if(legacy!==null&&legacy!=="granted"&&legacy!=="denied")return off();
  if(raw===null)return {analytics:legacy==="granted",ads:false};
  if(raw.length>512)return off();
  const p=JSON.parse(raw);
  if(!p||Array.isArray(p)||Object.keys(p).length!==5||p.version!=="2026-11-v2"||typeof p.basicOff!=="boolean"||typeof p.legacyTransition!=="boolean"||!choices.includes(p.analytics)||!choices.includes(p.ads))return off();
  return {analytics:p.analytics==="granted",ads:false};
 }catch{return off();}
}
export function granularMode(){
 return typeof document!=="undefined"&&document.documentElement?.dataset.ssPrivacyMode==="v2";
}
export function optionalAllowed(category:OptionalCategory){
 if(category==='ads')return false;
 try{return granularMode()?optionalPermissions(localStorage)[category]:localStorage.getItem(LEGACY_KEY)==="granted";}catch{return false;}
}
// Never let a legacy all-granted choice override a new split/rejection after rollback.
// A fresh visitor never receives a legacy grant from this flow.
export function protectRollback(storage:Pick<Storage,"getItem"|"setItem">,analytics:Choice,ads:Choice){
 if(storage.getItem(LEGACY_KEY)==="granted"&&(analytics!=="granted"||ads!=="granted"))storage.setItem(LEGACY_KEY,"denied");
}
