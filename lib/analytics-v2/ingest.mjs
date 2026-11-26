// Production-shaped request handler; no live database adapter or app route is connected.
import {parseEvent,events} from './core.mjs';
import {marketBuckets} from './market.mjs';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const response=status=>new Response(null,{status,headers});
export function createIngestion({enabled=false,origin,canonicalHost,increment,allowChoice=false,allowPrivate=false,admit=()=>true,marketForEntry=()=> 'unknown'}={}){
 return async function ingest(req){
  if(enabled!==true)return response(204);
  if(req.method!=='POST')return response(405);
  let url;try{url=new URL(req.url);}catch{return response(400);}
  if(!origin||(canonicalHost?req.headers.get('host')!==canonicalHost:url.origin!==origin)||req.headers.get('origin')!==origin||(req.headers.has('sec-fetch-site')&&req.headers.get('sec-fetch-site')!=='same-origin'))return response(403);
  if(url.pathname!=='/api/analytics-v2'||url.search||url.hash)return response(400);
  if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers.get('content-type')??''))return response(415);
  if(req.headers.has('content-encoding')&&req.headers.get('content-encoding')!=='identity')return response(415);
  const stated=req.headers.get('content-length');if(stated!==null){if(!/^\d+$/.test(stated))return response(400);if(Number(stated)>512)return response(413);}
  try{
   if(!await admit())return response(429);
   if(!req.body)return response(400);
   const reader=req.body.getReader(),chunks=[];let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>512){await reader.cancel();return response(413);}chunks.push(value);}}finally{reader.releaseLock();}
   const bytes=new Uint8Array(length);let pos=0;for(const part of chunks){bytes.set(part,pos);pos+=part.byteLength;}let raw;try{raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return response(400);}
   const x=parseEvent(raw);if(!x)return response(400);
   if((x.event==='optional_choice'&&!allowChoice)||(x.event.startsWith('personalisation_')&&!allowPrivate))return response(204);
   if(typeof increment!=='function')return response(503);
   const args={p_event:x.event};for(const f of events[x.event])args['p_'+f]=x[f];
   // Only a validated arrival can receive this server-only marginal. The resolver
   // is not called for any audit, private, or rejected request. Never echo the value.
   if(x.event==='site_entry'){
     let market='unknown';try{const value=marketForEntry(req);if(marketBuckets.includes(value))market=value;}catch{}
     args.p_market=market;
   }
   const result=await increment(args);return response(result==='limited'?429:204);
  }catch{return response(503);}
 };
}
