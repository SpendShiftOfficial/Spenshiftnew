// ISOLATED ACTIVATION CANDIDATE ONLY: do not merge or deploy without separate owner approval.
// Production collection still requires the privacy, schema, WAF and collection environment gates
// AND the independently administered database gate. Finance imports require separate approval.
export const RELEASE_AUTHORIZED=true;
export const FINANCE_IMPORT_AUTHORIZED=false;
export const PREPARATION_AUTHORIZED=true;
export const NOTICE_VERSION='2026-11-v2';
export const PRODUCTION_ORIGIN='https://www.spendshift.com.au';
// Optional overrides are exclusively for isolated tests. Production reads default constants.
export function releaseCapabilities(env,approved=RELEASE_AUTHORIZED,preparation=PREPARATION_AUTHORIZED){
 const hosted=env.VERCEL_ENV==='production'&&env.VERCEL==='1'&&env.NEXT_PUBLIC_SITE_URL===PRODUCTION_ORIGIN;
 const production=hosted&&approved===true;
 const prepared=hosted&&(preparation===true||approved===true);
 const schema=prepared&&env.SPENDSHIFT_ANALYTICS_V2_SCHEMA_READY==='true';
 const privacy=production&&env.SPENDSHIFT_ANALYTICS_V2_PRIVACY_ENABLED==='true'&&env.SPENDSHIFT_ANALYTICS_V2_NOTICE_VERSION===NOTICE_VERSION;
 const reviewed=production&&schema&&privacy&&env.SPENDSHIFT_ANALYTICS_V2_WAF_REVIEWED==='true';
 return {privacy,collect:reviewed&&env.SPENDSHIFT_ANALYTICS_V2_COLLECTION_ENABLED==='true',read:schema&&env.SPENDSHIFT_ANALYTICS_V2_DASHBOARD_ENABLED==='true',prune:schema&&env.SPENDSHIFT_ANALYTICS_V2_RETENTION_ENABLED==='true'};
}
