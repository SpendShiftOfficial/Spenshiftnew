// Shared browser-only fail-closed privacy state. No identifier, no network call.
const STOP_KEY='spendshift_privacy_save_failed';
const failedDocuments=new WeakSet();
const DOCUMENT_LATCH=Symbol.for('spendshift.privacy.save.failed');
const choices=['unset','granted','denied'];
export function decodePreference(raw){
 if(raw===null)return {ok:true,pref:null};
 try{
  if(typeof raw!=='string'||raw.length>512||raw.includes('\\'))return {ok:false,pref:null};
  const keys=[...raw.matchAll(/"([^"]+)"\s*:/g)].map(m=>m[1]);
  if(keys.length!==5||new Set(keys).size!==5||keys.some(k=>!['version','basicOff','legacyTransition','analytics','ads'].includes(k)))return {ok:false,pref:null};
  const p=JSON.parse(raw);
  if(!p||Array.isArray(p)||typeof p!=='object'||Object.keys(p).length!==5||
    p.version!=='2026-11-v2'||typeof p.basicOff!=='boolean'||typeof p.legacyTransition!=='boolean'||
    !choices.includes(p.analytics)||!choices.includes(p.ads))return {ok:false,pref:null};
  return {ok:true,pref:p};
 }catch{return {ok:false,pref:null};}
}
export function privacyBlocked(){
 if(typeof document==='undefined'||typeof window==='undefined')return false;
 if(failedDocuments.has(document)||document[DOCUMENT_LATCH]===true)return true;
 try{return window.sessionStorage?.getItem(STOP_KEY)==='1';}catch{return true;}
}
export function stopPrivacyDocument(){
 if(typeof document==='undefined'||typeof window==='undefined')return;
 failedDocuments.add(document);
 try{document[DOCUMENT_LATCH]=true;}catch{}
 // Best effort same-tab reload protection; if blocked, the in-memory latch still holds.
 try{window.sessionStorage?.setItem(STOP_KEY,'1');}catch{}
}
export function clearPrivacyFailureAfterSave(){
 if(typeof document==='undefined'||typeof window==='undefined')return true;
 try{
  const storage=window.sessionStorage;
  if(storage?.getItem(STOP_KEY)==='1'){storage.removeItem(STOP_KEY);if(storage.getItem(STOP_KEY)!==null)return false;}
  delete document[DOCUMENT_LATCH];failedDocuments.delete(document);return true;
 }catch{return false;}
}
