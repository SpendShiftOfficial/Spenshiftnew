// No release has been authorized. Removing this source lock is a separate, reviewed PR.
export const RELEASE_AUTHORIZED=false;
export const NOTICE_VERSION='2026-11-v2';
export const PRODUCTION_ORIGIN='https://www.spendshift.com.au';
// The second argument is injected only by tests or a reviewed server-side release.
export function releaseCapabilities(env,approved=RELEASE_AUTHORIZED){
 const production=approved===true&&env.VERCEL_ENV==='production'&&env.VERCEL==='1'&&env.NEXT_PUBLIC_SITE_URL===PRODUCTION_ORIGIN;
 const schema=production&&env.SPENDSHIFT_ANALYTICS_V2_SCHEMA_READY==='true';
 const privacy=production&&env.SPENDSHIFT_ANALYTICS_V2_PRIVACY_ENABLED==='true'&&env.SPENDSHIFT_ANALYTICS_V2_NOTICE_VERSION===NOTICE_VERSION;
 const reviewed=schema&&privacy&&env.SPENDSHIFT_ANALYTICS_V2_WAF_REVIEWED==='true';
 return {privacy,collect:reviewed&&env.SPENDSHIFT_ANALYTICS_V2_COLLECTION_ENABLED==='true',read:schema&&env.SPENDSHIFT_ANALYTICS_V2_DASHBOARD_ENABLED==='true',prune:schema&&env.SPENDSHIFT_ANALYTICS_V2_RETENTION_ENABLED==='true'};
}
