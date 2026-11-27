import {timingSafeEqual} from "node:crypto";
import {releaseCapabilities,PRODUCTION_ORIGIN} from "@/lib/analytics-v2/release-config.mjs";
import {productionOwnerAllowed,releaseAdapter} from "@/lib/analytics-v2/production-server";
import {analyticsFixtureEnabled,BRIDGE_ORIGIN,FIXTURE_ORIGIN} from "@/lib/analytics-v2/fixture-mode";
import {rangeFor,renderDashboard,dashboardData} from "@/lib/analytics-v2/dashboard.mjs";
import {operationalData} from "@/lib/analytics-v2/operational.mjs";
import {purchaseAttributionEnabled} from "@/lib/analytics-v2/purchase-attribution.mjs";
import {readPurchaseAttributionReport} from "@/lib/analytics-v2/purchase-attribution-server";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'"};
function authorized(value:string|null){
 // Synthetic fixture credential only. This is NOT a production owner auth design.
 const expected=Buffer.from("Basic "+Buffer.from("fixture:synthetic-only").toString("base64"));
 const actual=Buffer.from(value??"");
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export async function GET(req:Request){
 const fixture=analyticsFixtureEnabled(),production=releaseCapabilities(process.env).read;
 if(!fixture&&!production)return new Response(null,{status:404,headers});
 if(req.headers.get("host")!==new URL(fixture?FIXTURE_ORIGIN:PRODUCTION_ORIGIN).host||new URL(req.url).pathname!=="/internal/analytics")return new Response(null,{status:404,headers});
 if(fixture?!authorized(req.headers.get("authorization")):!await productionOwnerAllowed(req.headers.get("authorization")))return new Response(null,{status:401,headers:{...headers,"WWW-Authenticate":fixture?'Basic realm="Synthetic analytics"':'Bearer'}});
 const url=new URL(req.url);const period=url.searchParams.get("period")??"7";const range=rangeFor(period);
 const format=url.searchParams.get("format")??"html";
 if(!range||!["html","json"].includes(format)||[...url.searchParams.keys()].some(k=>k!=="period"&&k!=="format")||url.searchParams.getAll("period").length>1||url.searchParams.getAll("format").length>1)return new Response(null,{status:400,headers});
 try{
  if(production&&!fixture){
    const adapter=await releaseAdapter(),data=await adapter.read(range);
    // A missing financial migration/feed must not silently create zeros or partial totals.
    let financial:{operations:unknown;coverage:unknown}={operations:data.operations,coverage:null};
    try{financial=await adapter.financial(range,data.operations);}catch{}
    const attributionOn=purchaseAttributionEnabled(process.env);
    const attribution=attributionOn?await readPurchaseAttributionReport(range):null;
    if(format==="json")return Response.json({range,dashboard:dashboardData(data.rows),operations:operationalData(financial.operations),coverage:financial.coverage,synthetic:false,...(attributionOn?{purchaseAttribution:attribution}:{})},{headers});
    return new Response(renderDashboard(data.rows,period,range,financial.operations,false,attributionOn?attribution:undefined),{headers:{...headers,"Content-Type":"text/html; charset=utf-8"}});
  }
  const response=await fetch(BRIDGE_ORIGIN+"/report?period="+period,{headers:{"Authorization":"Bearer synthetic-only"},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(3000)});
  if(!response.ok)throw Error("fixture unavailable");const data=await response.json();if(!data||!Array.isArray(data.rows))throw Error("invalid fixture");
  if(format==="json")return Response.json({range,dashboard:dashboardData(data.rows),operations:operationalData(data.operations),coverage:null,synthetic:true},{headers});
  return new Response(renderDashboard(data.rows,period,range,data.operations),{headers:{...headers,"Content-Type":"text/html; charset=utf-8"}});
 }catch{return new Response("Aggregate report unavailable.",{status:503,headers});}
}
