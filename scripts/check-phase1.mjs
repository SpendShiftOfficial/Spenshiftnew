import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

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
    if (!request.startsWith(".")) throw new Error("Unexpected test dependency: " + request);
    return loadTs(path.resolve(path.dirname(filename), request));
  };
  new Function("require", "module", "exports", compiled)(localRequire, module, module.exports);
  return module.exports;
}

const { selectPersonalisationAreas } = loadTs("lib/personalisation-questions");
const { emptyRefinements, validateRefinements } = loadTs("lib/report-refinements");
const { analyseSavings } = loadTs("lib/savings-engine");
const audit = ["Never", "6–10", "Over 2 years ago", "Rarely", "Within 6 months", "Within 6 months", "Rarely", "Lower my bills"];

assert.deepEqual(selectPersonalisationAreas(audit), ["subscriptions", "insurance"], "Relevant categories only");

const details = validateRefinements({
  details: { subscriptionsMonthly: "120" },
  insurancePolicies: [
    { type: "Car", premium: "1800", paymentPeriod: "year" },
    { type: "Home or contents", premium: "240", paymentPeriod: "month" },
    { type: "Health", premium: "250", paymentPeriod: "month" },
  ],
});
const result = analyseSavings(audit, details);
assert.equal(result.opportunities.length, 2);
assert.equal(result.opportunities[0].scenarioSaving, 175);
assert.equal(result.opportunities[1].scenarioSaving, null);
assert.equal(result.opportunities[1].annualSpend, 7675);
assert.equal(result.estimatedAnnualScenario, 175, "Premiums are NOT counted as savings.");

const none = ["Never", "0–2", "Within 6 months", "Rarely", "Within 6 months", "Within 6 months", "Rarely", "Feel more financially in control"];
assert.deepEqual(selectPersonalisationAreas(none), []);
assert.equal(analyseSavings(none, emptyRefinements()).estimatedAnnualScenario, null);
assert.deepEqual(selectPersonalisationAreas([
  "Never", "0–2", "I don’t currently have insurance", "Rarely",
  "I don’t pay either of these bills", "I don’t pay these bills",
  "Rarely", "Save more money",
]), [], "Do not ask about bills the customer doesn't pay.");

const highHabits = ["Almost daily", "0–2", "Within 6 months", "Daily", "Within 6 months", "Within 6 months", "Rarely", "Save more money"];
const habits = analyseSavings(highHabits, validateRefinements({
  details: { takeawayOrder: "30", convenienceWeekly: "35" },
}));
assert.equal(habits.opportunities.find(o => o.area === "takeaway")?.scenarioSaving, 3125);
assert.equal(habits.opportunities.find(o => o.area === "convenience")?.scenarioSaving, 375);
assert.equal(habits.estimatedAnnualScenario, 3500);

const overlapping = analyseSavings(highHabits, validateRefinements({
  additionalArea: "unplanned", details: { takeawayOrder: "30", convenienceWeekly: "35", unplannedArea: "Online shopping" },
}));
assert.equal(overlapping.opportunities.find(o => o.area === "unplanned")?.scenarioSaving, null);
assert.equal(overlapping.estimatedAnnualScenario, habits.estimatedAnnualScenario);

assert.throws(() => validateRefinements({ details: { subscriptionsMonthly: "-4" } }), /non-negative/);
assert.throws(() => validateRefinements({ insurancePolicies: Array(7).fill({type:"Car"}) }), /six/);
assert.throws(() => validateRefinements({ additionalArea: "bank-passwords" }), /Invalid/);
assert.equal(validateRefinements({ details: { electricityBill: "0" } }).details.electricityBill, 0);
assert.equal(validateRefinements({ insurancePolicies: [{ type: "Health", premium: "100", paymentPeriod: "month" }] }).insurancePolicies[0].paymentPeriod, "month");

console.log("Phase 1 calculation and input-validation checks passed.");
