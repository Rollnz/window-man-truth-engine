

# Phase 4: Intent Intelligence & Attribution Repair (Steps 7 & 8)

## Summary

Two new capabilities layered onto the existing Guardian system:

- **Step 7 (Intent Engine)**: Scores each `wm_lead` event 1-10 based on time-to-convert (TTC) and scroll depth. Includes bot detection. Writes intent data to the `leads` table metadata so the CRM can display it.
- **Step 8 (Auto-Healer)**: Detects missing `_fbp` and `_gcl_au` cookies per conversion event. Implements a "healer" that checks `sessionStorage` for a previously-captured `_fbp` value and re-injects it if the cookie was stripped mid-session.

Zero new edge functions. Zero new database tables. One small DB migration to add `intent_score` and `intent_label` columns to `leads`.

---

## Files to Change

| Action | File | What Changes |
|--------|------|-------------|
| MIGRATE | Database | Add `intent_score` (integer) and `intent_label` (text) columns to `leads` |
| MODIFY | `src/hooks/useDataLayerMonitor.ts` | Add intent scoring, cookie detection, healer logic, new MonitorEvent fields |
| MODIFY | `src/pages/admin/TrackingTest.tsx` | Add IntentIntelligenceCard, AttributionHealthCard, Activity Log icons |
| MODIFY | `supabase/functions/verify-lead-exists/index.ts` | Write intent_score and intent_label to leads table on handshake confirm |

---

## Technical Details

### 1. Database Migration

Add two columns to the `leads` table:

```sql
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS intent_score integer;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS intent_label text;
```

These columns store the Guardian's behavioral assessment so the CRM and sales team can see "Hot / Warm / Cold" labels without needing the admin test page open. No RLS changes needed -- existing policies cover these columns automatically.

### 2. Hook: `useDataLayerMonitor.ts` (~80 lines added)

#### MonitorEvent Additions

```typescript
export interface MonitorEvent {
  // ... existing fields ...
  ttc: number | null;                    // Time-to-convert in seconds
  intentScore: number | null;            // 1-10
  intentLabel: 'hot' | 'warm' | 'cold' | null;
  attributionHealth: 'healthy' | 'repaired' | 'broken' | null;
  missingCookies: string[];              // e.g. ['_fbp', '_gcl_au']
}
```

#### New Ref: `pageLoadTimestamp`

A `useRef(Date.now())` captures when monitoring began. Stored in `sessionStorage` as part of `StoredState` so TTC calculations survive page redirects (same pattern as Step 5 timer persistence). On hydration, if a stored timestamp exists, it is used instead of `Date.now()`.

#### New Helper: `calculateIntentScore(ttc, scrollDepth)`

```text
Bot/Accidental: TTC < 3s AND Scroll < 5%  -->  score 1, label 'cold'
Fast click:     TTC < 10s                  -->  score 3, label 'cold'
Baseline:       score = 5
  + TTC >= 120s:  +3
  + TTC >= 60s:   +2
  + TTC >= 30s:   +1
  + Scroll >= 75%: +2
  + Scroll >= 50%: +1
  + Returning visitor bonus: +1
Cap at 10. Label: >= 9 = 'hot', >= 6 = 'warm', else 'cold'.
```

The returning visitor bonus uses a `sessionStorage` flag `__wm_returning_visitor` set after the first `wm_*` event.

#### New Helper: `checkAttributionCookies()`

Reads `document.cookie` for `_fbp` and `_gcl_au`. Returns `{ health, missing, repairedFbp }`.

**Healer Logic (Step 8.1)**: On hook mount, if `_fbp` is present in the browser, store it in `sessionStorage` as `__wm_fbp_backup`. On subsequent checks, if `_fbp` is missing from `document.cookie` but exists in `sessionStorage`:
1. The event is flagged as `attributionHealth: 'repaired'` (not `broken`)
2. The backed-up `_fbp` value is included in the event data for downstream use
3. This handles the scenario where ITP or ad-blockers strip cookies mid-session

If both `document.cookie` AND `sessionStorage` are empty for `_fbp`, status is `'broken'`.

#### Changes to `processEntry()`

For `wm_*` conversion events:
1. Calculate `ttc = (Date.now() - pageLoadTimestamp) / 1000`
2. Call `calculateIntentScore(ttc, scrollRef.current)`
3. Call `checkAttributionCookies()`
4. Populate new fields on MonitorEvent

For non-conversion events: all new fields set to `null` / empty array.

#### Bot Detection Health Escalation

If `ttc < 3` AND `scrollDepth < 5` AND event is `wm_lead`, escalate `systemHealth` to `'warning'` with reason: "Potential Bot: Lead converted in Xs with Y% scroll. Verify manually." This does not override `conflict` status.

#### New Export: `intentDistribution`

Computed from `liveEvents`:
```typescript
{ hot: number; warm: number; cold: number }
```

Added to hook return value.

#### CRM Handshake Integration

