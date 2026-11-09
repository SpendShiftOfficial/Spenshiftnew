import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
function loadTs(file) {
  const filename = path.resolve(file.endsWith(".ts") ? file : file + ".ts");
  if (cache.has(filename)) return cache.get(filename).exports;
  const code = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  cache.set(filename, module);
  const localRequire = (request) => {
    if (!request.startsWith(".")) return nativeRequire(request);
    return loadTs(path.resolve(path.dirname(filename), request));
  };
  new Function("require", "module", "exports", compiled)(localRequire, module, module.exports);
  return module.exports;
}

const { selectPersonalisationAreas, reasonForArea } = loadTs("lib/personalisation-questions");
const { emptyRefinements, validateRefinements } = loadTs("lib/report-refinements");
const { analyseSavings } = loadTs("lib/savings-engine");
const { makeReportMarkdown } = loadTs("lib/report-writing");

const audit = ["Never", "6–10", "Over 2 years ago", "Rarely", "Within 6 months", "Within 6 months", "Rarely", "Lower my bills"];
assert.deepEqual(selectPersonalisationAreas(audit), ["subscriptions", "insurance"]);
assert.equal(reasonForArea("subscriptions", audit), "You pay for 6–10 subscriptions.");

const details = validateRefinements({
  details: { subscriptionsMonthly: "120" },
  insurancePolicies: [
    { type: "Car", premium: "1800", paymentPeriod: "year" },
    { type: "Home or contents", premium: "240", paymentPeriod: "month" },
    { type: "Health", premium: "250", paymentPeriod: "month" },
  ],
});
const base = analyseSavings(audit, details);
assert.equal(base.opportunities.length, 2);
assert.deepEqual(base.opportunities.map(x => x.area), ["subscriptions", "insurance"]);
assert.equal(base.opportunities[0].annualSpend, 1440);
assert.equal(base.opportunities[1].annualSpend, 7680);
assert.equal(base.opportunities[0].scenarioSaving, null, "Never guess an unused subscription price.");
assert.equal(base.opportunities[1].scenarioSaving, null, "Insurance is not an established saving.");
assert.equal(base.estimatedAnnualScenario, null, "Known monthly costs do not equal confirmed savings.");

const markdown = makeReportMarkdown(audit, details, base);
assert.match(markdown, /You pay \$120 per month/);
assert.match(markdown, /Car: \$1,800 per year/);
assert.match(markdown, /Home or contents: \$240 per month/);
assert.match(markdown, /Health: \$250 per month/);
assert.match(markdown, /We don't know how much you'll save yet/);
assert.doesNotMatch(markdown, /\$175\/year|\$4,276\/year/);
assert.ok(markdown.length < 2400, "Customer report must not be a long repetitive essay.");

const unused = validateRefinements({
  details: { subscriptionsMonthly: "120", unusedSubscriptionMonthly: "15" },
  insurancePolicies: [{ type: "Car", premium: "1800", paymentPeriod: "year" }],
});
const withUnused = analyseSavings(audit, unused);
assert.equal(withUnused.opportunities[0].scenarioSaving, 180);
assert.equal(withUnused.opportunities[1].scenarioSaving, null);
assert.equal(withUnused.estimatedAnnualScenario, 180, "A named unused charge can produce a conditional saving.");
assert.match(makeReportMarkdown(audit, unused, withUnused), /could keep \$180 a year/);

assert.throws(
  () => validateRefinements({ details: { subscriptionsMonthly: "120", unusedSubscriptionMonthly: "150" } }),
  /cannot cost more/
);
assert.throws(() => validateRefinements({ details: { subscriptionsMonthly: "-4" } }), /non-negative/);
assert.throws(() => validateRefinements({ insurancePolicies: Array(7).fill({ type: "Car" }) }), /six/);
assert.throws(() => validateRefinements({ additionalArea: "bank-passwords" }), /Invalid/);
assert.equal(validateRefinements({ details: { electricityBill: "0" } }).details.electricityBill, 0);
assert.equal(validateRefinements({ insurancePolicies: [{ type: "Health", premium: "100", paymentPeriod: "month" }] }).insurancePolicies[0].paymentPeriod, "month");

