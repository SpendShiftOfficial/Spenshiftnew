// Isolated analytics v2 candidate. No network calls or production credentials.
export const pages={
  "home": "/",
  "pricing": "/pricing",
  "included": "/whats-included",
  "how_it_works": "/how-it-works",
  "why": "/why-spendshift",
  "services": "/services",
  "guide_savings": "/save-money-australia",
  "guide_energy": "/reduce-electricity-bill-australia",
  "guide_subscriptions": "/cancel-unused-subscriptions-australia"
};
export const enums={
  "page": [
    "home",
    "pricing",
    "included",
    "how_it_works",
    "why",
    "services",
    "guide_savings",
    "guide_energy",
    "guide_subscriptions"
  ],
  "source": [
    "instagram",
    "facebook",
    "tiktok",
    "google",
    "other_search",
    "other_social",
    "other_referral",
    "direct_or_unknown"
  ],
  "campaign": [
    "meta_founder_v1",
    "none_or_unknown"
  ],
  "device": [
    "mobile",
    "tablet",
    "desktop",
    "unknown"
  ],
  "browser": [
    "safari",
    "chrome",
    "firefox",
    "edge",
    "other_or_unknown"
  ],
  "placement": [
    "hero",
    "body",
    "footer",
    "other"
  ],
  "question": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8
  ],
  "faq": [
    "pricing",
    "free_check",
    "plan",
    "privacy",
    "refund",
    "support",
    "live_prices",
    "unknown_amount",
    "savings_guarantee",
    "after_payment"
  ],
  "error": [
    "audit_storage_unavailable",
    "checkout_open_failed",
    "results_unavailable",
    "other_reviewed"
  ],
  "choice": [
    "accept_all",
    "reject_all",
    "custom"
  ],
  "lcp": [
    "0_2500",
    "2501_4000",
    "4001_plus"
  ],
  "inp": [
    "0_200",
    "201_500",
    "501_plus"
  ],
  "cls": [
    "0_010",
    "010_025",
    "025_plus"
  ],
  "duration": [
    "under_30",
    "30_59",
    "60_119",
    "120_239",
    "240_plus"
  ]
};
export const events={
  "site_entry": [
    "page",
    "source",
    "campaign",
    "device",
    "browser"
  ],
  "public_page_view": [
    "page"
  ],
  "engaged_10s": [
    "page"
  ],
  "engaged_30s": [
    "page"
  ],
  "scroll_25": [
    "page"
  ],
  "scroll_50": [
    "page"
  ],
  "scroll_75": [
    "page"
  ],
  "scroll_90": [
    "page"
  ],
  "public_cta_click": [
    "page",
    "placement"
  ],
  "public_nav_click": [
    "page"
  ],
  "faq_open": [
    "faq"
  ],
  "lcp_bucket": [
    "lcp"
  ],
  "inp_bucket": [
    "inp"
  ],
  "cls_bucket": [
    "cls"
  ],
  "safe_ui_error": [
    "error"
  ],
  "privacy_notice_shown": [],
  "optional_choice": [
    "choice"
  ],
  "audit_arrival": [],
  "audit_start": [],
  "audit_question_seen": [
    "question"
  ],
  "audit_question_advanced": [
    "question"
  ],
  "audit_back": [
    "question"
  ],
  "audit_reset": [],
  "audit_complete": [],
  "audit_duration_bucket": [
    "duration"
  ],
  "results_view": [],
  "upgrade_offer_view": [],
  "upgrade_cta_click": [],
  "checkout_opened": [],
  "personalisation_view": [],
  "personalisation_step_advanced": []
};
export function validEvent(x) {
 if(!x||typeof x!=="object"||Array.isArray(x)||x.v!==2||!Object.hasOwn(events,x.event))return false;
 const fields=events[x.event], keys=Object.keys(x);
 if(keys.length!==fields.length+2||!keys.every(k=>k==="v"||k==="event"||fields.includes(k)))return false;
 return fields.every(k=>Object.hasOwn(x,k)&&enums[k].includes(x[k]))&&!(x.event==="audit_back"&&x.question===1);
}

