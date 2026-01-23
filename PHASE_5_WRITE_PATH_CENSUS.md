# Phase 5A: wm_event_log Write Path Census

## Objective
Enumerate ALL possible writers to wm_event_log and establish canonical/forbidden authority levels.

---

## Write Path Census Table

| Writer Name | Entry Point | Trigger | Status | Authority Level |
|-------------|-------------|---------|--------|-----------------|
| **save-lead** | `/functions/v1/save-lead` | Lead form submission | **ACTIVE** | **CANONICAL** |
| **log-event** | `/functions/v1/log-event` | Browser/server event logging | **ACTIVE** | SECONDARY (non-conversion only) |
| **signal** | `/functions/v1/signal` | Browser scanner signals | **ACTIVE** | SECONDARY (scanner events) |
| **phone-call-outcome** | `/functions/v1/phone-call-outcome` | Call completion webhook | **ACTIVE** | SECONDARY (voice_estimate_confirmed) |
| **quote-scanner** | `/functions/v1/quote-scanner` | Quote analysis completion | **ACTIVE** | SECONDARY (scanner_analysis_completed) |
| **upload-document** | `/functions/v1/upload-document` | Document upload completion | **ACTIVE** | SECONDARY (scanner_document_upload_completed) |
| **upload-quote** | `/functions/v1/upload-quote` | Quote file upload | **ACTIVE** | SECONDARY (quote_upload_completed) |
| **writeLedgerEvent** | `/_shared/writeLedgerEvent.ts` | Shared helper function | **ACTIVE** | HELPER (used by other functions) |
| **GTM Server (Stape)** | `lunaa.itswindowman.com` | Server-side GTM tags | **TO VERIFY** | **FORBIDDEN** (must remain disabled) |

---

## Authority Level Definitions

| Level | Description |
|-------|-------------|
| **CANONICAL** | The ONLY allowed writer for lead conversion events (lead_submission_success, lead_captured) |
| **SECONDARY** | Allowed for non-conversion events (scanner signals, voice confirmations, uploads) |
| **FORBIDDEN** | Must NEVER write to wm_event_log (legacy forwarders, GTM server write-back) |
| **HELPER** | Shared utility function used by other edge functions |

---

## Canonical Ingestion Rules (INVARIANTS)

### Rule 1: save-lead = CANONICAL
- `save-lead` is the ONLY allowed writer for `lead_captured` events
- All lead conversion events MUST originate from save-lead
- Event name: `lead_captured` (not `lead_submission_success` - that's the GTM trigger name)

### Rule 2: log-event = SECONDARY (non-conversion only)
- `log-event` can write behavioral events (pageviews, clicks, form starts)
- `log-event` MUST NOT write conversion events
- Already has duplicate detection via `uix_wm_event_log_event_id` constraint

### Rule 3: gtm-forwarder = FORBIDDEN
- GTM Server container MUST NOT write to wm_event_log
- Any Supabase write tags in Stape MUST be disabled/deleted
- This prevents double-writes and attribution drift

---

## Event Types by Writer

| Writer | Event Names | Event Type |
|--------|-------------|------------|
| save-lead | `lead_captured` | conversion |
| log-event | Various behavioral events | behavioral |
| signal | Scanner signals | behavioral |
| phone-call-outcome | `voice_estimate_confirmed` | conversion (secondary) |
| quote-scanner | `scanner_analysis_completed` | behavioral |
| upload-document | `scanner_document_upload_completed` | behavioral |
| upload-quote | `quote_upload_completed` | behavioral |

---

## Current State Analysis

### Existing Constraints (from log-event code):
```typescript
// Check for unique constraint violation (duplicate event_id)
if (error.code === "23505" && error.message.includes("uix_wm_event_log_event_id")) {
  console.log(`[log-event] Duplicate event_id: ${eventId}`);
  return new Response(
    JSON.stringify({ ok: true, event_id: eventId, duplicate: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

This indicates a UNIQUE constraint on `event_id` already exists: `uix_wm_event_log_event_id`

### Missing Protections:
1. **No idempotency guard in save-lead** - Retries can create duplicate `lead_captured` events
2. **No partial unique constraint** on `(lead_id, event_name)` for `lead_submission_success`
3. **GTM Server write-back status unknown** - Need to verify Stape configuration

---

## Confirmation Statements

- [x] save-lead = **CANONICAL** for lead conversion events
- [x] log-event = **SECONDARY** (non-conversion behavioral events only)
- [ ] gtm-forwarder = **FORBIDDEN** (pending Stape verification)

---

## Next Steps (Phase 5B-5G)

1. **5B**: Add UNIQUE constraint on `event_id` (verify existing) and PARTIAL UNIQUE on `(lead_id, event_name)`
2. **5C**: Implement idempotency guard in save-lead
3. **5D**: Create duplicate detection monitoring queries
4. **5E**: Verify and lock GTM Server forwarder
5. **5F**: Implement conversion versioning schema
6. **5G**: Run ledger integrity acceptance test
