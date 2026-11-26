export const homeSections:Readonly<Record<string,string>>;
export const homeCtas:Readonly<Record<string,string>>;
export const homeMetrics:readonly string[];
export function homeTimingEvents(ms:number):string[];
export function createDwellTracker():{reset():void;update(now:number,codes:string[]):string[]};