export function parseEvent(raw){
 if(typeof raw!=="string"||raw.length>512||!/^[\x20-\x7e\t\r\n]*$/.test(raw))return null;
 // Exact flat JSON only; count key tokens before JSON.parse so duplicate keys cannot disappear.
 // Reject escaped keys/values (all catalog codes are ASCII and require no escaping).
 if(raw.includes("\\")||!/^\s*\{(?:\s*"[a-z_][a-z_0-9]*"\s*:\s*(?:"[a-z_0-9]+"|[0-9]+)\s*(?:,\s*"[a-z_][a-z_0-9]*"\s*:\s*(?:"[a-z_0-9]+"|[0-9]+)\s*)*)?\}\s*$/.test(raw))return null;
 const keys=[...raw.matchAll(/"([a-z_][a-z_0-9]*)"\s*:/g)].map(m=>m[1]);
 if(new Set(keys).size!==keys.length)return null;
 try{const x=JSON.parse(raw);return validEvent(x)?x:null;}catch{return null;}
}

export function marginals(x){
 if(!validEvent(x))throw Error("invalid_metric");
 return [["all","all"],...events[x.event].map(k=>[k,String(x[k])])].map(([dimension,bucket])=>[x.event,dimension,bucket]);
}

export function basicAllowed({enabled,noticeVisible,storageOK,legacy,pref}){
 if(enabled!==true||noticeVisible!==true||storageOK!==true||![null,"granted","denied"].includes(legacy))return false;
 if(pref!==null&&(!pref||pref.version!=="2026-11-v2"||typeof pref.basicOff!=="boolean"||typeof pref.legacyTransition!=="boolean"||!["unset","granted","denied"].includes(pref.analytics)||!["unset","granted","denied"].includes(pref.ads)||Object.keys(pref).length!==5))return false;
 if(pref?.basicOff===true)return false;
 if(legacy!==null)return pref?.legacyTransition===true;
 return true;
}

export function sourceCategory(ref,ownOrigin){
 if(!ref)return "direct_or_unknown";
 try{const u=new URL(ref);if(!["https:","http:"].includes(u.protocol))return "direct_or_unknown";if(u.origin===ownOrigin)return null;
 const h=u.hostname.toLowerCase();const match=d=>h===d||h.endsWith("."+d);
 if(match("instagram.com"))return "instagram";if(match("facebook.com")||match("fb.com"))return "facebook";if(match("tiktok.com"))return "tiktok";if(match("google.com")||match("google.com.au"))return "google";if(["bing.com","duckduckgo.com","yahoo.com"].some(match))return "other_search";if(["reddit.com","linkedin.com","x.com","twitter.com"].some(match))return "other_social";return "other_referral";
 }catch{return "direct_or_unknown";}
}

export function campaignCategory(search){
 try{if(search.length>4096)return "none_or_unknown";const p=new URLSearchParams(search),a=p.getAll("utm_campaign");return a.length===1&&a[0]==="meta_founder_v1"?a[0]:"none_or_unknown";}catch{return "none_or_unknown";}
}

export function makeRecorder({allowed,send}){
 const seen=new Set();return {record(x,key){if(!allowed()||!validEvent(x))return false;const k=key??JSON.stringify(x);if(seen.has(k))return false;seen.add(k);try{Promise.resolve(send(x)).catch(()=>{});}catch{}return true;},reset(){seen.clear();},withdraw(){seen.clear();}};
}

export function questionRatio(advanced,seen){return Number.isSafeInteger(advanced)&&Number.isSafeInteger(seen)&&advanced>=0&&seen>0&&advanced<=seen?advanced/seen:null;}

export function suppress(n){return Number.isSafeInteger(n)&&n>=10?n:null;}

export function sydneyDay(d){return new Intl.DateTimeFormat("en-CA",{timeZone:"Australia/Sydney",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);}

export function makeAuditRun(record){
 const seen=new Set(),advanced=new Set(),back=new Set();let arrived=false,started=false,completed=false;
 return {arrive(){if(!arrived){arrived=true;record({v:2,event:"audit_arrival"});}},see(q){if(enums.question.includes(q)&&!seen.has(q)){seen.add(q);record({v:2,event:"audit_question_seen",question:q});}},choose(q){if(q===1&&!started){started=true;record({v:2,event:"audit_start"});}},advance(q){if(enums.question.includes(q)&&!advanced.has(q)){advanced.add(q);record({v:2,event:"audit_question_advanced",question:q});}},back(q){if(q>1&&enums.question.includes(q)&&!back.has(q)){back.add(q);record({v:2,event:"audit_back",question:q});}},complete(){if(!completed){completed=true;record({v:2,event:"audit_complete"});}},reset(){record({v:2,event:"audit_reset"});seen.clear();advanced.clear();back.clear();arrived=started=completed=false;}};
}
