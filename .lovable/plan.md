

# Cleanup: Remaining PENDING Items from Master Plan v3.0

## What I Found

### 1. MissionInitiatedModal.tsx -- 2 raw `dataLayer.push` calls
- **Line 82-93**: `mission_modal_opened` -- raw push with no `meta` object
- **Line 145-160**: `mission_form_completed` -- raw push with no `meta` object and `user_data` containing raw (unhashed) first/last name

Both bypass the firewall. Neither carries value/currency so they are not actively polluting ad bids, but they violate the "every event gets a `meta` object" contract.

### 2. toolDeltaValues.ts -- numeric `deltaValue` fields still present
The `deltaValue` numbers (100, 60, 35, 10) are still in every config entry. `useTrackToolCompletion` already fires `wmRetarget` (no value), so these numbers are **inert** -- only logged to dev console. But they are confusing leftovers from the old "engagement economy."

### 3. gtm.ts -- deprecated legacy conversion functions still exported
These are all marked `@deprecated` and have **zero callers** in production code (only referenced in test files and the `window.truthEngine` debug object):

| Function | Lines | Legacy Event Name | Value |
|---|---|---|---|
| `trackLeadSubmissionSuccess` | 568-658 | `lead_submission_success` | $15 |
| `trackQuoteUploadSuccess` | 703-779 | `quote_upload_success` | $50 |
| `trackPhoneLead` | 795-847 | `phone_lead_captured` | $25 |
| `trackConsultationBooked` | 858-911 | `consultation_booked` | $75 |
| `trackBookingConfirmed` | 923-985 | `booking_confirmed` | $75 |
| `trackOfflineConversion` | 1134-1146 | `offline_conversion` | variable |
| `trackConversionValue` | 1186-1236 | arbitrary | variable |

Also: `LeadSubmissionSuccessInput` interface (520-535) and `QuoteUploadSuccessInput` interface (668-679).

The `TruthEngine` interface and `installTruthEngine()` still reference the deprecated functions on `window.truthEngine`.

### 4. Test file and verification utility still import deprecated functions
- `src/lib/__tests__/lead-capture-integration.test.ts` -- imports and calls `trackLeadSubmissionSuccess`, `trackBookingConfirmed`, `trackConsultationBooked`
- `src/lib/trackingVerificationTest.ts` -- imports `trackLeadSubmissionSuccess`
- `src/lib/secondarySignalEvents.ts` -- exports its own `trackBookingConfirmed` (separate file, different function)

---

## Plan

### A. MissionInitiatedModal.tsx -- migrate raw pushes to `wmRetarget`

Replace the two `window.dataLayer.push(...)` blocks:

1. **`mission_modal_opened`** (lines 80-93): Replace with `wmRetarget('wm_mission_modal_opened', { source_tool, modal_name, quote_file_id })`. Remove `client_id`, `session_id`, `external_id` (those belong in the `wmRetarget` helper already via page context).

2. **`mission_form_completed`** (lines 144-160): Replace with `wmRetarget('wm_mission_form_completed', { source_tool, form_name, quote_file_id })`. Remove raw `user_data` block (first/last name was being pushed **unhashed** -- a PII leak).

3. Remove now-unused imports: `getOrCreateClientId`, `getOrCreateSessionId` from `@/lib/tracking`, and `getLeadAnchor` from `@/lib/leadAnchor` (if no longer used elsewhere in the file).

### B. toolDeltaValues.ts -- remove `deltaValue` from the config

1. Remove `deltaValue` from the `ToolDeltaConfig` interface.
2. Remove `deltaValue` from every entry in `TOOL_DELTA_VALUES`.
3. Delete the `getToolDeltaValue()` helper function.
4. Update `getToolDeltaConfig()` fallback to exclude `deltaValue`.
5. Update `useTrackToolCompletion.ts` line 121 to remove the `delta: config.deltaValue` dev log reference.
6. Update `src/types/tracking.ts` to remove the `deltaValue` field from `ToolCompletionEvent`.
7. Update the file's header comment to clarify these are **RT-only tool completion configs**, not bidding values.

### C. gtm.ts -- delete deprecated conversion functions

Delete these exports entirely (definitions + their interfaces):

- `trackLeadSubmissionSuccess` + `LeadSubmissionSuccessInput` (lines 515-658)
- `trackQuoteUploadSuccess` + `QuoteUploadSuccessInput` (lines 660-779)
- `trackPhoneLead` (lines 782-847)
- `trackConsultationBooked` (lines 849-911)
- `trackBookingConfirmed` (lines 914-985)
- `trackOfflineConversion` (lines 1130-1146)
- `trackConversionValue` (lines 1180-1236)
- `LEAD_VALUE` and `LEAD_CURRENCY` constants (lines 37-38)

Update `TruthEngine` interface and `installTruthEngine()` to remove the 4 deprecated function references, keeping only the canonical `wm*` functions.

### D. Update test files and verification utility

- `src/lib/__tests__/lead-capture-integration.test.ts`: Rewrite tests to use `wmLead`, `wmAppointmentBooked` instead of the deleted functions.
- `src/lib/trackingVerificationTest.ts`: Replace `trackLeadSubmissionSuccess` call with `wmLead`.

### E. secondarySignalEvents.ts -- leave as-is

This file has its own `trackBookingConfirmed` (different function, different file). It does NOT import from `gtm.ts`. No changes needed.

---

## What Does NOT Change
- `wmTracking.ts` -- already correct, no edits
- `useTrackToolCompletion.ts` -- already fires `wmRetarget`, only removing the `deltaValue` dev log
- `analytics.ts` / `useCanonicalScore.ts` -- already neutralized in prior steps
- No database or schema changes
- No edge function changes

## Risk Assessment
- **Low risk**: All deleted functions have zero production callers (confirmed by search)
- The `secondarySignalEvents.ts` file has its own unrelated `trackBookingConfirmed` -- it is not affected
- Test files will be updated to prevent build failures
