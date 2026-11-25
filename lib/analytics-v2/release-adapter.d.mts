type Rpc=(name:string,args:Record<string,unknown>)=>PromiseLike<{data:unknown;error:unknown}>;
export function createReleaseAdapter(rpc:Rpc):{increment(args:Record<string,string|number>):Promise<'accepted'|'disabled'|'limited'>;read(range:{from:string;to:string}):Promise<{rows:unknown[];operations:unknown}>;prune():Promise<void>;sessionActive(user:string,session:string):Promise<boolean>};
