import {createHash} from "node:crypto";
import {supabaseAdmin} from "@/lib/supabase";
import {checkoutLabels,purchaseAttributionEnabled,schemaReady,validatedReport} from "./purchase-attribution.mjs";
import {PRODUCTION_ORIGIN} from "./release-config.mjs";
// The original Stripe Checkout creation/idempotency contract is unchanged.
// This auxiliary record is best-effort and can never prevent payment.
export async function saveCheckoutAttribution(req:Request,session:{id:string;livemode:boolean},input:unknown){
 if(!purchaseAttributionEnabled(process.env)||session.livemode!==true||!/^cs_live_[A-Za-z0-9]{12,200}$/.test(session.id))return;
 if(req.headers.get("origin")!==PRODUCTION_ORIGIN||req.headers.get("host")!==new URL(PRODUCTION_ORIGIN).host||(req.headers.has("sec-fetch-site")&&req.headers.get("sec-fetch-site")!=="same-origin"))return;
 const label=checkoutLabels(input);
 try{
  const {error}=await supabaseAdmin.rpc("spendshift_save_checkout_attribution",{p_checkout_hash:createHash("sha256").update(session.id).digest("hex"),p_source:label?.source??null,p_campaign:label?.campaign??null,p_creative:label?.creative??null}).abortSignal(AbortSignal.timeout(1200));
  if(error)console.warn("[purchase-attribution] context unavailable");
 }catch{console.warn("[purchase-attribution] context unavailable");}
}
export async function readPurchaseAttributionReport(range:{from:string;to:string}){
 if(!purchaseAttributionEnabled(process.env))return null;
 try{
  const {data,error}=await supabaseAdmin.rpc("spendshift_read_purchase_attribution",{p_from:range.from,p_to:range.to}).abortSignal(AbortSignal.timeout(2000));
  return error?null:validatedReport(data);
 }catch{return null;}
}
export async function prunePurchaseAttribution(){
 if(!schemaReady(process.env))return;
 try{
  const {error}=await supabaseAdmin.rpc("spendshift_prune_purchase_attribution").abortSignal(AbortSignal.timeout(2500));
  if(error)throw Error("prune failed");
 }catch{console.warn("[purchase-attribution] retention unavailable");}
}
