import assert from 'node:assert/strict';
import {createIngestion} from '../../lib/analytics-v2/ingest.mjs';
import {marketFromCountry,marketBuckets} from '../../lib/analytics-v2/market.mjs';
const origin='http://127.0.0.1:1234',calls=[];let passes=0;
const make=(body,opts={})=>new Request(origin+(opts.path??'/api/analytics-v2'),{method:opts.method??'POST',headers:{Origin:origin,'Content-Type':'application/json',...opts.headers},...((opts.method??'POST')==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
const good={v:2,event:'audit_question_advanced',question:3};const run=createIngestion({enabled:true,origin,increment:args=>{calls.push(args);}});
async function status(handler,req,want){const res=await handler(req);assert.equal(res.status,want);assert.match(res.headers.get('cache-control'),/no-store/);assert.equal(await res.text(),'');passes++;}
await status(createIngestion(),make(good),204);assert.equal(calls.length,0);
await status(run,make(good),204);assert.deepEqual(calls,[{p_event:'audit_question_advanced',p_question:3}]);
await status(run,make({...good,reportId:'rpt_synthetic'}),400);await status(run,make(good,{method:'GET'}),405);await status(run,make(good,{path:'/api/analytics-v2?secret=yes'}),400);await status(run,make(good,{headers:{Origin:'https://example.invalid'}}),403);await status(run,make(good,{headers:{'Sec-Fetch-Site':'cross-site'}}),403);await status(run,make(good,{headers:{'Content-Type':'text/plain'}}),415);await status(run,make(good,{headers:{'Content-Encoding':'gzip'}}),415);await status(run,make(good,{headers:{'Content-Length':'999'}}),413);await status(run,make('x'.repeat(513)),413);await status(run,make('{"v":2,"event":"audit_start","event":"audit_arrival"}'),400);await status(run,make({v:2,event:'personalisation_view'}),204);await status(run,make({v:2,event:'optional_choice',choice:'accept_all'}),204);assert.equal(calls.length,1);
await status(createIngestion({enabled:true,origin,admit:()=>false,increment:()=>{throw Error('must not call');}}),make(good),429);
await status(createIngestion({enabled:true,origin,increment:()=>{throw Error('synthetic outage');}}),make(good),503);
await status(createIngestion({enabled:true,origin}),make(good),503);
const entry={v:2,event:'site_entry',page:'home',source:'instagram',campaign:'none_or_unknown',device:'mobile',browser:'safari'};
const marketCalls=[];let reads=0;
const geo=createIngestion({enabled:true,origin,increment:a=>marketCalls.push(a),marketForEntry:r=>{reads++;return marketFromCountry(r.headers.get('x-vercel-ip-country'));}});
for(const [code,expected] of [['AU','australia'],['NZ','outside_australia'],['US','outside_australia'],['GB','outside_australia'],['ZZ','unknown'],['XX','unknown'],['EU','unknown'],['AU, NZ','unknown'],['au','unknown'],['synthetic@example.invalid','unknown'],[null,'unknown']]){
 await status(geo,make(entry,{headers:code===null?{}:{'x-vercel-ip-country':code,'x-forwarded-for':'192.0.2.5','x-vercel-ip-city':'synthetic-city'}}),204);
 assert.equal(marketCalls.at(-1).p_market,expected);
 assert.ok(marketBuckets.includes(marketCalls.at(-1).p_market));
 assert.deepEqual(Object.keys(marketCalls.at(-1)).sort(),['p_event','p_page','p_source','p_campaign','p_device','p_browser','p_market'].sort());
}
assert.equal(reads,11);
await status(geo,make({...entry,market:'australia'}),400);
await status(geo,make({...entry,country:'AU'}),400);
await status(geo,make({...entry,ip:'192.0.2.5'}),400);
await status(geo,make(entry,{headers:{Origin:'https://evil.invalid'}}),403);
await status(geo,make(good,{headers:{'x-vercel-ip-country':'AU'}}),204);
assert.equal(reads,11,'no geo lookup for rejected or non-entry events');assert.equal(Object.hasOwn(marketCalls.at(-1),'p_market'),false);
await status(createIngestion({enabled:true,origin,increment:a=>marketCalls.push(a)}),make(entry,{headers:{'x-vercel-ip-country':'AU'}}),204);
assert.equal(marketCalls.at(-1).p_market,'unknown','unconfigured or local header not trusted');
await status(createIngestion({enabled:true,origin,increment:a=>marketCalls.push(a),marketForEntry:()=>{throw Error('synthetic failure')}}),make(entry),204);
assert.equal(marketCalls.at(-1).p_market,'unknown');
console.log('PASS '+passes+' request-handler status, no-cache and no-echo checks');
