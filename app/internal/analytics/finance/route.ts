import {releaseCapabilities,PRODUCTION_ORIGIN,RELEASE_AUTHORIZED} from "@/lib/analytics-v2/release-config.mjs";
import {productionOwnerAllowed,releaseAdapter} from "@/lib/analytics-v2/production-server";
import {createSourceHandler} from "@/lib/analytics-v2/source-handler.mjs";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(req:Request){
 return createSourceHandler({enabled:RELEASE_AUTHORIZED&&releaseCapabilities(process.env).read&&process.env.SPENDSHIFT_ANALYTICS_V2_FINANCE_IMPORT_ENABLED==="true",
 origin:PRODUCTION_ORIGIN,authorize:productionOwnerAllowed,save:async row=>(await releaseAdapter()).saveSource(row)})(req);
}
