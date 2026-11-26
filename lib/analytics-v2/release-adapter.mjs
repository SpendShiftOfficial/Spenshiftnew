// Inject a server-only Supabase RPC client. Never instantiate it in the browser.
import {events,validEvent} from './core.mjs';
import {marketBuckets} from './market.mjs';
import {validateDailySource,mergeFinancial} from './finance.mjs';
export function createReleaseAdapter(rpc){
 const call=async(name,args={})=>{const r=await rpc(name,args);if(!r||r.error)throw Error('analytics unavailable');return r.data;};
 return {
  async increment(args){
   if(!args||!Object.hasOwn(events,args.p_event))throw Error('invalid event');
   const arrival=args.p_event==='site_entry';
   if(Object.keys(args).length!==events[args.p_event].length+1+Number(arrival)||
      (arrival?!Object.hasOwn(args,'p_market')||!marketBuckets.includes(args.p_market):Object.hasOwn(args,'p_market')))throw Error('invalid event');
   const e={v:2,event:args.p_event};for(const k of events[e.event])e[k]=args['p_'+k];
   if(!validEvent(e)||e.event==='optional_choice'||e.event.startsWith('personalisation_'))throw Error('unapproved event');
   const result=await call('spendshift_accept_metrics_v2',args);
   if(!['accepted','disabled','limited'].includes(result))throw Error('invalid response');
   return result;
  },
  async read(range){
   const data=await call('spendshift_read_metrics_v2',{p_from:range.from,p_to:range.to});
   if(!data||!Array.isArray(data.rows)||!data.operations||typeof data.operations!=='object')throw Error('invalid report');
   return data;
  },
  async financial(range,operations){return mergeFinancial(operations,await call('spendshift_read_financial_v2',{p_from:range.from,p_to:range.to}),range);},
  async saveSource(input){const row=validateDailySource(input);if(!row)throw Error('invalid daily source');await call('spendshift_save_source_v2',{p_date:row.date,p_source:row.source,p_values:row.values});},
  async prune(){await call('spendshift_prune_metrics_v2_release');},
  async sessionActive(user,session){return (await call('spendshift_owner_session_active',{p_user:user,p_session:session}))===true;}
 };
}
