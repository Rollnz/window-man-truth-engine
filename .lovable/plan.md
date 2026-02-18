

# Implement 5 Approved Tracking Fixes

All 5 fixes from the approved audit were never applied. This plan implements them.

## 1. Fix Circular Dependency (P0-A)

**`src/lib/gtm.ts`**
- Remove line 19: the `wmLead, wmQualifiedLead, ...` import from `./wmTracking`
- Remove `installTruthEngine()` function and its `TruthEngine` interface (they already exist in `src/lib/tracking/truthEngine.ts`)
- Keep the `window.truthEngine?` type declaration (interface merging is fine)

**`src/main.tsx`**
- Change line 8 from `import { installTruthEngine } from "./lib/gtm"` to `import { installTruthEngine } from "./lib/tracking/truthEngine"`

## 2. Fix event_id Parity (P0-B)

**`src/lib/wmTracking.ts` line 289**
- Change `const eventId = \`lead:\${identity.leadId}\`` to `const eventId = identity.leadId`
- This makes the browser event_id match the server-side CAPI dispatch (bare UUID) for Meta deduplication

## 3. Neutralize value/currency in secondarySignalEvents (P0-D)

**`src/lib/secondarySignalEvents.ts`**
- Remove `VOICE_ESTIMATE_VALUE` constant (line 71)
- Remove `value: VOICE_ESTIMATE_VALUE` and `currency: 'USD'` from lines 114-115
- Add `meta: { send: false, category: 'internal', wm_tracking_version: '1.0.0' }` to the event payload
- Update file-level JSDoc to remove "value-based bidding" claim

## 4. Session-Stable Dedupe for wm_lead (P1-A)

**`src/lib/wmTracking.ts`**
- Add `hasLeadFired(leadId)` and `markLeadFired(leadId)` sessionStorage helpers after line 156
- Update wmLead() guard (line 281) to check both Set AND sessionStorage
- After firing, call `markLeadFired(identity.leadId)`
- Update `_resetSessionGuards()` to also clear `wm_lead_fired:{leadId}`

## 5. Fix getFbc Timestamp (P1-B)

**`src/lib/gtm.ts` line 240**
- Change `Date.now()` to `Math.floor(Date.now() / 1000)` (Meta fbc spec requires seconds)

## 6. Update Tests

**`src/lib/__tests__/wmTracking.test.ts`**
- Update the `wmLead` event_id test: expect bare `TEST_LEAD_ID` instead of `lead:${TEST_LEAD_ID}`
- Add test: wmLead deduplicates via sessionStorage across simulated reloads (clear Set, keep sessionStorage, verify suppression)
- Add test: `_resetSessionGuards` clears `wm_lead_fired:{leadId}`

## Files Modified

| File | Change |
|------|--------|
| `src/lib/gtm.ts` | Remove wm* imports, remove installTruthEngine, fix getFbc |
| `src/main.tsx` | Update installTruthEngine import path |
| `src/lib/wmTracking.ts` | Bare UUID event_id, session dedupe for wm_lead |
| `src/lib/secondarySignalEvents.ts` | Remove value/currency, add meta.category: internal |
| `src/lib/__tests__/wmTracking.test.ts` | Update event_id assertions, add session dedupe tests |

## Implementation Order

1. Create/verify `truthEngine.ts` (already exists, no changes needed)
2. Edit `gtm.ts` (remove cycle + fix getFbc) 
3. Edit `main.tsx` (update import)
4. Edit `wmTracking.ts` (event_id + session dedupe)
5. Edit `secondarySignalEvents.ts` (neutralize value)
6. Update tests
7. Run test suite to verify

