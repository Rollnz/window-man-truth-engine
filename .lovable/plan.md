

# Add "No Quote Yet? Download Sample" Secondary CTA to the Before Card

## What Changes

Add a secondary conversion path inside the "Before Card" (`QuoteUploadZone.tsx`) upload overlay. Below the existing "Upload Your Quote" button, a divider label ("No Quote To Analyze Yet?") and a secondary "Download Sample" button will appear, matching the reference screenshot.

## Visual Layout (Before Upload State Only)

```text
  +----------------------------------+
  |    [scan icon]                   |
  |    Analyze Quote                 |
  |    Take a photo or upload...     |
  |                                  |
  |  [ Upload Your Quote ]  (primary)|
  |                                  |
  |  No Quote To Analyze Yet?        |
  |                                  |
  |  [ Download Sample ]  (secondary)|
  +----------------------------------+
```

The secondary CTA only appears in the "before upload" state (no image preview, not analyzing). It disappears once a file is selected.

## File Changes

### `src/components/quote-scanner/QuoteUploadZone.tsx`

1. Add new props to the interface:
   - `onNoQuoteClick?: () => void` -- callback when "Download Sample" is clicked

2. Inside the upload overlay `div` (lines 226-241), after the `<Button>Upload Your Quote</Button>`, add:
   - A divider: bold text "No Quote To Analyze Yet?" (`text-sm font-bold text-foreground mt-4`)
   - A secondary button: "Download Sample" using `variant="cta"` with orange/secondary styling (matching the screenshot's orange button), calling `onNoQuoteClick` and firing a `trackEvent('no_quote_sample_click', { location: 'before_card' })`

3. Import `trackEvent` from `@/lib/gtm`

### `src/pages/QuoteScanner.tsx`

1. Add state: `const [sampleGateOpen, setSampleGateOpen] = useState(false)`
2. Add a ref for focus restoration: `const sampleGateTriggerRef = useRef<HTMLElement>(null)`
3. Pass `onNoQuoteClick={() => setSampleGateOpen(true)}` to the `QuoteUploadZone` component
4. Import and render `SampleReportGateModal` at the bottom of the page with `isOpen={sampleGateOpen}`, `onClose={() => setSampleGateOpen(false)}`, and `returnFocusRef={sampleGateTriggerRef}`
5. Import `SampleReportGateModal` from `@/components/audit/SampleReportGateModal`

## Analytics

| Event | Location | Fires When |
|---|---|---|
| `no_quote_sample_click` | `before_card` | User clicks "Download Sample" button |

The `SampleReportGateModal` already tracks its own open/close/submit/success events internally.

## What Does NOT Change

- No new files created
- No database changes
- No new dependencies
- The "after upload" state (Analyze Another / Select Different File) is untouched
- The existing `NoQuotePathway` section further down the page remains as-is
- All existing upload logic, drag-and-drop, and analysis flow untouched
