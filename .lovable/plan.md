

# Automation Layer Verification Tests - Execution Plan

## Overview
Execute two targeted tests to verify the Deep Backend Automation features:
1. **TEST 1**: IP Geo-Enrichment in `save-lead`
2. **TEST 2**: Retry Logic in `admin-retry-failed-events`

---

## TEST 1: IP Geo-Enrichment Verification

### Objective
Prove that when a lead is submitted WITHOUT address data, the system automatically enriches `city`, `state`, and `zip` from the client's IP address.

### Test Setup
The `save-lead` function extracts client IP from these headers (in order):
1. `cf-connecting-ip` (Cloudflare)
2. `x-forwarded-for` (standard proxy header)
3. `x-real-ip`

### Test Execution Steps

**Step 1: Invoke save-lead with spoofed Florida IP**

Call the edge function with:
- **Email**: `test-geo@windowman.com`
- **Source Tool**: `expert-system`
- **City/State/Zip**: Empty (not provided)
- **Header**: `X-Forwarded-For: 134.201.250.155` (Los Angeles IP for testing)

**Step 2: Query the resulting lead record**

```sql
SELECT id, email, city, state, zip, created_at
FROM leads
WHERE email = 'test-geo@windowman.com'
ORDER BY created_at DESC
LIMIT 1;
```

### Expected Results
| Field | Expected Value |
|-------|---------------|
| city | Auto-populated (e.g., "Los Angeles") |
| state | Auto-populated (e.g., "California") |
| zip | Auto-populated (e.g., "90001") |

### Note on IP Selection
The IP `134.201.250.155` is a public LA IP. Using this instead of a Florida IP because ip-api.com can verify it. For production, real user IPs from Florida would enrich with Florida data.

---

## TEST 2: Retry Logic Verification

### Objective
Prove that the "Retry All" button actually processes failed events and marks them as resolved.

### Current State
The `tracking_failed_events` table is currently empty (0 rows).

### Test Execution Steps

**Step 1: Insert a dummy failed event**

Insert a test row with:
- **status**: `pending`
- **destination**: `supabase` (this destination has working retry logic)
- **event_payload**: Simple test payload
- **next_retry_at**: Now (so it's eligible for immediate retry)

```sql
INSERT INTO tracking_failed_events (
  event_id,
  event_name,
  event_type,
  destination,
  status,
  retry_count,
  max_retries,
  next_retry_at,
  event_payload,
  error_message
) VALUES (
  gen_random_uuid(),
  'test_retry_event',
  'conversion',
  'supabase',
  'pending',
  0,
  5,
  now(),
  '{"test": "retry_logic_verification", "event_name": "test_retry_event"}'::jsonb,
  'Manual test seed'
);
```

**Step 2: Verify insertion**

```sql
SELECT id, event_name, status, retry_count, destination, error_message
FROM tracking_failed_events
WHERE event_name = 'test_retry_event';
```

**Step 3: Trigger the retry function**

Call `POST /admin-retry-failed-events` as an authenticated admin.

**Step 4: Verify the result**

```sql
SELECT id, event_name, status, retry_count, resolved_at, resolved_by, error_message
FROM tracking_failed_events
WHERE event_name = 'test_retry_event';
```

### Expected Results

| Before Retry | After Retry |
|--------------|-------------|
| status: `pending` | status: `resolved` OR `retrying` |
| resolved_at: NULL | resolved_at: timestamp (if resolved) |
| retry_count: 0 | retry_count: 1 (if retrying) |

### Note on "Supabase" Destination
The `supabase` destination handler attempts to re-insert the event_payload into `wm_event_log`. If the payload is valid, it succeeds and marks resolved. If not, it increments retry_count.

---

## Implementation Order

1. **Run TEST 1**: Execute save-lead with spoofed IP, then query leads table
2. **Run TEST 2**: Insert dummy failed event, trigger retry, verify status change

---

## Technical Details

### How Geo Enrichment Works
```
Client Request → save-lead
    ↓
getClientIp(req) extracts IP from headers
    ↓
enrichGeoFromIP(clientIp) calls ip-api.com
    ↓
Response: { city, state, zip }
    ↓
Merged into leadRecord → Saved to `leads` table
```

### How Retry Logic Works
```
Admin clicks "Retry All"
    ↓
POST /admin-retry-failed-events
    ↓
Query: status IN ('pending', 'retrying') AND next_retry_at <= now()
    ↓
For each event: retryToDestination()
    ↓
Success → status = 'resolved'
Failure → retry_count++ → next_retry_at = exponential backoff
Max retries → status = 'dead_letter'
```

---

## Success Criteria

| Test | Pass Condition |
|------|----------------|
| TEST 1 | Lead record has non-null `city` and `state` values |
| TEST 2 | Failed event moves from `pending` to `resolved` or `retrying` |

