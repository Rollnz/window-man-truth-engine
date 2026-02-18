

# Refactor Full-Funnel Audit to Canonical wmTracking Events

## Problem

`src/lib/fullFunnelTrackingAudit.ts` fires 6 legacy events (`lead_form_opened`, `scanner_upload`, `quote_upload_success`, `call_initiated`, `engagement_score`, `lead_submission_success`) with wrong values and bypasses the `wmTracking.ts` firewall entirely. The UI page (`src/pages/admin/FullFunnelAudit.tsx`) references these legacy event names in its icon map and descriptions.

## Solution

Replace the entire audit engine to fire the 5 canonical OPT events through `wmTracking.ts` functions directly, and update the UI to match.

## Files to Change

### 1. `src/lib/fullFunnelTrackingAudit.ts` (major rewrite)

**A. Replace META_EVENTS constant** -- from 6 legacy events to 5 canonical OPT events:

| Event | Value | Meta Tag |
|-------|-------|----------|
| `wm_lead` | $10 | Lead |
| `wm_qualified_lead` | $100 | QualifiedLead |
| `wm_scanner_upload` | $500 | ScannerUpload |
| `wm_appointment_booked` | $1,000 | Schedule |
| `wm_sold` | $5,000 | Purchase |

**B. Replace 6 individual fire functions** with calls to the canonical wmTracking emitters:

- `wmLead(identity, context)` instead of `fireLeadFormOpened` + `fireLeadSubmissionSuccess`
- `wmQualifiedLead(identity, context)` instead of `fireCallInitiated`
- `wmScannerUpload(identity, scanAttemptId, context)` instead of `fireScannerUpload` + `fireQuoteUploadSuccess`
- `wmAppointmentBooked(identity, appointmentKey, context)` instead of `fireEngagementScore`
- `wmSold(identity, saleAmount, dealKey, context)` -- new, no legacy equivalent

Before each call, reset the relevant dedupe guards (`_resetWmLeadGuard`, `_resetScannerUploadGuard`, `_resetSessionGuards`) so the audit can fire cleanly on every run.

**C. Update validation checks** to verify:
- `event_id` matches deterministic format (`lead:{uuid}`, `ql:{uuid}`, `upload:{uuid}`, etc.)
- `meta.category === 'opt'` and `meta.send === true`
- `client_id` and `session_id` are present at root level
- `value` and `currency` match expected OPT values
- All `user_data` hashed PII fields (em, ph, fn, ln, ct, st, zp)

**D. Update EventAuditResult interface** to add:
- `hasClientId: boolean`
- `hasSessionId: boolean`
- `hasMetaCategory: boolean`
- `hasMetaSend: boolean`

**E. Remove** all legacy fire functions (`fireLeadFormOpened`, `fireScannerUpload`, `fireQuoteUploadSuccess`, `fireCallInitiated`, `fireEngagementScore`, `fireLeadSubmissionSuccess`).

**F. Update scoring** -- max score per event adjusted to include identity checks (client_id, session_id) and meta firewall checks (meta.category, meta.send), bringing the total check count to ~14 per event.

### 2. `src/pages/admin/FullFunnelAudit.tsx` (UI updates)

**A. Update EVENT_ICONS** map keys from legacy names to `wm_lead`, `wm_qualified_lead`, `wm_scanner_upload`, `wm_appointment_booked`, `wm_sold`.

**B. Update copy**: "5 OPT conversion events" instead of "6 Meta conversion events". Update descriptions and button text.

**C. Add validation columns** in the per-event accordion for `client_id`, `session_id`, `meta.category`, and `meta.send`.

## Implementation Order

1. Rewrite `fullFunnelTrackingAudit.ts` -- constants, imports, fire logic, validation, scoring
2. Update `FullFunnelAudit.tsx` -- icon map, copy, validation display
3. Both files are self-contained; no other files change

## What Success Looks Like

- Click "Run Audit" and see 5 events in the Data Layer
- Each event has deterministic `event_id`, correct `value`/`currency`, `meta.category: 'opt'`, `client_id`, `session_id`
- Overall score reflects the new 5-event OPT ladder
- No TypeScript errors, no changes to `wmTracking.ts` or `gtm.ts`

## Potential Challenges

- **Dedupe guards will block re-runs**: The wmTracking functions deduplicate by leadId/scanAttemptId. The solution is to call the test-only reset utilities (`_resetWmLeadGuard`, `_resetScannerUploadGuard`, `_resetSessionGuards`) before firing each event sequence. These are already exported from `wmTracking.ts` for exactly this purpose.
- **wm_sold needs a sale amount**: Will use a fixed test value (e.g., $15,000) so `value` = $5,000 + $15,000 = $20,000.

