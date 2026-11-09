import {NextResponse} from 'next/server';
import {paidSession,ensurePaidOrder,readExistingReportId} from '@/lib/paid-orders';
import {supabaseAdmin} from '@/lib/supabase';
import {cleanDraft,prepareDraft} from '@/lib/plan-draft';
import {readJson,InputError,privateHeaders} from '@/lib/request-safety';
export async function POST(req:Request){
 try{
  const body=await readJson(req);if(typeof body.sessionId!=='string')throw new InputError('Your purchase link is missing.');
  const session=await paidSession(body.sessionId);const {order}=await ensurePaidOrder(session);
  if(order.report_id||await readExistingReportId(session.id))throw new InputError('Your plan is already ready. Open your plan link.',409);
  if(!['awaiting_details','failed'].includes(order.status))throw new InputError('Your plan is being made. Return to your purchase link.',409);
  if(typeof body.revision!=='string'||body.revision!==order.updated_at)throw new InputError('This plan changed in another tab. Reload before editing.',409);
  let draft;let refinements;try{draft=cleanDraft(body.draft);refinements=body.complete===true?{...prepareDraft(draft),completed:true}:{version:1,draft,completed:false};}catch(e){throw new InputError(e instanceof Error?e.message:'Please check your answers.');}
  const revision=new Date().toISOString();
  const {data,error}=await supabaseAdmin.from('report_orders').update({answers:draft.answers,refinements,status:"awaiting_details",updated_at:revision}).eq('stripe_session_id',session.id).eq('updated_at',body.revision).in('status',['awaiting_details','failed']).select('updated_at').maybeSingle();
  if(error)throw new Error('Draft write failed');if(!data)throw new InputError('This plan changed in another tab. Reload before editing.',409);
  return NextResponse.json({saved:true,revision:data.updated_at},{headers:privateHeaders});
 }catch(e){return NextResponse.json({error:e instanceof InputError?e.message:'Your answers could not be saved. Keep this page open and try again.'},{status:e instanceof InputError?e.status:503,headers:privateHeaders});}
}
