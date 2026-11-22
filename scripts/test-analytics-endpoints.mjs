import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

/*
 * Behavioural tests. These execute the actual Next.js POST route handlers
 * with in-memory Supabase fakes. They NEVER contact a real database,
 * switch live environment variables or send network requests.
 */
const baseRequire = createRequire(import.meta.url);
const calls = [];
const state = { reportFound: true, lookupError: false, rpcError: false };
const paidReportId = "rpt_ANONTESTREPORT012345";
const server = {
  rpc: async (name, args) => {
    calls.push({ type: "rpc", name, args });
    return { error: state.rpcError ? new Error("sensitive internal RPC failure") : null };
  },
  from: (name) => {
    calls.push({ type: "from", name });
    return {
      select(field) { calls.push({ type: "select", field }); return this; },
      eq(field, value) { calls.push({ type: "eq", field, value }); return this; },
      limit(n) { calls.push({ type: "limit", n }); return this; },
      async maybeSingle() {
        return { data: state.reportFound ? { report_id: paidReportId } : null,
          error: state.lookupError ? new Error("sensitive internal lookup failure") : null };
      },
    };
  },
};

function loadTsFile(filename) {
  const abs = path.resolve(filename);
  const compiled = ts.transpileModule(fs.readFileSync(abs, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    fileName: abs,
  }).outputText;
  const m = { exports: {} };
  const request = (specifier) => {
    if (specifier === "@/lib/supabase") return { supabaseAdmin: server };
    if (specifier === "@/lib/request-safety") return requestSafety;
    if (specifier.startsWith("./") || specifier.startsWith("../"))
      return loadTsFile(path.resolve(path.dirname(abs), specifier) + ".ts");
    return baseRequire(specifier);
  };
  new Function("require", "module", "exports", compiled)(request, m, m.exports);
  return m.exports;
}
const requestSafety = loadTsFile("lib/request-safety.ts");
const audit = loadTsFile("app/api/audit-metric/route.ts");
const report = loadTsFile("app/api/report-metric/route.ts");
const original = { vercel: process.env.VERCEL_ENV, enabled: process.env.SPENDSHIFT_AGGREGATE_METRICS_ENABLED };
const origin = "https://www.spendshift.com.au";

function reset() { calls.length = 0; state.reportFound = true; state.lookupError = false; state.rpcError = false; }
function req(endpoint, data, opts = {}) {
  const headers = { "content-type": "application/json", "origin": origin,
    "sec-fetch-site": "same-origin", ...opts.headers };
  if (opts.noOrigin) delete headers.origin;
  if (opts.noFetchSite) delete headers["sec-fetch-site"];
  return new Request(origin + endpoint, {
    method: "POST", headers,
    body: typeof data === "string" ? data : JSON.stringify(data),
  });
}
async function expectStatus(label, handler, endpoint, body, status, opts = {}) {
  const response = await handler.POST(req(endpoint, body, opts));
  assert.equal(response.status, status, label + " status");
  assert.match(response.headers.get("Cache-Control") || "", /no-store/, label + " cache");
  assert.equal(response.headers.get("Referrer-Policy"), "no-referrer", label + " referrer");
  if (status === 204) assert.equal(await response.text(), "", label + " empty body");
  return response;
}
let tests = 0;
async function test(name, fn) { reset(); await fn(); tests++; process.stdout.write("PASS " + name + "\n"); }

