import {canTrack,safeEventParams} from './privacy';
declare global {interface Window {ttq?:{track?:(event:string,params?:Record<string,any>)=>void;page?:()=>void;};}}
export function trackTikTok(eventName:string,params:Record<string,any>={}){if(canTrack())window.ttq?.track?.(eventName,safeEventParams(params));}
