

# Fix: Revert wm_event_log event_id to crypto.randomUUID()

## Problem

The `event_id` column is the primary key of `wm_event_log`. The previous change set it to `leadId`, which causes a duplicate key crash when:
- A user submits twice (retry)
- Multiple events are logged for the same lead
- The idempotency guard fails its check but proceeds to insert

## Fix (1 line)

**File:** `supabase/functions/save-lead/index.ts`, line 1136

Change:
```typescript
event_id: leadId,
```
Back to:
```typescript
event_id: crypto.randomUUID(),
```

## What stays the same

- **Lead saving**: Unaffected (leads/wm_leads inserts happen before this code)
- **Meta CAPI deduplication**: The Stape payload (line ~405) already uses `leadId` as event_id for Facebook -- unchanged
- **Idempotency guard**: Still checks `lead_id + event_name` before inserting -- unchanged
- **GTM/Stape loader**: Your index.html update is correct and ready to publish
- **All frontend forms**: No changes needed -- they push to dataLayer identically regardless of GTM loader URL
- **Attribution data**: Fully preserved -- early attribution script and dataLayer pushes are unaffected

## Summary

| Concern | Status |
|---------|--------|
| Leads saving to database | Working (unaffected by this bug) |
| wm_event_log crash | Fixed by this 1-line revert |
| Meta CAPI deduplication | Working (uses leadId in Stape payload, not in DB row) |
| Google reporting | Working (dataLayer events unchanged) |
| Stape custom loader | Ready to publish (index.html already updated) |
| Frontend code changes needed | None |

