

# Tracking Autopilot Phase 2: Active Guardian (with Hardening Tweaks)

## What We Are Building

A real-time monitoring system that watches `window.dataLayer` as events arrive, detects collisions, captures scroll depth at conversion, and provides instant health feedback -- all without requiring a button click. Three architectural hardening tweaks are integrated directly into the core design.

## Files

| Action | File | Lines Added |
|--------|------|-------------|
| CREATE | `src/hooks/useDataLayerMonitor.ts` | ~200 |
| MODIFY | `src/pages/admin/TrackingTest.tsx` | ~150 added |

No database, edge function, or other file changes.

---

## File 1: `src/hooks/useDataLayerMonitor.ts` (NEW)

### Exported Interface

```typescript
interface MonitorEvent {
  event: string;
  event_id: string | undefined;
  timestamp: number;
  emqScore: number | null;
  hasEmail: boolean;
  hasPhone: boolean;
  collision: boolean;
  collisionSource: string | null;   // Tweak #2: source attribution
  scrollDepth: number;
  raw: Record<string, unknown>;
}

interface MonitorState {
  systemHealth: 'idle' | 'healthy' | 'warning' | 'conflict';
  healthReason: string;
  liveEvents: MonitorEvent[];       // max 20, newest first
  collisions: Map<string, number>;  // event_id -> occurrence count
  isMonitoring: boolean;
}

// Hook return
{ state, startMonitoring, stopMonitoring }
```

### Core Mechanics

**A. DataLayer Push Proxy**
- On `startMonitoring()`, save a reference to `window.dataLayer.push` and replace it with a proxy function
- The proxy calls the original push, then processes the new entry
- On `stopMonitoring()` or unmount, restore the original

**B. Tweak #1 -- sessionStorage Persistence**
- On every state update, serialize `liveEvents` and `collisions` to `sessionStorage` under key `__wm_monitor_state`
- On hook mount, hydrate state from sessionStorage if present
- This survives page redirects (e.g., form submission to thank-you page) but clears on tab close
- The `startMonitoring` flag itself is NOT persisted (user must re-enable after refresh -- intentional safety)

**C. Tweak #2 -- Source Attribution for Collisions**
- When a collision is detected (event_id already in the Set), capture the script source using `new Error().stack`
- Parse the stack trace to extract the first non-monitor file path (e.g., `gtm.js:42` or `fbevents.js:118`)
- Store as `collisionSource` on the MonitorEvent
- This tells you whether GTM or a hardcoded pixel caused the duplicate

**D. Tweak #3 -- Race Condition Guard (DataLayer Hijack Protection)**
- After applying the proxy, start a `setInterval(2000)` watchdog that checks if `window.dataLayer.push` is still the proxy function
- If a third-party script has replaced the array (reset to `[]`) or overwritten `.push`, the watchdog re-applies the proxy and logs a warning: `"[Guardian] DataLayer was reset by external script. Re-applying proxy."`
- The watchdog interval is cleared on `stopMonitoring()` or unmount

**E. Collision Detection**
- Maintain a `Set<string>` of all `event_id` values seen this session
- When a duplicate is found: increment count in `collisions` Map, set `collision: true` on event, escalate `systemHealth` to `'conflict'`

**F. Scroll Depth Capture**
- Attach a passive scroll listener on `startMonitoring()`
- Track `maxScrollPercent` = `Math.round((scrollTop + viewportHeight) / documentHeight * 100)`
- Debounced at 200ms
- When any `wm_*` event fires, stamp current `maxScrollPercent` onto the event record

**G. EMQ Scoring per Event**
- For events where `event.event` starts with `wm_`, run `validateDataLayerEvent()` (imported from trackingVerificationTest.ts) and store the score
- Non-wm events get `emqScore: null`

**H. Health State Logic**
- `idle`: monitoring not started
- `healthy`: monitoring active, no issues
- `warning`: a `wm_*` event arrived missing hashed email (`user_data.em`) or phone (`user_data.ph`)
- `conflict`: a collision was detected (overrides warning)
- `healthReason` string provides the human-readable explanation

