import {timingSafeEqual} from "node:crypto";
import {releaseCapabilities,PRODUCTION_ORIGIN} from "@/lib/analytics-v2/release-config.mjs";
import {productionOwnerAllowed,releaseAdapter} from "@/lib/analytics-v2/production-server";
import {analyticsFixtureEnabled,BRIDGE_ORIGIN,FIXTURE_ORIGIN} from "@/lib/analytics-v2/fixture-mode";
import {rangeFor,renderDashboard} from "@/lib/analytics-v2/dashboard.mjs";
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
 if(!range||[...url.searchParams.keys()].some(k=>k!=="period")||url.searchParams.getAll("period").length>1)return new Response(null,{status:400,headers});
 try{
  if(production&&!fixture){const data=await (await releaseAdapter()).read(range);return new Response(renderDashboard(data.rows,period,range,data.operations,false),{headers:{...headers,"Content-Type":"text/html; charset=utf-8"}});}
  const response=await fetch(BRIDGE_ORIGIN+"/report?period="+period,{headers:{"Authorization":"Bearer synthetic-only"},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(3000)});
  if(!response.ok)throw Error("fixture unavailable");const data=await response.json();if(!data||!Array.isArray(data.rows))throw Error("invalid fixture");
  return new Response(renderDashboard(data.rows,period,range,data.operations),{headers:{...headers,"Content-Type":"text/html; charset=utf-8"}});
 }catch{return new Response("Synthetic aggregate report unavailable.",{status:503,headers});}
}
