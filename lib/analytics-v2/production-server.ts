// Server-only adapter; no production credentials retrieved or written by this branch.
import {createReleaseAdapter} from "./release-adapter.mjs";
import {authorizeOwner} from "./owner-auth.mjs";
import {releaseCapabilities} from "./release-config.mjs";
export async function releaseAdapter(){
 const {supabaseAdmin}=await import("@/lib/supabase");
 return createReleaseAdapter(async(name,args)=>await supabaseAdmin.rpc(name,args).abortSignal(AbortSignal.timeout(2500)));
}
export async function productionOwnerAllowed(header:string|null){
 if(!releaseCapabilities(process.env).read)return false;
 const {supabaseAdmin}=await import("@/lib/supabase");
 const adapter=await releaseAdapter();
 return authorizeOwner(header,{
  ownerId:process.env.SPENDSHIFT_ANALYTICS_OWNER_USER_ID,
  verifyUser:async jwt=>{const {data,error}=await supabaseAdmin.auth.getUser(jwt);return error?null:data.user;},
  verifyMfa:async jwt=>{const {data,error}=await supabaseAdmin.auth.mfa.getAuthenticatorAssuranceLevel(jwt);return error?null:data;},
  sessionActive:adapter.sessionActive
 });
}
