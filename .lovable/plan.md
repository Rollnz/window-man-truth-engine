

# Fix Broken "Before" Card: Smart FilePreviewCard (Revised)

## Summary

Replace raw `<img>` tags that break on PDF uploads with a smart `FilePreviewCard` component across all three render sites: the locked/analyzing "Before" block in QuoteScanner, the AnalysisTheaterScreen, and the UploadZoneXRay left panel on /audit.

---

## All 6 Gaps Addressed

### Gap 1: AnalysisTheaterScreen (third blob preview)

`AnalysisTheaterScreen` (line 35-39) renders `previewUrl` in an `<img>` -- breaks for PDFs. Will update its props to accept `fileName` and `fileType`, and replace the `<img>` with `FilePreviewCard`. QuoteScanner.tsx line 221 will pass the new props.

### Gap 2: File size after refresh

`fileSize` will be persisted alongside `fileName`/`fileType` in sessionStorage. `FilePreviewCard` accepts an optional `fileSize?: number` prop so it can display size even when the `File` object is gone.

### Gap 3: Post-refresh placeholder location

On refresh, `useGatedAIScanner` sets phase to `idle` and shows `recoveryMessage`. The upload zone is shown in idle phase, so there's no "Before" card rendered. Decision: **no placeholder card is shown after refresh** -- the recovery message text strip (lines 114-118 in QuoteScanner.tsx) is sufficient. The persisted `fileName`/`fileType` will be used to enrich the recovery message text (e.g. "We lost your upload of **window-quote.pdf** due to a browser refresh.") instead of rendering a separate card.

### Gap 4: Backward compatibility for persisted state

`readPersistedState()` will read with fallbacks: `fileName ?? null`, `fileType ?? null`, `fileSize ?? null`. Old payloads without these keys will not break.

### Gap 5: Image detection when File is missing

The component uses `fileType` (string prop) as the source of truth when `file` is null. Logic: `const isImage = (file?.type || fileType || '').startsWith('image/') && !!previewUrl && !imageError`. Explicit and unambiguous.

### Gap 6: Accessibility

The document placeholder will have `role="img"` and `aria-label="Document preview: {filename}"`. The `<img>` tag already has `alt` text.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/FilePreviewCard.tsx` | **New** -- smart preview component |
| `src/hooks/useGatedAIScanner.ts` | Add `fileName`, `fileType`, `fileSize` to state + persistence + recovery |
| `src/hooks/audit/useGatedScanner.ts` | Expose `fileName`, `fileType`, `fileSize` from state (no persistence) |
| `src/components/quote-scanner/AnalysisTheaterScreen.tsx` | Accept `fileName`/`fileType`/`fileSize` props, use `FilePreviewCard` |
| `src/pages/QuoteScanner.tsx` | Pass new props to AnalysisTheaterScreen + use FilePreviewCard in locked/analyzing block + enrich recovery message |
| `src/components/audit/UploadZoneXRay.tsx` | Accept `fileName`/`fileType`/`fileSize` props, use `FilePreviewCard` in left panel |
| `src/pages/Audit.tsx` | Pass `scanner.fileName`, `scanner.fileType`, `scanner.fileSize` to UploadZoneXRay |

---

## Technical Details

### FilePreviewCard.tsx

```text
Props:
  file?: File | null          -- live File object (if available)
  previewUrl?: string | null  -- blob URL
  fileName?: string           -- fallback from sessionStorage
  fileType?: string           -- fallback MIME type
  fileSize?: number           -- fallback size in bytes
  className?: string

Behavior:
  name = file?.name || fileName || "Document"
  type = file?.type || fileType || ""
  size = file?.size || fileSize || 0
  isImage = type.startsWith("image/") && !!previewUrl && !imageError

  Image path: <img> with onError -> setImageError(true) -> falls back to document path
  Document path: portrait container (aspect-[3/4]), FileText icon (cyan-400),
                 truncated filename, type badge + size
  Accessibility: role="img", aria-label="Document preview: {name}"
```

### useGatedAIScanner.ts changes

1. Extend `PersistedState` interface:
   ```text
   interface PersistedState {
     phase: 'locked' | 'analyzing';
     leadId: string | null;
     scanAttemptId: string;
     fileName?: string | null;   // NEW
     fileType?: string | null;   // NEW
     fileSize?: number | null;   // NEW
   }
   ```

2. Extend `GatedAIScannerState`:
   ```text
   fileName: string | null;
   fileType: string | null;
   fileSize: number | null;
   ```

3. In `handleFileSelect`: populate from `file.name`, `file.type`, `file.size`.

4. In `persistState` calls (closeModal + captureLead): include `fileName`, `fileType`, `fileSize` from state.

5. In mount recovery `useEffect`: read with fallbacks (`persisted.fileName ?? null`). Enrich `recoveryMessage` with filename if available: `"We lost your upload of {fileName}..."`.

6. Expose `fileName`, `fileType`, `fileSize` in return type.

### useGatedScanner.ts changes (audit hook)

1. Add `fileName: string | null`, `fileType: string | null`, `fileSize: number | null` to `GatedScannerState`.
2. Populate in `handleFileSelect` from `file.name`, `file.type`, `file.size`.
3. Add to `INITIAL_STATE` as `null`.
4. Expose in return. No sessionStorage persistence (audit hook doesn't use it).

### AnalysisTheaterScreen.tsx changes

1. Extend props:
   ```text
   interface AnalysisTheaterScreenProps {
     previewUrl?: string | null;
     fileName?: string;
     fileType?: string;
     fileSize?: number;
   }
   ```

2. Replace lines 33-41 (the `<img>` block) with `<FilePreviewCard>` passing all props. Keep the outer wrapper div with blur + overlay.

### QuoteScanner.tsx changes

1. **Lines 133-146** (locked/analyzing block): Replace raw `<img>` with `<FilePreviewCard file={gated.file} previewUrl={gated.filePreviewUrl} fileName={gated.fileName} fileType={gated.fileType} fileSize={gated.fileSize} className="w-full h-64" />`.

2. **Line 221** (AnalysisTheaterScreen): Add props `fileName={gated.fileName} fileType={gated.fileType} fileSize={gated.fileSize}`.

3. **Lines 114-118** (recovery message): If `gated.fileName` exists, include it in the message: "We lost your upload of **{fileName}**...".

### UploadZoneXRay.tsx changes

1. Add to props interface: `fileName?: string`, `fileType?: string`, `fileSize?: number`.

2. In `renderLeftPanel()` lines 148-155: Replace raw `<img>` with `<FilePreviewCard previewUrl={filePreviewUrl} fileName={fileName} fileType={fileType} fileSize={fileSize} />`. Keep existing blur/overlay logic on the wrapper.

### Audit.tsx changes

1. Pass three new props to `UploadZoneXRay`: `fileName={scanner.fileName}`, `fileType={scanner.fileType}`, `fileSize={scanner.fileSize}`.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| PDF upload | Document placeholder with icon, filename, size badge |
| Image upload | Normal `<img>` (existing behavior preserved) |
| Blob URL revoked | `onError` fires, auto-fallback to document placeholder |
| Page refresh (File lost) | `fileName`/`fileType`/`fileSize` restored from sessionStorage; recovery message includes filename; no card rendered (idle phase shows upload zone) |
| Old sessionStorage payload missing new keys | Read with `?? null` fallback; recovery works with generic "your upload" text |
| AnalysisTheaterScreen with PDF | Document placeholder inside blur container (no broken image) |
| Very long filename | Truncated with `truncate` class |

