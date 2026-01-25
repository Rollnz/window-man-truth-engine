# GTM Wiring Guide: Quote Upload Success ($50 Conversion)

## Overview

This guide documents how to configure GTM to fire Meta Pixel events for the `quote_upload_success` conversion signal.

| Property | Value |
|----------|-------|
| **Event Name** | `quote_upload_success` |
| **Conversion Value** | $50 USD |
| **Event ID Format** | `quote_uploaded:<scanAttemptId>` (deterministic) |
| **Purpose** | High-intent signal for value-based bidding |

---

## A) Custom Event Trigger

Create a new trigger in GTM:

| Setting | Value |
|---------|-------|
| **Trigger Name** | `quote_upload_success` |
| **Trigger Type** | Custom Event |
| **Event Name** | `quote_upload_success` |
| **This trigger fires on** | All Custom Events |

---

## B) Required Data Layer Variables (DLVs)

Ensure these Data Layer Variables exist in your GTM container:

### DLV - event_id

| Setting | Value |
|---------|-------|
| **Variable Name** | `DLV - event_id` |
| **Variable Type** | Data Layer Variable |
| **Data Layer Variable Name** | `event_id` |

### DLV - value

| Setting | Value |
|---------|-------|
| **Variable Name** | `DLV - value` |
| **Variable Type** | Data Layer Variable |
| **Data Layer Variable Name** | `value` |

### DLV - currency

| Setting | Value |
|---------|-------|
| **Variable Name** | `DLV - currency` |
| **Variable Type** | Data Layer Variable |
| **Data Layer Variable Name** | `currency` |

---

## C) Meta Pixel Tag Configuration (Browser-Side)

### Tag Name
`Meta - Quote Upload Success`

### Tag Type
Custom HTML

### Tag Code

```html
<script>
fbq('trackCustom', 'quote_upload_success', {
  value: {{DLV - value}},
  currency: {{DLV - currency}}
}, {
  eventID: '{{DLV - event_id}}'
});
</script>
```

### Firing Trigger
- `quote_upload_success` (the trigger created in Section A)

### Exceptions (Recommended)
- `Block - Lovable Domains` (if exists)
- `Exclude Admin and Lead Pages` (if exists)

### Setup Tag (Required)
- Ensure **Meta Pixel - Base Code** is set as a Setup Tag so the pixel loads before this tag fires

---

## D) GA4 Event Tag (Server Relay to Stape)

**CRITICAL:** This tag relays the event to the Stape Server Container for CAPI deduplication.

### Tag Name
`GA4 - Quote Upload Success (Stape Relay)`

### Tag Type
Google Analytics: GA4 Event

### Configuration Tag
**IMPORTANT:** Create or use an existing Google Tag that points to your Stape server:

| Setting | Value |
|---------|-------|
| **Tag Type** | Google Tag |
| **Tag ID** | Your GA4 Measurement ID (e.g., `G-XXXXXXXXXX`) |
| **Server Container URL** | `https://lunaa.itswindowman.com` |

If you already have a Google Tag configured for Stape (e.g., `AW-17439985315`), use that as the Configuration Tag.

### Event Name
`quote_upload_success`

### Event Parameters

| Parameter Name | Value |
|---------------|-------|
| `event_id` | `{{DLV - event_id}}` |
| `value` | `{{DLV - value}}` |
| `currency` | `{{DLV - currency}}` |
| `source_tool` | `quote-scanner` |

### Firing Trigger
- `quote_upload_success`

### Exceptions
- `Block - Lovable Domains` (if exists)

---

## E) Stape Server Container Setup (GTM-PJZDXKH9)

### Verify Event Arrival

1. Open Stape Server Container in Preview mode
2. Trigger a quote upload on your website
3. Confirm `quote_upload_success` appears in the server container event stream
4. Verify `event_id` parameter is present and starts with `quote_uploaded:`

### Option 1: Use Existing "Facebook CAPI - All Events" Tag

The existing **Facebook CAPI - All Events** tag should automatically catch `quote_upload_success` because:
- It fires on all server events
- `quote_upload_success` is NOT in its exception list

Verify the tag maps `event_id` from the incoming event to the CAPI `eventID` parameter.

### Option 2: Create Dedicated CAPI Tag (Recommended for explicit control)

1. **Create Trigger:**
   - Trigger Name: `Quote Upload Success - Server`
   - Trigger Type: Custom
   - Event Name contains: `quote_upload_success`

2. **Create Facebook CAPI Tag:**
   - Tag Name: `Facebook CAPI - Quote Upload Success`
   - Tag Type: Facebook Conversion API (stape-io template)
   - Event Name: `quote_upload_success`
   - Event ID: Map to incoming `event_id` parameter
   - Value: Map to incoming `value` parameter
   - Currency: Map to incoming `currency` parameter
   - Firing Trigger: `Quote Upload Success - Server`

---

## F) Verification Steps

### Step 1: Browser Console Verification

After uploading a quote for analysis, run in browser console:

```javascript
window.dataLayer.filter(e => e.event === 'quote_upload_success').slice(-1)[0]
```

**Expected Output:**
```javascript
{
  event: "quote_upload_success",
  event_id: "quote_uploaded:abc123-def456-...", // deterministic UUID
  value: 50,
  currency: "USD",
  source_tool: "quote-scanner",
  source_system: "website",
  user_data: {
    em: "64-char-sha256-hash",  // if email provided
    ph: "64-char-sha256-hash",  // if phone provided
    fbp: "fb.1...",             // if cookie exists
    fbc: "fb.1...",             // if fbclid in URL
    // ...
  }
}
```

