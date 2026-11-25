export const pages:Record<string,string>;
export const enums:Record<string,(string|number)[]>;
export const events:Record<string,string[]>;
export type Metric={v:2;event:string;[key:string]:string|number};
export function validEvent(x:unknown):x is Metric;
export function sourceCategory(ref:string,origin:string):string|null;
export function campaignCategory(search:string):string;
