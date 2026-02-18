
# Fix: eventIdParity.browserEventId shows expected value instead of actual

## Problem
In `src/lib/trackingVerificationTest.ts` line 354, the `browserEventId` field is populated with `expectedEventId` (the value we *hope* to find) rather than the actual `event_id` extracted from the dataLayer.

The admin Tracking Test UI (`TrackingTest.tsx` line 233) displays this field as "Browser event_id". If there is ever a mismatch, the developer sees the expected ID labeled as the real one -- defeating the entire diagnostic purpose.

## Fix (1 file, 1 line)

**`src/lib/trackingVerificationTest.ts`** -- line 354

Change:
```
browserEventId: expectedEventId,
```
To:
```
browserEventId: dataLayerEvent?.event_id ?? 'NOT_FOUND',
```

The `expectedFormat`, `match`, and `deduplicationReady` fields remain unchanged -- they already compare against `expectedEventId` correctly.

## What does NOT change
- The `match` and `deduplicationReady` comparisons (already correct)
- The `expectedFormat` label
- The `TrackingTest.tsx` admin UI (it already renders `browserEventId` correctly)
- No other files affected
