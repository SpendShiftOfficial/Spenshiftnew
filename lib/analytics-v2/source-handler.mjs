import {validateDailySource} from './finance.mjs';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
const reply=status=>new Response(null,{status,headers});
export function createSourceHandler({enabled=false,origin,authorize,save}={}){
 return async function handle(req){
  if(!enabled)return reply(404);
  if(req.method!=='POST')return reply(405);
  try{
   if(!origin||req.headers.get('host')!==new URL(origin).host||req.headers.get('origin')!==origin||
      (req.headers.has('sec-fetch-site')&&req.headers.get('sec-fetch-site')!=='same-origin'))return reply(403);
   const u=new URL(req.url);if(u.pathname!=='/internal/analytics/finance'||u.search||u.hash)return reply(400);
   if(typeof authorize!=='function'||!await authorize(req.headers.get('authorization')))return reply(401);
   if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers.get('content-type')??''))return reply(415);
   if(req.headers.has('content-encoding')&&req.headers.get('content-encoding')!=='identity')return reply(415);
   const size=req.headers.get('content-length');if(size!==null&&(!/^\d+$/.test(size)||Number(size)>2048))return reply(413);
   if(!req.body)return reply(400);const reader=req.body.getReader();let count=0,raw='';
   try{const decoder=new TextDecoder('utf-8',{fatal:true});for(;;){const part=await reader.read();if(part.done)break;count+=part.value.byteLength;if(count>2048){await reader.cancel();return reply(413);}raw+=decoder.decode(part.value,{stream:true});}raw+=decoder.decode();}catch{return reply(400);}finally{reader.releaseLock();}
   // Only fixed ASCII keys, ISO dates and integer values; no escaped or duplicate keys.
   if(raw.includes('\\')||!/^[\x20-\x7e\t\r\n]*$/.test(raw))return reply(400);
   const keys=[...raw.matchAll(/"([a-z_]+[a-z0-9_]*)"\s*:/g)].map(m=>m[1]);if(new Set(keys).size!==keys.length)return reply(400);
   let data;try{data=JSON.parse(raw);}catch{return reply(400);}
   const row=validateDailySource(data);if(!row)return reply(400);
   if(typeof save!=='function')return reply(503);await save(row);return reply(204);
  }catch{return reply(503);}
 };
}
