

# Tier-2 Rollout: ExitIntentModal Expansion

## What Tier-2 Covers

Tier-2 has **two parts**:

### Part A: Fix the `hasConverted` bug on 7 existing pages
These pages already have ExitIntentModal but use incorrect suppression logic (the same bug we just fixed on the pillar pages). They use `!!sessionData.leadId`, `isSubmitting`, `isModalOpen`, or `!!userEmail` — none of which reflect the true global lead identity.

| Page | Current (broken) | Fix |
|------|------------------|-----|
| CostCalculator | `!!sessionData.leadId` | `hasIdentity` via `useLeadIdentity` |
| RiskDiagnostic | `!!sessionData.leadId` | `hasIdentity` via `useLeadIdentity` |
| RealityCheck | `!!sessionData.leadId` | `hasIdentity` via `useLeadIdentity` |
| KitchenTableGuide | `isSubmitting` | `hasIdentity` via `useLeadIdentity` |
| InsuranceSavingsGuide | `isSubmitting` | `hasIdentity` via `useLeadIdentity` |
| SalesTacticsGuide | `isModalOpen` | `hasIdentity` via `useLeadIdentity` |
| FairPriceQuiz | `!!userEmail` | `hasIdentity` (hook already imported) |
| SpecChecklistGuide | custom localStorage flag | `hasIdentity` via `useLeadIdentity` |

### Part B: Add ExitIntentModal to 7 new pages
These educational/tool pages currently have zero exit-intent capture.

| Page | sourceTool | resultSummary | Risk Analysis |
|------|-----------|---------------|---------------|
| Defense (`/defense`) | `"fast-win"` (defensive content) | "Quote Defense Checklist" | No conflict — simple content page with ConsultationBookingModal only |
| Evidence (`/evidence`) | `"evidence-locker"` | "Evidence Locker Case Studies" | Has LeadCaptureModal + ConsultationBookingModal, but exit intent only fires for unconverted users — no overlap |
| ClaimSurvival (`/claim-survival`) | `"claim-survival-kit"` | "Insurance Claim Survival Kit" | Has LeadCaptureModal gate for uploads. Exit intent catches users who browse but never upload — complementary |
| Expert (`/expert`) | `"expert-system"` | "Window Expert AI Consultation" | AI chat page; already imports useLeadIdentity. No conflict |
| FastWin (`/fast-win`) | `"fast-win"` | "Fastest Win Strategy" | Has LeadCaptureModal for results. Exit intent catches users who leave before completing — complementary |
| Intel (`/intel`) | `"intel-library"` | "Intelligence Library Resources" | Hub page linking to guides. Catches browsers who don't click through |
| Roleplay (`/roleplay`) | `"roleplay"` | "Sales Pressure Roleplay Simulator" | AI game page. Catches users who leave mid-game or before starting |

**Pages deliberately excluded from Tier-2:**
- **Consultation** (`/consultation`) — This IS the conversion page. Adding an exit-intent to catch people leaving a booking form could feel aggressive and counterproductive.

## Conflict Analysis

**No new errors will be introduced because:**
1. `useLeadIdentity` is a pure read hook from `useSessionData` context — already available on all pages wrapped in `PublicLayout`
2. ExitIntentModal already handles its own trigger prerequisites (10s dwell, 30% scroll) and sessionStorage suppression
3. The modal co-exists with SilentAllyInterceptor via shared `gauntlet_exit_intent_*` sessionStorage keys
4. Pages with existing modals (LeadCaptureModal, ConsultationBookingModal) won't conflict because ExitIntentModal only fires for unconverted users, and those other modals are user-initiated (button clicks)

**One edge case worth noting:** On SpecChecklistGuide, the current `hasConverted` uses a localStorage flag (`spec_checklist_converted`) which persists across sessions. Switching to `useLeadIdentity` (session-based) means a returning user who converted last session but has no `leadId` in the current session could see the exit modal again. This is actually **desirable** — it's a re-engagement opportunity.

## Technical Implementation

For each file, the same 3-step pattern:

1. Add import: `import { useLeadIdentity } from '@/hooks/useLeadIdentity'` and (if missing) `import { ExitIntentModal } from '@/components/authority'`
2. Add hook call: `const { hasIdentity } = useLeadIdentity()` inside the component
3. Add or update the component: `<ExitIntentModal sourceTool="..." hasConverted={hasIdentity} resultSummary="..." />`

**Total files modified: 15** (8 bug fixes + 7 new additions)

No new dependencies, no schema changes, no edge function changes, no CSS/layout modifications.

