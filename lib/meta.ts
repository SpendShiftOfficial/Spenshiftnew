import {canTrack,safeEventParams} from './privacy';
declare global {interface Window {fbq?:(...args:any[])=>void;}}
export function trackMeta(eventName:string,params:Record<string,any>={}){if(canTrack())window.fbq?.('trackCustom',eventName,safeEventParams(params));}
export function trackMetaStandard(eventName:string,params:Record<string,any>={}){if(canTrack())window.fbq?.('track',eventName,safeEventParams(params));}
