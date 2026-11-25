// Candidate owner gate: remote authentication before trusting claims.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function authorizeOwner(header,{ownerId,verifyUser,verifyMfa,sessionActive,now=Math.floor(Date.now()/1000)}){
 if(typeof ownerId!=='string'||!uuid.test(ownerId)||typeof header!=='string'||header.length>4096)return false;
 const match=/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(header);
 if(!match)return false;
 const token=match[1];
 try{
   const user=await verifyUser(token);if(!user||user.id!==ownerId)return false;
   const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));
   if(claims.sub!==ownerId||claims.role!=='authenticated'||claims.aal!=='aal2'||!uuid.test(claims.session_id??'')||
      !Number.isSafeInteger(claims.exp)||!Number.isSafeInteger(claims.iat)||claims.exp<=now||claims.iat>now+30||now-claims.iat>900)return false;
   const mfa=await verifyMfa(token);if(mfa?.currentLevel!=='aal2'||mfa?.nextLevel!=='aal2')return false;
   return await sessionActive(ownerId,claims.session_id)===true;
 }catch{return false;}
}
