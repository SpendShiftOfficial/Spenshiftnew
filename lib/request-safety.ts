export class InputError extends Error { constructor(message:string, public status=400){super(message);} }
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
