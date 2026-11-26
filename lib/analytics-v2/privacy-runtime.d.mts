import type {Preference} from './browser.mjs';
export function decodePreference(raw:string|null):{ok:boolean;pref:Preference|null};
export function privacyBlocked():boolean;
export function stopPrivacyDocument():void;
export function clearPrivacyFailureAfterSave():boolean;
