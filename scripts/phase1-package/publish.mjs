import fs from 'node:fs';
const repo='SpendShiftOfficial/Spenshiftnew';const branch='phase-1-personalisation-2026-11';
if(process.env.GITHUB_REPOSITORY!==repo||process.env.GITHUB_REF!=='refs/heads/'+branch)throw new Error('Wrong repository or branch');
const token=process.env.GITHUB_TOKEN;if(!token)throw new Error('Missing scoped repository token');
const manifest=JSON.parse(fs.readFileSync('prepared-package/manifest.json','utf8'));
if(manifest.parent!==process.env.GITHUB_SHA||!Array.isArray(manifest.files)||manifest.files.length>80)throw new Error('Wrong build artifact');
const allowed=p=>/^(app|components|lib|docs)\/[A-Za-z0-9_./\[\]-]+$/.test(p)||p==='next.config.ts'||['scripts/check-phase1.mjs','scripts/check-phase1-browser.mjs'].includes(p);
if(manifest.files.some(f=>!allowed(f.path)||f.path.includes('..')||typeof f.content!=='string'||Buffer.byteLength(f.content)>200000))throw new Error('Unexpected source path');
async function api(path,method='GET',body){const r=await fetch('https://api.github.com/repos/'+repo+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw new Error('GitHub '+method+' failed with status '+r.status);return r.json();}
const head=await api('/git/ref/heads/'+branch);if(head.object.sha!==manifest.parent)throw new Error('Branch changed. Do not overwrite another change.');
const parent=await api('/git/commits/'+manifest.parent);
const tree=await api('/git/trees','POST',{base_tree:parent.tree.sha,tree:manifest.files.map(f=>({path:f.path,mode:'100644',type:'blob',content:f.content}))});
const commit=await api('/git/commits','POST',{message:'Phase 1: tested trust, saved progress, goal-aware plan and checked savings package',tree:tree.sha,parents:[manifest.parent]});
const current=await api('/git/ref/heads/'+branch);if(current.object.sha!==manifest.parent)throw new Error('Branch changed before publishing');
await api('/git/refs/heads/'+branch,'PATCH',{sha:commit.sha,force:false});
console.log('Published tested package to '+branch+' at '+commit.sha);console.log('Production branch was not changed.');
