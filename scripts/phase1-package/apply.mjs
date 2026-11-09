import trust from './trust.mjs';
import marketing from './marketing.mjs';
import journey from './journey.mjs';
import plan from './plan.mjs';
import polish from './polish.mjs';
import tests from './tests.mjs';
import {edit,replace} from './io.mjs';
for(const [name,run] of Object.entries({trust,marketing,journey,plan,polish,tests})){run();console.log('Prepared '+name);}
edit('scripts/check-phase1-browser.mjs',s=>replace(s,"import {chromium} from 'playwright';","import {createRequire} from 'node:module';\nconst {chromium}=createRequire(process.env.PLAYWRIGHT_INSTALL_PATH||process.cwd()+'/package.json')('playwright');"));
console.log('Ten-improvement package prepared. Tests must pass before any source is published.');
