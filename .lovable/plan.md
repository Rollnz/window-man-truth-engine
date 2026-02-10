

# Wire "Download Sample" Button to PreQuoteLeadModal + Cleanup

## Summary

Replace the `SampleReportGateModal` on the AI Scanner page with the unified `PreQuoteLeadModal`, and fully remove the dead modal code to prevent future confusion.

## Changes

### 1. `src/pages/QuoteScanner.tsx`

**Remove:**
- Import of `SampleReportGateModal` (line 30)
- State: `sampleGateOpen` / `setSampleGateOpen` (line 70)
- Ref: `sampleGateTriggerRef` (line 75)
- The `<SampleReportGateModal>` JSX block (lines 313-317)

**Add:**
- Import `PreQuoteLeadModal` from `@/components/sample-report/PreQuoteLeadModal`
- State: `const [preQuoteOpen, setPreQuoteOpen] = useState(false)`
- Update `onNoQuoteClick` handler (line 156): change from `() => setSampleGateOpen(true)` to `() => setPreQuoteOpen(true)`
- Render `<PreQuoteLeadModal isOpen={preQuoteOpen} onClose={() => setPreQuoteOpen(false)} ctaSource="scanner_download_sample" />` in place of the removed `SampleReportGateModal`

### 2. No changes to other files

- `QuoteUploadZone` -- same `onNoQuoteClick` prop interface, no change needed.
- `PreQuoteLeadModal` -- already accepts `ctaSource` prop, no modification required.

## What Is NOT Changing

- The orange button styling, text, and position -- untouched (lives in QuoteUploadZone).
- The `PreQuoteLeadModal` form, validation, tracking, and success state -- zero changes.
- Post-submission routing (deferred to a future prompt -- currently shows generic success with "Go to Quote Scanner" button).
- Scroll lock is handled by Radix Dialog internally -- no additional work needed.

## Technical Detail

```text
Current flow:
  "Download Sample" click -> onNoQuoteClick() -> setSampleGateOpen(true) -> SampleReportGateModal

New flow:
  "Download Sample" click -> onNoQuoteClick() -> setPreQuoteOpen(true) -> PreQuoteLeadModal (ctaSource='scanner_download_sample')
```

