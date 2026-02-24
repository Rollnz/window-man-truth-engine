## Summary

Fixes a tracking bug in `useGatedAIScanner.ts` where `wmScannerUpload` was called twice per quote upload — once at the wrong moment with an unsafe deduplication key, and once redundantly after analysis. This PR consolidates the call to a single, authoritative invocation at the correct point in the `captureLead` flow.

---

## Problem

`wmScannerUpload` was invoked twice inside `captureLead`:

**Call 1 (wrong position — Step 4, after image compression):**
```typescript
await wmScannerUpload(
  { email: data.email, phone: data.phone, leadId: capturedLeadId || undefined },
  state.scanAttemptId || '',  // ⚠️ unsafe: '' is a valid Map key
  { source_tool: 'quote-scanner' },
);
```
- Fires mid-analysis, after a potentially slow `compressImage` call.
- Uses `state.scanAttemptId || ''` as the deduplication key. An empty string `''` is a valid key in the `firedScanIds` Set, which would mark the slot as "already fired" and silently suppress all future `wm_scanner_upload` events for that session.

**Call 2 (redundant — Step 5, after `awardScore`):**
```typescript
await wmScannerUpload(
  { email: data.email, phone: data.phone, leadId: capturedLeadId || undefined },
  state.scanAttemptId,
  { source_tool: 'quote-scanner' },
);
```
- Fires after the full AI analysis completes — unnecessarily late.
- Silently no-ops due to `firedScanIds` deduplication in `wmTracking.ts`, making it dead code that obscures intent.

---

## Fix

Both calls are removed. A single authoritative call is added **immediately after `submitLead` succeeds**, guarded by `if (state.scanAttemptId)` to guarantee a non-empty deduplication key:

```typescript
// 2. ✅ FIRE THE HIGH-VALUE EVENT (The Critical Step)
// This is the one and only time this event should fire.
if (state.scanAttemptId) {
  await wmScannerUpload(
    { email: data.email, phone: data.phone, leadId: capturedLeadId || undefined },
    state.scanAttemptId,
    { source_tool: 'quote-scanner' },
  );
}
```

This is the earliest possible moment when all required identity data (`leadId`, `email`, `phone`) is resolved and `scanAttemptId` is guaranteed to be a valid, non-empty UUID.

---

## Impact

| Dimension | Before | After |
|---|---|---|
| **Fire count per upload** | 2 (1 effective, 1 silently deduped) | 1 |
| **Dedup key safety** | `scanAttemptId \|\| ''` (unsafe) | `scanAttemptId` (guarded) |
| **Fire timing** | Mid-analysis (after compression) | Immediately after lead capture |
| **Meta CAPI signal** | Unreliable / potentially suppressed | `ScannerUpload` with `value: $500` |
| **EMQ identity data** | Passed but at wrong moment | Passed at correct moment |

---

## Checklist

- [x] Single file changed: `src/hooks/useGatedAIScanner.ts`
- [x] No new dependencies introduced
- [x] No changes to public API / hook return type
- [x] `wmTracking.ts` deduplication logic unchanged (still guards against double-fire)
- [ ] Verify in Meta Events Manager: `ScannerUpload` events appear with `value: 500` after deploy
- [ ] Verify EMQ score ≥ 8 in Meta Events Manager after first live upload

---

## Related

- `src/lib/wmTracking.ts` — `wmScannerUpload` function and `firedScanIds` deduplication Set
- `PHASE_3_FINAL_REPORT.md` — CAPI deduplication and EMQ verification report
- `AUDIT_SUMMARY.md` — Original audit identifying the quote upload tracking gap
