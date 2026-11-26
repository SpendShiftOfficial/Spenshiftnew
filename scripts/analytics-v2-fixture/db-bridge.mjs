// Local synthetic database adapter; never import into the live application.
import http from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {validEvent,events} from '../../lib/analytics-v2/core.mjs';
import {marketBuckets} from '../../lib/analytics-v2/market.mjs';
import {rangeFor} from '../../lib/analytics-v2/dashboard.mjs';
import {operationalQuery} from '../../lib/analytics-v2/operational.mjs';
const exec=promisify(execFile);
if(process.env.CI!=='true'||process.env.PGHOST!=='127.0.0.1'||process.env.PGDATABASE!=='analytics_v2_test'||process.env.PGUSER!=='postgres'||process.env.PGPASSWORD!=='synthetic_only')throw Error('disposable test DB required');
const sql=async statement=>(await exec('psql',['-X','-qAt','-v','ON_ERROR_STOP=1','-c',statement],{timeout:2500,maxBuffer:1000000})).stdout.trim();
const q=v=>typeof v==='number'?String(v):"'"+v.replaceAll("'","''")+"'";
if(await sql("SELECT current_database() || ':' || (to_regclass('public.report_orders') IS NULL AND to_regclass('public.reports') IS NULL)::text")!=='analytics_v2_test:true')throw Error('unexpected schema');
const server=http.createServer(async(req,res)=>{
 const reply=(status,body='')=>{res.writeHead(status,{'Cache-Control':'no-store','Content-Type':'application/json'});res.end(body);};
 if(req.headers.authorization!=='Bearer synthetic-only')return reply(403);
 try{
  if(req.method==='POST'&&req.url==='/increment'){
   let bytes=0,parts=[];for await(const p of req){bytes+=p.length;if(bytes>512)return reply(413);parts.push(p);}
   const a=JSON.parse(Buffer.concat(parts).toString('utf8')),e={v:2,event:a.p_event};
   if(!Object.hasOwn(events,a.p_event))return reply(400);
   const arrival=e.event==='site_entry';
   if(Object.keys(a).length!==events[a.p_event].length+1+Number(arrival)||(arrival?!marketBuckets.includes(a.p_market):Object.hasOwn(a,'p_market')))return reply(400);
   for(const f of events[a.p_event])e[f]=a['p_'+f];
   if(!validEvent(e)||e.event==='optional_choice'||e.event.startsWith('personalisation_'))return reply(400);
   const args=[q(e.event),...events[e.event].map(f=>'p_'+f+'=>'+q(e[f]))];if(arrival)args.push('p_market=>'+q(a.p_market));
   await sql("SET ROLE service_role; SELECT public.spendshift_increment_metrics_v2("+args.join(',')+");");return reply(204);
  }
  const url=new URL(req.url,'http://127.0.0.1:3163');
  if(req.method==='GET'&&url.pathname==='/report'){
   const range=rangeFor(url.searchParams.get('period')??'7');if(!range)return reply(400);
   const result=await sql("SET ROLE service_role; SELECT COALESCE(json_agg(t),'[]'::json) FROM (SELECT metric_code,dimension_code,bucket_code,SUM(event_count)::text AS event_count FROM public.spendshift_metrics_v2_daily WHERE metric_date BETWEEN "+q(range.from)+"::date AND "+q(range.to)+"::date GROUP BY 1,2,3) t;");
   const ops=await sql('SET ROLE service_role; '+operationalQuery(range));
   return reply(200,JSON.stringify({rows:JSON.parse(result),operations:JSON.parse(ops)}));
  }
  return reply(404);
 }catch{return reply(503);}
});
server.listen(3163,'127.0.0.1',()=>console.log('synthetic PostgreSQL bridge ready'));