const none = ["Never", "0–2", "Within 6 months", "Rarely", "Within 6 months", "Within 6 months", "Rarely", "Feel more financially in control"];
assert.deepEqual(selectPersonalisationAreas(none), [], "Don't invent money leaks to fill a questionnaire.");
assert.equal(analyseSavings(none, emptyRefinements()).estimatedAnnualScenario, null);
assert.deepEqual(selectPersonalisationAreas([
  "Never", "0–2", "I don’t currently have insurance", "Rarely",
  "I don't pay either of these bills", "I don't pay these bills",
  "Rarely", "Save more money",
]), [], "Don't recommend areas the customer does not pay for.");

const highHabits = ["Almost daily", "0–2", "Within 6 months", "Daily", "Within 6 months", "Within 6 months", "Rarely", "Save more money"];
const habits = analyseSavings(highHabits, validateRefinements({
  details: { takeawayOrder: "30", convenienceWeekly: "35" },
}));
assert.deepEqual(habits.opportunities.map(x => x.area), ["takeaway", "convenience"]);
assert.equal(habits.opportunities.find(x => x.area === "takeaway")?.annualSpend, null, "Do not assume exact weekly order counts from a range.");
assert.equal(habits.opportunities.find(x => x.area === "convenience")?.annualSpend, 1820);
assert.equal(habits.estimatedAnnualScenario, null, "Food costs and repeated spending are NOT net savings.");

const extra = analyseSavings(highHabits, validateRefinements({
  additionalArea: "unplanned",
  details: { takeawayOrder: "30", convenienceWeekly: "35", unplannedArea: "Online shopping" },
}));
assert.deepEqual(extra.opportunities.map(x => x.area), ["takeaway", "convenience", "unplanned"]);
assert.equal(extra.opportunities[2].scenarioSaving, null, "Don't count unplanned shopping twice.");
assert.equal(extra.estimatedAnnualScenario, null);

const household = ["Never", "0–2", "Within 6 months", "Rarely", "Over a year ago", "Over a year ago", "Rarely", "Lower my bills"];
assert.deepEqual(selectPersonalisationAreas(household), ["phone", "energy"]);
assert.equal(analyseSavings(household, validateRefinements({
  details: { internetMonthly: 79.95, mobileMonthly: 44.9, electricityBill: 425.50, electricityPeriod: "quarter" },
})).estimatedAnnualScenario, null, "Paid bills are not automatically cheaper elsewhere.");

// Keep the customer-facing promises aligned between free and paid.
const freePage = fs.readFileSync("app/results/page.tsx", "utf8");
assert.match(freePage, /We don't know how much you can save yet/);
assert.doesNotMatch(freePage, /Indicative Savings\s+Range|money\(totalMax\)|Total Recoverable Cash|Save.*per year/);

const questionsPage = fs.readFileSync("app/personalise/PersonaliseClient.tsx", "utf8");
assert.match(questionsPage, /Want to check another bill\?/);
assert.doesNotMatch(questionsPage, /Did we miss an important area\?/);
assert.match(questionsPage, /Skip anything you don't know/);

const simpleReportPage = fs.readFileSync("app/report/[id]/SimpleSavingsReport.tsx", "utf8");
assert.match(simpleReportPage, /Your 3 things to do/);
assert.match(simpleReportPage, /We haven't checked live prices/);
assert.doesNotMatch(simpleReportPage, /Conditional savings scenario|Executive Summary|30-Day Action Plan/);

console.log("Phase 1 checks passed: rankings, honesty, exact bills, named subscriptions, no overlap, short report and clear UI.");
