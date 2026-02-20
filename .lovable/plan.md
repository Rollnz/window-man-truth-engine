

# Fix: Add Diagnostic Logging + Path Normalization to `get_quote_file_url`

## Root Cause (Confirmed)

The code is architecturally correct -- it already uses the service-role client (`SUPABASE_SERVICE_ROLE_KEY` on line 57) and the correct bucket name (`quotes`). The "Object not found" error occurs because:

- The `quote_files` database rows reference paths like `167a06f9.../...png`
- Those storage objects exist in **Live** storage but **not in Test** storage
- Storage files never sync between environments

**This will work in production once published.** However, we should still add robust logging and path normalization so failures are immediately diagnosable.

## Changes

### 1. Update `supabase/functions/admin-lead-detail/index.ts` (lines 549-585)

Replace the current `get_quote_file_url` block with an enhanced version that adds:

**Diagnostic logging before signing:**
- Bucket name
- fileId
- DB row values (lead_id, file_path)
- Whether SUPABASE_URL is set, service role key length (not the key itself)

**Path normalization:**
- Strip leading `quotes/` prefix if present
- Strip leading `/` if present
- If path contains `/object/`, extract the object key portion
- Reject empty paths with 400

**Detailed error response on failure:**
- Include `bucket`, `fileId`, `file_path` (original from DB), `normalized_path`, and `storage_error` in the `details` field

**Success logging:**
- Log confirmation when signed URL is generated successfully

### Technical Detail

```text
Before (line 573):
  const { data: signedData, error: signError } = await supabase
    .storage.from('quotes')
    .createSignedUrl(file.file_path, 600);

After:
  // Normalize path
  let objectPath = file.file_path;
  if (objectPath.startsWith('quotes/')) objectPath = objectPath.slice(7);
  if (objectPath.startsWith('/')) objectPath = objectPath.slice(1);
  if (objectPath.includes('/object/')) {
    objectPath = objectPath.split('/object/').pop() || '';
    if (objectPath.startsWith('quotes/')) objectPath = objectPath.slice(7);
  }
  if (!objectPath) return errorResponse(400, 'invalid_file_path', '...');

  // Diagnostic log
  console.log('[get_quote_file_url] Signing:', {
    bucket: 'quotes', fileId, file_path: file.file_path,
    normalizedPath: objectPath,
    hasUrl: !!Deno.env.get('SUPABASE_URL'),
    srkLen: (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').length
  });

  const { data: signedData, error: signError } = await supabase
    .storage.from('quotes')
    .createSignedUrl(objectPath, 600);

  // Enhanced error with details
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/admin-lead-detail/index.ts` | Enhanced `get_quote_file_url` with logging + path normalization |

## Testing

- After deploying, the button will still return "Object not found" in Test for leads whose files only exist in Live -- this is expected.
- **To verify end-to-end:** publish to Live and test with a real lead, or upload a new file in Test and use that lead.
- The improved logging will now show exactly what path was attempted, making any future issues immediately diagnosable.

