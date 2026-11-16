"use client";

import { useEffect } from "react";
import { recordReportEngagement } from "@/lib/first-party-report";

/** No visual UI, tracking script, cookie or report content collection. */
export default function ReportEngagementOpen({ reportId }: { reportId: string }) {
  useEffect(() => { recordReportEngagement("report_open", reportId); }, [reportId]);
  return null;
}