**Assertions:**
- ✅ `value` equals `50`
- ✅ `currency` equals `'USD'`
- ✅ `event_id` starts with `'quote_uploaded:'`

### Step 2: GTM Web Container Preview Mode

1. Enable GTM Preview mode for GTM-NHVFR5QZ
2. Navigate to Quote Scanner and upload a quote
3. Wait for analysis to complete

**Verify in GTM Preview:**
- ✅ Trigger `quote_upload_success` fires
- ✅ Tag `Meta - Quote Upload Success` fires
- ✅ Tag `GA4 - Quote Upload Success (Stape Relay)` fires
- ✅ Variable `DLV - event_id` resolves to non-empty string (e.g., `quote_uploaded:abc123...`)
- ✅ Variable `DLV - value` resolves to `50`
- ✅ Variable `DLV - currency` resolves to `USD`

### Step 3: Stape Server Container Preview Mode

1. Enable Preview for GTM-PJZDXKH9
2. Upload a quote on the website
3. Verify:
   - ✅ Event `quote_upload_success` appears in server container
   - ✅ `event_id` parameter is present and matches browser value
   - ✅ Facebook CAPI tag fires

### Step 4: Meta Events Manager (Test Events)

1. Open Meta Events Manager → Test Events
2. Enter your website URL and start test
3. Upload a quote in Quote Scanner
4. Wait for analysis to complete

**Verify in Meta Test Events:**
- ✅ Event `quote_upload_success` appears (both browser AND server)
- ✅ Event Parameters show `value: 50` and `currency: USD`
- ✅ `eventID` is present and identical for both browser/server events
- ✅ Status shows **"Deduplicated"** (confirms matching worked)

---

## G) Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (Quote Scanner)                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ trackQuoteUploadSuccess({ scanAttemptId, email?, phone? })  │   │
│  │ → event_id: 'quote_uploaded:abc123-def456'                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│                     window.dataLayer.push()                         │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│  GTM Web Container (GTM-NHVFR5QZ)                                   │
│  ┌────────────────────────┐  ┌────────────────────────────────────┐│
│  │ Meta - Quote Upload    │  │ GA4 - Quote Upload Success         ││
│  │ Success (Pixel)        │  │ (Stape Relay)                      ││
│  │ eventID: 'quote_...'   │  │ → lunaa.itswindowman.com           ││
│  └────────────────────────┘  └────────────────────────────────────┘│
│           ↓                               ↓                         │
└─────────────────────────────────────────────────────────────────────┘
            ↓                               ↓
┌───────────────────┐          ┌──────────────────────────────────────┐
│  Meta Pixel       │          │  Stape Server Container              │
│  (Browser-side)   │          │  (GTM-PJZDXKH9)                      │
│                   │          │  ┌────────────────────────────────┐  │
│  eventID: 'quote_ │          │  │ Facebook CAPI - All Events     │  │
│  uploaded:abc123' │          │  │ event_id: 'quote_uploaded:...' │  │
│                   │          │  └────────────────────────────────┘  │
└───────────────────┘          └──────────────────────────────────────┘
            ↓                               ↓
            └───────────┬───────────────────┘
                        ↓
          ┌─────────────────────────────────┐
          │  Meta Events Manager            │
          │  ✅ Deduplicated (same eventID) │
          │  ✅ Value: $50 USD              │
          └─────────────────────────────────┘
```

---

## Troubleshooting

### Event Not Appearing in GTM Preview

1. Verify quote analysis completed successfully (not just upload started)
2. Check browser console for `[GTM] quote_upload_success pushed with EMQ` log
3. Confirm `trackQuoteUploadSuccess` is being called in `useQuoteScanner.ts`

### event_id is Empty

1. Check that `scanAttemptId` is generated in `useQuoteScanner.ts`
2. Verify `DLV - event_id` variable is configured correctly

### Value/Currency Missing

1. Confirm DLV variables are set to correct Data Layer Variable Names (`value`, `currency`)
2. Check for typos in variable configuration

### Event Not Reaching Stape Server

1. Verify GA4 Event Tag has correct Configuration Tag pointing to `https://lunaa.itswindowman.com`
2. Check Network tab for requests to `lunaa.itswindowman.com`
3. Verify no ad-blockers are interfering

### Deduplication Not Working in Meta

1. Confirm `event_id` is identical in both browser pixel and CAPI events
2. Check that CAPI tag maps `event_id` correctly (not `eventID` vs `event_id` mismatch)
3. Verify events arrive within 48-hour deduplication window

---

## Code Reference

**Frontend Implementation:** `src/lib/gtm.ts` → `trackQuoteUploadSuccess()`

**Call Site:** `src/hooks/useQuoteScanner.ts` → after `awardScore({ eventType: 'QUOTE_UPLOADED' })`

**Tests:** `src/lib/__tests__/gtm-tracking.test.ts` → `describe('trackQuoteUploadSuccess')`

---

## Related Events (DO NOT MODIFY)

| Event | Value | Purpose |
|-------|-------|---------|
| `lead_submission_success` | $100 | Primary lead capture |
| `phone_lead_captured` | $25 | Phone lead capture |
| `consultation_booked` | $50 | Consultation booking |
| `booking_confirmed` | $75 | Booking confirmation |

**Note:** This guide only covers `quote_upload_success`. Do not modify the above events.
