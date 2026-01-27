
# Cleanup Plan: Test Leads from Verification Testing

## Summary

Remove all test data created during the `window_count` fix verification from the production database.

## Data to Remove

### leads Table (19 records)

| Email Pattern | Count | Purpose |
|---------------|-------|---------|
| `test-wc-*@example.com` | 4 | Window count range testing |
| `test-*@example.com` | 4 | Window count range testing |
| `sales-tactics-test-*@windowman-test.com` | 4 | Sales Tactics Guide testing |
| `stress-test-*@test.com` | 2 | Stress/edge case testing |
| `test-ktg-verify@test.com` | 1 | Kitchen Table Guide testing |
| `test-byq-verify@example.com` | 1 | Beat Your Quote testing |
| `test@itswindowman.com` | 1 | General testing |
| `identity-test@lovable.dev` | 1 | Identity testing |
| `validation-test-1@example.com` | 1 | Validation testing |

### wm_leads Table (20 records)

Same patterns as above plus:
- `idempotency-test-*@example.com` (1 record)

### global_search_index

Entries linked to test `wm_leads` records will be automatically cleaned up by the existing database trigger (`trigger_index_wm_leads`) when the corresponding `wm_leads` records are deleted.

## Cleanup Steps

### Step 1: Delete from `leads` table

```sql
DELETE FROM public.leads 
WHERE email LIKE 'test-%@example.com'
   OR email LIKE 'test-%@test.com'
   OR email LIKE 'stress-test-%@test.com'
   OR email LIKE '%@windowman-test.com'
   OR email = 'test@itswindowman.com'
   OR email LIKE 'identity-test%'
   OR email LIKE 'validation-test%'
   OR email LIKE 'idempotency-test%';
```

### Step 2: Delete from `wm_leads` table

```sql
DELETE FROM public.wm_leads 
WHERE email LIKE 'test-%@example.com'
   OR email LIKE 'test-%@test.com'
   OR email LIKE 'stress-test-%@test.com'
   OR email LIKE '%@windowman-test.com'
   OR email = 'test@itswindowman.com'
   OR email LIKE 'identity-test%'
   OR email LIKE 'validation-test%'
   OR email LIKE 'idempotency-test%';
```

### Step 3: Verify cleanup

Run verification queries to confirm all test data has been removed:
- Count remaining test records in `leads`
- Count remaining test records in `wm_leads`
- Count remaining test entries in `global_search_index`

## Safety Measures

- Uses specific email patterns that won't match real user data
- All patterns target domains like `@example.com`, `@test.com`, `@windowman-test.com`
- Real production emails use `@gmail.com`, `@yahoo.com`, etc.

## Expected Outcome

| Table | Records Deleted |
|-------|----------------|
| `leads` | 19 |
| `wm_leads` | 20 |
| `global_search_index` | ~20 (auto-cleanup) |

---

**Technical Note**: This cleanup uses the existing `cleanup_test_data()` database function patterns, but targets the specific test records from the recent verification session.
