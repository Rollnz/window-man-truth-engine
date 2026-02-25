

# GTM wm_* Migration Checklist (docs/GTM_WM_MIGRATION_CHECKLIST.md)

Create a single markdown document that serves as the step-by-step manual checklist for migrating GTM tags from legacy event names to canonical `wm_*` events, to be completed **before** any code changes are deployed.

## What the document will cover

### Section 1: Pre-Flight (Current State Snapshot)
- Document the 4 legacy events being retired: `lead_submission_success`, `phone_lead_captured`, `quote_upload_success`, `booking_confirmed`
- Document the 5 canonical replacements: `wm_lead` ($10), `wm_qualified_lead` ($100), `wm_scanner_upload` ($500), `wm_appointment_booked` ($1,000), `wm_sold` ($5,000+)
- Remind user to screenshot current GTM tag/trigger state for rollback reference

### Section 2: Data Layer Variables to Create
- `DLV - meta.category` -> `meta.category`
- `DLV - meta.send` -> `meta.send`
- `DLV - meta.meta_event_name` -> `meta.meta_event_name`
- Plus confirmation that existing DLVs (value, currency, event_id, user_data, lead_id, external_id) are already verified per `GTM_VARIABLE_VERIFICATION.md`

### Section 3: New Triggers (5 canonical OPT triggers)
- One trigger per canonical event, each with `meta.category equals opt` condition
- Plus a catch-all `wm_*` regex trigger for GA4 passthrough

### Section 4: New Tags (clone-and-remap for each platform)
- Meta Pixel tags using `fbq('track', ...)` with `eventID` for deduplication
- Google Ads conversion tags with value/currency
- GA4 event tags
- All firing on the new `wm_*` triggers

### Section 5: Dual-Fire Verification
- GTM Preview mode checklist for each form
- Confirm both legacy AND new tags fire simultaneously
- Verify value, event_id, user_data in each new tag

### Section 6: Server Container Updates (GTM-PJZDXKH9)
- Update Facebook CAPI - Lead tag to also match `wm_lead`
- Verify event_id passthrough for deduplication

### Section 7: Post-Code-Deploy Cleanup
- Pause legacy tags after 7 days
- Delete legacy tags after 21 days
- Rollback instructions

## Technical details

**File created:** `docs/GTM_WM_MIGRATION_CHECKLIST.md`

**No other files modified.** This is a documentation-only change. No database, CRM, edge function, or tracking code is touched.

The content will reference the exact legacy-to-canonical mapping from `LEGACY_BRIDGE` in `src/lib/wmTracking.ts` (lines 104-110), the Meta event name mapping from `META_EVENT_NAMES` (lines 96-101), and the verified DLV state from `GTM_VARIABLE_VERIFICATION.md`.

