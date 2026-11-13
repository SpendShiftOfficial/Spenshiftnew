import type {ReportRefinements} from './report-refinements';
export const roundMoney=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
export type MealComponent={
 type:"takeaway"|"restaurant"|"combined";
 label:string;
 amount:number|null;
 amountPeriod:"order"|"week";
 orders:number|null;
 swaps:number|null;
 homeCost:number|null;
 orderCost:number|null;
 weeklyCost:number|null;
 /** Net reduction for this group, including possible extra home-meal costs. */
 netWeeklySaving:number|null;
};
function mealComponent(
 type:MealComponent["type"],label:string,amount:number|null,
 amountPeriod:"order"|"week",orders:number|null,swaps:number|null,homeCost:number|null,
):MealComponent{
 const orderCost=amount===null?null:amountPeriod==="week"?(orders!==null&&orders>0?amount/orders:null):amount;
 const weeklyCost=amount===null?null:amountPeriod==="week"?amount:orders!==null?roundMoney(amount*orders):null;
 const netWeeklySaving=swaps!==null&&swaps>0&&orders!==null&&swaps<=orders&&orderCost!==null&&homeCost!==null
  ?roundMoney((orderCost-homeCost)*swaps):null;
 return {type,label,amount,amountPeriod,orders,swaps,homeCost,
  orderCost:orderCost===null?null:roundMoney(orderCost),weeklyCost,netWeeklySaving};
}
export function takeawayMath(r:ReportRefinements){
 const d=r.details;
 const mode=d.takeawayMealMode;
 const parts:MealComponent[]=[];
 if(["takeaway","both","combined"].includes(mode))parts.push(
  mealComponent(mode==="combined"?"combined":"takeaway",
    mode==="combined"?"Takeaway and eating out":"Takeaway or delivery",
    d.takeawayOrder,d.takeawayAmountPeriod,d.takeawayOrdersPerWeek,d.takeawaySwapPerWeek,d.takeawayReplacementCost)
 );
 if(["restaurant","both"].includes(mode))parts.push(
  mealComponent("restaurant","Cafés and restaurants",d.restaurantOrder,"order",
    d.restaurantOrdersPerWeek,d.restaurantSwapPerWeek,d.restaurantReplacementCost)
 );
 const allSpendKnown=parts.length>0&&parts.every(part=>part.weeklyCost!==null);
 const weeklyCost=allSpendKnown?roundMoney(parts.reduce((sum,p)=>sum+(p.weeklyCost??0),0)):null;
 const active=parts.filter(p=>p.swaps!==null&&p.swaps>0);
 const allSwapAmountsKnown=active.length>0&&active.every(p=>p.netWeeklySaving!==null);
 const net=allSwapAmountsKnown?roundMoney(active.reduce((sum,p)=>sum+(p.netWeeklySaving??0),0)):null;
 const weeklySaving=net!==null&&net>0?net:null;
 const orderCost=parts.length===1?parts[0].orderCost:null;
 return {orderCost,weeklyCost,weeklySaving,annualExample:weeklySaving===null?null:roundMoney(weeklySaving*52),parts};
}
export function checkedDifference(before:number,after:number,fees:number){
 if([before,after,fees].some(v=>!Number.isFinite(v)||v<0||v>100000))throw new Error('Use amounts from 0 to 100,000.');
 return roundMoney(before-after-fees);
}
export function quoteDifference(currentAnnual:number,quote:number,period:'month'|'year',fees:number){return checkedDifference(currentAnnual,quote*(period==='month'?12:1),fees);}
