

# Fix Warning Bubbles, Image Preview & Add Click-to-Scroll

## Problems Identified

1. **Image not showing**: The `img` tag hardcodes `data:image/jpeg;base64,...` but the uploaded file's mime type could be `image/png`, `image/webp`, or `application/pdf`. PDFs cannot render as `<img>` tags at all -- this is why the Before card is blank after upload.
2. **Warning bubbles invisible**: The bubbles render at `z-[5]` but the "Analyze Another Quote" CTA overlay sits at `z-10`, covering them entirely.
3. **No click-to-scroll**: Bubbles are not interactive -- no `onClick`, no `cursor-pointer`, no scroll targets on the score rows.
4. **No entrance animation**: Bubbles lack a dramatic staggered reveal.

## File Changes

### 1. `src/components/quote-scanner/QuoteUploadZone.tsx`

**Fix image rendering (line 134):**
- Accept `mimeType` as a new prop alongside `imagePreview`
- Change the `src` from hardcoded `data:image/jpeg;base64,...` to `data:${mimeType || 'image/jpeg'};base64,...`
- For PDFs (`application/pdf`), render a placeholder card instead of a broken `<img>` tag (a FileText icon + "PDF Document Uploaded" label with a blurred background)

**Fix z-index layering (lines 142-146):**
- Change warning bubble z-index from `z-[5]` to `z-30` so they sit above both the image and the CTA overlay
- Move the "Analyze Another Quote" CTA to `z-20` (below bubbles but above image)

**Add `onWarningSelect` callback prop:**
- New prop: `onWarningSelect?: (categoryKey: string) => void`
- Add a `categoryKey` field to `getTopWarnings` output (values: `'safety'`, `'scope'`, `'price'`, `'finePrint'`, `'warranty'`)
- Wrap each `EnhancedFloatingCallout` in a clickable `<button>` with `cursor-pointer` and `hover:scale-105 transition-transform`
- On click, call `onWarningSelect(categoryKey)`

**Add dramatic reveal animation:**
- Use Tailwind `animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500 ease-out` classes
- Staggered delays: 0ms, 300ms, 600ms
- Start with `opacity-0` and use `fill-mode-forwards` so bubbles stay hidden until their delay fires

### 2. `src/components/quote-scanner/EnhancedFloatingCallout.tsx`

**Add `onClick` prop:**
- New optional prop: `onClick?: () => void`
- When provided, add `cursor-pointer hover:scale-105 transition-transform` to the outer div
- Attach the `onClick` handler to the outer div

### 3. `src/components/quote-scanner/QuoteAnalysisResults.tsx`

**Add scroll-target IDs to ScoreRow:**
- Add an `id` prop to `ScoreRow`
- Each ScoreRow gets a unique ID: `score-row-safety`, `score-row-scope`, `score-row-price`, `score-row-fineprint`, `score-row-warranty`

### 4. `src/pages/QuoteScanner.tsx`

**Pass new props and handle scroll:**
- Pass `mimeType` (from `useQuoteScanner`) to `QuoteUploadZone`
- Add `onWarningSelect` handler that finds the element by ID (`#score-row-${key}`) and calls `scrollIntoView({ behavior: 'smooth', block: 'center' })`

### 5. `src/hooks/useQuoteScanner.ts`

No changes needed -- `mimeType` is already exposed in the return value.

## Summary of Visual Behavior

| State | Before Card |
|-------|-------------|
| No upload | Sample document + 4 static callouts |
| Analyzing | Spinner overlay |
| Post-analysis (image) | Uploaded image visible (correct mime type) + 3 dynamic warning bubbles with dramatic stagger entrance + "Select Different File" below |
| Post-analysis (PDF) | PDF placeholder card + 3 dynamic warning bubbles |

## What Does NOT Change

- Props interface shape (only additive new optional props)
- Form validation, API calls, tracking
- Pre-upload static callouts
- The "After" gradecard display logic

