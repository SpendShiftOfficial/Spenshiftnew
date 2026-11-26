import {events,enums,questionRatio,sydneyDay} from './core.mjs';
import {operationalData} from './operational.mjs';
import {marketBuckets,marketLabels} from './market.mjs';
export const periods=['today','yesterday','7','30','90','180'];
export function rangeFor(period,now=new Date()){
 if(!periods.includes(period))return null;
 const today=sydneyDay(now),end=new Date(today+'T00:00:00Z');
 if(period==='yesterday')end.setUTCDate(end.getUTCDate()-1);
 const start=new Date(end);start.setUTCDate(start.getUTCDate()-(period==='today'||period==='yesterday'?0:Number(period)-1));
 return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)};
}
export function dashboardData(rows){
 const sums=new Map();
 for(const row of rows){
   const {metric_code,dimension_code,bucket_code,event_count}=row;
   const count=typeof event_count==='string'&&/^\d+$/.test(event_count)?Number(event_count):event_count;
   const allowed=Object.hasOwn(events,metric_code)&&(dimension_code==='all'?bucket_code==='all':(dimension_code==='market'?metric_code==='site_entry'&&marketBuckets.includes(bucket_code):events[metric_code].includes(dimension_code)&&enums[dimension_code].map(String).includes(bucket_code)));
   if(!allowed||!Number.isSafeInteger(count)||count<0)throw Error('invalid aggregate');
   const key=[metric_code,dimension_code,bucket_code].join(':');const n=(sums.get(key)??0)+count;if(!Number.isSafeInteger(n))throw Error('overflow');sums.set(key,n);
 }
 const get=(e,d='all',b='all')=>sums.get([e,d,b].join(':'))??null;
 const totals=Object.fromEntries(Object.keys(events).map(e=>[e,get(e)]));
 function breakdown(event,dimension){
   const counts=enums[dimension].map(b=>({bucket:String(b),count:get(event,dimension,String(b))}));
   // Suppress the whole marginal distribution if it contains a sparse observation.
   if(counts.some(x=>x.count!==null&&x.count<10))return null;
   return counts.filter(x=>x.count!==null);
 }
 // Publish a distribution only when all recorded arrivals have a market bucket,
 // no positive bucket is sparse, and the total is at least ten. Missing periods
 // are not zeros; only complete marginals can justify an absent bucket's zero.
 const marketCounts=marketBuckets.map(bucket=>({bucket,label:marketLabels[bucket],count:get('site_entry','market',bucket)??0}));
 const marketTotal=marketCounts.reduce((n,x)=>n+x.count,0),arrivals=totals.site_entry;
 const marketMix=arrivals!==null&&arrivals>=10&&marketTotal===arrivals&&marketCounts.every(x=>x.count===0||x.count>=10)
   ?marketCounts.map(x=>({...x,share:x.count/arrivals})):null;
 const questions=Array.from({length:8},(_,i)=>{
   const seen=get('audit_question_seen','question',String(i+1)),advanced=get('audit_question_advanced','question',String(i+1));
   return {q:i+1,seen,advanced,ratio:seen!==null&&advanced!==null&&seen>=10&&advanced>=10?questionRatio(advanced,seen):null};
 });
 const sparse=questions.some(q=>[q.seen,q.advanced].some(n=>n!==null&&n<10));
 const breakdowns=[
 ['Traffic source','site_entry','source'],['Campaign labels','site_entry','campaign'],['Device categories','site_entry','device'],['Browser categories','site_entry','browser'],['Public pages','public_page_view','page'],['CTA placement','public_cta_click','placement'],['Navigation destinations','public_nav_click','page'],['FAQ opens','faq_open','faq'],['Audit duration','audit_duration_bucket','duration'],['LCP (ms)','lcp_bucket','lcp'],['INP (ms)','inp_bucket','inp'],['CLS','cls_bucket','cls'],['Error codes','safe_ui_error','error']
 ].map(([title,event,dimension])=>({title,values:breakdown(event,dimension)}));
 return {totals,marketMix,questions:sparse?null:questions,breakdowns,ctaRatio:totals.public_cta_click!==null&&totals.public_page_view!==null?questionRatio(totals.public_cta_click,totals.public_page_view):null};
}
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n===null||n===undefined?'N/A':Number(n).toLocaleString('en-AU');
export function renderDashboard(rows,period,range,operations=null,synthetic=true){
 const d=dashboardData(rows),o=operationalData(operations);
 const names={site_entry:'Website arrivals',public_page_view:'Public page views',public_cta_click:'Free check CTA clicks',audit_arrival:'Audit arrivals',audit_start:'Audit starts',audit_complete:'Audit completions',results_view:'Free results viewed',upgrade_offer_view:'Paid offer viewed',upgrade_cta_click:'Purchase button clicks',checkout_opened:'Checkout URL returned',engaged_10s:'10 seconds engaged',engaged_30s:'30 seconds engaged',scroll_25:'25% scroll',scroll_50:'50% scroll',scroll_75:'75% scroll',scroll_90:'90% scroll',privacy_notice_shown:'Notices shown',safe_ui_error:'Reviewed errors',public_nav_click:'Public navigation clicks',faq_open:'FAQ opens',audit_back:'Audit back actions',audit_reset:'Audit resets'};
 const table=(headers,data)=>'<table><thead><tr>'+headers.map(x=>'<th scope="col">'+safe(x)+'</th>').join('')+'</tr></thead><tbody>'+data.map(row=>'<tr>'+row.map((x,i)=>i===0?'<th scope="row">'+safe(x)+'</th>':'<td>'+safe(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 const breakdown=({title,values})=>'<section><h2>'+safe(title)+'</h2>'+(values&&values.length?table(['Category','Observations'],values.map(x=>[x.bucket,fmt(x.count)])):'<p>Unavailable or suppressed (small counts).</p>')+'</section>';
 const marketHtml='<section><h2>Australian audience</h2><p>Estimated connection location, not nationality or residence. VPNs and proxies may affect accuracy. Shares are of all observed website arrivals, including unknown.</p>'+ (d.marketMix?table(['Location','Arrivals','Share'],d.marketMix.map(x=>[x.label,fmt(x.count),(100*x.share).toFixed(1)+'%'])):'<p>Unavailable or suppressed (small counts or incomplete coverage).</p>')+'</section>';
 const cards=['site_entry','audit_start','audit_complete','checkout_opened'].map(e=>'<article><p>'+names[e]+'</p><strong>'+fmt(d.totals[e])+'</strong></article>').join('');
 const funnel=table(['Stage','Observations'],['site_entry','public_page_view','public_cta_click','audit_arrival','audit_start','audit_complete','results_view','upgrade_offer_view','upgrade_cta_click','checkout_opened'].map(e=>[names[e],fmt(d.totals[e])]));
 const q=d.questions?table(['Question','Seen','Advanced','Directional ratio'],d.questions.map(x=>['Q'+x.q,fmt(x.seen),fmt(x.advanced),x.ratio===null?'N/A':(x.ratio*100).toFixed(1)+'%'])):'<p>Question breakdown suppressed (small counts).</p>';
 const money=n=>n===null?'N/A':(n/100).toLocaleString('en-AU',{style:'currency',currency:'AUD'});
 const operationsHtml=o?table(['Metric',synthetic?'Synthetic result':'Aggregate result'],[
 ['Stripe paid orders',fmt(o.stripe_paid_orders)],['Gross confirmed AUD',money(o.gross_cents)],['Refunds',money(o.refund_cents)],['Refund-adjusted gross (not profit)',money(o.net_cents)],['Failed payment attempts',fmt(o.payment_failures)],['Order cohort — paid date',fmt(o.order_cohort)],['Details completed — cohort',fmt(o.details_completed)],['Plans ready — cohort',fmt(o.reports_ready)],['Emails processed — cohort',fmt(o.emails_processed)],['Failed status — cohort',fmt(o.failed_order_status)],['Plans ready — throughput date',fmt(o.reports_ready_throughput)],['Emails processed — throughput date',fmt(o.emails_processed_throughput)],['Stripe vs order count difference',fmt(o.order_difference)],['Meta reported spend',money(o.meta_spend_cents)],['Meta reported landing page views',fmt(o.meta_lpv)],['Meta outbound clicks',fmt(o.meta_outbound_clicks)],['Cost per Meta reported LPV',money(o.meta_cost_per_lpv)],['Blended spend / all paid orders (not CAC)',money(o.blended_spend_per_order)],['GA4 consented sessions (separate)',fmt(o.ga4_sessions)],['Legacy consented audit starts (separate)',fmt(o.legacy_audit_starts)]
 ])+'<p>Order cohort values reflect status at report time. Email processed is not inbox delivery. Stripe amount totals are independent of order counts. External figures are separate sources, not campaign attribution.</p>':'<p>Operational source unavailable.</p>';
 const nav=periods.map(p=>'<a href="?period='+p+'"'+(p===period?' aria-current="page"':'')+'>'+safe(p==='today'||p==='yesterday'?p:p+' days')+'</a>').join(' ');
 return '<!doctype html><html lang="en-AU"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SpendShift Intelligence</title><style>body{font:16px system-ui,sans-serif;margin:0;background:#f5f7f5;color:#16291e}main{max-width:1100px;margin:auto;padding:24px}h1{margin:0}h2{font-size:20px}nav{display:flex;flex-wrap:wrap;gap:14px;margin:18px 0}a{color:#176b3e}article,section{background:white;border:1px solid #d8e2da;border-radius:12px;padding:18px;margin:12px 0}article p{margin:0 0 8px}article strong{font-size:30px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:8px;border-bottom:1px solid #e3e9e4}td:last-child{text-align:right}p{line-height:1.5}.muted{color:#506157}</style><main><h1>SpendShift Intelligence</h1><p><strong>'+ (synthetic?'SYNTHETIC DATA ONLY — NOT LIVE':'PRIVATE OWNER REPORT') +'</strong> · Sydney dates '+safe(range.from)+' to '+safe(range.to)+'</p><nav aria-label="Date range">'+nav+'</nav><p class="muted">Counts are observations, not unique visitors or joined customer journeys. N/A means missing or unavailable; no inference of zero. Small breakdowns are suppressed. '+ (synthetic?'No real customer or advertising data is connected.':'Unconnected sources are marked unavailable.') +'</p><div class="cards">'+cards+'</div><section><h2>Acquisition and audit funnel</h2>'+funnel+'<p>Directional CTA/page-view ratio: '+(d.ctaRatio===null?'N/A':(d.ctaRatio*100).toFixed(1)+'%')+'</p></section>'+marketHtml+'<section><h2>Question progression</h2>'+q+'</section><section><h2>Engagement and reliability</h2>'+table(['Metric','Observations'],['engaged_10s','engaged_30s','scroll_25','scroll_50','scroll_75','scroll_90','public_nav_click','faq_open','audit_back','audit_reset','safe_ui_error','privacy_notice_shown'].map(e=>[names[e],fmt(d.totals[e])]))+'</section>'+d.breakdowns.map(breakdown).join('')+'<section><h2>Payments, fulfilment and external measurement</h2>'+operationsHtml+'<p>Optional choice and expanded private engagement remain off.</p>'+'</section></main></html>';
}
