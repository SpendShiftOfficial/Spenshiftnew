// Fixed public-homepage codes; no visitor IDs, raw text, coordinates or dwell timestamps sent.
export const homeSections=Object.freeze({"hero":"Opening headline","benefits":"Benefits","offer":"Personalised plan","example":"Phone bill example","faq":"FAQs","final":"Final call to action"});
export const homeCtas=Object.freeze({"header":"Header / menu","hero":"Opening CTA","offer":"Plan offer CTA","final":"Final CTA","footer":"Footer link"});
export const homeMetrics=Object.freeze([
 'home_engaged_60s','home_engaged_120s',
 ...Object.keys(homeSections).map(k=>'home_section_'+k+'_seen'),
 ...Object.keys(homeCtas).flatMap(k=>['home_cta_'+k+'_impression','home_cta_'+k+'_click'])
]);
export const homeTimingEvents=ms=>[...(ms>=60000?['home_engaged_60s']:[]),...(ms>=120000?['home_engaged_120s']:[])];
// Require repeated qualifying samples for at least a second; reset on hidden/off/gaps.
export function createDwellTracker(){
 const pending=new Map();
 return {
  reset(){pending.clear();},
  update(now,codes){
   const current=new Set(codes.filter(c=>homeMetrics.includes(c)&&!c.endsWith('_click')&&!c.startsWith('home_engaged_')));
   for(const key of pending.keys())if(!current.has(key))pending.delete(key);
   const reached=[];
   for(const code of current){
    const old=pending.get(code);
    const sample=old&&now>=old.last&&now-old.last<=1200?{start:old.start,last:now}:{start:now,last:now};
    pending.set(code,sample);
    if(now-sample.start>=1000)reached.push(code);
   }
   return reached;
  }
 };
}
