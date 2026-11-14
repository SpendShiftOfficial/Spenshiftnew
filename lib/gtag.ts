import {canTrack,safeEventParams} from './privacy';
export const GA_MEASUREMENT_ID='G-MEHDG2Y7T2';
declare global {interface Window {gtag?:(...args:any[])=>void;dataLayer?:Record<string,any>[];clarity?:(command:string,...args:any[])=>void;}}
const allowed=new Set(['audit_start','audit_complete','free_results_view','upgrade_click','begin_checkout','purchase','paid_report_ready','personalisation_started','personalisation_completed','personalisation_skipped']);
export function trackEvent(eventName:string,params:Record<string,any>={}){
 if(!canTrack()||!allowed.has(eventName)) return;
 window.gtag?.('event',eventName,safeEventParams(params));
 // Never copy private events into the data layer or console.
}
