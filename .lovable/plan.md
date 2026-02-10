

# Fix Meta Event Deduplication: Strip Prefixed `event_id` from All 12 Files

## Problem

Meta deduplication requires the browser-side `event_id` to exactly match the server-side `event_id`. Currently, the browser sends prefixed strings (e.g., `lead_captured:550e8400-...`) while the server sends raw UUIDs (`550e8400-...`). This mismatch causes double-counting of conversions.

## The Fix

In every file that calls `trackLeadSubmissionSuccess`, change the `eventId` from a prefixed string to the raw `leadId` UUID.

## Files to Update (11 call sites + 1 test + 1 validator)

### Lead Capture Call Sites

1. `src/hooks/useLeadFormSubmit.ts` -- change `eventId: \`lead_captured:${leadId}\`` to `eventId: leadId`
2. `src/components/conversion/LeadCaptureModal.tsx` -- same change
3. `src/components/conversion/ConsultationBookingModal.tsx` -- same change
4. `src/components/conversion/EbookLeadModal.tsx` -- same change
5. `src/components/quote-scanner/ScannerLeadCaptureModal.tsx` -- same change
6. `src/pages/QuoteScanner.tsx` -- same change
7. `src/pages/Consultation.tsx` -- same change
8. `src/components/quote-builder/LeadModal.tsx` -- same change
9. `src/hooks/useQuoteBuilder.ts` -- same change
10. `src/components/beat-your-quote/MissionInitiatedModal.tsx` -- same change
11. `src/components/sample-report/SampleReportAccessGate.tsx` (line 181) -- change `eventId: \`sample_report_gate:${data.leadId}\`` to `eventId: data.leadId`

### Validator Update

12. `src/lib/emqValidator.ts` -- Update comments in `isValidEventId` to note that plain UUID is the primary/recommended format. The `event_type:uuid` pattern remains accepted as a fallback but is no longer preferred. Logic stays as-is since it already accepts both formats.

### Test Update

13. `src/lib/__tests__/gtm-tracking.test.ts` -- Update the test that passes `lead_captured:test-lead-456` to pass a raw UUID instead (e.g., `test-lead-456` or a proper UUID string).

## What Does NOT Change

- The `trackLeadSubmissionSuccess` function signature (it already accepts any string as `eventId`)
- The `save-lead` Edge Function (already sends raw UUID)
- GTM configuration (already updated to read `event_id` from dataLayer)
- No new dependencies, no database changes, no new files

## Expected Outcome

After deployment, the browser pixel and server CAPI will send identical `event_id` values (raw UUIDs), bringing Meta's Event Coverage Rate from approximately 8% to approximately 97% and enabling proper deduplication.

