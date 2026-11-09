import fs from 'node:fs';
import path from 'node:path';
export function read(file){ return fs.readFileSync(file,'utf8'); }
export function write(file,content){ fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,content); }
export function edit(file,fn){ write(file,fn(read(file))); }
export function replace(s,from,to){ if(s.includes(from)) return s.replace(from,()=>to); if(s.includes(to)) return s; throw new Error('Expected source not found: '+from.slice(0,110)); }
