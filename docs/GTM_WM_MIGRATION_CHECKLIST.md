# GTM wm_* Migration Checklist

> **Purpose:** Step-by-step manual checklist for migrating GTM tags from legacy event names to canonical `wm_*` events.  
> **Complete ALL steps below BEFORE deploying any code changes** (i.e., before removing `fireLegacyBridge()` from `wmTracking.ts`).  
> **No database, CRM, edge function, or backend code is touched by this migration.**

---

## Section 1 — Pre-Flight (Current State Snapshot)

### 1.1 Legacy Events Being Retired

| Legacy Event Name | Fired By | Current GTM Tags That Listen |
|---|---|---|
| `lead_submission_success` | `fireLegacyBridge('wm_lead')` | Meta - Lead Conversion, GAds - Lead Submission Success |
| `phone_lead_captured` | `fireLegacyBridge('wm_qualified_lead')` | *(verify in GTM UI)* |
| `quote_upload_success` | `fireLegacyBridge('wm_scanner_upload')` | *(verify in GTM UI)* |
| `booking_confirmed` | `fireLegacyBridge('wm_appointment_booked')` | *(verify in GTM UI)* |

> **Source:** `LEGACY_BRIDGE` constant in `src/lib/wmTracking.ts` lines 104–110.

### 1.2 Canonical Replacements

| Canonical Event | Value | Currency | Meta CAPI Event Name | event_id Format |
|---|---|---|---|---|
| `wm_lead` | $10 | USD | `Lead` | `{leadId}` (bare UUID) |
| `wm_qualified_lead` | $100 | USD | `QualifiedLead` | `ql:{leadId}` |
| `wm_scanner_upload` | $500 | USD | `ScannerUpload` | `upload:{scanAttemptId}` |
| `wm_appointment_booked` | $1,000 | USD | `Schedule` | `appt:{leadId}:{key}` |
| `wm_sold` | $5,000 + sale_amount | USD | `Purchase` | `sold:{leadId}:{key}` |

> **Source:** `OPT_VALUES` (lines 87–93) and `META_EVENT_NAMES` (lines 96–102) in `src/lib/wmTracking.ts`.

### 1.3 Rollback Preparation

- [ ] Screenshot **all current tags** in GTM Web Container (GTM-NHVFR5QZ)
- [ ] Screenshot **all current triggers** in GTM Web Container
- [ ] Screenshot **all current tags** in GTM Server Container (GTM-PJZDXKH9)
- [ ] Note the current GTM Web Container **version number**: `________`
- [ ] Note the current GTM Server Container **version number**: `________`
- [ ] Confirm you can revert to these versions if needed

---

## Section 2 — Data Layer Variables

### 2.1 New DLVs to Create

Create these **three** new Data Layer Variables in GTM Web Container (GTM-NHVFR5QZ):

| Variable Name | Type | Data Layer Variable Name | Data Layer Version |
|---|---|---|---|
| `DLV - meta.category` | Data Layer Variable | `meta.category` | Version 2 |
| `DLV - meta.send` | Data Layer Variable | `meta.send` | Version 2 |
| `DLV - meta.meta_event_name` | Data Layer Variable | `meta.meta_event_name` | Version 2 |

- [ ] Created `DLV - meta.category`
- [ ] Created `DLV - meta.send`
- [ ] Created `DLV - meta.meta_event_name`

### 2.2 Existing DLVs (Already Verified)

These DLVs already exist and are confirmed working per `GTM_VARIABLE_VERIFICATION.md`:

| Variable Name | DLV Path | Status |
|---|---|---|
| DLV - event_id | `event_id` | ✅ Verified |
| DLV - value | `value` | ✅ Verified |
| DLV - currency | `currency` | ✅ Verified |
| DLV - user_data.em | `user_data.em` | ✅ Verified |
| DLV - user_data.ph | `user_data.ph` | ✅ Verified |
| DLV - user_data.fn | `user_data.fn` | ✅ Verified |
| DLV - user_data.ln | `user_data.ln` | ✅ Verified |
| DLV - user_data.external_id | `user_data.external_id` | ✅ Verified |
| DLV - user_data.fbp | `user_data.fbp` | ✅ Verified |
| DLV - user_data.fbc | `user_data.fbc` | ✅ Verified |
| DLV - lead_id | `lead_id` | ✅ Verified |
| DLV - source_tool | `source_tool` | ✅ Verified |

