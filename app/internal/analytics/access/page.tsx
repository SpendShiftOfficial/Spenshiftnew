import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {analyticsFixtureEnabled,FIXTURE_ORIGIN} from "@/lib/analytics-v2/fixture-mode";
import {releaseCapabilities} from "@/lib/analytics-v2/release-config.mjs";
import OwnerAccess from "@/components/OwnerAccess";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"SpendShift owner access",robots:{index:false,follow:false}};
export default function OwnerAccessPage(){
 const fixture=analyticsFixtureEnabled()&&process.env.SPENDSHIFT_ANALYTICS_V2_OWNER_FIXTURE==="true";
 if(!fixture&&!releaseCapabilities(process.env).read)notFound();
 const url=fixture?FIXTURE_ORIGIN:process.env.SUPABASE_URL;
 const key=fixture?"sb_publishable_synthetic_fixture":process.env.SPENDSHIFT_ANALYTICS_AUTH_PUBLIC_KEY;
 if(!url||!key||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)||(!fixture&&url!=="https://isbmbayaorsfujexejku.supabase.co"))notFound();
 return <OwnerAccess authUrl={url} publicKey={key} fixture={fixture} importEnabled={fixture||process.env.SPENDSHIFT_ANALYTICS_V2_FINANCE_IMPORT_ENABLED==="true"}/>;
}
