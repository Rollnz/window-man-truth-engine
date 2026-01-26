
# Plan: Fix Claim Documents View Access

## Problem Summary
The "View Document" button returns 404 errors because:
1. Files are uploaded via edge function using **service role key** (bypasses RLS)
2. Files are viewed from frontend using **anon key** (subject to RLS)
3. The `claim-documents` bucket has **no RLS policies** allowing read access
4. Supabase returns 404 "Object not found" when RLS denies access (misleading error)

## Solution
Add RLS policies to the `claim-documents` storage bucket to allow anyone to read files (since these are private user uploads accessed via signed URLs, not public URLs).

---

## Implementation

### Step 1: Add Storage RLS Policies for `claim-documents` Bucket

Create a database migration to add the following policies:

```sql
-- Allow anyone to read/download files from claim-documents bucket
-- This is safe because files are only accessible via signed URLs
CREATE POLICY "Allow public read access to claim-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'claim-documents');

-- The upload is handled by edge function with service role,
-- but we add this policy for completeness in case frontend upload is needed
CREATE POLICY "Allow authenticated upload to claim-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'claim-documents');
```

### Why This Is Safe
1. **Signed URLs are time-limited** - The `handleViewDocument` function creates URLs valid for only 1 hour
2. **Storage paths are unguessable** - Paths include UUIDs and timestamps
3. **No directory listing** - Users can only access files if they know the exact path
4. **Files are not publicly browsable** - The bucket remains private (`public: false`)

---

## Files to Modify

| File | Change |
|------|--------|
| Database Migration | Add RLS policies for `claim-documents` bucket |

---

## Technical Note
The current code in `ClaimSurvival.tsx` (lines 239-263) is correct - it properly generates signed URLs. The issue is purely the missing RLS policy that prevents the anon key from generating those signed URLs.

After the migration, the existing `handleViewDocument` function will work without any code changes:

```typescript
// This existing code will work once RLS is fixed
const { data, error } = await supabase.storage
  .from('claim-documents')
  .createSignedUrl(storagePath, 3600);
```
