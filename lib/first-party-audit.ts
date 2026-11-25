import {granularMode,optionalAllowed} from './analytics-v2/optional';
/** First-party, aggregate-only telemetry. No tracking identifiers or answers. */
type AggregateAuditEvent = "audit_arrival" | "audit_start" | "audit_complete";

export function recordAggregateAuditEvent(event: AggregateAuditEvent) {
  if (typeof window === "undefined") return;
  try {
    // Respect the customer's existing optional-analytics choice.
    if (granularMode()) { if (!optionalAllowed("analytics")) return; }
    else if (localStorage.getItem("spendshift_cookie_consent") !== "granted") return;
    // Count at most once per tab/session. This is not a unique-person identifier.
    const key = "spendshift_aggregate_" + event;
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    // keepalive allows the completion event to finish while navigating to results.
    void fetch("/api/audit-metric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      referrerPolicy: "no-referrer",
      keepalive: true,
      body: JSON.stringify({ event }),
    }).catch(() => {
      // Analytics must never prevent an audit from completing.
    });
  } catch {
    // If storage or telemetry is blocked, the product remains fully functional.
  }
}
