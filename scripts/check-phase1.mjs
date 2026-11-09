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

const { selectPersonalisationAreas, reasonForArea, previewProfiles } = loadTs("lib/personalisation-questions");
const { emptyRefinements, validateRefinements } = loadTs("lib/report-refinements");
const { analyseSavings } = loadTs("lib/savings-engine");
const { makeReportMarkdown } = loadTs("lib/report-writing");

const audit = previewProfiles["subscriptions-insurance"].answers;
assert.deepEqual(selectPersonalisationAreas(audit), ["subscriptions","insurance"]);
assert.equal(reasonForArea("subscriptions",audit), "You pay for 6–10 subscriptions.");

const allHigh = previewProfiles["all-seven"].answers;
const ranked = selectPersonalisationAreas(allHigh);
assert.equal(ranked.length,7,"Flag EVERY meaningful issue, not just top three.");
assert.deepEqual(new Set(ranked),new Set(["takeaway","subscriptions","insurance","convenience","phone","energy","unplanned"]));

const policies=[
  {type:"Car",premium:"1800",paymentPeriod:"year",renewal:"later"},
  {type:"Home or contents",premium:"240",paymentPeriod:"month",renewal:"soon"},
  {type:"Health",premium:"250",paymentPeriod:"month",renewal:"not_sure"},
];
const details=validateRefinements({
  details:{subscriptionsMonthly:"120",unusedSubscriptionChoice:"not_sure"},
  insurancePolicies:policies,
});
const result=analyseSavings(audit,details);
assert.deepEqual(result.opportunities.map(x=>x.area),["subscriptions","insurance"]);
assert.equal(result.opportunities[0].annualSpend,1440);
assert.equal(result.opportunities[1].annualSpend,7680);
assert.equal(result.opportunities[0].scenarioSaving,null);
assert.equal(result.opportunities[1].scenarioSaving,null);
assert.equal(result.estimatedAnnualScenario,null,"Bills are not money saved.");

const markdown=makeReportMarkdown(audit,details,result);
assert.match(markdown,/You pay \$120 each month/);
assert.match(markdown,/Car: \$1,800 per year/);
assert.match(markdown,/Health: \$250 per month/);
assert.match(markdown,/Home or contents: \$240 per month/);
assert.doesNotMatch(markdown,/Save \$4,276|Annual Savings: \$1,300/);
assert.ok(markdown.length<2600,"Keep the two-area report short.");

const unused=validateRefinements({
  details:{subscriptionsMonthly:"120",unusedSubscriptionChoice:"yes",unusedSubscriptionName:"Video app",unusedSubscriptionMonthly:"15"},
});
const subscriptionResult=analyseSavings(audit,unused);
assert.equal(subscriptionResult.opportunities[0].scenarioSaving,180);
assert.equal(subscriptionResult.estimatedAnnualScenario,180);
assert.match(makeReportMarkdown(audit,unused,subscriptionResult),/could save \$180 a year/);
assert.equal(analyseSavings(audit,validateRefinements({
  details:{subscriptionsMonthly:"120",unusedSubscriptionChoice:"no"}
})).estimatedAnnualScenario,null,"If all services are used, don't tell people to cancel one.");

const improved=validateRefinements({
  details:{
    takeawayOrder:"120",takeawayOrdersPerWeek:"7",takeawaySwapPerWeek:"3",takeawayReplacementCost:"40",
    convenienceWeekly:"100",convenienceGoalWeekly:"70",
    subscriptionsMonthly:"70",unusedSubscriptionChoice:"no",
    unplannedArea:"Online shopping",shoppingTrigger:"Social media",
  },
  insurancePolicies:policies,
});
const all=analyseSavings(allHigh,improved);
assert.equal(all.opportunities.length,7);
assert.deepEqual(all.opportunities.slice(0,2).map(x=>x.area), ["takeaway","convenience"], "Priced customer goals should be first when audit priority is equally high.");
assert.equal(all.opportunities.find(x=>x.area==="takeaway")?.annualSpend,43680);
assert.equal(all.opportunities.find(x=>x.area==="takeaway")?.scenarioSaving,12480,
  "Net takeaway goal subtracts food-at-home costs for same people.");
assert.equal(all.opportunities.find(x=>x.area==="convenience")?.scenarioSaving,1560,
  "Weekly budget differences count only as goals.");
assert.equal(all.opportunities.find(x=>x.area==="insurance")?.scenarioSaving,null);
assert.equal(all.opportunities.find(x=>x.area==="unplanned")?.scenarioSaving,null,
  "Never double-count unplanned shopping.");
