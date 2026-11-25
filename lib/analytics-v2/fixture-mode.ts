// Hard-disabled on any hosted deployment. No production adapter in this iteration.
export const FIXTURE_ORIGIN="http://127.0.0.1:3162";
export const BRIDGE_ORIGIN="http://127.0.0.1:3163";
export function analyticsFixtureEnabled(){
 return process.env.CI==="true" && process.env.SPENDSHIFT_ANALYTICS_V2_FIXTURE==="true" &&
 process.env.VERCEL_ENV==="preview" && !process.env.VERCEL &&
 process.env.NEXT_PUBLIC_SITE_URL===FIXTURE_ORIGIN &&
 process.env.SUPABASE_SERVICE_ROLE_KEY==="ci-placeholder-not-a-real-key" &&
 process.env.STRIPE_SECRET_KEY==="sk_test_ci_placeholder";
}
