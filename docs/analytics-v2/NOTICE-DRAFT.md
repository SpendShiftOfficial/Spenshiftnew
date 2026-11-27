# First-party-only privacy notice and settings — revised draft for independent approval

**27 November 2026 — NOT APPROVED OR EFFECTIVE.** No legal or production authorization.

## Active collection; new visitor

**Your privacy choices**

We use basic website statistics to improve your experience with SpendShift, not to build personal profiles. These statistics may continue if you reject optional cookies.

[Accept optional cookies] [Reject optional cookies] [Privacy settings]

Two equal-width optional action buttons; Privacy settings is visibly linked from the notice and contains the all-statistics opt-out. No vendor scripts. The short notice, two optional choices and Privacy settings control must be visibly presented in the viewport across two animation frames, in a visible, non-prerendering document, before new basic events. Once presented, the in-document gate permits existing approved events on eligible pages as the visitor scrolls or navigates. This check is an engineering safeguard, not proof of reading or consent. Confirm actual mobile/assistive technology behaviour and whether disclosure is legally sufficient. Policy links in the immediately accessible settings panel; service access is not conditional on consent.

## Disabled and prior-choice notices

When collection is disabled: "Basic statistics are off. Any choice here keeps them off until you explicitly enable them." Fallback also says optional audit/report counts are separate. A choice made while disabled records basicOff=true, even if optional is granted. Switching on collection later cannot reverse this. Earlier legacy consent is preserved; basic statistics stay off unless explicitly enabled. A choice before initial notice presentation does not authorise basic statistics. For previously informed active visitors, optional choices do not reverse a separate basic opt-out. On an ineligible page no basic events are collected. Explicit basic enablement is unavailable unless collection is enabled and the eligible notice has been presented.

## Expanded privacy settings

Basic statistics use limited daily counts to improve SpendShift, not individual browsing profiles. For website arrivals, the host's IP-based country estimate is reduced to Australia, outside Australia or unknown; no IP or detailed location is stored in analytics. Optional audit and report counts are separate. No Google Analytics, Clarity, Meta or TikTok tracking scripts run in this version. Your choices do not affect your savings check or purchased plan.

- Accurate basic and optional status, based on effective permission rather than an unvalidated stored value.
- Turn off basic statistics: only v2 events stop; previously permitted optional activity counts remain separate.
- Explicitly enable basic statistics: an affirmative, available action after notice presentation; never grants advertising or optional counts.
- Turn off basic statistics and reject optional cookies separately: visible in the one-step Privacy settings panel; stops both categories.
- Privacy Policy and Cookie Policy links.

## Failure handling and limitations

Any failed, silently lost or invalid choice write stops both categories in the affected document via a shared in-memory latch. A best-effort non-identifying sessionStorage restriction marker keeps the tab blocked after reload if it can be persisted. Verify actual writes and read-back before showing success. The warning says "Statistics stopped here. We could not save your choice. Please retry before reopening other tabs." Successful retries preserve restrictive choices; optional acceptance after failure cannot restore basic stats. Malformed stored choices fail closed; an explicit all-off action can replace a malformed preference if storage is readable and writable. Never clear saved audit answers to reset consent. No claim of persistence where browser writes fail, cross-device withdrawal or erasure of already-sent requests. Other active documents honour successful storage updates; if both storage mechanisms fail, current-document restriction is guaranteed by design, but future documents and other tabs may still have an older choice. Confirm actual testing before sign-off.

Final wording, purposes, legal applicability, collection basis and transition require written solicitor review. No publication or collection activation without separate owner approval.
