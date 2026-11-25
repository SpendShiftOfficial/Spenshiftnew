import {createIngestion} from "@/lib/analytics-v2/ingest.mjs";
import {analyticsFixtureEnabled,FIXTURE_ORIGIN,BRIDGE_ORIGIN} from "@/lib/analytics-v2/fixture-mode";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:Request){
 return createIngestion({enabled:analyticsFixtureEnabled(),origin:FIXTURE_ORIGIN,canonicalHost:new URL(FIXTURE_ORIGIN).host,allowChoice:false,allowPrivate:false,increment:async args=>{
 const res=await fetch(BRIDGE_ORIGIN+"/increment",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer synthetic-only"},body:JSON.stringify(args),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(2500)});
 if(!res.ok)throw Error("fixture unavailable");
 }})(req);
}
