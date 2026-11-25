export const RELEASE_AUTHORIZED:boolean;
export const PRODUCTION_ORIGIN:string;
export const NOTICE_VERSION:string;
export function releaseCapabilities(env:Record<string,string|undefined>,approved?:boolean):{privacy:boolean;collect:boolean;read:boolean;prune:boolean};
