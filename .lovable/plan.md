

# Phase 6: Budget Kill Switch, Autopilot, forwardRef Fixes, and Certification Badge

## Summary

This build delivers four things in one pass:

1. **forwardRef Fixes** -- Wrap `SystemHealthGauge` (and any other warning-producing components) in `React.forwardRef` to eliminate console warnings.
2. **Step 9: Budget Protection Kill Switch** -- Add a `critical` health state triggered when Lost Lead rate exceeds 15%. Renders a full-width red alert banner with links to pause ad campaigns.
3. **Step 10: Truth Engine Autopilot** -- Cross-references Parity, Attribution, and Handshake data to generate actionable "Proposed Fix" cards with copy-to-clipboard instructions.
4. **Certification Badge** -- A `TruthEngineCertification` footer at the bottom of the page proving all 10 steps are active, with a "Verified Ad Spend" counter.

Zero database changes. Zero new edge functions.

---

## Files to Change

| Action | File | What Changes |
|--------|------|-------------|
| MODIFY | `src/hooks/useDataLayerMonitor.ts` | Add `critical` to SystemHealth type; add `lostLeadRate`, `isCritical`, `intentDistribution`, and `autopilotInsights` exports |
| MODIFY | `src/pages/admin/TrackingTest.tsx` | Add BudgetAlertBanner, AutopilotCard, TruthEngineCertification components; add `critical` config to SystemHealthGauge; fix forwardRef warnings |
| MODIFY | `src/components/debug/EMQValidatorOverlay.tsx` | Wrap EMQValidatorOverlayInner in React.forwardRef (if warning originates here) |

---

## Technical Details

### 1. Hook Changes (`useDataLayerMonitor.ts`)

**A. Expand SystemHealth:**
```typescript
export type SystemHealth = 'idle' | 'healthy' | 'warning' | 'conflict' | 'critical';
```

**B. Kill-switch logic (computed after handshake updates):**
- Look at the last 10 handshake results
- Count entries with `status === 'lost'`
- If lost / total >= 0.15, set health to `critical` (overrides all other states)
- Health reason: "BUDGET ALERT: X% of recent leads are not reaching the database. Pause campaigns immediately."

**C. New exports added to hook return:**
- `lostLeadRate: number` (0-100)
- `isCritical: boolean`
- `intentDistribution: { hot: number; warm: number; cold: number }` (computed from liveEvents)
- `autopilotInsights: AutopilotInsight[]`

**D. AutopilotInsight type and gap analysis:**
```typescript
interface AutopilotInsight {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  proposedFix: string;
  copyText: string;
}
```

Five detection rules:
1. **Parity Gap** -- browserOnlyCount > 0: "Server Not Receiving Browser Events"
2. **High Ad-Blocker Impact** -- >50% of conversion events have broken/repaired attribution
3. **Cookie Mismatch** -- any parity result has cookieMatch === false
4. **Bot Traffic** -- any events with intentScore === 1
5. **Lost Lead Pattern** -- 2+ consecutive lost handshakes

### 2. UI Components (`TrackingTest.tsx`)

**A. SystemHealthGauge -- add `critical` config:**
```typescript
critical: {
  bg: 'bg-red-700/20 border-red-700/40',
  icon: <AlertOctagon className="h-6 w-6 text-red-600 animate-pulse" />,
  defaultMsg: '',
}
```
Label renders as "CRITICAL" with pulsing styling.

**B. BudgetAlertBanner (new component):**
- Full-width red banner, only renders when `systemHealth === 'critical'`
- Pulsing border, `Siren` or `AlertOctagon` icon
- Headline: "BUDGET PROTECTION ALERT"
- Two buttons: "Pause Google Ads" (opens ads.google.com) and "Pause Meta Ads" (opens business.facebook.com/adsmanager)
- "Copy Emergency Alert" button that copies a pre-formatted incident summary to clipboard

**C. AutopilotCard (new component):**
- Header: "Truth Engine Autopilot" with `Cpu` icon
- Each insight renders as an expandable item with severity icon
- "Copy Fix Request" button per insight copies the `copyText` to clipboard
- Summary line: "X insight(s) detected"

**D. TruthEngineCertification (new component):**
- Renders at the very bottom of the page, below test controls
- Centered badge with `CheckCircle2` icon
- Text: "Truth Engine v1.0: All 10 Steps of the Deduplication and Attribution Pipeline are Active."
- Verified spend counter: `handshakeResults.filter(h => h.status === 'confirmed').length * 10`
- Display: "This session has verified $[verifiedSpend] of projected conversion value."
- Subtle styling: muted border, small text, professional "seal" appearance

**E. forwardRef fix on SystemHealthGauge:**
- Wrap the function component in `React.forwardRef`
- Forward the ref to the outer `<Card>` element
- Set `displayName = 'SystemHealthGauge'`

### 3. Page Layout Order (final)

1. BudgetAlertBanner (Step 9, conditional)
2. SystemHealthGauge (with critical state)
3. LiveActivityLog
4. LeadVerificationCard (Step 5)
5. DeduplicationParityCard (Step 6)
6. IntentIntelligenceCard (Step 7)
7. AttributionHealthCard (Step 8)
8. AutopilotCard (Step 10)
9. CROInsightCard (Step 4)
10. Run Verification Test controls
11. **TruthEngineCertification** (new, bottom)

### 4. EMQValidatorOverlay forwardRef

Wrap `EMQValidatorOverlayInner` in `React.forwardRef`, forwarding ref to its outermost `<div>`. Add `displayName`.

---

## Scope Summary

- `useDataLayerMonitor.ts`: ~60 lines added (critical state, lost-lead rate, autopilot insights, intent distribution)
- `TrackingTest.tsx`: ~200 lines added (BudgetAlertBanner, AutopilotCard, TruthEngineCertification, critical gauge config, forwardRef fixes)
- `EMQValidatorOverlay.tsx`: ~5 lines changed (forwardRef wrap)
- Zero backend changes
- Zero database changes

