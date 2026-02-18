

# Fix: Make Tracking Fire-and-Forget in useGatedScanner.ts

## Problem

Two `await wmScannerUpload(...)` calls on lines 304 and 348 are in the critical path. If either throws, the entire `handleLeadSubmit` catch block fires, showing the user "Analysis Failed" even when the AI analysis could succeed (or already has).

## Changes (1 file only: `src/hooks/audit/useGatedScanner.ts`)

### Fix 1 -- Line 304: Pre-analysis tracking (blocks AI call)

```text
Before:
  await wmScannerUpload(identity, scanAttemptId, context);

After:
  wmScannerUpload(identity, scanAttemptId, context)
    .catch(err => console.warn('[Non-critical] Scanner upload tracking failed:', err));
```

Remove `await` so it becomes fire-and-forget. Add `.catch()` to prevent unhandled rejection.

### Fix 2 -- Line 348: Post-analysis tracking (blocks result reveal)

Same pattern:

```text
Before:
  await wmScannerUpload(identity, scanAttemptId, context);

After:
  wmScannerUpload(identity, scanAttemptId, context)
    .catch(err => console.warn('[Non-critical] Post-analysis tracking failed:', err));
```

### Fix 3 -- Line 341: `awardScore` (also blocks result reveal)

`awardScore` on line 342 is also awaited. If the canonical score API is down, the user never sees their report. Same treatment:

```text
Before:
  await awardScore({ ... });

After:
  awardScore({ ... })
    .catch(err => console.warn('[Non-critical] Canonical score award failed:', err));
```

### What does NOT change

- No new imports
- No changes to `wmTracking.ts`, `gtm.ts`, or any other file
- Event names, payloads, and `event_id` logic are untouched
- The `trackEvent` calls (lines 287, 333) are already synchronous and safe

### Test file

Create `src/hooks/audit/__tests__/useGatedScanner.test.tsx` with cases covering:
1. AI analysis succeeds when first `wmScannerUpload` rejects
2. Result reveal succeeds when second `wmScannerUpload` rejects
3. Result reveal succeeds when `awardScore` rejects
4. Analysis succeeds when all three non-critical calls reject simultaneously

## Why this order

All three fixes are independent single-line changes in the same function. The test file depends on understanding the fixed behavior, so it is created last.

