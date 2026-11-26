// Real Auth APIs, real local Postgres RPC and exact owner client/authorization functions.
// No real customer or production secrets. Never print keys, passwords, JWTs or TOTP seeds.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHmac,randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {beginOwnerSignIn,completeOwnerSignIn} from '../../lib/analytics-v2/owner-client.ts';
import {authorizeOwner} from '../../lib/analytics-v2/owner-auth.mjs';
import {createReleaseAdapter} from '../../lib/analytics-v2/release-adapter.mjs';
import {releaseCapabilities,RELEASE_AUTHORIZED} from '../../lib/analytics-v2/release-config.mjs';
import {sydneyDay} from '../../lib/analytics-v2/core.mjs';
const die=label=>{throw Error(label);};
let checks=0;const check=(value,label)=>{if(value!==true)die(label);checks++;console.log('PASS '+label);};
const ok=(res,label)=>{if(res.error)die(label);return res.data;};
const settings=JSON.parse(readFileSync(process.env.SPENDSHIFT_LOCAL_AUTH_STATUS,'utf8'));
const url=new URL(settings.API_URL);
const db=new URL(settings.DB_URL);
assert.equal(url.protocol,'http:');assert.ok(['127.0.0.1','localhost'].includes(url.hostname));assert.equal(url.port,'54321');assert.equal(url.pathname,'/');
assert.equal(db.protocol,'postgresql:');assert.ok(['127.0.0.1','localhost'].includes(db.hostname));assert.equal(db.port,'54322');assert.equal(db.pathname,'/postgres');
if(process.env.VERCEL||process.env.SUPABASE_URL||process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_ACCESS_TOKEN)die('unexpected hosted configuration');
const publicKey=settings.PUBLISHABLE_KEY??settings.ANON_KEY,serverKey=settings.SECRET_KEY??settings.SERVICE_ROLE_KEY;
if(!publicKey||!serverKey||publicKey===serverKey)die('local key setup');
const client=(key)=>createClient(url.origin,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>{const target=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);if(target.origin!==url.origin)die('non-loopback request');return fetch(input,{...init,signal:AbortSignal.timeout(12000)});}}});
const admin=client(serverKey),owner=client(publicKey),other=client(publicKey);
function sql(args){execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','--dbname',settings.DB_URL,...args],{stdio:['ignore','ignore','ignore'],timeout:30000});}
function totp(secret,offset=0){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits=0,n=0,bytes=[];for(const ch of secret.toUpperCase().replace(/=+$/,'')){const v=alphabet.indexOf(ch);if(v<0)die('bad fixture factor');n=(n<<5)|v;bits+=5;if(bits>=8){bits-=8;bytes.push((n>>bits)&255);}}const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)+offset));const digest=createHmac('sha1',Buffer.from(bytes)).update(counter).digest();return String((digest.readUInt32BE(digest.at(-1)&15)&0x7fffffff)%1000000).padStart(6,'0');}
function claim(jwt){return JSON.parse(Buffer.from(jwt.split('.')[1],'base64url').toString('utf8'));}
async function session(c){return ok(await c.auth.getSession(),'get session').session?.access_token;}
const email='owner-'+randomBytes(6).toString('hex')+'@example.invalid',password=randomBytes(24).toString('base64url')+'aA1!';
const otherEmail='other-'+randomBytes(6).toString('hex')+'@example.invalid',otherPassword=randomBytes(24).toString('base64url')+'bB2!';
let ownerId,otherId;
try{
 check(RELEASE_AUTHORIZED===false&&!Object.values(releaseCapabilities(process.env)).some(Boolean),'source release lock remains closed');
 // The local CLI has created the actual auth schema and roles. Supply only synthetic product tables.
 sql(['-c',"DO $$ BEGIN IF to_regclass('auth.sessions') IS NULL OR to_regclass('public.report_orders') IS NOT NULL OR to_regclass('public.spendshift_metrics_v2_daily') IS NOT NULL THEN RAISE EXCEPTION 'fresh local Auth required'; END IF; END $$; CREATE TABLE public.report_orders(stripe_session_id text PRIMARY KEY,paid_at timestamptz,status text,refinements jsonb,ready_at timestamptz,report_sent_at timestamptz); CREATE TABLE public.spendshift_audit_daily(event_date date,event_name text,event_count bigint); GRANT SELECT ON public.report_orders,public.spendshift_audit_daily TO service_role; REVOKE ALL ON public.report_orders,public.spendshift_audit_daily FROM PUBLIC,anon,authenticated;"]);
 for(const path of ['candidate-migration.sql','candidate-release.sql','candidate-financial.sql'])sql(['-f','docs/analytics-v2/'+path]);
 sql(['-c',"NOTIFY pgrst, 'reload schema';"]);
 await new Promise(r=>setTimeout(r,1000));
 const adapter=createReleaseAdapter((name,args)=>admin.rpc(name,args));
 const ownerUser=ok(await admin.auth.admin.createUser({email,password,email_confirm:true}),'create local owner').user;ownerId=ownerUser.id;
 otherId=ok(await admin.auth.admin.createUser({email:otherEmail,password:otherPassword,email_confirm:true}),'create local non-owner').user.id;
 const verifyUser=async jwt=>{const {data,error}=await admin.auth.getUser(jwt);return error?null:data.user;};
 const verifyMfa=async jwt=>{const {data,error}=await admin.auth.mfa.getAuthenticatorAssuranceLevel(jwt);return error?null:data;};
 const opts={ownerId,verifyUser,verifyMfa,sessionActive:adapter.sessionActive};
 const allowed=async(jwt,override={})=>authorizeOwner(jwt?'Bearer '+jwt:null,{...opts,...override});
 check(!await allowed(null),'missing owner bearer denied');
 // Password-only and unverified factor cannot pass the owner gate.
 ok(await owner.auth.signInWithPassword({email,password}),'local password sign-in');
 const aal1=await session(owner);
 check(claim(aal1).aal==='aal1'&&!await allowed(aal1),'actual password-only owner denied');
 const factor=ok(await owner.auth.mfa.enroll({factorType:'totp',friendlyName:'Local synthetic TOTP'}),'local TOTP enroll');
 check(!await allowed(aal1),'unverified factor denied');
 ok(await owner.auth.mfa.challengeAndVerify({factorId:factor.id,code:totp(factor.totp.secret)}),'verify enrolment');
 const enrolled=await session(owner);
 check(claim(enrolled).aal==='aal2','real TOTP enrolment promotes session to AAL2');
 ok(await owner.auth.signOut({scope:'local'}),'sign out after enrolment');
 check(!await allowed(enrolled),'enrolment session revoked by actual sign out');
 // Exercise the exact application's two login functions against actual Auth.
 const factors=await beginOwnerSignIn(owner,email,password);
 check(factors.some(f=>f.id===factor.id),'owner login lists pre-enrolled verified TOTP');
 const passwordOnly=await session(owner);check(!await allowed(passwordOnly),'dashboard denied before second factor');
 const correct=totp(factor.totp.secret);const invalid=String((Number(correct)+1)%1000000).padStart(6,'0');
 let rejected=false;try{await completeOwnerSignIn(owner,factor.id,invalid);}catch{rejected=true;}
 check(rejected&&!await allowed(await session(owner)),'real wrong authenticator code rejected');
 const full=await completeOwnerSignIn(owner,factor.id,totp(factor.totp.secret));
 check(claim(full).aal==='aal2'&&await allowed(full),'real owner password and TOTP accepted by exact gate');
 check(await adapter.sessionActive(ownerId,claim(full).session_id),'real Postgres Auth session and candidate RPC agree');
 check(!await allowed(full,{now:claim(full).iat+901}),'token older than application limit rejected');
 check(!await allowed(full,{now:claim(full).exp}),'expired token rejected');
 // Tampered signature must fail remote verification, not merely decoded claims.
 const segments=full.split('.');segments[2]=(segments[2][0]==='A'?'B':'A')+segments[2].slice(1);
 check(!await allowed(segments.join('.')),'tampered bearer rejected by real Auth');
 ok(await other.auth.signInWithPassword({email:otherEmail,password:otherPassword}),'local non-owner sign in');
 const otherFactor=ok(await other.auth.mfa.enroll({factorType:'totp',friendlyName:'Other synthetic TOTP'}),'other TOTP enroll');
 ok(await other.auth.mfa.challengeAndVerify({factorId:otherFactor.id,code:totp(otherFactor.totp.secret)}),'other verify');
 const otherToken=await session(other);check(claim(otherToken).aal==='aal2'&&!await allowed(otherToken),'different authenticated AAL2 user denied');
 const forbidden=await other.rpc('spendshift_read_metrics_v2',{p_from:sydneyDay(new Date()),p_to:sydneyDay(new Date())});
 check(!!forbidden.error,'authenticated browser cannot read analytics RPC');
 const anon=client(publicKey);check(!!(await anon.rpc('spendshift_owner_session_active',{p_user:ownerId,p_session:claim(full).session_id})).error,'anonymous browser cannot invoke session-check RPC');
 const now=sydneyDay(new Date()),report=await adapter.read({from:now,to:now});
 check(Array.isArray(report.rows)&&typeof report.operations==='object','service-only aggregate report returns with real local schema');
 check(await adapter.increment({p_event:'audit_start'})==='disabled','local collection control defaults off');
 // On logout the actual auth.sessions row must disappear, even if JWT signature is still valid.
 ok(await owner.auth.signOut({scope:'local'}),'owner local logout');
 check(!await adapter.sessionActive(ownerId,claim(full).session_id)&&!await allowed(full),'real logout revokes saved bearer and database session');
 console.log('PASS '+checks+' real isolated Auth, MFA, permission and revocation checks');
}catch(error){console.error('FAIL isolated Auth verification: '+(error instanceof Error?error.message:'unknown failure'));process.exitCode=1;}
finally{try{await owner.auth.signOut({scope:'local'});await other.auth.signOut({scope:'local'});if(ownerId)await admin.auth.admin.deleteUser(ownerId);if(otherId)await admin.auth.admin.deleteUser(otherId);}catch{}}
