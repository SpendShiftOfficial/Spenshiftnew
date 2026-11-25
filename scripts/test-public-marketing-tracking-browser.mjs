// Previous vendor-positive tests are superseded by the stricter first-party-only browser suite.
// Run the branch-only GitHub Actions first_party_only job, or its documented isolated localhost harness.
import {spawnSync} from 'node:child_process';
if(process.env.CI!=='true'||process.env.SPENDSHIFT_ANALYTICS_V2_FIXTURE!=='true'||process.env.NEXT_PUBLIC_SITE_URL!=='http://127.0.0.1:3162')throw Error('Isolated fixture configuration required');
const result=spawnSync('python',['scripts/analytics-v2-fixture/test-first-party-browser.py'],{stdio:'inherit'});
if(result.error)throw result.error;process.exitCode=result.status??1;
