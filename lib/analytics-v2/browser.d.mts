import type {Metric} from './core.mjs';
export type Choice='unset'|'granted'|'denied';
export type Preference={version:string;basicOff:boolean;legacyTransition:boolean;analytics:Choice;ads:Choice};
export type Collector={allowed():boolean;state():{storageOK:boolean;legacy:string|null;pref:Preference|null};choose(p:{analytics:Choice;ads:Choice;basicOff?:boolean;transition?:boolean}):boolean;emit(e:Metric):boolean};
export function browserCollector(options:{enabled:boolean;noticeVisible:()=>boolean}):Collector;
