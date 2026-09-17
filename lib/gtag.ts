export const GA_MEASUREMENT_ID = "G-MEHDG2Y7T2";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(
  eventName: string,
  params: Record<string, any> = {}
) {
  console.log("🔥 GA EVENT:", eventName, params);

  if (typeof window === "undefined") {
    console.log("❌ window unavailable");
    return;
  }

  if (typeof window.gtag !== "function") {
    console.log("❌ gtag unavailable");
    return;
  }

  window.gtag("event", eventName, params);

  console.log("✅ GA EVENT SENT:", eventName);
}