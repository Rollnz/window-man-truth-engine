

# Fix Private Bucket File Viewing + Add 1-Click "View Original Quote" Button

## Summary

The `quotes` storage bucket is private (service_role only). The current `FilesWidget` uses client-side `createSignedUrl` which silently fails for all admins. This plan adds a server-side signed URL action and wires it through the UI, fixing existing file viewing and adding a prominent "View Original Quote" button.

## Changes

### 1. Backend: Add `get_quote_file_url` action to `admin-lead-detail/index.ts`

Add a new action block (after `force_fail_analysis`, before opportunity CRUD) that:

- Validates `fileId` is present and a valid UUID
- Queries `quote_files` by `id = fileId`, selecting `id, lead_id, file_path`
- Cross-lead guard: confirms `quote_files.lead_id === resolution.lead_id` (the `leads.id` foreign key used by `quote_files`, NOT `wm_leads.id`)
- Generates signed URL: `supabase.storage.from('quotes').createSignedUrl(file_path, 600)`
- Returns `{ ok: true, signedUrl }` on success
- Returns 400 for missing/invalid fileId, 404 for not found or wrong lead, 500 for signing failure

### 2. Hook: Add `getQuoteFileUrl` to `useLeadDetail.ts`

- Add a new async function `getQuoteFileUrl(fileId: string): Promise<string | null>`
- Uses a dedicated fetch (not `callAction` which returns boolean) to POST the action and parse the JSON response for `signedUrl`
- Shows destructive toast on error, returns null
- Add to the hook return object and interface

### 3. UI: Fix `FilesWidget.tsx`

- Remove direct `supabase.storage` import and client-side signing
- Accept new prop: `getQuoteFileUrl: (fileId: string) => Promise<string | null>`
- The ExternalLink button per row now calls `getQuoteFileUrl(file.id)`, shows a per-row loading state, and opens the result in a new tab
- Add "View file" tooltip to the ExternalLink button

### 4. UI: Add "View Original Quote" button in `LeadDetail.tsx`

- Add a button between `SalesIntelCard` and the 3-pane grid
- Only renders when `files.length > 0`
- Label: "View Original Quote", icon: `FileText`, variant: `outline`
- On click: calls `getQuoteFileUrl(files[0].id)`, opens result in new tab
- Shows `Loader2` spinner while loading, disabled during fetch
- Pass `getQuoteFileUrl` as prop to `FilesWidget`

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/admin-lead-detail/index.ts` | Add `get_quote_file_url` action (~35 lines) |
| `src/hooks/useLeadDetail.ts` | Add `getQuoteFileUrl` function + export |
| `src/components/lead-detail/FilesWidget.tsx` | Replace client signing with prop callback, add tooltip + loading |
| `src/pages/admin/LeadDetail.tsx` | Add "View Original Quote" button, wire prop |

## Technical Details

### Cross-lead guard (critical)

The GET handler fetches `quote_files` using `.eq('lead_id', lead.lead_id)` -- this is `leads.id`, not `wm_leads.id`. So the guard in the new action must use `resolution.lead_id`:

```text
query: quote_files.id = fileId
guard: file.lead_id === resolution.lead_id
```

### Edge function signing

The edge function already creates a service-role client (line 55-58), which has full storage access. `supabase.storage.from('quotes').createSignedUrl(file_path, 600)` will work without any policy changes.

### No database or storage changes required