try {
  process.env.VERCEL_ENV = "preview";
  process.env.SPENDSHIFT_AGGREGATE_METRICS_ENABLED = "true";
  await test("preview never writes, even when flag is enabled", async () => {
    await expectStatus("audit preview arrival", audit, "/api/audit-metric", { event: "audit_arrival" }, 204);
    await expectStatus("audit preview", audit, "/api/audit-metric", { event: "audit_start" }, 204);
    await expectStatus("report preview", report, "/api/report-metric",
      { event: "report_open", reportId: paidReportId }, 204);
    assert.deepEqual(calls, []);
  });
  process.env.VERCEL_ENV = "production";
  process.env.SPENDSHIFT_AGGREGATE_METRICS_ENABLED = "false";
  await test("production flag disabled never writes", async () => {
    await expectStatus("audit disabled", audit, "/api/audit-metric", { event: "audit_complete" }, 204);
    await expectStatus("report disabled", report, "/api/report-metric",
      { event: "report_open", reportId: paidReportId }, 204);
    assert.deepEqual(calls, []);
  });

  process.env.SPENDSHIFT_AGGREGATE_METRICS_ENABLED = "true";
  await test("audit valid event creates one atomic counter increment only", async () => {
    await expectStatus("audit valid", audit, "/api/audit-metric", { event: "audit_start" }, 204);
    assert.deepEqual(calls, [
      { type: "rpc", name: "spendshift_increment_audit_daily", args: { p_event: "audit_start" } },
    ]);
  });
  await test("audit arrival is a valid atomic aggregate with no visitor details", async () => {
    await expectStatus("audit arrival", audit, "/api/audit-metric", { event: "audit_arrival" }, 204);
    assert.deepEqual(calls, [
      { type: "rpc", name: "spendshift_increment_audit_daily", args: { p_event: "audit_arrival" } },
    ]);
  });
  await test("audit rejects missing origin", async () => {
    await expectStatus("audit missing origin", audit, "/api/audit-metric",
      { event: "audit_start" }, 403, { noOrigin: true });
    assert.deepEqual(calls, []);
  });
  await test("audit rejects foreign origin", async () => {
    await expectStatus("audit foreign origin", audit, "/api/audit-metric",
      { event: "audit_complete" }, 403, { headers: { origin: "https://example.org" } });
    assert.deepEqual(calls, []);
  });
  await test("audit rejects cross-site fetch metadata", async () => {
    await expectStatus("audit cross-site", audit, "/api/audit-metric",
      { event: "audit_start" }, 403, { headers: { "sec-fetch-site": "cross-site" } });
    assert.deepEqual(calls, []);
  });
  await test("audit rejects unknown event", async () => {
    await expectStatus("audit unknown", audit, "/api/audit-metric", { event: "purchase" }, 400);
    assert.deepEqual(calls, []);
  });
  await test("audit rejects extra fields containing private data", async () => {
    await expectStatus("audit extra field", audit, "/api/audit-metric",
      { event: "audit_start", answers: ["sensitive answer"] }, 400);
    assert.deepEqual(calls, []);
  });
  await test("audit rejects non JSON and oversized payloads", async () => {
    await expectStatus("audit wrong type", audit, "/api/audit-metric",
      { event: "audit_start" }, 415, { headers: { "content-type": "text/plain" } });
    await expectStatus("audit too large", audit, "/api/audit-metric",
      { event: "audit_start", padding: "X".repeat(400) }, 413);
    assert.deepEqual(calls, []);
  });
  await test("audit database failures are sanitised", async () => {
    state.rpcError = true;
    const response = await expectStatus("audit DB error", audit, "/api/audit-metric",
      { event: "audit_complete" }, 503);
    assert.doesNotMatch(await response.text(), /sensitive internal/i);
  });

  await test("report valid ready paid order increments only aggregate event", async () => {
    const response = await expectStatus("report valid", report, "/api/report-metric",
      { event: "report_open", reportId: paidReportId }, 204);
    assert.equal(await response.text(), "");
    assert.deepEqual(calls.at(-1), { type: "rpc", name: "spendshift_increment_report_daily",
      args: { p_event: "report_open" } });
    assert.ok(calls.some(c => c.type === "eq" && c.field === "status" && c.value === "ready"));
    assert.ok(calls.some(c => c.type === "eq" && c.field === "report_id" && c.value === paidReportId));
    assert.ok(!Object.hasOwn(calls.at(-1).args, "reportId"));
  });
  await test("report unknown report silently does not increment", async () => {
    state.reportFound = false;
    await expectStatus("unknown report", report, "/api/report-metric",
      { event: "tracker_saved", reportId: paidReportId }, 204);
    assert.equal(calls.filter(c => c.type === "rpc").length, 0);
  });
  await test("report rejects malformed report ID and unexpected event", async () => {
    await expectStatus("bad report ID", report, "/api/report-metric",
      { event: "report_open", reportId: "https://example.com/report/private" }, 400);
    await expectStatus("bad event", report, "/api/report-metric",
      { event: "purchase", reportId: paidReportId }, 400);
    assert.deepEqual(calls, []);
  });
  await test("report rejects free-text and spending fields", async () => {
    await expectStatus("report extra", report, "/api/report-metric",
      { event: "tracker_saved", reportId: paidReportId, amount: 1000 }, 400);
    assert.deepEqual(calls, []);
  });
  await test("report rejects foreign origin and cross-site fetch metadata", async () => {
    await expectStatus("report cross origin", report, "/api/report-metric",
      { event: "report_open", reportId: paidReportId }, 403,
      { headers: { origin: "https://example.com" } });
    await expectStatus("report cross-site", report, "/api/report-metric",
      { event: "report_open", reportId: paidReportId }, 403,
      { headers: { "sec-fetch-site": "cross-site" } });
    assert.deepEqual(calls, []);
  });
  await test("report rejects missing Origin", async () => {
    await expectStatus("report missing origin", report, "/api/report-metric",
      { event: "report_open", reportId: paidReportId }, 403, { noOrigin: true });
    assert.deepEqual(calls, []);
  });
  await test("report DB failures do not leak errors or report IDs", async () => {
    state.lookupError = true;
    let response = await expectStatus("report lookup error", report, "/api/report-metric",
      { event: "report_open", reportId: paidReportId }, 503);
    assert.doesNotMatch(await response.text(), /sensitive internal|rpt_ANONTEST/);
    reset();
    state.rpcError = true;
    response = await expectStatus("report RPC error", report, "/api/report-metric",
      { event: "report_open", reportId: paidReportId }, 503);
    assert.doesNotMatch(await response.text(), /sensitive internal|rpt_ANONTEST/);
  });

  await test("only audited consent-gated client helpers send aggregate event fields", async () => {
    const a = fs.readFileSync("lib/first-party-audit.ts", "utf8");
    const p = fs.readFileSync("lib/first-party-report.ts", "utf8");
    for (const code of [a, p]) {
      assert.match(code, /spendshift_cookie_consent/);
      assert.doesNotMatch(code, /\bgtag\(|\bclarity\(|\bfbq\(|\bttq\(/);
    }
    assert.match(a, /JSON\.stringify\(\{ event \}\)/);
    assert.match(p, /JSON\.stringify\(\{ event, reportId \}\)/);
  });
  await test("client helpers respect optional consent and send no financial data", async () => {
    const saved = { window: globalThis.window, localStorage: globalThis.localStorage,
      sessionStorage: globalThis.sessionStorage, fetch: globalThis.fetch };
    let consent = "denied";
    const stored = new Map();
    const sent = [];
    try {
      globalThis.window = {};
      globalThis.localStorage = { getItem: key => key === "spendshift_cookie_consent" ? consent : null };
      globalThis.sessionStorage = {
        getItem: key => stored.has(key) ? stored.get(key) : null,
        setItem: (key, value) => stored.set(key, value),
      };
      globalThis.fetch = (url, options) => {
        sent.push({ url, options });
        return Promise.resolve({ ok: true, status: 204 });
      };
      const auditClient = loadTsFile("lib/first-party-audit.ts");
      const reportClient = loadTsFile("lib/first-party-report.ts");
      auditClient.recordAggregateAuditEvent("audit_arrival");
      auditClient.recordAggregateAuditEvent("audit_start");
      reportClient.recordReportEngagement("report_open", paidReportId);
      assert.equal(sent.length, 0, "denied consent sends nothing");
      consent = "granted";
      auditClient.recordAggregateAuditEvent("audit_arrival");
      auditClient.recordAggregateAuditEvent("audit_arrival");
      auditClient.recordAggregateAuditEvent("audit_start");
      auditClient.recordAggregateAuditEvent("audit_start");
      reportClient.recordReportEngagement("tracker_saved", paidReportId);
      reportClient.recordReportEngagement("tracker_saved", paidReportId);
      reportClient.recordReportEngagement("tracker_saved", "invalid_token");
      assert.equal(sent.length, 3, "grant + per-tab deduplication for arrival, start and report");
      assert.equal(sent[0].url, "/api/audit-metric");
      assert.deepEqual(JSON.parse(sent[0].options.body), { event: "audit_arrival" });
      assert.equal(sent[1].url, "/api/audit-metric");
      assert.deepEqual(JSON.parse(sent[1].options.body), { event: "audit_start" });
      assert.equal(sent[2].url, "/api/report-metric");
      assert.deepEqual(JSON.parse(sent[2].options.body),
        { event: "tracker_saved", reportId: paidReportId });
      for (const item of sent) {
        assert.equal(item.options.credentials, "same-origin");
        assert.equal(item.options.referrerPolicy, "no-referrer");
        assert.equal(item.options.keepalive, true);
        assert.doesNotMatch(item.options.body, /insurance|email|answer|payment|amount/i);
      }
    } finally {
      for (const key of ["window", "localStorage", "sessionStorage", "fetch"]) {
        if (saved[key] === undefined) delete globalThis[key];
        else globalThis[key] = saved[key];
      }
    }
  });
  console.log("PASS " + tests + " endpoint and privacy behaviour checks");
} finally {
  if (original.vercel === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = original.vercel;
  if (original.enabled === undefined) delete process.env.SPENDSHIFT_AGGREGATE_METRICS_ENABLED;
  else process.env.SPENDSHIFT_AGGREGATE_METRICS_ENABLED = original.enabled;
}