When a handshake confirms a lead (in `verifyLead()` success path), if the corresponding event has `intentScore` and `intentLabel`, fire an additional update to persist these to the database:

```typescript
await supabase.functions.invoke('verify-lead-exists', {
  body: { lead_id: leadId, intent_score: intentScore, intent_label: intentLabel }
});
```

### 3. Edge Function: `verify-lead-exists/index.ts` (~15 lines added)

Add support for optional `intent_score` and `intent_label` fields in the request body. When provided alongside `lead_id`:

```typescript
if (intent_score !== undefined && intent_label) {
  await adminClient
    .from('leads')
    .update({ intent_score, intent_label })
    .eq('id', lead_id);
}
```

This writes the intent data to the leads table so CRM views can display it. The update runs inside the existing admin-authenticated function using `service_role`, so no RLS bypass is needed.

### 4. UI: `TrackingTest.tsx` (~150 lines added)

#### New Component: `IntentIntelligenceCard`

Inserted between DeduplicationParityCard and CROInsightCard. Only renders when there are conversion events with intent scores.

**Layout:**
- Header: "Intent Intelligence" with `Flame` icon
- **Intent Distribution Row**: Three badges:
  - Red/orange: "N Hot"
  - Amber: "N Warm"
  - Gray: "N Cold"
- **Latest Lead Spotlight** (most recent scored event):
  - Large score display (e.g., "9/10") with color coding
  - Intent label badge
  - Detail: "Converted in Xm Ys with Y% scroll depth"
  - Actionable text:
    - Hot: "High Value: User spent [time] reading before converting. Call immediately."
    - Warm: "Moderate Intent: User engaged but may need nurturing."
    - Cold: "Low Intent: Likely accidental submission or bot behavior. Verify before calling."
- **Bot Warning**: If score is 1, show red alert: "Potential Bot or Accidental Click detected."

#### New Component: `AttributionHealthCard`

Renders after IntentIntelligenceCard. Shows cookie/attribution status for the latest conversion event.

**Layout:**
- Header: "Attribution Health" with `ShieldPlus` icon
- **Cookie Status List**:
  - `_fbp` row: Green checkmark "Meta Pixel Active" / Amber wrench "Meta Pixel Repaired (from session backup)" / Red X "Meta Pixel Missing"
  - `_gcl_au` row: Green checkmark "Google Tag Active" / Red X "Google Tag Missing"
- **Attribution Status Badge**:
  - `healthy`: Green shield "Full Attribution"
  - `repaired`: Amber shield "Attribution Repaired" + explanation text
  - `broken`: Red shield "Attribution Broken" + warning about ad-blockers
- **Ad-Blocker Warning**: If cookies are missing but DataLayer events are flowing, show: "Warning: User is likely using an Ad-Blocker. Attribution data is incomplete."

#### Activity Log Enhancements

Add two small icons to each `wm_*` event row in LiveActivityLog:

- **Flame icon** (`lucide-react`): Color-coded by intent (red = hot, amber = warm, gray = cold). Tooltip shows "Intent: 9/10 (Hot Lead)"
- **ShieldPlus icon**: Color-coded by attribution health (green = healthy, amber = repaired, red = broken). Tooltip shows repair status detail.

These icons only render for `wm_*` conversion events to avoid visual clutter.

#### Health Integration

Bot detection case from hook integrates with existing health gauge. Warning reason updates to include bot alerts alongside existing parity/collision/lost-lead reasons.

---

## Hardening Requirements Addressed

1. **Rule of Hooks Persistence**: `pageLoadTimestamp` in `useRef`, also persisted to `sessionStorage` for cross-redirect TTC accuracy.
2. **Bot Detection**: `TTC < 3s AND Scroll < 5%` flags as potential bot with `intentScore: 1` and health escalation.
3. **Cross-Session Intent**: `sessionStorage` flag `__wm_returning_visitor` adds +1 to score on return visits.
4. **No Double-Toasts**: Attribution status is purely visual in cards -- no toast notifications fired.
5. **Graceful Degradation**: If `document.cookie` throws (sandboxed iframe, strict CSP), `checkAttributionCookies()` returns `broken` with both cookies listed.
6. **CRM Handshake**: Intent score and label written to `leads` table via `verify-lead-exists` function on handshake confirm, making the data visible in the CRM.
7. **Healer Logic (Step 8.1)**: `_fbp` backed up to `sessionStorage` on first detection. If stripped mid-session, the backup is used and event is marked `repaired` rather than `broken`.

---

## Scope Summary

- Database: 1 migration (2 columns added to `leads`)
- `verify-lead-exists/index.ts`: ~15 lines added (intent write-back)
- `useDataLayerMonitor.ts`: ~80 lines added (intent scoring, cookie checking, healer, new fields)
- `TrackingTest.tsx`: ~150 lines added (IntentIntelligenceCard, AttributionHealthCard, Activity Log icons)

