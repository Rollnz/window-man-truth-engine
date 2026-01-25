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

## C) Meta Tag Configuration

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

## D) Verification Steps

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

### Step 2: GTM Preview Mode

1. Enable GTM Preview mode
2. Navigate to Quote Scanner and upload a quote
3. Wait for analysis to complete

**Verify in GTM Preview:**
- ✅ Trigger `quote_upload_success` fires
- ✅ Tag `Meta - Quote Upload Success` fires
- ✅ Variable `DLV - event_id` resolves to non-empty string (e.g., `quote_uploaded:abc123...`)
- ✅ Variable `DLV - value` resolves to `50`
- ✅ Variable `DLV - currency` resolves to `USD`

### Step 3: Meta Events Manager (Test Events)

1. Open Meta Events Manager → Test Events
2. Enter your website URL and start test
3. Upload a quote in Quote Scanner
4. Wait for analysis to complete

**Verify in Meta Test Events:**
- ✅ Event `quote_upload_success` appears
- ✅ Event Parameters show `value: 50` and `currency: USD`
- ✅ `eventID` is present (for deduplication)

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
