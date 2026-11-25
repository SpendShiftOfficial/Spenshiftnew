"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
import {ownerClient,beginOwnerSignIn,completeOwnerSignIn} from "@/lib/analytics-v2/owner-client";
import type {DashboardSummary} from "@/lib/analytics-v2/dashboard.mjs";
import {fields,type Source,type Coverage} from "@/lib/analytics-v2/finance.mjs";
type Report={range:{from:string;to:string};dashboard:DashboardSummary;operations:Record<string,number|null>|null;coverage:Coverage|null;synthetic:boolean};
const labels:Record<string,string>={site_entry:"Website arrivals (observations)",public_page_view:"Public page views",public_cta_click:"Free check clicks",audit_arrival:"Audit arrivals",audit_start:"Audit starts",audit_complete:"Audit completions",results_view:"Free results viewed",upgrade_offer_view:"Paid offer viewed",upgrade_cta_click:"Purchase clicks",checkout_opened:"Checkout URL returned",stripe_paid_orders:"Stripe confirmed paid orders",gross_cents:"Gross confirmed AUD",refund_cents:"Refunds",net_cents:"Refund-adjusted gross (not profit)",payment_failures:"Failed payment attempts",order_cohort:"Paid-order records",details_completed:"Paid details completed",reports_ready:"Plans ready",emails_processed:"Report emails processed",failed_order_status:"Orders in failed state",reports_ready_throughput:"Reports generated in period",emails_processed_throughput:"Emails processed in period",order_difference:"Stripe vs paid-order count difference",meta_spend_cents:"Meta spend (AUD)",meta_lpv:"Meta reported landing page views",meta_outbound_clicks:"Meta outbound clicks",meta_cost_per_lpv:"Cost per Meta reported LPV",blended_spend_per_order:"Blended spend / all paid orders (not CAC)",ga4_sessions:"GA4 consented sessions",legacy_audit_starts:"Legacy consented audit starts"};
const moneyFields=new Set(["gross_cents","refund_cents","net_cents","meta_spend_cents","meta_cost_per_lpv","blended_spend_per_order"]);
const fmt=(value:number|null|undefined,key="")=>value===null||value===undefined?"N/A":moneyFields.has(key)?(value/100).toLocaleString("en-AU",{style:"currency",currency:"AUD"}):value.toLocaleString("en-AU");
const card={border:"1px solid #d7e0d8",borderRadius:12,padding:16,margin:"12px 0"};
const inputStyle={display:"block",width:"100%",maxWidth:400,margin:"6px 0 12px",padding:8,border:"1px solid #84958a",borderRadius:6};
export default function OwnerAccess({authUrl,publicKey,fixture,importEnabled}:{authUrl:string;publicKey:string;fixture:boolean;importEnabled:boolean}){
 const client=useRef<SupabaseClient|null>(null),token=useRef<string|null>(null),generation=useRef(0),expiry=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [phase,setPhase]=useState<"login"|"mfa"|"report">("login"),[factors,setFactors]=useState<{id:string;label:string}[]>([]),[factor,setFactor]=useState("");
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[code,setCode]=useState("");
 const [period,setPeriod]=useState("today"),[report,setReport]=useState<Report|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [source,setSource]=useState<Source>("stripe"),[date,setDate]=useState(""),[values,setValues]=useState<Record<string,string>>({}),[confirm,setConfirm]=useState(false);
 function clear(){
  generation.current++;token.current=null;setReport(null);setPhase("login");setEmail("");setPassword("");setCode("");setFactors([]);setFactor("");setValues({});setConfirm(false);setBusy(false);
  if(expiry.current!==null){clearTimeout(expiry.current);expiry.current=null;}
  const prior=client.current;client.current=null;if(prior)void prior.auth.signOut({scope:"local"}).catch(()=>{});
 }
 useEffect(()=>{
  const restore=(event:PageTransitionEvent)=>{if(event.persisted)location.reload();};
  window.addEventListener("pageshow",restore);
  return()=>{window.removeEventListener("pageshow",restore);if(expiry.current!==null)clearTimeout(expiry.current);generation.current++;token.current=null;const prior=client.current;client.current=null;if(prior)void prior.auth.signOut({scope:"local"}).catch(()=>{});};
 },[]);
 async function read(access:string,which:string,g:number){
  const response=await fetch("/internal/analytics?format=json&period="+encodeURIComponent(which),{headers:{Authorization:"Bearer "+access},cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer",redirect:"error",signal:AbortSignal.timeout(10000)});
  if(g!==generation.current)return false;
  if(response.status===401){clear();setMessage("Session expired or access denied. Sign in again.");return false;}
  if(!response.ok)throw Error("report unavailable");
  const data:Report=await response.json();if(g!==generation.current)return false;
  if(!data?.dashboard?.totals||!data.range||data.synthetic!==fixture)throw Error("invalid report");
  setReport(data);setPhase("report");return true;
 }
 async function login(e:FormEvent){
  e.preventDefault();if(busy)return;setBusy(true);setMessage("");const g=++generation.current,pw=password;setPassword("");
  try{
   client.current=ownerClient(authUrl,publicKey);
   const list=await beginOwnerSignIn(client.current,email.trim(),pw);if(g!==generation.current)return;
   setFactors(list);setFactor(list[0].id);setPhase("mfa");
  }catch{if(g===generation.current){clear();setMessage("Sign-in failed, or no pre-enrolled authenticator. Use your approved owner account.");}}
  finally{if(g===generation.current)setBusy(false);}
 }
 async function verify(e:FormEvent){
  e.preventDefault();if(busy||!client.current)return;setBusy(true);setMessage("");const g=generation.current,otp=code;setCode("");
  try{
   const access=await completeOwnerSignIn(client.current,factor,otp);if(g!==generation.current)return;
   token.current=access;
   if(!await read(access,period,g))return;
   expiry.current=setTimeout(()=>{clear();setMessage("Owner session expired. Sign in again.");},12*60*1000);
  }catch{if(g===generation.current){clear();setMessage("Verification or owner access failed. Sign in again.");}}
  finally{if(g===generation.current)setBusy(false);}
 }
 async function refresh(which:string){
  if(busy||!token.current)return;setPeriod(which);setBusy(true);setMessage("");setReport(null);const g=generation.current;
  try{await read(token.current,which,g);}catch{if(g===generation.current)setMessage("Report unavailable.");}finally{if(g===generation.current)setBusy(false);}
 }
 async function save(e:FormEvent){
  e.preventDefault();if(busy||!token.current||!confirm||!date)return;
  if(!fields[source].every(k=>/^\d{1,13}$/.test(values[k]??"")&&Number(values[k])<=1000000000000)){setMessage("Enter a whole, non-negative value for every field. Enter dollars in cents.");return;}
  setBusy(true);setMessage("");const g=generation.current;
  try{
   const res=await fetch("/internal/analytics/finance",{method:"POST",headers:{Authorization:"Bearer "+token.current,"Content-Type":"application/json"},body:JSON.stringify({date,source,values:Object.fromEntries(fields[source].map(k=>[k,Number(values[k])]))}),cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer",redirect:"error",signal:AbortSignal.timeout(10000)});
   if(g!==generation.current)return;
   if(res.status===401){clear();setMessage("Session expired. Sign in again.");return;}
   if(res.status!==204)throw Error("not saved");
   setValues({});setConfirm(false);setReport(null);await read(token.current!,period,g);if(g===generation.current)setMessage("Daily aggregate saved. A previous entry for this source and date was replaced.");
  }catch{if(g===generation.current)setMessage("Daily aggregate not confirmed. Check the source and try again.");}finally{if(g===generation.current)setBusy(false);}
 }
 return <main style={{maxWidth:1080,margin:"0 auto",padding:"24px 16px",color:"#173320"}}>
  <h1>SpendShift Intelligence</h1><p>{fixture?"Synthetic owner-access test — no real data.":"Private owner access. Authenticator required."}</p>
  {phase==="login"&&<form onSubmit={login} style={card}><h2>Owner sign-in</h2>
   <label>Email<input style={inputStyle} type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <label>Password<input style={inputStyle} type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <button type="submit" disabled={busy}>Sign in</button></form>}
  {phase==="mfa"&&<form onSubmit={verify} style={card}><h2>Authenticator verification</h2>
   <label>Authenticator<select style={inputStyle} value={factor} onChange={e=>setFactor(e.target.value)}>{factors.map((f,i)=><option key={f.id} value={f.id}>{f.label} {i+1}</option>)}</select></label>
   <label>Six-digit code<input style={inputStyle} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/></label>
   <button type="submit" disabled={busy}>Verify</button>{" "}<button type="button" onClick={clear}>Cancel</button></form>}
  {phase==="report"&&<>
    <button type="button" onClick={()=>{clear();setMessage("Signed out on this device.");}}>Sign out</button>
    <label style={{display:"block",marginTop:16}}>Sydney reporting period<select style={inputStyle} value={period} disabled={busy} onChange={e=>void refresh(e.target.value)}>{["today","yesterday","7","30","90","180"].map(p=><option key={p} value={p}>{p==="today"||p==="yesterday"?p:p+" days"}</option>)}</select></label>
    <button type="button" disabled={busy} onClick={()=>void refresh(period)}>Refresh report</button>
    {report&&<>
      <p>{report.range.from} to {report.range.to} · N/A = unavailable. Observations are not linked visitors. Today's data may be partial.</p>
      <section style={card}><h2>Acquisition funnel</h2><table style={{width:"100%"}}><tbody>{["site_entry","public_page_view","public_cta_click","audit_arrival","audit_start","audit_complete","results_view","upgrade_offer_view","upgrade_cta_click","checkout_opened"].map(k=><tr key={k}><th scope="row" style={{textAlign:"left"}}>{labels[k]}</th><td>{fmt(report.dashboard.totals[k])}</td></tr>)}</tbody></table></section>
      <section style={card}><h2>Question progression</h2>{report.dashboard.questions?<table style={{width:"100%"}}><thead><tr><th>Question</th><th>Seen</th><th>Advanced</th><th>Directional ratio</th></tr></thead><tbody>{report.dashboard.questions.map(q=><tr key={q.q}><th>Q{q.q}</th><td>{fmt(q.seen)}</td><td>{fmt(q.advanced)}</td><td>{q.ratio===null?"N/A":(100*q.ratio).toFixed(1)+"%"}</td></tr>)}</tbody></table>:<p>Suppressed due to small counts.</p>}</section>
      <section style={card}><h2>Engagement and reliability</h2><table style={{width:"100%"}}><tbody>{["engaged_10s","engaged_30s","scroll_25","scroll_50","scroll_75","scroll_90","faq_open","public_nav_click","audit_back","audit_reset","safe_ui_error"].map(k=><tr key={k}><th scope="row" style={{textAlign:"left"}}>{k.replaceAll("_"," ")}</th><td>{fmt(report.dashboard.totals[k])}</td></tr>)}</tbody></table></section>
      {report.dashboard.breakdowns.map(b=><section key={b.title} style={card}><h2>{b.title}</h2>{b.values?.length?<table style={{width:"100%"}}><tbody>{b.values.map(v=><tr key={v.bucket}><th scope="row" style={{textAlign:"left"}}>{v.bucket}</th><td>{fmt(v.count)}</td></tr>)}</tbody></table>:<p>Unavailable or suppressed.</p>}</section>)}
      <section style={card}><h2>Payments, fulfilment and marketing</h2>
        {report.coverage?<p>Owner-entered source coverage: Stripe {report.coverage.stripe}/{report.coverage.expected_days} days; Meta {report.coverage.meta}/{report.coverage.expected_days}; GA4 {report.coverage.ga4}/{report.coverage.expected_days}. Incomplete source periods show N/A.</p>:<p>Imported source coverage unavailable.</p>}
        <p>These sources are separate. Email processed is not delivery. Gross less refunds is not profit; spend divided by all orders is not attributed CAC.</p>
        {report.operations?<table style={{width:"100%"}}><tbody>{Object.entries(report.operations).map(([k,v])=><tr key={k}><th scope="row" style={{textAlign:"left"}}>{labels[k]??k}</th><td>{fmt(v,k)}</td></tr>)}</tbody></table>:<p>Operational data unavailable.</p>}
      </section>
    </>}
    {importEnabled&&<form style={card} onSubmit={save}><h2>Enter verified daily source totals</h2>
      <p>Use only aggregate AUD reports for SpendShift, aligned to the Sydney calendar day. Do not enter names, emails, payment IDs, report references or individual transactions. Include explicit zero only if verified. Amounts are in cents.</p>
      <label>Source<select style={inputStyle} value={source} onChange={e=>{setSource(e.target.value as Source);setValues({});setConfirm(false);}}><option value="stripe">Stripe</option><option value="meta">Meta Ads</option><option value="ga4">Google Analytics</option></select></label>
      <label>Reporting date<input style={inputStyle} type="date" required value={date} onChange={e=>{setDate(e.target.value);setConfirm(false);}}/></label>
      {fields[source].map(k=><label key={k}>{labels[k]??k}{moneyFields.has(k)?" — cents":""}<input style={inputStyle} type="text" inputMode="numeric" pattern="[0-9]{1,13}" required value={values[k]??""} onChange={e=>{setValues(v=>({...v,[k]:e.target.value}));setConfirm(false);}}/></label>)}
      <label><input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/> I verified the source, currency, date and totals. Saving replaces the existing source/date entry.</label><br/><button type="submit" disabled={busy||!confirm}>Save daily totals</button>
    </form>}
  </>}
  <p role="status" aria-live="polite">{busy?"Working…":message}</p>
 </main>;
}
