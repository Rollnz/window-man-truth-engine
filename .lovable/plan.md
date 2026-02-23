

# Pro-Active DataLayer Diagnostic Tool

## What Changes

Single file update: `src/pages/admin/TrackingTest.tsx`

No changes to `trackingVerificationTest.ts` -- all existing exports (`findWmLeadEvent`, `validateDataLayerEvent`) are already available and will be reused directly in the page component.

## Implementation Details

### 1. New State Variables (3 additions)

```typescript
const [quickCheckResult, setQuickCheckResult] = useState<{
  eventCount: number;
  latestEvent: Record<string, unknown> | null;
  hasLeadId: boolean;
  hasEventId: boolean;
  validationScore: number | null;
} | null>(null);
```

### 2. Rewritten `handleQuickCheck` Function

- Safely read `window.dataLayer` (handle `undefined`)
- Count total entries, find the most recent `wm_lead` event using `findWmLeadEvent()`
- If a `wm_lead` event exists, run `validateDataLayerEvent()` to get the score
- Check for `lead_id` and `event_id` presence for deduplication readiness
- Store results in `quickCheckResult` state
- Fire a toast via `useToast`:
  - Events found: `"DataLayer Active: Found [X] events."` (default/success variant)
  - Zero events: `"Warning: DataLayer Empty. Check for ad-blockers."` (destructive variant)

### 3. New UI Section: Quick Check Results Panel

Renders below the "Quick DataLayer Check" button, only when `quickCheckResult !== null`.

Layout:
- **Event Counter**: A metric card showing the total dataLayer event count, styled with `bg-muted rounded-lg` and large bold number
- **Deduplication Badge**: Green "Deduplication Ready" badge if both `lead_id` and `event_id` are present; Yellow/amber "Incomplete" badge if either is missing
- **Validation Score**: Display the EMQ validation score (e.g., "7.5/10") if a wm_lead event was found
- **Live JSON Preview**: A scrollable `<pre>` block inside `<ScrollArea>` (already imported) with `bg-muted rounded-md p-4 font-mono text-xs` showing the latest event as pretty-printed JSON
- **Clear Results Button**: A small outline button that sets `quickCheckResult` back to `null`

### 4. New Import

Add `useToast` from `@/hooks/use-toast` (already available in project).

### 5. Visual Hierarchy

```
+--------------------------------------------------+
| Quick DataLayer Check  [button]  [Clear Results]  |
+--------------------------------------------------+
| Event Count: 14          | Deduplication Ready [G]|
| Validation: 8.5/10       |                        |
+--------------------------------------------------+
| Live JSON Preview                                  |
| {                                                  |
|   "event": "wm_lead",                             |
|   "event_id": "263b817f-...",                      |
|   "lead_id": "263b817f-...",                       |
|   ...                                              |
| }                                                  |
+--------------------------------------------------+
```

## Scope
- 1 file modified: `src/pages/admin/TrackingTest.tsx`
- 0 new files
- 0 backend changes
- Uses only existing imports and exports (Badge, ScrollArea, Card, useToast, findWmLeadEvent, validateDataLayerEvent)

