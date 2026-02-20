

# Upgrade Consultation "Quote Details" to Combined Upload + Paste

## Summary

Replace the textarea-only "Upload or paste quote details" section (lines 452-461 of ConsultationForm.tsx) with a compact file upload dropzone above a textarea, separated by an "or" divider. Reuses the existing `QuoteUploadDropzone` component and `upload-quote` edge function. The uploaded file ID is threaded through to `save-lead` via the existing `sessionData` JSONB column -- no database migration needed.

---

## File 1: `src/components/consultation/ConsultationForm.tsx`

### What Changes

**Replace lines 452-461** (the "Quote Details" block) with a three-part layout:

**Part A: Compact QuoteUploadDropzone**
- Import `QuoteUploadDropzone` from `@/components/beat-your-quote/QuoteUploadDropzone`
- Render with `compact={true}` and `sourcePage="consultation"`
- Add two local state variables at the top of the component:
  - `uploadedFileId: string | null` (default `null`)
  - `uploadedFileName: string | null` (default `null`)
- `onSuccess` callback: set both state variables from the returned `fileId` and reconstruct the filename from the path
- `onError` callback: show a `toast.error()` with the error message (reuses existing `sonner` import pattern from Consultation.tsx)

**Part B: "or" divider**
- Single line: `<div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="flex-1 h-px bg-border" /><span>or</span><div className="flex-1 h-px bg-border" /></div>`
- Height cost: 24px total

**Part C: Textarea (simplified label)**
- Same textarea, but label changes from "Upload or paste quote details" to "Paste quote details"
- Reduce `rows` from 4 to 3 to offset the added dropzone height
- Everything else identical (onChange, placeholder, etc.)

**Part D: File attached state**
- When `uploadedFileId` is not null AND the dropzone is in success state, the `QuoteUploadDropzone` already renders its own success card with "Upload Another Quote" button -- this handles the "file preview" display automatically
- Add a small "Quote Detected" badge below the dropzone success state: `<span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="w-3 h-3" /> Quote attached to your submission</span>`
- This badge confirms the file will be included when the form submits

**Part E: Remove lifecycle**
- The `QuoteUploadDropzone` already has a "Upload Another Quote" button in its success state that calls `reset()` internally
- When the dropzone resets (user clicks "Upload Another Quote" or removes a selected file), the `onSuccess` callback won't fire, but we need to also clear `uploadedFileId` and `uploadedFileName`
- Solution: Track the dropzone's reset by checking if `lastUpload` goes back to null -- or simpler: add a small "Remove attachment" text button next to the badge that sets both state vars back to `null`

**Part F: State integrity**
- `uploadedFileId` and `uploadedFileName` are stored as `useState` at the component level, separate from `formData`
- They survive form validation errors (validation only touches `errors` state, not upload state)
- They are passed upward via the existing `onSubmit(data)` callback by extending the data object

### Threading file ID to parent

Update `handleSubmit` (line 216-237): Before calling `onSubmit(formData as ConsultationFormData)`, spread in the upload fields:

```typescript
const submissionData = {
  ...formData,
  quoteFileId: uploadedFileId || undefined,
  quoteFileName: uploadedFileName || undefined,
} as ConsultationFormData;
await onSubmit(submissionData);
```

### Mobile height budget

| Element | Height |
|---|---|
| Compact dropzone (min-h-[120px], p-4) | ~120px |
| "or" divider | ~24px |
| Textarea (3 rows) | ~80px |
| Total | ~224px |
| Current textarea (4 rows) | ~100px |
| **Net increase** | **~124px** |

When a file is attached, the dropzone's success state replaces the dropzone (~100px), so the total is roughly equal to the current layout. The form card scrolls naturally within the page, so this does not cause viewport overflow.

---

## File 2: `src/types/consultation.ts`

### What Changes

Add two optional fields to `ConsultationFormData`:

```typescript
quoteFileId?: string;
quoteFileName?: string;
```

These are optional because file upload is not required. No other type changes needed.

---

## File 3: `src/pages/Consultation.tsx`

### What Changes

Update `handleSubmit` (line 39) to include the upload fields in the `sessionData` payload sent to `save-lead`:

```typescript
sessionData: {
  clientId,
  propertyType: data.propertyType,
  windowCount: data.windowCount,
  cityZip: data.cityZip,
  impactRequired: data.impactRequired,
  hasQuote: data.hasQuote,
  quoteCount: data.quoteCount,
  windowTypes: data.windowTypes,
  concern: data.concern,
  quoteDetails: data.quoteDetails,
  quoteFileId: data.quoteFileId,    // NEW
  quoteFileName: data.quoteFileName, // NEW
}
```

No other changes. The `save-lead` edge function already stores `sessionData` as JSONB -- no backend update needed.

---

## What Already Works (No Changes Needed)

- **`QuoteUploadDropzone`** already accepts `sourcePage` and `compact` props (confirmed from the component code) -- no interface update needed
- **`useQuoteUpload` hook** already handles client-side validation (file type: PDF/JPG/PNG, max 10MB), progress bar, error display with retry, and loading spinner -- all production-grade error/loading states are built in
- **`upload-quote` edge function** already stores files in the `quotes` bucket with session metadata -- reused as-is
- **Storage bucket** (`quotes`) already exists with appropriate policies

---

## Safety and Logic Layer (Addressing All Gaps)

| Concern | How It Is Handled |
|---|---|
| **Loading/Error UI** | Built into `QuoteUploadDropzone`: progress bar during upload, red error card with message on failure, retry via re-selecting file |
| **Client-side validation** | Built into `useQuoteUpload`: checks file type (PDF/JPG/PNG only) and size (max 10MB) before any network call |
| **State integrity on validation errors** | `uploadedFileId` is a separate `useState`, not part of `formData` -- form validation errors do not clear it |
| **Remove clears payload** | Explicit: "Remove attachment" button sets `uploadedFileId = null` and `uploadedFileName = null`, so cleared IDs are never sent to `save-lead` |
| **Component props** | `QuoteUploadDropzone` already accepts `sourcePage` prop and passes it through to `useQuoteUpload` -- no interface update required |
| **Ghost file on failure** | `useQuoteUpload` never sets `lastUpload.success = true` on error, so `uploadedFileId` stays `null` -- impossible to attach a failed upload |

---

## Files Modified

1. **`src/components/consultation/ConsultationForm.tsx`** -- Import `QuoteUploadDropzone`, add upload state, replace quote details section with upload + divider + textarea layout, thread file ID into submission data
2. **`src/types/consultation.ts`** -- Add optional `quoteFileId` and `quoteFileName` fields
3. **`src/pages/Consultation.tsx`** -- Pass `quoteFileId` and `quoteFileName` in `sessionData` to `save-lead`

No new files. No new edge functions. No database migrations. No new storage buckets. No new dependencies.

