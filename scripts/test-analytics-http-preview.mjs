import assert from "node:assert/strict";
import { spawn } from "node:child_process";

/*
 * Real HTTP smoke test of the built Next.js application, with analytics OFF.
 * Preview environment and placeholder keys only: never contacts production.
 */
const port = "3157";
const origin = "http://127.0.0.1:" + port;
const service = spawn(process.execPath, [
  "node_modules/next/dist/bin/next", "start", "-p", port, "-H", "127.0.0.1",
], {
  env: {
    ...process.env,
    PORT: port,
    VERCEL_ENV: "preview",
    SPENDSHIFT_AGGREGATE_METRICS_ENABLED: "true",
    SUPABASE_URL: "https://pcjgzbaigtsnevhcjqyd.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "ci-placeholder-not-a-real-key",
    STRIPE_SECRET_KEY: "sk_test_ci_placeholder",
    NEXT_PUBLIC_SITE_URL: origin,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
for (const stream of [service.stdout, service.stderr]) {
  stream.on("data", chunk => { output = (output + chunk.toString()).slice(-6000); });
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (service.exitCode !== null) throw new Error("Next exited unexpectedly: " + output);
    try {
      const res = await fetch(origin + "/");
      if (res.ok) { ready = true; break; }
    } catch { /* server not ready yet */ }
    await sleep(250);
  }
  assert.equal(ready, true, "Next server not ready: " + output);

  for (const [endpoint, body] of [
    ["/api/audit-metric", { event: "audit_start" }],
    ["/api/report-metric", { event: "report_open", reportId: "rpt_ANONTESTREPORT012345" }],
  ]) {
    const response = await fetch(origin + endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 204, endpoint + " must be disabled in preview");
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(await response.text(), "");
    console.log("PASS real preview HTTP: " + endpoint + " disabled, empty, no-store");
  }
  console.log("PASS both analytics API HTTP smoke checks");
} finally {
  service.kill("SIGTERM");
}
