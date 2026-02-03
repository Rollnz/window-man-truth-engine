
# Stape GTM Endpoint Path Fix

## Problem
The `save-lead` edge function is POSTing server-side events to the Stape GTM root domain (`https://lunaa.itswindowman.com`) instead of the Data Client endpoint (`https://lunaa.itswindowman.com/data`). This causes a **400 Bad Request** because the Stape container's Data Client expects payloads at the `/data` path.

## Root Cause
Line 253 in `supabase/functions/save-lead/index.ts`:
```typescript
const STAPE_GTM_ENDPOINT = 'https://lunaa.itswindowman.com';  // Missing /data
```

## Solution
Update the endpoint constant to include the `/data` path to match the Stape Data Client configuration.

---

## File to Modify

### `supabase/functions/save-lead/index.ts`

**Location:** Line 253

**Before:**
```typescript
const STAPE_GTM_ENDPOINT = 'https://lunaa.itswindowman.com';
```

**After:**
```typescript
const STAPE_GTM_ENDPOINT = 'https://lunaa.itswindowman.com/data';
```

---

## Technical Details

The Stape server container uses different paths for different purposes:
- `/76bwidfqcvb.js` → GTM container JavaScript (browser-side)
- `/ns.html` → noscript fallback tracking (browser-side)
- `/data` → Data Client endpoint for server-side events

The `save-lead` function sends server-side CAPI events and must use the `/data` path.

---

## Verification After Deployment

1. Deploy the updated edge function
2. Test with a sample lead submission
3. Confirm logs show `[Stape GTM] Success` instead of `400 Bad Request`
4. Verify the event appears in Stape server container debug view
5. Confirm Facebook Events Manager shows the Lead event with proper deduplication

---

## Summary

| Scope | Details |
|-------|---------|
| Files Changed | 1 (`save-lead/index.ts`) |
| Lines Changed | 1 (line 253) |
| Risk | Low - simple string constant change |
| Impact | Fixes 400 errors when sending leads to Stape CAPI |
