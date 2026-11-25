import {createClient,type SupabaseClient} from "@supabase/supabase-js";
// Browser auth uses a publishable key, never the server secret. Auth state is memory only.
export function ownerClient(url:string,publishableKey:string){
 if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey))throw Error("invalid public configuration");
 const u=new URL(url);if(u.origin!==url||!(u.protocol==="https:"||u.origin==="http://127.0.0.1:3162"))throw Error("invalid auth origin");
 return createClient(url,publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:"spendshift-owner-memory-only"},global:{fetch:(input,init)=>fetch(input,{...init,cache:"no-store",referrerPolicy:"no-referrer",signal:init?.signal?AbortSignal.any([init.signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)})}});
}
export async function beginOwnerSignIn(client:SupabaseClient,email:string,password:string){
 if(!email||email.length>254||!password||password.length>1024)throw Error("invalid credentials");
 const result=await client.auth.signInWithPassword({email,password});
 if(result.error||!result.data.session)throw Error("sign-in failed");
 const {data,error}=await client.auth.mfa.listFactors();
 if(error||!data.totp.length)throw Error("A pre-enrolled authenticator is required");
 const verified=data.totp.filter(f=>f.status==="verified").map(f=>({id:f.id,label:f.friendly_name||"Authenticator"}));
 if(!verified.length)throw Error("A pre-enrolled authenticator is required");
 return verified;
}
export async function completeOwnerSignIn(client:SupabaseClient,factorId:string,code:string){
 if(!/^[0-9]{6}$/.test(code)||!/^[0-9a-f-]{36}$/i.test(factorId))throw Error("invalid verification");
 const result=await client.auth.mfa.challengeAndVerify({factorId,code});
 if(result.error)throw Error("verification failed");
 const session=await client.auth.getSession();
 if(session.error||!session.data.session?.access_token)throw Error("verification failed");
 const aal=await client.auth.mfa.getAuthenticatorAssuranceLevel();
 if(aal.error||aal.data.currentLevel!=="aal2")throw Error("verification failed");
 return session.data.session.access_token;
}
