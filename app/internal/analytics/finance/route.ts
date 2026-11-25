import {releaseCapabilities,PRODUCTION_ORIGIN} from "@/lib/analytics-v2/release-config.mjs";
import {productionOwnerAllowed,releaseAdapter} from "@/lib/analytics-v2/production-server";
import {validateDailySource} from "@/lib/analytics-v2/finance.mjs";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow"};
const reply=(status:number)=>new Response(null,{status,headers});
export async function POST(req:Request){
 if(!releaseCapabilities(process.env).read||process.env.SPENDSHIFT_ANALYTICS_V2_FINANCE_IMPORT_ENABLED!=="true")return reply(404);
 if(req.headers.get("host")!==new URL(PRODUCTION_ORIGIN).host||req.headers.get("origin")!==PRODUCTION_ORIGIN||
    req.headers.has("sec-fetch-site")&&req.headers.get("sec-fetch-site")!=="same-origin")return reply(403);
 if(!await productionOwnerAllowed(req.headers.get("authorization")))return reply(401);
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers.get("content-type")??""))return reply(415);
 const size=req.headers.get("content-length");if(size!==null&&(!/^\d+$/.test(size)||Number(size)>2048))return reply(413);
 try{
  if(!req.body)return reply(400);const reader=req.body.getReader();let count=0;const decoder=new TextDecoder("utf-8",{fatal:true});let raw="";
  try{for(;;){const part=await reader.read();if(part.done)break;count+=part.value.byteLength;if(count>2048){await reader.cancel();return reply(413);}raw+=decoder.decode(part.value,{stream:true});}raw+=decoder.decode();}
  finally{reader.releaseLock();}
  let data:unknown;try{data=JSON.parse(raw);}catch{return reply(400);}
  const row=validateDailySource(data);if(!row)return reply(400);
  await (await releaseAdapter()).saveSource(row);return reply(204);
 }catch{return reply(503);}
}
