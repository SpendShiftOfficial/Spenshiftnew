export type MarketBucket='australia'|'outside_australia'|'unknown';
export const marketBuckets:readonly MarketBucket[];
export const marketLabels:Readonly<Record<MarketBucket,string>>;
export function marketFromCountry(code:unknown):MarketBucket;
