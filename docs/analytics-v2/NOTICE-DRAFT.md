# First-party-only privacy notice and settings — draft for approval

**25 November 2026 — NOT APPROVED OR EFFECTIVE.**

The approved candidate UI is in components/BasicAnalytics.tsx. It is an in-flow notice, not a blocking overlay. For disabled v2 mode the fallback consent banner explains optional first-party counts only.

## Proposed notice

**Your privacy choices**

We use limited first-party statistics to improve SpendShift without creating individual browsing profiles. No third-party analytics or advertising pixels run in this version. Basic statistics are separate from the optional audit and report activity counts. You can turn either off without affecting your savings check or purchased plan.

- Accept optional — grants only the existing first-party audit/report counts, never a vendor tracker.
- Reject optional — denies only those counts; basic-statistics choice remains independent.
- Turn off basic statistics — stops new v2 events, not separately permitted optional counts.
- Explicitly enable basic statistics — affirmative action required for a browser with an earlier cookie choice; does not grant optional counts.
- Turn off all statistics — withdraws both first-party categories.
- Privacy Policy and Cookie Policy links.

For earlier choices: “Your earlier privacy choice is preserved. Basic statistics remain off unless you explicitly enable them under this notice.” Basic stats off when collection unavailable. Optional choices do not affect service. Preserve prior valid permission only within its previous first-party scope. No new legacy vendor grant. Show test-only status in fixture and draft status on proposed legal pages. No vendor cookie removal or historical-data deletion promise.

Privacy mode remains independent of the basic collection switch. Do not publish until solicitor approval, owner release approval and the staged tracker-free cutover are confirmed.
