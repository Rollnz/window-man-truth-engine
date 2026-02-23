

# Step 6: Smart Deduplication Verification (The ROI Protector)

## Summary

Cross-reference browser `event_id` values against server-side `wm_event_log` records to prove that Meta/Google see exactly one event per lead. Includes fuzzy ID matching, cookie parity verification (`fbp`/`fbc`), and cross-component hover highlighting.

---

## Files to Change

| Action | File | What Changes |
|--------|------|-------------|
| MODIFY | `supabase/functions/verify-lead-exists/index.ts` | Add batch `event_ids` parity mode with cookie data |
| MODIFY | `src/hooks/useDataLayerMonitor.ts` | Add `ParityState`, `normalizeId`, `runParityCheck`, `highlightedEventId` |
| MODIFY | `src/pages/admin/TrackingTest.tsx` | Add DeduplicationParityCard with hover linkage |

No database changes. No new files. No new edge functions.

---

## Technical Details

### 1. Edge Function: `verify-lead-exists/index.ts`

Currently accepts `{ lead_id }`. Will accept an optional `event_ids: string[]` (max 20) alongside or independently.

When `event_ids` is provided:
- Query `wm_event_log` using `.in('event_id', eventIds)` selecting `event_id, event_name, ingested_by, source_system, fbp, fbc, created_at`
- Return a `parityResults` array:

```json
{
  "parityResults": [
    {
      "event_id": "abc-123",
      "serverFound": true,
      "event_name": "wm_lead",
      "ingested_by": "capi",
      "source_system": "log-event",
      "fbp": "fb.1.1234567890.987654321",
      "fbc": "fb.1.1234567890.IwAR..."
    }
  ]
}
```

Both `lead_id` and `event_ids` remain optional -- the function handles whichever is provided. Existing lead verification behavior is untouched.

### 2. Hook: `useDataLayerMonitor.ts`

**New types:**
```typescript
export interface ParityResult {
  eventId: string;
  browserEventName: string;
  serverFound: boolean;
  serverEventName: string | null;
  serverIngestedBy: string | null;
  serverSourceSystem: string | null;
  serverFbp: string | null;
  serverFbc: string | null;
  browserFbp: string | null;
  cookieMatch: boolean;
  checkedAt: number;
}

export interface ParityState {
  results: ParityResult[];
  browserOnlyCount: number;
  serverConfirmedCount: number;
  lastCheckedAt: number | null;
  isChecking: boolean;
}
```

**New helper -- `normalizeId`:**
Strips GTM/Meta wrapper prefixes: `const normalizeId = (id: string) => id.replace(/^(gtm|meta)\.[^.]+\./, '');`

**New state:** `parityState` added to `MonitorState`, persisted in `sessionStorage`.

**New state:** `highlightedEventId: string | null` added to `MonitorState` for cross-component hover linking.

**New exported functions:**
- `runParityCheck()` -- collects unique `wm_*` event_ids from `liveEvents`, batch-calls `verify-lead-exists` with `{ event_ids }`, normalizes IDs for comparison, reads browser `_fbp` cookie via `document.cookie`, compares against server `fbp` value, updates `parityState`.
- `setHighlightedEventId(id: string | null)` -- sets the hover-linked event ID.

**Auto-trigger:** Parity check runs automatically 15 seconds after `startMonitoring()` is called (only if there are `wm_*` events with event_ids).

**Health integration:** If `browserOnlyCount > 0`, escalate to `warning` with reason: "Parity Gap: N browser event(s) not confirmed on server. Meta may be under-counting conversions."

### 3. UI: `TrackingTest.tsx`

**New component: `DeduplicationParityCard`**

Inserted between LeadVerificationCard and CROInsightCard. Only renders when `parityState.results.length > 0` or monitoring is active with events.

Layout:
- Header: "Deduplication Parity" with Database icon and "Check Now" button
- Circular progress gauge showing match percentage (e.g., "4/5 Matched = 80%")
- Summary badges: Green "N Confirmed" + Red/Amber "N Browser-Only"
- Per-result rows:
  - Truncated `event_id` (monospace)
  - Browser event name badge
  - Green checkmark + "Matched" + `ingested_by` badge, OR Red X + "Server Missing"
  - Cookie Match badge: Green "fbp Match" or Amber "fbp Mismatch"
- **Hover linkage:** `onMouseEnter` sets `highlightedEventId`, `onMouseLeave` clears it. The corresponding row in `LiveActivityLog` gets a `ring-2 ring-primary` highlight when IDs match.

**LiveActivityLog update:** Accept `highlightedEventId` prop. Apply `ring-2 ring-primary` class to any row whose `event_id` (normalized) matches.

**Parity Gap Alert:** If `browserOnlyCount > 0`, show amber warning: "Parity Gap Detected: N event(s) fired in the browser but missing from the server event log."

**Perfect Parity:** If all match, green success: "Perfect Parity: All browser events confirmed on server."

---

## Hardening Requirements Addressed

1. **Fuzzy Matching** -- `normalizeId()` strips `gtm.` and `meta.` prefixes before comparison, preventing false mismatches from wrapper formatting.
2. **Cookie Handshake** -- Server returns `fbp`/`fbc` from `wm_event_log`; client reads browser `_fbp` cookie and compares. Mismatch = amber badge warning.
3. **UI Linkage** -- Cross-component hover highlighting via `highlightedEventId` state shared between ParityCard and ActivityLog.
4. **Batching** -- All event_ids sent in a single edge function call, not N individual requests.

## Security

- Same admin JWT validation via `validateAdminRequest()` -- no new auth surface.
- `event_ids` array capped at 20 to prevent abuse.
- Queries use existing `service_role` client on `wm_event_log` (no RLS changes needed).

