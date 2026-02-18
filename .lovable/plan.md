
# Fix: Scanner Dedupe Guard + Unused Import Cleanup

## Finding 1: Scanner dedupe uses single variable (VALID -- needs fix)

**Problem**: `lastFiredScanId` in `wmTracking.ts` is a single string. It only blocks the *immediately previous* scanAttemptId. If a user uploads scan A, then scan B, then scan A again, the second A fires a duplicate $500 event.

The `markUploadFired()` sessionStorage guard works per *leadId* (not per scanAttemptId), so it does not catch this scenario either.

**Fix** (in `src/lib/wmTracking.ts`):

1. Replace `let lastFiredScanId: string | null = null` with `const firedScanIds = new Set<string>()` (line 112).
2. In `wmScannerUpload`, change the guard from `lastFiredScanId === scanAttemptId` to `firedScanIds.has(scanAttemptId)` (line 341).
3. Replace `lastFiredScanId = scanAttemptId` with `firedScanIds.add(scanAttemptId)` (line 349).
4. In `_resetScannerUploadGuard`, replace `lastFiredScanId = null` with `firedScanIds.clear()` (line 479).
5. Add bounded pruning: if the Set exceeds 50 entries, clear and re-add only the current ID. This prevents unbounded memory growth in long-running sessions (edge case, but cheap insurance).

No other files change -- the Set is module-private, and the public API (`wmScannerUpload`, `_resetScannerUploadGuard`) keeps the same signatures.

---

## Finding 2: Unused `_resetSessionGuards` import (VALID -- remove it)

**Problem**: `src/lib/__tests__/lead-capture-integration.test.ts` line 15 imports `_resetSessionGuards` but never calls it. These tests only exercise `wmLead` and `wmAppointmentBooked`, which do not use the session-based scanner/QL dedupe guards. The `_resetScannerUploadGuard()` call in `beforeEach` (line 46) is sufficient.

**Fix**: Remove `_resetSessionGuards` from the import statement on line 15.

---

## Summary

| File | Change |
|---|---|
| `src/lib/wmTracking.ts` | Replace `lastFiredScanId` single-variable with bounded `Set<string>` |
| `src/lib/__tests__/lead-capture-integration.test.ts` | Remove unused `_resetSessionGuards` import |