> **No action needed** for existing DLVs — just confirm they still exist.

- [ ] Confirmed all existing DLVs still present in container

---

## Section 3 — New Triggers

### 3.1 OPT Event Triggers (one per canonical event)

Create **5 triggers**, each a **Custom Event** trigger with the additional condition `DLV - meta.category equals opt`:

| Trigger Name | Event Name | Condition |
|---|---|---|
| `CE - wm_lead` | `wm_lead` | `DLV - meta.category` equals `opt` |
| `CE - wm_qualified_lead` | `wm_qualified_lead` | `DLV - meta.category` equals `opt` |
| `CE - wm_scanner_upload` | `wm_scanner_upload` | `DLV - meta.category` equals `opt` |
| `CE - wm_appointment_booked` | `wm_appointment_booked` | `DLV - meta.category` equals `opt` |
| `CE - wm_sold` | `wm_sold` | `DLV - meta.category` equals `opt` |

- [ ] Created `CE - wm_lead`
- [ ] Created `CE - wm_qualified_lead`
- [ ] Created `CE - wm_scanner_upload`
- [ ] Created `CE - wm_appointment_booked`
- [ ] Created `CE - wm_sold`

### 3.2 GA4 Catch-All Trigger (optional but recommended)

For GA4 passthrough of all `wm_*` events (including RT events for audience building):

| Trigger Name | Type | Event Name (regex) | Use regex matching |
|---|---|---|---|
| `CE - wm_* (all)` | Custom Event | `^wm_` | ✅ Yes |

- [ ] Created `CE - wm_* (all)` regex trigger

---

## Section 4 — New Tags

### 4.1 Meta Pixel Tags

Create one Meta Pixel tag per OPT event. Each tag uses `fbq('track', ...)` with the `eventID` option for browser-server deduplication.

#### Tag: Meta - wm_lead

- **Type:** Custom HTML
- **Trigger:** `CE - wm_lead`
- **Code:**

```html
<script>
  fbq('track', '{{DLV - meta.meta_event_name}}', {
    value: {{DLV - value}},
    currency: {{DLV - currency}},
    content_name: 'wm_lead',
    external_id: '{{DLV - user_data.external_id}}'
  }, {
    eventID: '{{DLV - event_id}}'
  });
</script>
```

- [ ] Created and configured

#### Tag: Meta - wm_qualified_lead

- **Type:** Custom HTML
- **Trigger:** `CE - wm_qualified_lead`
- **Code:** Same template as above, replacing `content_name: 'wm_qualified_lead'`

- [ ] Created and configured

#### Tag: Meta - wm_scanner_upload

- **Type:** Custom HTML
- **Trigger:** `CE - wm_scanner_upload`
- **Code:** Same template, `content_name: 'wm_scanner_upload'`

- [ ] Created and configured

#### Tag: Meta - wm_appointment_booked

- **Type:** Custom HTML
- **Trigger:** `CE - wm_appointment_booked`
- **Code:** Same template, `content_name: 'wm_appointment_booked'`

- [ ] Created and configured

#### Tag: Meta - wm_sold

- **Type:** Custom HTML
- **Trigger:** `CE - wm_sold`
- **Code:** Same template, `content_name: 'wm_sold'`

- [ ] Created and configured

### 4.2 Google Ads Conversion Tags

Create one Google Ads Conversion Tracking tag per OPT event (or at minimum for `wm_lead`, `wm_appointment_booked`, `wm_sold`).

| Tag Name | Trigger | Conversion Label | Value | Currency | Transaction ID |
|---|---|---|---|---|---|
| GAds - wm_lead | `CE - wm_lead` | *(your label)* | `{{DLV - value}}` | `{{DLV - currency}}` | `{{DLV - event_id}}` |
| GAds - wm_qualified_lead | `CE - wm_qualified_lead` | *(your label)* | `{{DLV - value}}` | `{{DLV - currency}}` | `{{DLV - event_id}}` |
| GAds - wm_appointment_booked | `CE - wm_appointment_booked` | *(your label)* | `{{DLV - value}}` | `{{DLV - currency}}` | `{{DLV - event_id}}` |
| GAds - wm_sold | `CE - wm_sold` | *(your label)* | `{{DLV - value}}` | `{{DLV - currency}}` | `{{DLV - event_id}}` |

