# Isolated activation candidate — explicit approval required

This candidate changes the source collection gate for a future reviewed release; it is not authority to merge, deploy or collect. Main remains the dashboard/retention-only release. Finance import remains separately source-locked.

## Preparation and approval
- Confirm exact candidate CI success; keep production flag and database control false and production POST deny in place.
- Confirm current backup and retention operation, owner MFA and no data until activation.
- Review current rate limiting entitlement, usage headroom and any possible incremental usage costs. A disabled rule does not protect or meter active traffic; test the exact enabled rate-limit policy with collection off after owner confirms allowance/usage permission. Keep legacy rule unchanged. Abort if 429 is not observed within a bounded test; reapply exact POST deny and verify.
- Keep preview quarantine in place. Do not reopen or destroy historical deployments or rotate credentials without a reviewed continuity plan. Verify retired credentials or complete controlled revocation/rotation if necessary; access containment is not erasure.
- Keep published policies and controls intact. Review data minimisation and any contractual/legal requirements. Do not activate imports, advertising pixels or other third-party trackers.

## Controlled rollout (only after separate explicit owner approval)
1. Verify release candidate and backup, production target and all flags. Deploy with schema, dashboard, retention and revised privacy notice enabled, collection flag false, DB gate false, POST deny in place. Verify visible disabled-mode notice and preserved old choices; test a clean browser and Instagram in-app route, separate basic-statistics off and optional rejection, audit and results, no external tracking requests, zero new rows. Earlier choices made during disabled mode require explicit opt-in. Avoid purchases.
2. Confirm rate-limit costs/allowance and exact rule (60 requests/IP/60 seconds, 429). With DB and collection still off, temporarily replace production POST deny with approved rate limit and run bounded invalid empty requests from an isolated test client. Verify 204 below threshold (disabled handler), 429 above, no customer fields or database rows. If unsuccessful restore deny immediately. Preview quarantine and existing rate limit remain unchanged.
3. With approval, set WAF reviewed and collection enabled environment flags and deploy the exact tested candidate. DB gate stays false until final smoke and privacy checks succeed. Note client may attempt events while DB gate is off; verify none accepted. Turn the DB gate on only as the final approved step. Use fresh browser, test one controlled visit and opt-out; verify aggregate-only counts, no unintended writes and no vendor traffic. Small-count suppression may show N/A. Do not enable finance import. Pause/avoid paid traffic expansion until verified.
4. If any unexpected writes, failures, privacy issues, abuse or cost problems: immediately restore the DB gate false and production POST deny, then set collection environment flag false and redeploy the tested candidate with revised privacy mode retained. Keep dashboard, retention, and preview quarantine. Never roll back to a third-party-tracker-enabled deployment. Recheck zero additional v2 rows after stop; do not delete previously accepted observations or customer records.

## Evidence
- Live disabled endpoint POST rejection and unauthenticated owner denial: isolated public readiness probe, workflow run 45921829094.
- Latest dashboard/retention production release regression: workflow run 45916509391.
- Activate only when all outstanding tests and authorisations have been recorded. No background activation.
