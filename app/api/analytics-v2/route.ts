import {createIngestion} from "@/lib/analytics-v2/ingest.mjs";
import {analyticsFixtureEnabled,FIXTURE_ORIGIN,BRIDGE_ORIGIN} from "@/lib/analytics-v2/fixture-mode";
import {releaseCapabilities,PRODUCTION_ORIGIN} from "@/lib/analytics-v2/release-config.mjs";
import {releaseAdapter} from "@/lib/analytics-v2/production-server";
import {marketFromCountry} from "@/lib/analytics-v2/market.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:Request){
 if(releaseCapabilities(process.env).collect){return createIngestion({enabled:true,origin:PRODUCTION_ORIGIN,canonicalHost:new URL(PRODUCTION_ORIGIN).host,allowChoice:false,allowPrivate:false,marketForEntry:request=>marketFromCountry(request.headers.get('x-vercel-ip-country')),increment:async args=>(await releaseAdapter()).increment(args)})(req);}

 const fixture=analyticsFixtureEnabled();
 // Synthetic header is usable only under the exact localhost CI fixture guard.
 return createIngestion({enabled:fixture,marketForEntry:request=>fixture?marketFromCountry(request.headers.get('x-ss-test-country')):'unknown',origin:FIXTURE_ORIGIN,canonicalHost:new URL(FIXTURE_ORIGIN).host,allowChoice:false,allowPrivate:false,increment:async args=>{
 const res=await fetch(BRIDGE_ORIGIN+"/increment",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer synthetic-only"},body:JSON.stringify(args),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(2500)});
 if(!res.ok)throw Error("fixture unavailable");
 }})(req);
}