- [ ] Created GAds tags for each required conversion
- [ ] Conversion labels entered from Google Ads UI

### 4.3 GA4 Event Tags

If using the `CE - wm_* (all)` regex trigger, a single GA4 tag can forward all canonical events:

| Tag Name | Type | Trigger | Event Name | Parameters |
|---|---|---|---|---|
| GA4 - wm_* Events | GA4 Event | `CE - wm_* (all)` | `{{Event}}` | `value`, `currency`, `event_id`, `lead_id`, `source_tool`, `meta.category` |

- [ ] Created GA4 passthrough tag

---

## Section 5 — Dual-Fire Verification

> **Critical:** Complete this section in GTM Preview mode BEFORE deploying any code changes.  
> During dual-fire, the legacy bridge is still active. Both old AND new tags should fire simultaneously for each form submission.

### 5.1 Verification Matrix

For each form below, trigger a test submission in GTM Preview mode and verify:

| Form | Page URL | Expected Legacy Tag(s) | Expected New Tag(s) | Both Fire? |
|---|---|---|---|---|
| PreQuoteLeadModalV2 (Step 1) | `/sample-report` | Meta - Lead Conversion | Meta - wm_lead, GAds - wm_lead | ☐ |
| PreQuoteLeadModalV2 (Step 5, qualified) | `/sample-report` | *(phone_lead_captured tag)* | Meta - wm_qualified_lead | ☐ |
| LeadCaptureModal | `/expert` | Meta - Lead Conversion | Meta - wm_lead | ☐ |
| ConsultationBookingModal | `/expert` | *(booking_confirmed tag)* | Meta - wm_appointment_booked | ☐ |
| EbookLeadModal | `/guide/kitchen-table` | Meta - Lead Conversion | Meta - wm_lead | ☐ |
| ScannerLeadCaptureModal | `/ai-scanner` | *(quote_upload_success tag)* | Meta - wm_scanner_upload | ☐ |

### 5.2 Parameter Verification (per new tag)

For each new tag that fires, verify these values in the GTM Preview "Data Layer" tab:

- [ ] `meta.category` = `opt`
- [ ] `meta.send` = `true`
- [ ] `meta.meta_event_name` = correct Meta event name (e.g., `Lead`)
- [ ] `value` = correct dollar amount (e.g., `10` for wm_lead)
- [ ] `currency` = `USD`
- [ ] `event_id` = non-empty string in correct format
- [ ] `lead_id` = non-empty UUID
- [ ] `user_data.em` = SHA-256 hashed email (64 hex chars)
- [ ] `user_data.ph` = SHA-256 hashed phone (if provided)

### 5.3 Meta Pixel Helper Verification

Install the [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) Chrome extension and verify:

- [ ] `fbq('track', 'Lead', ...)` fires with `value: 10` and `eventID` parameter
- [ ] `eventID` matches the `event_id` in the dataLayer push
- [ ] No duplicate pixel fires for the same event

---

## Section 6 — Server Container Updates (GTM-PJZDXKH9)

### 6.1 GA4 Client

- [ ] Verify the GA4 Client in server container is receiving events from the web container
- [ ] Confirm the client passes through custom event parameters (event_id, user_data, value, currency)

### 6.2 Facebook CAPI Tags

Update existing Facebook CAPI tags (or create new ones) to match canonical event names:

| Server Tag | Trigger Condition | Event Name Sent to Meta | event_id Source |
|---|---|---|---|
| CAPI - wm_lead | Event Name equals `wm_lead` | `Lead` | `event_id` parameter from GA4 event |
| CAPI - wm_qualified_lead | Event Name equals `wm_qualified_lead` | `QualifiedLead` | `event_id` parameter |
| CAPI - wm_scanner_upload | Event Name equals `wm_scanner_upload` | `ScannerUpload` | `event_id` parameter |
| CAPI - wm_appointment_booked | Event Name equals `wm_appointment_booked` | `Schedule` | `event_id` parameter |
| CAPI - wm_sold | Event Name equals `wm_sold` | `Purchase` | `event_id` parameter |

