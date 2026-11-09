import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {supabaseAdmin} from "@/lib/supabase";
import EditReportClient from "./EditReportClient";
import Header from "@/components/Header";
export const metadata:Metadata={
 title:"Correct my savings plan",
 robots:{index:false,follow:false}
};
export default async function ReportCorrection({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^rpt_[A-Za-z0-9_-]{8,72}$/.test(id))notFound();
 const {data,error}=await supabaseAdmin.from("reports")
  .select("id,stripe_session_id,answers,refinements,savings_summary").eq("id",id).maybeSingle();
 if(error||!data)notFound();
 const summary=data.savings_summary as Record<string,unknown>|null;
 if(!data.stripe_session_id||!summary||Number(summary.version)<3){
  return <><Header simple/><main style={{maxWidth:680,margin:"60px auto",padding:"0 20px"}}>
   <h1>This plan needs help to change</h1>
   <p>Please contact info@spendshift.com.au with your purchase email. We won't charge you again for a correction.</p>
   <a href={"/report/"+encodeURIComponent(id)}>Back to my plan</a>
  </main></>;
 }
 const revision=typeof summary.edit_revision==="number"?summary.edit_revision:1;
 return <EditReportClient reportId={id} revision={revision} answers={data.answers||[]} refinements={data.refinements}/>;
}
