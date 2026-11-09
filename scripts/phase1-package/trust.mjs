import {read,write,edit,replace} from './io.mjs';
export default function trust(){
write('lib/audit-schema.ts',String.raw`/** Shared, server-validated audit choices. Keep old paid answers readable. */
export const auditQuestions = [
 {q:'How often do you buy takeaway food?', options:['Never','1–2 times/week','3–5 times/week','Almost daily']},
 {q:'How many subscriptions do you pay for?', options:['0–2','3–5','6–10','10+','Not sure']},
 {q:'When did you last check your insurance price?', options:['I don’t currently have insurance','Within 6 months','6–12 months ago','1–2 years ago','Over 2 years ago','Never / not sure']},
 {q:'How often do you buy coffee, snacks or lunch while out?', options:['Rarely','1–2 times/week','3–5 times/week','Daily']},
 {q:'When did you last check your phone or internet price?', options:['Within 6 months','6-12 months ago','Over a year ago',"I honestly don't know","I don't pay either of these bills"]},
 {q:'When did you last check your power or gas price?', options:['Within 6 months','6-12 months ago','Over a year ago',"I honestly don't know","I don't pay these bills"]},
 {q:"How often do you buy things you didn't plan to buy?", options:['Rarely','1–2 times/week','3–5 times/week','Almost daily']},
 {q:'What would help you most right now?', options:['Lower my bills','Save more money','Reduce stress','Stop money disappearing so fast','Feel more financially in control']},
];
const normal = (s:string) => s.replace(/[‘’]/g,"'").replace(/[–—]/g,'-').trim();
export function validateAuditAnswers(input:unknown):string[]{
 if(!Array.isArray(input)||input.length!==auditQuestions.length) throw new Error('Please answer all eight questions.');
 return input.map((answer,index)=>{
  if(typeof answer!=='string'||answer.length>160) throw new Error('Please check question '+(index+1)+'.');
  const found=auditQuestions[index].options.find(option=>normal(option)===normal(answer));
  if(!found) throw new Error('Please check question '+(index+1)+'.');
  return found;
 });
}
export const PLAN_PRICE_CENTS=3900;
export const TERMS_VERSION='2026-11-phase1';
`);
write('lib/request-safety.ts',String.raw`export class InputError extends Error { constructor(message:string, public status=400){super(message);} }
export async function readJson(req:Request,maxBytes=24000):Promise<Record<string,unknown>>{
 const origin=req.headers.get('origin');
 if(origin&&origin!==new URL(req.url).origin) throw new InputError('Please use this website to continue.',403);
 if(!req.headers.get('content-type')?.toLowerCase().includes('application/json')) throw new InputError('Please send your answers as JSON.',415);
 const stated=Number(req.headers.get('content-length')||0);
 if(stated>maxBytes) throw new InputError('Too much information was sent.',413);
 const text=await req.text();
 if(new TextEncoder().encode(text).length>maxBytes) throw new InputError('Too much information was sent.',413);
 let data:unknown; try {data=JSON.parse(text);} catch {throw new InputError('Please check your answers and try again.');}
 if(!data||typeof data!=='object'||Array.isArray(data)) throw new InputError('Please check your answers.');
 return data as Record<string,unknown>;
}
export const privateHeaders={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
`);
write('lib/privacy.ts',String.raw`/** Only public brochure pages may load optional third-party measurement. */
export const publicMarketingPaths=['/','/pricing','/whats-included','/how-it-works','/save-money-australia'];
export function isMarketingPath(path:string){return publicMarketingPaths.includes(path.replace(/\/$/,'')||'/');}
export function canTrack(){
 if(typeof window==='undefined'||!isMarketingPath(window.location.pathname)||window.location.search||window.location.hash) return false;
 try{return localStorage.getItem('spendshift_cookie_consent')==='granted'&&(window as any).__spendshiftPublicTracking===true;}catch{return false;}
}
export function safeEventParams(params:Record<string,unknown>={}){
 const out:Record<string,string|number|boolean>={};
 if(params.currency==='AUD') out.currency='AUD';
 for(const key of ['question_number','sections_presented','insurance_policies']) if(typeof params[key]==='number'&&Number.isFinite(params[key])) out[key]=params[key] as number;
 if(typeof params.extra_area_selected==='boolean') out.extra_area_selected=params.extra_area_selected;
 // No URLs, access IDs, email addresses, free text, financial answers or report content.
 return out;
}
`);
write('lib/gtag.ts',String.raw`import {canTrack,safeEventParams} from './privacy';
export const GA_MEASUREMENT_ID='G-MEHDG2Y7T2';
declare global {interface Window {gtag?:(...args:any[])=>void;dataLayer?:Record<string,any>[];clarity?:(command:string,...args:any[])=>void;}}
const allowed=new Set(['audit_start','audit_complete','free_results_view','upgrade_click','begin_checkout','purchase','paid_report_ready','personalisation_started','personalisation_completed','personalisation_skipped']);
export function trackEvent(eventName:string,params:Record<string,any>={}){
 if(!canTrack()||!allowed.has(eventName)) return;
 window.gtag?.('event',eventName,safeEventParams(params));
 // Never copy private events into the data layer or console.
}
`);
write('lib/tiktok.ts',String.raw`import {canTrack,safeEventParams} from './privacy';
declare global {interface Window {ttq?:{track?:(event:string,params?:Record<string,any>)=>void;page?:()=>void;};}}
export function trackTikTok(eventName:string,params:Record<string,any>={}){if(canTrack())window.ttq?.track?.(eventName,safeEventParams(params));}
`);
write('lib/meta.ts',String.raw`import {canTrack,safeEventParams} from './privacy';
declare global {interface Window {fbq?:(...args:any[])=>void;}}
export function trackMeta(eventName:string,params:Record<string,any>={}){if(canTrack())window.fbq?.('trackCustom',eventName,safeEventParams(params));}
export function trackMetaStandard(eventName:string,params:Record<string,any>={}){if(canTrack())window.fbq?.('track',eventName,safeEventParams(params));}
`);
let layout=read('app/layout.tsx');
if(!layout.includes('PublicAnalytics')){
 const a=layout.indexOf('<Script id="consent-default"'); const b=layout.lastIndexOf('</Script>')+9;
 if(a<0||b<9)throw new Error('Analytics block not found');
 const block=layout.slice(a,b).replaceAll('strategy="beforeInteractive"','strategy="afterInteractive"');
 write('components/PublicAnalytics.tsx',String.raw`"use client";
import Script from 'next/script';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {isMarketingPath} from '@/lib/privacy';
export default function PublicAnalytics({enabled}:{enabled:boolean}){
 const pathname=usePathname();const [allowed,setAllowed]=useState(false);
 useEffect(()=>{
  let consent=false;try{consent=localStorage.getItem('spendshift_cookie_consent')==='granted';}catch{}
  const ok=enabled&&consent&&isMarketingPath(pathname)&&!location.search&&!location.hash;
  if(!ok&&(window as any).__spendshiftPublicTracking){location.replace(location.href);return;}
  (window as any).__spendshiftPublicTracking=ok;setAllowed(ok);
  // Full navigation creates a fresh, tracker-free document before any answers are entered.
  const leave=(event:MouseEvent)=>{const link=(event.target as Element)?.closest?.('a');if(!link)return;const url=new URL(link.href,location.href);if(url.origin===location.origin&&(!isMarketingPath(url.pathname)||url.search||url.hash)){event.preventDefault();event.stopImmediatePropagation();location.assign(url.href);}};
  if(ok)window.addEventListener('click',leave,true);
  return()=>window.removeEventListener('click',leave,true);
 },[pathname,enabled]);
 if(!allowed)return null;
 return (<>`+block+String.raw`</>);
}
`);
 layout=layout.slice(0,a)+'<PublicAnalytics enabled={process.env.VERCEL_ENV === "production"} />'+layout.slice(b);
 layout=layout.replace('import Script from "next/script";','import PublicAnalytics from "@/components/PublicAnalytics";');
 layout=layout.replaceAll('fast, AI-powered savings audit and personalised financial report.','free money check and a clear, step-by-step savings plan.').replaceAll('personalised AI savings report.','step-by-step savings plan.').replaceAll('Find hidden money leaks and discover how much you could save every year.','Find bills and spending worth checking, with clear steps to follow.');
 write('app/layout.tsx',layout);
}
edit('components/ConsentBanner.tsx',s=>{
 s=replace(s,'import Link from "next/link";','import Link from "next/link";\nimport {isMarketingPath} from "@/lib/privacy";');
 s=replace(s,'const saved = localStorage.getItem(CONSENT_KEY) as ConsentChoice | null;','if (!isMarketingPath(window.location.pathname)) return;\nlet saved: ConsentChoice | null = null;\ntry { saved = localStorage.getItem(CONSENT_KEY) as ConsentChoice | null; } catch {}');
 s=replace(s,'localStorage.setItem(CONSENT_KEY, choice);','try { localStorage.setItem(CONSENT_KEY, choice); } catch {}');
 return s;
});
write('next.config.ts',String.raw`import type {NextConfig} from 'next';
const nextConfig:NextConfig={
 async headers(){
  const privateRoutes=['/audit','/results','/success','/personalise','/report/:path*','/report-preview','/api/:path*'];
  const csp="default-src 'self'; script-src 'self' 'unsafe-inline'"+(process.env.NODE_ENV==='development'?" 'unsafe-eval'":'')+"; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com";
  return [{source:'/:path*',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Content-Type-Options',value:'nosniff'}]},...privateRoutes.map(source=>({source,headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'},{key:'Content-Security-Policy',value:csp}]}))];
 }
};export default nextConfig;
`);
write('app/api/checkout/route.ts',String.raw`import {NextResponse} from 'next/server';
import Stripe from 'stripe';
import {createHash} from 'node:crypto';
import {validateAuditAnswers,PLAN_PRICE_CENTS,TERMS_VERSION} from '@/lib/audit-schema';
import {selectPersonalisationAreas} from '@/lib/personalisation-questions';
import {readJson,InputError,privateHeaders} from '@/lib/request-safety';
export async function POST(req:Request){
 try{
  const data=await readJson(req,6000);
  let answers:string[];try{answers=validateAuditAnswers(data.answers);}catch(e){throw new InputError(e instanceof Error?e.message:'Please check your answers.');}
  if(data.acceptedTerms!==true||data.termsVersion!==TERMS_VERSION)throw new InputError('Please read and accept the terms before checkout.');
  if(!selectPersonalisationAreas(answers).length)throw new InputError('Your answers do not show a clear reason to buy a plan.');
  const requestId=data.checkoutRequestId;
  if(typeof requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(requestId))throw new InputError('Please reopen checkout and try again.');
  const preview=process.env.VERCEL_ENV==='preview';const key=process.env.STRIPE_SECRET_KEY||'';
  if(preview&&(!key.startsWith('sk_test_')||key.includes('setup_required')||process.env.SUPABASE_URL!=='https://pcjgzbaigtsnevhcjqyd.supabase.co'||process.env.SPENDSHIFT_ALLOW_PREVIEW_PAYMENTS!=='true'))throw new InputError('Test checkout is paused. No payment has been taken.',403);
  const base=(preview&&process.env.VERCEL_URL?'https://'+process.env.VERCEL_URL:process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'');
  if(!base||!key)throw new Error('Configuration unavailable');
  const fingerprint=createHash('sha256').update(requestId+JSON.stringify(answers)+TERMS_VERSION).digest('hex');
  const session=await new Stripe(key).checkout.sessions.create({mode:'payment',payment_method_types:['card'],customer_creation:'always',line_items:[{price_data:{currency:'aud',product_data:{name:'SpendShift Step-by-Step Savings Plan'},unit_amount:PLAN_PRICE_CENTS},quantity:1}],metadata:{product:'spendshift_full_report',answers:JSON.stringify(answers),terms_version:TERMS_VERSION},success_url:base+'/success?session_id={CHECKOUT_SESSION_ID}',cancel_url:base+'/results'},{idempotencyKey:'spendshift:'+fingerprint});
  return NextResponse.json({url:session.url},{headers:privateHeaders});
 }catch(e){return NextResponse.json({error:e instanceof InputError?e.message:'Checkout could not open. No new payment was taken. Please try again.'},{status:e instanceof InputError?e.status:503,headers:privateHeaders});}
}
`);
edit('app/results/page.tsx',s=>{
 s=replace(s,'import styles from "./results.module.css";','import styles from "./results.module.css";\nimport {TERMS_VERSION} from "@/lib/audit-schema";');
 s=replace(s,'body: JSON.stringify({ answers }),',`body: JSON.stringify({ answers, acceptedTerms, termsVersion: TERMS_VERSION, checkoutRequestId: (()=>{const key='spendshift_checkout_'+JSON.stringify(answers);let id=sessionStorage.getItem(key);if(!id){id=crypto.randomUUID();sessionStorage.setItem(key,id);}return id;})() }),`);
 s=s.replace('One payment. Extra questions after checkout are optional.','One payment. Next, answer a few questions about your bills and spending. Skip any amount you do not know.');
 s=s.replace('Want to change an answer?','Want to change an answer?');
 return s;
});
edit('lib/paid-orders.ts',s=>{
 s=replace(s,'import Stripe from "stripe";','import Stripe from "stripe";\nimport {validateAuditAnswers} from "./audit-schema";');
 s=s.replace(' || process.env.SPENDSHIFT_ALLOW_PREVIEW_PAYMENTS !== "true"','');
 s=replace(s,'return answers as string[];','return validateAuditAnswers(answers);');
 s=s.replace('(!session.metadata?.product || session.metadata.product === "spendshift_full_report")','session.metadata?.product === "spendshift_full_report"');
 s=s.replace('You can answer a few optional questions to make it more useful, or generate it immediately.','Next, answer short questions about the areas in your plan. You can skip any amount you do not know. Your progress is saved as you go.');
 s=s.replace('Please keep this private report link secure. Estimates are illustrative and actual results vary.','Keep this link private. It opens your plan without a password. Possible savings are not money saved yet.');
 return s;
});
edit('app/success/page.tsx',s=>s.replace('transaction_id: sessionId, value: 39','value: 39').replace('transaction_id: sessionId, report_id: reportId, value: 39','value: 39'));
}
