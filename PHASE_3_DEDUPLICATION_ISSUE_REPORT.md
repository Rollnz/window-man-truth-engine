# Phase 3D: Deduplication Issue Report

## Critical Finding

**Date:** January 23, 2026
**Source:** Meta Events Manager → Lead Event → Event Deduplication

## Issue Summary

**Event Deduplication Status: NOT MEETING BEST PRACTICES**

The Browser Pixel is NOT sending `event_id` to Meta, causing deduplication to fail.

## Deduplication Keys Analysis

| Dedupe Key | Browser Events | Server Events | Event Coverage Rate |
|------------|----------------|---------------|---------------------|
| **Event ID** (Recommended) | **0 (0%)** ❌ | **24 (96.77%)** ✅ | **0%** 🔴 |
| External ID | 0 (0%) | 0 (0%) | 0% |
| FBP | 33 (100%) | 25 (100%) | **8.51%** |

**Total Event Coverage Rate: 8.51%** (Meta recommends ≥75%)

## Root Cause

1. **Server CAPI:** Correctly sending `event_id` (96.77% coverage) ✅
2. **Browser Pixel:** NOT sending `event_id` (0% coverage) ❌

The GTM Web Container's "Meta - Lead Conversion" tag is a Custom HTML tag that is not properly passing the `eventID` parameter to the Meta Pixel's `fbq('track', 'Lead', ...)` call.

## Impact

- Events are being counted twice (browser + server)
- Attribution is inaccurate
- Ad optimization is suboptimal
- EMQ score is limited to 6.1/10

## Required Fix

Update the Meta - Lead Conversion tag in GTM Web Container to include:

```javascript
fbq('track', 'Lead', {
  value: {{DLV - value}},
  currency: {{DLV - currency}}
}, {
  eventID: '{{DLV - event_id}}'  // THIS IS MISSING!
});
```

## Current Meta Pixel Tag Code (Suspected)

```javascript
fbq('track', 'Lead', {
  value: {{DLV - value}},
  currency: {{DLV - currency}}
});
// Missing: eventID option
```

## Next Steps

1. Navigate to GTM Web Container
2. Edit "Meta - Lead Conversion" tag
3. Add `eventID` parameter to the fbq() call
4. Publish changes
5. Re-test deduplication

## Expected Outcome After Fix

| Dedupe Key | Browser Events | Server Events | Event Coverage Rate |
|------------|----------------|---------------|---------------------|
| **Event ID** | ~100% | ~97% | **~97%** ✅ |

Total Event Coverage Rate should increase from 8.51% to ~97%.
