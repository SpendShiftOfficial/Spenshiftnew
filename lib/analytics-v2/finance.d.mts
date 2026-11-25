export type Source="stripe"|"meta"|"ga4";
export type DailySource={date:string;source:Source;values:Record<string,number>};
export type Coverage={expected_days:number;stripe:number;meta:number;ga4:number};
export const fields:Record<Source,string[]>;
export function validateDailySource(input:unknown,now?:Date):DailySource|null;
export function mergeFinancial(operations:unknown,finance:unknown,range:{from:string;to:string}):{operations:Record<string,unknown>;coverage:Coverage};
