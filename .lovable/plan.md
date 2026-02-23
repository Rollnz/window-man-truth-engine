

# Fix: "Object Not Found" Storage Error on View File

## Root Cause (NOT a code bug)

The file physically exists in **Live** storage but not in **Test** storage. When you click "View File" from the preview app, the edge function runs against the **Test** environment. It finds the `quote_files` database record (which was synced), but the actual storage blob was never copied to Test.

This is the documented behavior: **storage files (data) never sync between Test and Live environments.**

## Immediate Fix: Test from Published URL

To verify the feature works, use the published URL instead of the preview:
`https://window-man-truth-engine.lovable.app/admin/leads/e0a82a9f-d17a-4fdd-bbd7-68941d2c890c`

This hits the Live environment where the file actually exists.

## Code Improvement: Better Error Messaging

Even though the code is correct, we can improve the error response to help diagnose environment mismatches in the future.

### File: `supabase/functions/admin-lead-detail/index.ts` (lines 595-622)

**Before signing**, add a storage existence check and environment-aware logging:

1. After path normalization (line 583), add a `storage.objects` list check to verify the file exists before attempting to sign it
2. If the file doesn't exist in storage, return a more descriptive error that suggests an environment mismatch
3. Log the environment context (SUPABASE_URL hostname) to make it obvious which environment is being hit

**Changes:**

```typescript
// After line 593 (after diagnostic logging), add:

// Pre-check: verify object exists in storage before signing
const { data: objectList, error: listError } = await supabase
  .storage.from('quotes')
  .list(objectPath.substring(0, objectPath.lastIndexOf('/')), {
    search: objectPath.substring(objectPath.lastIndexOf('/') + 1),
    limit: 1,
  });

if (listError) {
  console.warn('[get_quote_file_url] List check failed:', listError.message);
  // Continue to sign attempt — list failure doesn't mean sign will fail
}

const objectExists = objectList && objectList.length > 0;
if (!objectExists) {
  const envHint = (Deno.env.get('SUPABASE_URL') || '').includes('localhost')
    ? 'local' : 'cloud';
  console.warn('[get_quote_file_url] Object NOT found in storage pre-check', {
    normalizedPath: objectPath,
    environment: envHint,
    supabaseUrlHost: new URL(Deno.env.get('SUPABASE_URL') || 'http://x').hostname,
  });
}
```

Then update the sign-failure response (line 606-621) to include the pre-check result:

```typescript
// In the sign failure response details, add:
object_found_in_storage: objectExists,
environment_hint: 'File may exist in Live but not Test. Try the published URL.',
```

## Scope

- **1 file changed**: `supabase/functions/admin-lead-detail/index.ts`
- ~20 lines added (pre-check + enhanced error details)
- Zero breaking changes — the happy path is unchanged
- Redeploy of the edge function is automatic