---

## File 2: `src/pages/admin/TrackingTest.tsx` (MODIFIED)

### New Imports
- `useDataLayerMonitor` from new hook
- `ShieldCheck`, `ShieldAlert`, `AlertTriangle`, `XOctagon`, `Activity`, `Mail`, `Phone`, `ArrowDown` from lucide-react
- `Progress` from `@/components/ui/progress`

### New UI Sections (inserted BEFORE the existing "Run Verification Test" card)

#### Section 1: System Health Gauge

A full-width banner card. Four visual states:

| State | Background | Icon | Message |
|-------|-----------|------|---------|
| `idle` | `bg-muted/50 border-border` | ShieldCheck (gray) | "Guardian inactive. Click Start Monitoring to begin." |
| `healthy` | `bg-emerald-600/10 border-emerald-600/20` | ShieldCheck (green) | "All signals nominal. Deduplication pipeline active." |
| `warning` | `bg-amber-600/10 border-amber-600/20` | AlertTriangle (amber) | Dynamic reason from hook (e.g., "Low Match Quality...") |
| `conflict` | `bg-destructive/10 border-destructive/20` | XOctagon (red) | Dynamic reason (e.g., "Collision on ID abc123...") |

Right side: Toggle button "Start Monitoring" / "Stop Monitoring"

#### Section 2: Live Activity Log

A card with title "Live Activity Log" and an Activity icon.

- Shows the last 10 events from `state.liveEvents` (newest first)
- Each row is a horizontal flex with:
  - Relative timestamp (e.g., "3s ago") -- `text-muted-foreground text-xs`
  - Event name in monospace badge -- `bg-muted font-mono text-xs`
  - EMQ dot: green circle (8+), amber (5-7.9), red (<5), gray (non-conversion)
  - PII indicators: Mail icon (filled if `hasEmail`, outlined if not), Phone icon (same)
  - If `collision === true`: red "COLLISION" badge with `ring-1 ring-destructive/40` on the row, plus a tooltip or subtitle showing `collisionSource` (the stack trace snippet from Tweak #2)
- Empty state: "Monitoring active. Waiting for dataLayer events..." in muted text
- If not monitoring: "Start monitoring to see live events."
- Events persist across redirects thanks to sessionStorage (Tweak #1)

#### Section 3: CRO Insight Card

Only renders when `state.liveEvents` contains at least one `wm_*` event with `scrollDepth > 0`.

- Shows the most recent conversion event's scroll depth as a `Progress` bar (0-100%)
- Below the bar, a dynamic text recommendation:
  - `> 75%`: "Users scroll deep before converting. Consider moving your primary CTA higher."
  - `50-75%`: "Mid-page conversion. Content flow is balanced."
  - `25-50%`: "Above-fold influence is strong. Hero section doing heavy lifting."
  - `< 25%`: "Lightning-fast conversion. Your above-fold value proposition is your strongest asset."
- Subtitle shows the event name and scroll percentage

### Existing Sections -- UNCHANGED

The Quick DataLayer Check panel (Phase 1), Run Full Test, and all result cards remain exactly as they are. The new sections are inserted above them.

---

## Why These Tweaks Make It 100

1. **sessionStorage** solves the #1 real-world failure: you submit a form, the page redirects, and your diagnostic data vanishes. Now it survives. Using sessionStorage (not localStorage) means it auto-clears when the tab closes, so stale data never accumulates.

2. **Source attribution** turns a "something is wrong" alert into a "this specific script caused it" alert. The `new Error().stack` approach costs zero runtime overhead (only triggered on collision, which is already an error state).

3. **Race condition guard** handles the scenario where Google Optimize, Hotjar, or a poorly-coded A/B testing script replaces `window.dataLayer` after page load. A 2-second watchdog is lightweight and catches this within one polling cycle.

