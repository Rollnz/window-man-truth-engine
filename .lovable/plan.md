
# Add Golden Thread Console.log Verification

## Overview
Add a startup console.log that displays `[Golden Thread] Active FID: xxxxx` to verify the persistent visitor identity system is working correctly.

## Current State
The identity system already exists via two parallel implementations:
- **wte-anon-id**: Managed in `src/hooks/useCanonicalScore.ts` via `getOrCreateAnonId()`
- **wm_vid**: Managed in `src/hooks/useVisitorIdentity.ts` via `getVisitorIdStandalone()`

Both use localStorage with cookie backup (400-day TTL).

## Implementation

### Single File Change: `src/main.tsx`

Add the Golden Thread verification log after `installTruthEngine()` is called:

```typescript
import { getOrCreateAnonId } from './hooks/useCanonicalScore';

// ... existing code ...

// Install TruthEngine on window for debugging and cross-module access
installTruthEngine();

// Log Golden Thread identity for debugging verification
const goldenThreadFID = getOrCreateAnonId();
console.log(`[Golden Thread] Active FID: ${goldenThreadFID}`);
```

This will:
1. Display the visitor's persistent identity UUID on every page load
2. Work in both development and production environments
3. Verify the identity cookie/localStorage is functioning correctly
4. Make debugging easier when tracking attribution issues

## Technical Notes
- Uses the existing `getOrCreateAnonId()` function (no new code needed)
- Logs immediately at startup (synchronous operation)
- The FID persists for 400 days across sessions via localStorage + cookie backup
- Identical ID will appear even after browser restart, verifying persistence
