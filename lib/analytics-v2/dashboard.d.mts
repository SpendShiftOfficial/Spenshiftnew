export function rangeFor(period:string,now?:Date):{from:string;to:string}|null;
export function renderDashboard(rows:unknown[],period:string,range:{from:string;to:string},operations?:unknown,synthetic?:boolean,attribution?:import("./purchase-attribution.mjs").PurchaseAttributionReport|null):string;

export type DashboardSummary={totals:Record<string,number|null>;marketMix:{bucket:'australia'|'outside_australia'|'unknown';label:string;count:number;share:number}[]|null;homeEngagement:{views:number|null;time:{label:string;count:number|null;ratio:number|null}[];sections:{label:string;count:number|null;ratio:number|null}[];ctas:{label:string;impressions:number|null;clicks:number|null;ratio:number|null}[]};questions:{q:number;seen:number|null;advanced:number|null;ratio:number|null}[]|null;breakdowns:{title:string;values:{bucket:string;count:number}[]|null}[];ctaRatio:number|null};
export function dashboardData(rows:unknown[]):DashboardSummary;
