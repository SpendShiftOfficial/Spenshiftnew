import {optionalPermissions} from './analytics-v2/optional';
/**
 * Consent-based first-party aggregate usage events.
 * The private report token is sent only to the first-party verification API;
 * it is not stored in aggregate counters or shared with GA4/Clarity.
 */
export type ReportEngagement = "report_open" | "checklist_interaction" | "tracker_saved" | "feedback_sent";

export function recordReportEngagement(event: ReportEngagement, reportId: string): void {
  if (typeof window === "undefined" ||
      !/^rpt_[A-Za-z0-9_-]{8,72}$/.test(reportId)) return;
  try {
    // Respect the existing optional-analytics consent choice on private pages.
    if (!optionalPermissions(localStorage).analytics) return;
    const key = "spendshift_report_metric_" + event + "_" + reportId;
    if (sessionStorage.getItem(key) === "1") return;
    // At most one attempt per report, event and browser tab. Not unique users.
    sessionStorage.setItem(key, "1");
    void fetch("/api/report-metric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      referrerPolicy: "no-referrer",
      keepalive: true,
      body: JSON.stringify({ event, reportId }),
    }).catch(() => {
      // Never affect the paid report experience if measurement fails.
    });
  } catch {
    // Private browsing/storage restrictions must not block the product.
  }
}
