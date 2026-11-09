import {NextResponse} from "next/server";
import {supabaseAdmin} from "@/lib/supabase";
import {cleanDraft,prepareDraft} from "@/lib/plan-draft";
import {analyseSavings} from "@/lib/savings-engine";
import {makeReportMarkdown} from "@/lib/report-writing";
import {readJson,InputError,privateHeaders} from "@/lib/request-safety";

export const dynamic="force-dynamic";
const reportIdPattern=/^rpt_[A-Za-z0-9_-]{8,72}$/;
type Row={
 id:string;stripe_session_id:string|null;answers:string[];
 refinements:unknown;report:string;savings_summary:Record<string,unknown>;
};
export async function POST(req:Request){
 try{
  const body=await readJson(req,30000);
  const reportId=body.reportId;
  const revision=body.revision;
  if(typeof reportId!=="string"||!reportIdPattern.test(reportId))
   throw new InputError("The private report link is not valid.",400);
  if(typeof revision!=="number"||!Number.isInteger(revision)||revision<1||revision>6)
   throw new InputError("Please reopen your saved plan before editing.",409);

  // The private report ID is a random 192-bit bearer link. Sharing that link
  // grants edit access. No Stripe payment URL is sent to the browser.
  const {data,error}=await supabaseAdmin
   .from("reports")
   .select("id,stripe_session_id,answers,refinements,report,savings_summary")
   .eq("id",reportId).maybeSingle();
  if(error)throw new Error("Could not load report");
  if(!data||!data.stripe_session_id)throw new InputError("This report could not be found.",404);
  const saved=data as Row;
  const summary=saved.savings_summary||{};
  const priorRevision=typeof summary.edit_revision==="number"?summary.edit_revision:1;
  if(Number(summary.version)<3)throw new InputError("This older report needs help from support to change.",409);
  if(priorRevision!==revision)throw new InputError("Your plan changed in another tab. Reload it before saving.",409);
  if(priorRevision>=6)throw new InputError("This plan has reached its online correction limit. Contact SpendShift for help.",409);

  let draft,refinements;
  try{
   draft=cleanDraft(body.draft);
   refinements=prepareDraft(draft); // validates amounts and free/paid contradictions
  }catch(e){throw new InputError(e instanceof Error?e.message:"Please check the updated answers.");}
  const analysis=analyseSavings(draft.answers,refinements);
  const report=makeReportMarkdown(draft.answers,refinements,analysis);
  const archive=Array.isArray(summary.edit_history)?summary.edit_history.slice(-3):[];
  const now=new Date().toISOString();
  // Keep prior versions for the customer-support audit trail. Never include
  // the payment session ID or customer email in this archived snapshot.
  const previous={
   revision:priorRevision,changed_at:now,answers:saved.answers,
   refinements:saved.refinements,report:saved.report,
   summary:{version:summary.version,opportunities:summary.opportunities,
    estimatedAnnualScenario:summary.estimatedAnnualScenario}
  };
  const newSummary={
   version:4,edit_revision:priorRevision+1,updated_at:now,
   estimatedAnnualScenario:analysis.estimatedAnnualScenario,
   firstAction:analysis.opportunities[0]?.firstAction||"Review a bill or regular payment.",
   opportunities:analysis.opportunities,disclaimer:analysis.disclaimer,
   edit_history:[...archive,previous]
  };
  const {data:success,error:saveError}=await supabaseAdmin.rpc("update_spendshift_report_cas",{
   p_report_id:reportId,p_expected_revision:revision,p_answers:draft.answers,
   p_refinements:refinements,p_report:report,p_savings_summary:newSummary
  });
  if(saveError)throw new Error("Report edit failed");
  if(success!==true)throw new InputError("Your plan changed elsewhere. Reload before saving.",409);
  return NextResponse.json({saved:true,reportId,revision:priorRevision+1},
    {headers:privateHeaders});
 }catch(e){
  const userError=e instanceof InputError;
  return NextResponse.json({error:userError?e.message:"We couldn't update your plan. Your old report is safe. Please try again."},
   {status:userError?e.status:503,headers:privateHeaders});
 }
}
