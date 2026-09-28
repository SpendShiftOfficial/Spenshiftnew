export const GA_MEASUREMENT_ID = "G-MEHDG2Y7T2";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: Record<string, any>[];
  }
}

export function trackEvent(
  eventName: string,
  params: Record<string, any> = {}
) {
  console.log("🔥 EVENT:", eventName, params);

  if (typeof window === "undefined") return;

  // Send event to Google Tag Manager
  window.dataLayer = window.dataLayer || [];

  window.dataLayer.push({
    event: eventName,
    ...params,
  });

  console.log("✅ GTM EVENT SENT:", eventName);

  // Existing direct GA4 tracking
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);

    console.log("✅ GA4 EVENT SENT:", eventName);
  } else {
    console.log("❌ gtag unavailable");
  }
}