

# Audit: Meta CAPI Deduplication via eventId in trackLeadSubmissionSuccess

## Finding

Only **1 out of 16** form components explicitly passes `eventId` to `trackLeadSubmissionSuccess`. The other 15 rely on the fallback in `gtm.ts` line 581, which generates a **random UUID** instead of using `leadId`.

This breaks Meta CAPI deduplication because:
- **Browser side** (GTM): sends a random `event_id`
- **Server side** (save-lead): sends `leadId` as `event_id`
- Meta sees these as two different events and double-counts conversions

## Call Site Inventory

| # | Component | Passes eventId? | Status |
|---|-----------|----------------|--------|
| 1 | SampleReportAccessGate | Yes (`eventId: data.leadId`) | OK |
| 2 | PreQuoteLeadModal | No | BROKEN |
| 3 | PreQuoteLeadModalV2 | No | BROKEN |
| 4 | SampleReportLeadModal | No | BROKEN |
| 5 | ConsultationBookingModal | No | BROKEN |
| 6 | EbookLeadModal | No | BROKEN |
| 7 | LeadCaptureModal | No | BROKEN |
| 8 | MissionInitiatedModal | No | BROKEN |
| 9 | ScannerLeadCaptureModal | No | BROKEN |
| 10 | LeadModal (quote-builder) | No | BROKEN |
| 11 | useQuoteBuilder hook | No | BROKEN |
| 12 | useLeadFormSubmit hook | No | BROKEN |
| 13 | QuoteScanner page | No | BROKEN |
| 14 | FairPriceQuiz page | No | BROKEN |
| 15 | Consultation page | No | BROKEN |
| 16 | EstimateSlidePanel | Uses trackLeadCapture only (no trackLeadSubmissionSuccess) | N/A |

## Root Cause

In `src/lib/gtm.ts`, line 581:
```
const eventId = params.eventId || generateEventId();
```

The fallback is `generateEventId()` (random UUID) instead of `params.leadId`.

## Fix (1 line, fixes all 15 broken sites)

**File:** `src/lib/gtm.ts`, line 581

Change:
```typescript
const eventId = params.eventId || generateEventId();
```
To:
```typescript
const eventId = params.eventId || params.leadId || generateEventId();
```

This makes `leadId` the automatic fallback for `eventId`, matching what the server-side `save-lead` function sends to Meta CAPI. All 15 form components are instantly fixed without modifying any of them individually.

The one component that already passes `eventId: data.leadId` (SampleReportAccessGate) continues to work identically since the explicit `eventId` takes precedence.

## No other changes needed

- No form components need editing
- No edge functions need editing
- The server-side `save-lead` already uses `leadId` as Meta's `event_id`
- The `trackLeadCapture` function already uses `params.leadId` as fallback (no issue there)

