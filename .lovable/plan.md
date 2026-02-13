

# Meta Browser + CAPI Deduplication Integrity Audit

## Findings Summary

### GOOD: event_id Parity (Browser ↔ Server)

The browser and Stape server-side paths both use **leadId** as the event_id:

- **Browser** (`src/lib/gtm.ts`, line 581): `eventId = params.eventId || generateEventId()` -- callers consistently pass `eventId: data.leadId` (confirmed across SampleReportAccessGate, useLeadFormSubmit, Consultation, FairPriceQuiz)
- **Stape CAPI** (`save-lead/index.ts`, line 405): `event_id: payload.leadId`

Both resolve to the same UUID. Deduplication on event_id is aligned.

### ISSUE 1: event_name Mismatch (Browser vs Stape)

| Path | event_name sent |
|------|----------------|
| Browser dataLayer | `lead_submission_success` |
| Stape server-side | `Lead` |

Meta deduplicates by matching **both** event_name AND event_id. If the GTM web container's Meta Pixel tag fires the event as `lead_submission_success` (raw dataLayer name), it will NOT match the server's `Lead` event, and Meta will count both -- double-counting.

**Resolution**: This is a GTM container configuration task. The Meta Pixel tag in GTM must map `lead_submission_success` to the standard Meta event name `Lead` when calling `fbq('track', 'Lead', ...)`. This is typically done via a Custom Event trigger + tag that uses `Lead` as the event name.

### ISSUE 2: wm_event_log Uses Independent event_id

Line 1136 of `save-lead`: `event_id: crypto.randomUUID()` generates a fresh UUID unrelated to leadId.

**Verdict**: This is the internal analytics ledger only. It is NOT sent to Meta CAPI (Stape handles that separately). No fix needed -- this is by design for internal event log immutability.

### ISSUE 3: GTM Web Container Tag Configuration (Cannot Audit From Code)

The following must be verified in the GTM UI (tagmanager.google.com):

1. A Meta Pixel tag exists that fires on `lead_submission_success` dataLayer events
2. The tag maps event_name to `Lead` (Meta standard)
3. The tag reads `event_id` from a Data Layer Variable (DLV) and passes it as `eventID` in the `fbq()` options
4. The tag reads `user_data` fields (em, ph, fn, ln, external_id, fbp, fbc) from DLVs for Advanced Matching

Without this GTM configuration, the browser Pixel will either:
- Not fire at all for lead events
- Fire with no event_id (no deduplication)
- Fire with wrong event_name (double-counting)

## Recommended Fix

### Step 1: Fix wm_event_log to use leadId as event_id (Consistency)

Even though wm_event_log is internal, aligning it with the deduplication standard prevents future confusion:

**File**: `supabase/functions/save-lead/index.ts`  
**Line 1136**: Change `event_id: crypto.randomUUID()` to `event_id: leadId`

This ensures all three paths (browser, Stape, event_log) use the same event_id = leadId. The idempotency guard on lines 1105-1111 already checks by lead_id + event_name, so this change is safe.

### Step 2: GTM Container Configuration Checklist (Manual, in GTM UI)

These are GTM UI tasks that cannot be done in code:

1. **Create Data Layer Variable**: Name = `DLV - event_id`, Variable Name = `event_id`
2. **Create Data Layer Variable**: Name = `DLV - user_data`, Variable Name = `user_data`
3. **Create Custom Event Trigger**: Trigger fires on Custom Event = `lead_submission_success`
4. **Create Meta Pixel Tag** (or update existing):
   - Event Name: `Lead` (Meta standard)
   - Event ID: `{{DLV - event_id}}`
   - Advanced Matching: Map from `{{DLV - user_data}}` fields
   - Trigger: The custom trigger from step 3
5. **Verify PageView tag** fires on All Pages with `fbq('track', 'PageView')`

### Step 3: Verification Steps (Post-Deploy)

After publishing the code change and configuring GTM:

1. Open production site with Meta Pixel Helper browser extension
2. Submit a test lead form
3. In Meta Events Manager, Test Events tab:
   - Confirm `Lead` event appears with Integration = "Browser"
   - Confirm `Lead` event appears with Integration = "Server"
   - Confirm both show the same `event_id` value
   - Confirm one is marked as "Deduplicated"
4. In browser console, run `window.dataLayer.filter(e => e.event === 'lead_submission_success')` and verify `event_id` matches the leadId returned from save-lead

## Technical Details

### Code Change

**File**: `supabase/functions/save-lead/index.ts`

Change line 1136 from:
```
event_id: crypto.randomUUID(),
```
to:
```
event_id: leadId,
```

This is a one-line change. The idempotency guard (lines 1105-1121) prevents duplicate inserts based on `lead_id + event_name`, so using leadId as event_id is safe and consistent.

### What This Does NOT Fix

- GTM container tag configuration (must be done manually in GTM UI)
- The event_name mapping from `lead_submission_success` to `Lead` (GTM tag config)
- Whether the Meta Pixel base code is properly initialized in GTM (GTM tag config)

These are GTM workspace tasks outside the codebase.

