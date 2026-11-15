import {NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase';
import {generatePaidReport} from '@/lib/report-fulfillment';
export const runtime='nodejs';export const maxDuration=180;
export async function GET(req:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.get('authorization')!=='Bearer '+secret)return NextResponse.json({error:'Unauthorised.'},{status:401});
 try{
  const now=Date.now();
  const {error:resetError}=await supabaseAdmin.from('report_orders').update({status:'failed',last_error:'Generation interrupted',processing_started_at:null}).eq('status','processing').lt('processing_started_at',new Date(now-20*60*1000).toISOString());
  if(resetError)throw new Error('Could not release stuck jobs');
  const cutoff=new Date(now-2*60*1000).toISOString();
  const [completed,failedJobs]=await Promise.all([
   supabaseAdmin.from('report_orders').select('stripe_session_id,status,refinements').eq('status','awaiting_details').eq('refinements->>completed','true').lt('attempt_count',4).lt('updated_at',cutoff).order('updated_at',{ascending:true}).limit(20),
   supabaseAdmin.from('report_orders').select('stripe_session_id,status,refinements').eq('status','failed').lt('attempt_count',4).lt('updated_at',cutoff).order('updated_at',{ascending:true}).limit(20),
  ]);
  if(completed.error||failedJobs.error)throw new Error('Could not read pending jobs');
  const data=[...(completed.data||[]),...(failedJobs.data||[])];
  // Never turn an unfinished paid draft into an uneditable report.
  const ready=(data||[]).filter(o=>(o.refinements as any)?.completed===true||(o.status==='failed'&&!(o.refinements as any)?.draft));
  let recovered=0,failed=0;
  for(let i=0;i<ready.length;i+=3){const results=await Promise.allSettled(ready.slice(i,i+3).map(o=>generatePaidReport(o.stripe_session_id)));for(const result of results){if(result.status==='fulfilled'&&result.value.status==='ready')recovered++;else if(result.status==='rejected')failed++;}}
  return NextResponse.json({recovered,failed,unfinishedDraftsLeftEditable:(data||[]).length-ready.length});
 }catch{return NextResponse.json({error:'Recovery could not finish. It will be retried.'},{status:503});}
}