- [ ] Created/updated CAPI tags for each canonical event
- [ ] Each CAPI tag reads `event_id` from the incoming event and passes it as the Meta `event_id` for deduplication
- [ ] Each CAPI tag reads `user_data` (em, ph, fn, ln, external_id, fbp, fbc) from the incoming event
- [ ] Each CAPI tag sends `value` and `currency` from the incoming event

### 6.3 Deduplication Verification

- [ ] Browser pixel `eventID` and server CAPI `event_id` match for the same event
- [ ] Meta Events Manager shows events as "Merged" (browser + server) — not double-counted

---

## Section 7 — Post-Code-Deploy Cleanup

> **Only proceed with this section AFTER the code changes are deployed** (removal of `fireLegacyBridge()` from `wmTracking.ts`, version bump to `2.0.0`).

### 7.1 Immediate Post-Deploy Verification

- [ ] Legacy events (`lead_submission_success`, etc.) have **stopped** firing in GTM Preview
- [ ] New `wm_*` tags continue to fire with correct values
- [ ] Meta Events Manager receiving events with correct value/currency
- [ ] Google Ads conversion tracking shows conversions with correct value
- [ ] GA4 receiving all `wm_*` events

### 7.2 Day 1–7: Monitor

- [ ] Check Meta Events Manager daily — conversion count should remain stable
- [ ] Check Google Ads conversion actions — no drop in reported conversions
- [ ] Check GA4 conversion events — `wm_lead` count ≈ previous `lead_submission_success` count
- [ ] Monitor Event Match Quality (EMQ) in Meta — target ≥ 7.0

### 7.3 Day 7: Pause Legacy Tags

- [ ] **Pause** (do NOT delete) all legacy tags:
  - Meta - Lead Conversion (fires on `lead_submission_success`)
  - GAds - Lead Submission Success
  - Any other tags firing on `phone_lead_captured`, `quote_upload_success`, `booking_confirmed`
- [ ] Publish GTM container with paused tags
- [ ] Note GTM version number: `________`

### 7.4 Day 21: Delete Legacy Tags

- [ ] Confirm 14 days of clean data since pausing
- [ ] **Delete** all paused legacy tags
- [ ] **Delete** all legacy triggers (triggers for `lead_submission_success`, `phone_lead_captured`, `quote_upload_success`, `booking_confirmed`)
- [ ] Publish final clean GTM container
- [ ] Note GTM version number: `________`

### 7.5 Rollback Instructions

If conversions drop or data quality degrades at any point:

1. **Code rollback:** `git revert` the commit that removed `fireLegacyBridge()`. Legacy bridge events resume immediately on next deploy.
2. **GTM rollback:** Revert to the GTM container version noted in Section 1.3. Legacy tags resume firing.
3. **Both are independent** — you can revert code without touching GTM, and vice versa.

---

## Quick Reference: GTM Firewall Contract

Every `wm_*` OPT event pushed to the dataLayer includes this structure:

```json
{
  "event": "wm_lead",
  "event_id": "abc-123-def",
  "meta": {
    "send": true,
    "category": "opt",
    "meta_event_name": "Lead",
    "value": 10,
    "currency": "USD",
    "wm_tracking_version": "2.0.0"
  },
  "value": 10,
  "currency": "USD",
  "lead_id": "abc-123-def",
  "external_id": "abc-123-def",
  "client_id": "...",
  "session_id": "...",
  "user_data": {
    "em": "sha256_hash",
    "ph": "sha256_hash",
    "fn": "sha256_hash",
    "ln": "sha256_hash",
    "external_id": "sha256_hash",
    "fbp": "fb.1.xxx",
    "fbc": "fb.1.xxx"
  }
}
```

**Conversion tag condition:** `Event matches ^wm_` AND `{{DLV - meta.category}} equals opt`

This ensures only OPT events with hardcoded values trigger conversion tags. RT and internal events are excluded.
