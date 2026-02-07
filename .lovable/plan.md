
# Safety Valve Verification Tests - Execution Plan

## Overview
Execute two critical safety tests to validate the "Worst Case Scenarios" and ensure the system has proper safeguards against infinite loops and runaway costs.

---

## TEST 4: Dead Letter Safety Valve (Infinite Loop Check)

### Objective
Prove that when `retry_count >= MAX_RETRIES (5)`, the system stops retrying and moves the event to `dead_letter` status instead of creating an infinite retry loop.

### Test Logic Verification
From `admin-retry-failed-events/index.ts` (lines 222-234):
```typescript
const newRetryCount = event.retry_count + 1;
if (newRetryCount >= MAX_RETRIES) {  // MAX_RETRIES = 5
  status = 'dead_letter'
}
```

**Math:** If we insert `retry_count = 5`, then:
- `newRetryCount = 5 + 1 = 6`
- `6 >= 5` → **TRUE** → Event goes to `dead_letter`

### Execution Steps

**Step 1: Insert "Exhausted" Test Event**
```sql
INSERT INTO tracking_failed_events (
  event_id,
  event_name,
  event_type,
  destination,
  status,
  retry_count,      -- Set to 5 (at the limit)
  max_retries,
  next_retry_at,    -- Set to NOW so it's immediately eligible
  event_payload,
  error_message
) VALUES (
  gen_random_uuid(),
  'test_dead_letter_event',
  'conversion',
  'supabase',
  'pending',        -- Must be 'pending' to be picked up
  5,                -- Already at max retries
  5,
  now(),            -- Eligible for immediate retry
  '{"test": "dead_letter_verification"}'::jsonb,
  'Manual test seed - should dead letter'
);
```

**Step 2: Verify Insertion**
```sql
SELECT id, event_name, status, retry_count
FROM tracking_failed_events
WHERE event_name = 'test_dead_letter_event';
```

**Step 3: Trigger Retry Function**
Call `POST /admin-retry-failed-events`

**Step 4: Verify Dead Letter**
```sql
SELECT id, event_name, status, retry_count, error_message
FROM tracking_failed_events
WHERE event_name = 'test_dead_letter_event';
```

### Expected Results
| Before | After |
|--------|-------|
| `status: 'pending'` | `status: 'dead_letter'` |
| `retry_count: 5` | `retry_count: 6` |

### Pass Criteria
✅ Status changes to `dead_letter` (NOT `retrying`)
✅ Event is NOT picked up on subsequent retry calls
✅ Server bill is safe from infinite loops

---

## TEST 3: Health Alerts Fire Drill

### Objective
Verify the `check-tracking-health` function returns valid metrics and correctly identifies system health state.

### Key Validation Points
1. **Error Rate**: Must be a number (not `NaN` or `null`)
2. **EMQ Score**: Must be 0-10 scale
3. **Alerts Created**: Should be 0 when system is healthy

### Execution Steps

**Step 1: Invoke Health Check**
Call `GET /check-tracking-health`

**Step 2: Examine Response Structure**
```json
{
  "ok": true,
  "timestamp": "...",
  "metrics": {
    "emqScore": <number>,
    "emqBreakdown": {...},
    "totalEvents": <number>,
    "pendingCount": <number>,
    "deadLetterCount": <number>,
    "errorRate": <number>  // MUST NOT BE NaN
  },
  "alertsCreated": <number>,
  "activeAlerts": <number>
}
```

### Expected Results
| Metric | Expected |
|--------|----------|
| `ok` | `true` |
| `emqScore` | 0.0 - 10.0 |
| `errorRate` | 0.0 - 100.0 (not NaN/null) |
| `alertsCreated` | 0 (healthy state) |
| `pendingCount` | 1 (our test event from TEST 2) |

### Pass Criteria
✅ Response is valid JSON
✅ `errorRate` is a valid number (not NaN/null)
✅ `alertsCreated` is 0 (no critical thresholds breached)
✅ All metrics have appropriate data types

---

## Implementation Order

1. **Run TEST 3 first** (non-destructive health check)
2. **Run TEST 4** (dead letter verification)
3. **Clean up test data** (optional)

---

## Files Involved

| File | Role |
|------|------|
| `supabase/functions/admin-retry-failed-events/index.ts` | Dead letter logic (lines 222-234) |
| `supabase/functions/check-tracking-health/index.ts` | Health monitoring & error rate calc |
| `tracking_failed_events` table | Test data storage |
| `tracking_health_alerts` table | Alert log destination |

---

## Success Summary

| Test | Pass Condition | Impact if Fails |
|------|----------------|-----------------|
| TEST 3 | `errorRate` is valid number | Health monitoring broken |
| TEST 4 | Event moves to `dead_letter` | Potential infinite retry loop |

---

## Technical Notes

### Dead Letter Query Filter
The retry function filters: `status IN ('pending', 'retrying') AND next_retry_at <= now()`

Our test event will be picked up because:
- `status = 'pending'` ✅
- `next_retry_at = now()` ✅

### Error Rate Division Safety
```javascript
const errorRate = totalRecentEvents && totalRecentEvents > 0
  ? ((failedRecentEvents || 0) / totalRecentEvents) * 100
  : 0;
```

This guards against:
- Division by zero → returns `0`
- Null failed count → uses `0`
- Result: Never returns `NaN` or `null`
