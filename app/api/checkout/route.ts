import {NextResponse} from 'next/server';
import Stripe from 'stripe';
import {createHash} from 'node:crypto';
import {validateAuditAnswers,PLAN_PRICE_CENTS,TERMS_VERSION} from '@/lib/audit-schema';
import {selectPersonalisationAreas,isPersonalisationArea} from '@/lib/personalisation-questions';
import {readJson,InputError,privateHeaders} from '@/lib/request-safety';
export async function POST(req:Request){
 try{
  const data=await readJson(req,6000);
  let answers:string[];try{answers=validateAuditAnswers(data.answers);}catch(e){throw new InputError(e instanceof Error?e.message:'Please check your answers.');}
  if(data.acceptedTerms!==true||data.termsVersion!==TERMS_VERSION)throw new InputError('Please read and accept the terms before checkout.');
  const additionalArea=data.additionalArea??null;
  if(additionalArea!==null&&!isPersonalisationArea(additionalArea))throw new InputError('Choose a valid area to check.');
  const foundAreas=selectPersonalisationAreas(answers);
  if(additionalArea!==null&&foundAreas.includes(additionalArea))throw new InputError('That area is already in your plan.');
  if(!foundAreas.length&&!additionalArea)throw new InputError('Choose a spending area to check before buying a plan.');
  const requestId=data.checkoutRequestId;
  if(typeof requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(requestId))throw new InputError('Please reopen checkout and try again.');
  const preview=process.env.VERCEL_ENV==='preview';const key=process.env.STRIPE_SECRET_KEY||'';
  if(preview&&(!key.startsWith('sk_test_')||key.includes('setup_required')||process.env.SUPABASE_URL!=='https://pcjgzbaigtsnevhcjqyd.supabase.co'||process.env.SPENDSHIFT_ALLOW_PREVIEW_PAYMENTS!=='true'))throw new InputError('Test checkout is paused. No payment has been taken.',403);
  const base=(preview&&process.env.VERCEL_URL?'https://'+process.env.VERCEL_URL:process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'');
  if(!base||!key)throw new Error('Configuration unavailable');
  const fingerprint=createHash('sha256').update(requestId+JSON.stringify({answers,additionalArea})+TERMS_VERSION).digest('hex');
  const session=await new Stripe(key).checkout.sessions.create({mode:'payment',payment_method_types:['card'],customer_creation:'always',line_items:[{price_data:{currency:'aud',product_data:{name:'SpendShift Step-by-Step Savings Plan'},unit_amount:PLAN_PRICE_CENTS},quantity:1}],metadata:{product:'spendshift_full_report',answers:JSON.stringify(answers),additional_area:additionalArea||'',terms_version:TERMS_VERSION},success_url:base+'/success?session_id={CHECKOUT_SESSION_ID}',cancel_url:base+'/results'},{idempotencyKey:'spendshift:'+fingerprint});
  return NextResponse.json({url:session.url},{headers:privateHeaders});
 }catch(e){return NextResponse.json({error:e instanceof InputError?e.message:'Checkout could not open. No new payment was taken. Please try again.'},{status:e instanceof InputError?e.status:503,headers:privateHeaders});}
}
