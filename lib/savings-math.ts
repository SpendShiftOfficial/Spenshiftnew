import type {ReportRefinements} from './report-refinements';
export const roundMoney=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
export function takeawayMath(r:ReportRefinements){
 const d=r.details;const amount=d.takeawayOrder;const orders=d.takeawayOrdersPerWeek;const swaps=d.takeawaySwapPerWeek;const home=d.takeawayReplacementCost;
 const orderCost=amount===null?null:d.takeawayAmountPeriod==='week'?(orders!==null&&orders>0?amount/orders:null):amount;
 const weeklyCost=amount===null?null:d.takeawayAmountPeriod==='week'?amount:(orders!==null?amount*orders:null);
 const weeklySaving=orderCost!==null&&orders!==null&&swaps!==null&&home!==null&&swaps>0&&swaps<=orders&&orderCost>home?roundMoney((orderCost-home)*swaps):null;
 return {orderCost:orderCost===null?null:roundMoney(orderCost),weeklyCost:weeklyCost===null?null:roundMoney(weeklyCost),weeklySaving,annualExample:weeklySaving===null?null:roundMoney(weeklySaving*52)};
}
export function checkedDifference(before:number,after:number,fees:number){
 if([before,after,fees].some(v=>!Number.isFinite(v)||v<0||v>100000))throw new Error('Use amounts from 0 to 100,000.');
 return roundMoney(before-after-fees);
}
export function quoteDifference(currentAnnual:number,quote:number,period:'month'|'year',fees:number){return checkedDifference(currentAnnual,quote*(period==='month'?12:1),fees);}
