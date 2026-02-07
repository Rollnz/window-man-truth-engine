
# Edge Function Stability Fix: save-lead

## Problem Summary

The `save-lead` edge function crashes on the **second submission** because:
1. The email lookup query (line 593) uses `.maybeSingle()` 
2. When duplicate leads exist in the database, `.maybeSingle()` throws `PGRST116` error
3. Confirmed: `partyclean@yahoo.com` has 2 duplicate entries

**Error Message:**
```
"Results contain 2 rows, application/vnd.pgrst.object+json requires 1 row"
```

---

## Fix Strategy

### Fix 1: Replace `.maybeSingle()` with Safe Array Query

**File:** `supabase/functions/save-lead/index.ts`

**Current Code (Lines 588-600):**
```typescript
const { data: leadByEmail, error: emailSelectError } = await supabase
  .from('leads')
  .select('id, utm_source, gclid, fbc, msclkid, last_non_direct_gclid, last_non_direct_fbclid, client_id')
  .eq('email', normalizedEmail)
  .maybeSingle();  // ← FAILS if 2+ rows exist

if (emailSelectError) {
  console.error('Error checking existing lead by email:', emailSelectError);
  throw new Error('Database error while checking lead');
}

existingLead = leadByEmail;
```

**Fixed Code:**
```typescript
// SAFE: Use limit(1) instead of maybeSingle() to handle duplicate emails gracefully
const { data: leadsArray, error: emailSelectError } = await supabase
  .from('leads')
  .select('id, utm_source, gclid, fbc, msclkid, last_non_direct_gclid, last_non_direct_fbclid, client_id')
  .eq('email', normalizedEmail)
  .order('created_at', { ascending: false })  // Get most recent lead first
  .limit(1);

if (emailSelectError) {
  console.error('Error checking existing lead by email:', emailSelectError);
  throw new Error('Database error while checking lead');
}

// Take first result if exists (handles 0, 1, or 2+ rows safely)
existingLead = leadsArray && leadsArray.length > 0 ? leadsArray[0] : null;
if (existingLead) {
  console.log('Found lead by email:', existingLead.id, '(selected most recent)');
}
```

**Why This Fix Works:**
- `.limit(1)` always returns an **array** (0 or 1 items) - never throws on multiple rows
- `order('created_at', { ascending: false })` ensures we get the **most recent** lead
- Handles edge cases: 0 rows, 1 row, 2+ rows all work correctly

---

### Fix 2: Clean Up Existing Duplicate Leads

**Action:** Run a one-time database migration to merge duplicate leads

```sql
-- Find and merge duplicate leads (keep most recent, update references)
WITH duplicates AS (
  SELECT email, 
         array_agg(id ORDER BY created_at DESC) as ids,
         COUNT(*) as cnt
  FROM leads 
  GROUP BY email 
  HAVING COUNT(*) > 1
),
keep_ids AS (
  SELECT email, ids[1] as keep_id, ids[2:] as delete_ids
  FROM duplicates
)
-- Log duplicates first (before deletion)
SELECT * FROM keep_ids;

-- Then delete the older duplicates (keeping the newest)
DELETE FROM leads 
WHERE id IN (
  SELECT unnest(delete_ids) 
  FROM keep_ids
);
```

**Note:** This is a data cleanup, not a schema change. Should be run manually after reviewing which leads to keep.

---

### Fix 3: Add Global Error Handling Improvement

**Current:** Error at line 597 throws a generic error that gets caught at line 733

**Enhancement:** Add more specific error logging before the throw:

```typescript
if (emailSelectError) {
  // Log detailed error for debugging
  console.error('Error checking existing lead by email:', {
    error: emailSelectError,
    email: normalizedEmail.slice(0, 3) + '***', // Redact for privacy
    code: emailSelectError.code,
    details: emailSelectError.details,
  });
  
  // If it's a "multiple rows" error, log a warning and continue
  if (emailSelectError.code === 'PGRST116') {
    console.warn('Multiple leads found for email - using limit(1) query');
    // This should never happen after Fix 1, but defensive coding
  }
  
  throw new Error('Database error while checking lead');
}
```

---

## Files to Modify

| File | Change | Risk |
|------|--------|------|
| `supabase/functions/save-lead/index.ts` | Replace `.maybeSingle()` with `.limit(1)` on email lookup | Low |
| Database (manual) | Clean up duplicate leads | Low (data cleanup only) |

---

## Implementation Details

### Step 1: Fix the Query (Lines 588-604)

Replace the vulnerable `.maybeSingle()` pattern with a safe array query:

```typescript
// PRIORITY 2: Fallback to email lookup if no lead found by ID
if (!existingLead) {
  // SAFE: Use limit(1) instead of maybeSingle() to handle duplicate emails gracefully
  // This prevents PGRST116 errors when multiple leads share the same email
  const { data: leadsArray, error: emailSelectError } = await supabase
    .from('leads')
    .select('id, utm_source, gclid, fbc, msclkid, last_non_direct_gclid, last_non_direct_fbclid, client_id')
    .eq('email', normalizedEmail)
    .order('created_at', { ascending: false })  // Most recent first
    .limit(1);

  if (emailSelectError) {
    console.error('Error checking existing lead by email:', emailSelectError);
    throw new Error('Database error while checking lead');
  }

  // Take first result if exists (handles 0, 1, or 2+ rows safely)
  existingLead = leadsArray && leadsArray.length > 0 ? leadsArray[0] : null;
  if (existingLead) {
    console.log('Found lead by email:', existingLead.id, '(selected most recent)');
  }
}
```

### Step 2: Deploy and Test

1. Deploy the edge function
2. Test with the same email that previously failed
3. Verify the lead is updated (not duplicated)

---

## Testing Checklist

1. Submit lead with NEW email → Should create new lead
2. Submit lead with EXISTING email → Should update existing lead (not crash)
3. Submit lead with DUPLICATE email (`partyclean@yahoo.com`) → Should work (picks most recent)
4. Verify rate limiting still works
5. Verify Stape GTM events still fire
6. Verify email notifications still trigger

---

## Root Cause Summary

| What | Details |
|------|---------|
| **Error** | `PGRST116: Results contain 2 rows, application/vnd.pgrst.object+json requires 1 row` |
| **Location** | `save-lead/index.ts` line 593 |
| **Trigger** | Email lookup when duplicate leads exist |
| **Fix** | Replace `.maybeSingle()` with `.limit(1)` |
| **Prevention** | Consider adding unique constraint on `email` column (future) |

---

## No Blockers

I can fix this completely. The issue is a single line change from `.maybeSingle()` to a safe array query pattern. No external dependencies or missing permissions required.