assert.equal(all.estimatedAnnualScenario,14040);
assert.match(all.opportunities.find(x=>x.area==="unplanned")?.firstAction??"",/shopping ads/);
assert.match(makeReportMarkdown(allHigh,improved,all),/## 7\. Power and gas/);

const missingCost=analyseSavings(allHigh,validateRefinements({
  details:{takeawayOrder:"120",takeawayOrdersPerWeek:"7",takeawaySwapPerWeek:"3"},
}));
assert.equal(missingCost.opportunities.find(x=>x.area==="takeaway")?.scenarioSaving,null);
const higherReplacement=analyseSavings(allHigh,validateRefinements({
  details:{takeawayOrder:"120",takeawayOrdersPerWeek:"7",takeawaySwapPerWeek:"3",takeawayReplacementCost:"135"},
}));
assert.equal(higherReplacement.opportunities.find(x=>x.area==="takeaway")?.scenarioSaving,null);
const overlap=analyseSavings(allHigh,validateRefinements({
  details:{takeawayOrder:"120",takeawayOrdersPerWeek:"7",takeawaySwapPerWeek:"3",takeawayReplacementCost:"40",shoppingTrigger:"Sales or deals"},
}));
assert.equal(overlap.opportunities.find(x=>x.area==="unplanned")?.scenarioSaving,null);
assert.equal(overlap.estimatedAnnualScenario,12480);

assert.throws(()=>validateRefinements({details:{takeawayOrdersPerWeek:"4",takeawaySwapPerWeek:"5"}}),/can't swap more/);
assert.throws(()=>validateRefinements({details:{takeawayOrdersPerWeek:"2.5"}}),/whole number/);
assert.throws(()=>validateRefinements({details:{takeawayOrdersPerWeek:"22"}}),/21 or less/);
assert.throws(()=>validateRefinements({details:{convenienceWeekly:"50",convenienceGoalWeekly:"60"}}),/no higher/);
assert.throws(()=>validateRefinements({details:{unusedSubscriptionChoice:"no",unusedSubscriptionMonthly:"20"}}),/Choose Yes/);
assert.throws(()=>validateRefinements({details:{subscriptionsMonthly:"70",unusedSubscriptionMonthly:"75"}}),/cannot cost more/);
assert.throws(()=>validateRefinements({details:{subscriptionsMonthly:"-2"}}),/non-negative/);
assert.throws(()=>validateRefinements({insurancePolicies:Array(7).fill({type:"Car"})}),/six/);
assert.throws(()=>validateRefinements({additionalArea:"bank-passwords"}),/Invalid/);
assert.equal(validateRefinements({details:{electricityBill:"0"}}).details.electricityBill,0);
assert.equal(validateRefinements({insurancePolicies:[{type:"Health",premium:"100",paymentPeriod:"month",renewal:"soon"}]}).insurancePolicies[0].renewal,"soon");
assert.equal(emptyRefinements().details.takeawayOrdersPerWeek,null);

const none=["Never","0–2","Within 6 months","Rarely","Within 6 months","Within 6 months","Rarely","Feel more financially in control"];
assert.deepEqual(selectPersonalisationAreas(none),[]);
assert.equal(analyseSavings(none,emptyRefinements()).estimatedAnnualScenario,null);
assert.deepEqual(selectPersonalisationAreas([
  "Never","0–2","I don’t currently have insurance","Rarely",
  "I don't pay either of these bills","I don't pay these bills","Rarely","Save more money",
]),[]);

const freePage=fs.readFileSync("app/results/page.tsx","utf8");
assert.match(freePage,/We don't know how much you can save yet/);
assert.doesNotMatch(freePage,/Indicative Savings\s+Range|money\(totalMax\)|Total Recoverable Cash/);
const questions=fs.readFileSync("app/personalise/PersonaliseClient.tsx","utf8");
assert.match(questions,/Do you pay for a subscription you no longer use\?/);
assert.match(questions,/How many could you replace with food from home\?/);
assert.match(questions,/Want to check another bill\?/);
assert.doesNotMatch(questions,/Did we miss an important area\?/);
assert.doesNotMatch(questions,/Skip questions and make my plan now/);
const success=fs.readFileSync("app/success/page.tsx","utf8");
assert.match(success,/router\.replace\("\/personalise\?session_id="/);
assert.doesNotMatch(success,/mode === "choice"/);
const paidPage=fs.readFileSync("app/report/[id]/SimpleSavingsReport.tsx","utf8");
assert.match(paidPage,/Your other/);
assert.match(paidPage,/more\.map\(/,"All additional relevant areas must appear.");
assert.match(paidPage,/same people/i);
assert.match(paidPage,/free government/);
assert.doesNotMatch(paidPage,/Need help\? Copy a message|30-Day Action Plan|Executive Summary/);

console.log("Phase 1 tests pass: all seven areas, guided paid flow, exact net savings, no invented totals, simple report.");
