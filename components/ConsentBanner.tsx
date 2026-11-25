"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {isMarketingPath} from "@/lib/privacy";
import {optionalPermissions,protectRollback} from "@/lib/analytics-v2/optional";
import {browserCollector} from "@/lib/analytics-v2/browser.mjs";

const CONSENT_KEY = "spendshift_cookie_consent";

type ConsentChoice = "granted" | "denied";

export default function ConsentBanner() {
const [visible, setVisible] = useState(false);

useEffect(() => {
if (!isMarketingPath(window.location.pathname)) return;
let saved: ConsentChoice | null = null;
try { const raw=localStorage.getItem("spendshift_privacy_v2"); saved=raw!==null?(optionalPermissions(localStorage).analytics?"granted":"denied"):localStorage.getItem(CONSENT_KEY) as ConsentChoice | null; } catch {}

if (saved === "granted" || saved === "denied") {

return;
}

setVisible(true);
}, []);
  useEffect(() => {
const openCookieSettings = () => {
setVisible(true);
};

window.addEventListener("open-cookie-settings", openCookieSettings);

return () => {
window.removeEventListener("open-cookie-settings", openCookieSettings);
};
}, []);

function saveConsent(choice: ConsentChoice) {
 try {
   protectRollback(localStorage,choice,"denied");
   // In this disabled/basic-pre-release state preserve the earlier basic choice.
   // Do not create a legacy vendor grant.
   const c=browserCollector({enabled:false,noticeVisible:()=>false});
   if(c.choose({analytics:choice,ads:"denied"}))setVisible(false);
 } catch {}
}

if (!visible) {
  return null;
}

return (
<div
role="dialog"
aria-label="Cookie preferences"
style={{
position: "fixed",
left: "20px",
right: "20px",
bottom: "20px",
zIndex: 99999,
maxWidth: "720px",
margin: "0 auto",
padding: "20px",
background: "#ffffff",
color: "#1f2937",
border: "1px solid #e5e7eb",
borderRadius: "16px",
boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
}}
>
<div
style={{
fontSize: "18px",
fontWeight: 700,
marginBottom: "8px",
}}
>
Your privacy choices
</div>

<p
style={{
margin: "0 0 16px",
lineHeight: 1.5,
fontSize: "14px",
}}
>
No third-party analytics or advertising scripts run in this version.
If you accept optional activity counts, we count certain free-check and paid-report actions on SpendShift's own servers. We do not include your answers in these totals. Basic website statistics are currently disabled. You can accept or reject these optional first-party counts.{" "}
<Link
href="/cookies"
style={{
textDecoration: "underline",
color: "inherit",
}}
>
Cookie Policy
</Link>
</p>

<div
style={{
display: "flex",
gap: "10px",
flexWrap: "wrap",
}}
>
<button
type="button"
onClick={() => saveConsent("granted")}
style={{
border: 0,
borderRadius: "10px",
padding: "11px 18px",
fontWeight: 700,
cursor: "pointer",
background: "#059625",
color: "#ffffff",
}}
>
Accept optional activity counts
</button>

<button
type="button"
onClick={() => saveConsent("denied")}
style={{
border: "1px solid #d1d5db",
borderRadius: "10px",
padding: "11px 18px",
fontWeight: 700,
cursor: "pointer",
background: "#ffffff",
color: "#1f2937",
}}
>
Reject optional activity counts
</button>
</div>
</div>
);
}
