// Aggregate-only read plan. The fixture tables contain synthetic values only.
export const operationalFields=['order_cohort','details_completed','reports_ready','emails_processed','failed_order_status','reports_ready_throughput','emails_processed_throughput','stripe_paid_orders','gross_cents','refund_cents','payment_failures','meta_spend_cents','meta_lpv','meta_outbound_clicks','ga4_sessions','legacy_audit_starts'];
export function operationalQuery(range){
 const day=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s)))throw Error('bad day');return "'"+s+"'::date";};
 const from=day(range.from),to=day(range.to);
 const date=col=>"("+col+" AT TIME ZONE 'Australia/Sydney')::date BETWEEN "+from+" AND "+to;
 return "SELECT json_build_object("+
 "'order_cohort',(SELECT count(*) FROM fixture_operations.orders WHERE "+date("paid_at")+"),"+
 "'details_completed',(SELECT count(*) FROM fixture_operations.orders WHERE details_completed AND "+date("paid_at")+"),"+
 "'reports_ready',(SELECT count(*) FROM fixture_operations.orders WHERE status='ready' AND "+date("paid_at")+"),"+
 "'emails_processed',(SELECT count(*) FROM fixture_operations.orders WHERE report_sent_at IS NOT NULL AND "+date("paid_at")+"),"+
 "'failed_order_status',(SELECT count(*) FROM fixture_operations.orders WHERE status='failed' AND "+date("paid_at")+"),"+
 "'reports_ready_throughput',(SELECT count(*) FROM fixture_operations.orders WHERE "+date("ready_at")+"),"+
 "'emails_processed_throughput',(SELECT count(*) FROM fixture_operations.orders WHERE "+date("report_sent_at")+"),"+
 ['paid_orders','gross_cents','refund_cents','payment_failures'].map(k=>"'"+(k==='paid_orders'?'stripe_paid_orders':k)+"',(SELECT sum("+k+") FROM fixture_operations.payments WHERE metric_date BETWEEN "+from+" AND "+to+")").join(",")+","+
 ['meta_spend_cents','meta_lpv','meta_outbound_clicks','ga4_sessions','legacy_audit_starts'].map(k=>"'"+k+"',(SELECT sum("+k+") FROM fixture_operations.external WHERE metric_date BETWEEN "+from+" AND "+to+")").join(",")+")";
}
export function operationalData(raw){
 if(raw===null||raw===undefined)return null;
 if(typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==operationalFields.length||!operationalFields.every(k=>Object.hasOwn(raw,k)))throw Error('invalid operations');
 const v={};for(const k of operationalFields){const n=raw[k];if(n!==null&&(!Number.isSafeInteger(n)||n<0))throw Error('bad total');v[k]=n;}
 return {...v,net_cents:v.gross_cents===null||v.refund_cents===null?null:v.gross_cents-v.refund_cents,meta_cost_per_lpv:v.meta_spend_cents===null||!v.meta_lpv?null:v.meta_spend_cents/v.meta_lpv,blended_spend_per_order:v.meta_spend_cents===null||!v.stripe_paid_orders?null:v.meta_spend_cents/v.stripe_paid_orders,order_difference:v.stripe_paid_orders===null||v.order_cohort===null?null:v.stripe_paid_orders-v.order_cohort};
}
