

# Step 5: Client-Server Handshake (with 100/100 Tweaks)

## Overview

Add a "Lead Verification" system that confirms browser-captured leads actually reach the database. When the Guardian detects a `wm_lead` event with a `lead_id`, it automatically pings the server at 10s/30s/60s intervals to confirm the lead was saved. If missing after 60s, a "Lost Lead Recovery Card" appears with the full payload and a copy button.

Three hardening tweaks from the user's feedback are integrated:
1. Timer Persistence -- surviving page redirects
2. Manual Force Re-check button on lost leads
3. Deep Event Verification -- also checking `wm_event_log` for CAPI event parity

---

## Files

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `supabase/functions/verify-lead-exists/index.ts` | Admin-only endpoint to check leads + wm_event_log |
| MODIFY | `supabase/config.toml` | Add verify_jwt = false entry |
| MODIFY | `src/hooks/useDataLayerMonitor.ts` | Add handshake subsystem with timer persistence |
| MODIFY | `src/pages/admin/TrackingTest.tsx` | Add Lead Verification UI section |

---

## File 1: `supabase/functions/verify-lead-exists/index.ts` (NEW, ~60 lines)

A JWT-protected admin endpoint that checks two tables:

**Request:** `POST { lead_id: string }`

**Logic:**
1. Validate admin JWT using existing `validateAdminRequest()` from `_shared/adminAuth.ts`
2. Query `leads` table: `SELECT id, created_at FROM leads WHERE id = :lead_id LIMIT 1`
3. Query `wm_event_log` table: `SELECT event_id, event_name, created_at FROM wm_event_log WHERE lead_id = :lead_id LIMIT 5` (Tweak #3: Deep Event Verification)
4. Return:
```json
{
  "leadExists": true,
  "leadCreatedAt": "2025-01-15T...",
  "capiEvents": [
    { "event_id": "abc...", "event_name": "wm_lead", "created_at": "..." }
  ],
  "capiEventCount": 1,
  "checkedAt": "..."
}
```

This confirms both that the lead was saved AND that the CAPI event was logged for Meta deduplication.

## File 2: Config Update

Add to `supabase/config.toml`:
```toml
[functions.verify-lead-exists]
verify_jwt = false
```

## File 3: `src/hooks/useDataLayerMonitor.ts` (MODIFY, ~80 lines added)

### New Types

```typescript
export interface HandshakeResult {
  leadId: string;
  status: 'pending' | 'confirmed' | 'lost';
  attempts: number;
  confirmedAt: number | null;
  leadCreatedAt: string | null;
  capiEventCount: number;
  capturedAt: number;        // when browser first saw the event
  eventPayload: Record<string, unknown>;
}
```

Add `handshakeResults` to `MonitorState` as `HandshakeResult[]` (max 10, newest first).

### Handshake Logic in `processEntry()`

When a `wm_lead` event is detected with a `lead_id`:
1. Create a `HandshakeResult` with `status: 'pending'`, `capturedAt: Date.now()`
2. Persist to sessionStorage immediately
3. Schedule verification at T+10s via `setTimeout`
4. The verification function:
   - Calls `supabase.functions.invoke('verify-lead-exists', { body: { lead_id } })`
   - Uses the auth token from the current session (admin is logged in)
   - If `leadExists === true`: mark `'confirmed'`, store `capiEventCount`
   - If not found and `attempts < 3`: schedule next check (30s for attempt 2, 60s for attempt 3)
   - If not found after 3 attempts: mark `'lost'`, escalate `systemHealth` to `'conflict'`

### Tweak #1: Timer Persistence (surviving redirects)

On hook mount, scan sessionStorage for any `'pending'` handshake results. For each:
- Calculate `elapsed = Date.now() - capturedAt`
- If elapsed < 10000 (10s): schedule check at `10000 - elapsed` ms
- If elapsed < 30000: schedule check at `30000 - elapsed` ms
- If elapsed < 60000: schedule check at `60000 - elapsed` ms
- If elapsed >= 60000 and still pending: mark as `'lost'` immediately

This means if the page redirects at T+5s, when the admin navigates back to the tracking page, the hook picks up where it left off.

### Tweak #2: Force Re-check

Export a `forceRecheck(leadId: string)` function from the hook that manually triggers a verification call regardless of attempt count. Updates the handshake result in-place.

### Cleanup

All `setTimeout` IDs stored in a `Map<string, NodeJS.Timeout>` ref, cleared on unmount.

## File 4: `src/pages/admin/TrackingTest.tsx` (MODIFY, ~100 lines added)

### New UI Section: Lead Verification Card

Inserted between the Live Activity Log and the CRO Insight Card. Only renders when `handshakeResults.length > 0`.

**Layout per handshake result:**

| Status | Visual |
|--------|--------|
| `pending` | Amber spinner + "Verifying lead abc123... (attempt 1/3)" with a pulsing dot |
| `confirmed` | Green checkmark + "Server confirmed lead abc123" + "CAPI events: 1" badge + time delta (e.g., "confirmed in 2.4s") |
| `lost` | Red alert card (expanded) with full recovery tools |

**Lost Lead Recovery Card:**
- Red border, `bg-destructive/10`
- Title: "LOST LEAD: lead abc123 captured in browser but NOT found in database after 60s"
- "Force Re-check" button (Tweak #2) -- calls `forceRecheck(leadId)`
- "Copy Payload" button -- copies the full `eventPayload` JSON to clipboard using existing `copyToClipboard` utility
- Scrollable `<pre>` block showing the raw event JSON
- CAPI status: if `capiEventCount === 0`, show additional warning: "No CAPI events found -- Meta will not receive this conversion"
- The System Health Gauge escalates to `conflict` with reason: "Lead Verification Failed: 1 lead captured in browser but missing from database"

### New Imports
- `Copy`, `RotateCcw`, `Loader2` from lucide-react (Copy and RotateCcw are new)
- `copyToClipboard` from `@/utils/clipboard`
- `supabase` from `@/integrations/supabase/client` (already used elsewhere in admin pages)

---

## Security

- The edge function uses `validateAdminRequest()` which checks JWT + admin role in `user_roles` table
- Queries use `service_role` client internally (bypasses RLS safely)
- The client-side code uses `supabase.functions.invoke()` which automatically includes the auth token
- No new database tables, no schema changes, no RLS modifications needed

## Why This is 100/100

1. **Timer Persistence** -- The hook resumes pending handshakes after page redirects by calculating elapsed time from `capturedAt`. No lost timers.
2. **Force Re-check** -- One-click manual retry for edge cases beyond the 60s window (regional outages, temporary DB locks).
3. **Deep Event Verification** -- Checks both `leads` AND `wm_event_log` tables. A lead can exist in the DB but if the CAPI event wasn't logged, Meta will never see it. This catches that gap.
4. **Recovery Card with Copy** -- Turns a catastrophic "lost lead" into a recoverable incident. At $10K per window job, this single feature pays for itself.

