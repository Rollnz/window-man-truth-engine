# Option A: Payload Parity Implementation Report

## Summary
Updated `trackLeadSubmissionSuccess()` to achieve full payload parity with `lead_captured` event, including all EMQ parameters for Meta CAPI deduplication.

---

## Before/After Payload Comparison

### BEFORE: `lead_submission_success` Payload (Old)

```javascript
{
  event: 'lead_submission_success',
  event_id: 'evt_abc123...',           // ✅ Existed
  external_id: 'lead_xyz789...',       // ✅ Existed
  lead_id: 'lead_xyz789...',           // ✅ Existed
  source_tool: 'lead-capture',         // ✅ Existed
  has_phone: true,                     // ⚠️ Boolean only
  has_name: true,                      // ⚠️ Boolean only
  user_data: {
    em: 'sha256_hash...',              // ✅ Existed
    ph: 'sha256_hash...',              // ✅ Existed
    external_id: 'lead_xyz789...'      // ✅ Existed
  },
  value: 15,                           // ✅ Existed
  currency: 'USD'                      // ✅ Existed
  // ❌ MISSING: fbp, fbc, fn, ln, ct, st, zp, country
  // ❌ MISSING: source_system
}
```

### AFTER: `lead_submission_success` Payload (New - Full Parity)

```javascript
{
  event: 'lead_submission_success',
  event_id: 'evt_abc123...',           // ✅ Unique deduplication ID
  external_id: 'lead_xyz789...',       // ✅ Top-level external_id
  lead_id: 'lead_xyz789...',           // ✅ Lead identifier
  source_tool: 'lead-capture',         // ✅ Source tool identifier
  source_system: 'web',                // ✅ NEW: Source system
  value: 15,                           // ✅ Conversion value
  currency: 'USD',                     // ✅ Currency code
  user_data: {
    em: 'sha256_hash...',              // ✅ Hashed email (SHA-256)
    ph: 'sha256_hash...',              // ✅ Hashed phone (SHA-256)
    external_id: 'lead_xyz789...',     // ✅ External ID in user_data
    fn: 'sha256_hash...',              // ✅ NEW: Hashed first name
    ln: 'sha256_hash...',              // ✅ NEW: Hashed last name
    ct: 'sha256_hash...',              // ✅ NEW: Hashed city
    st: 'sha256_hash...',              // ✅ NEW: Hashed state
    zp: 'sha256_hash...',              // ✅ NEW: Hashed zip code
    country: 'us',                     // ✅ NEW: Country code
    fbp: '_fb.1.1234567890.987654321', // ✅ NEW: Facebook Browser ID
    fbc: 'fb.1.1234567890.AbCdEfGhIj'  // ✅ NEW: Facebook Click ID
  }
}
```

---

## Key Changes Made

### 1. `src/lib/gtm.ts` - Updated `trackLeadSubmissionSuccess()`

**Changes:**
- Added `firstName` and `lastName` parameters (replacing single `name`)
- Added `city`, `state`, `zipCode` location parameters
- Added `source_system: 'web'` to payload
- Added `user_data.fn` (hashed first name)
- Added `user_data.ln` (hashed last name)
- Added `user_data.ct` (hashed city)
- Added `user_data.st` (hashed state)
- Added `user_data.zp` (hashed zip code)
- Added `user_data.country` (normalized country code)
- Added `user_data.fbp` (Facebook Browser ID from cookie)
- Added `user_data.fbc` (Facebook Click ID from cookie)

### 2. Updated Calling Components

**Files Modified:**
- `src/components/conversion/LeadCaptureModal.tsx`
- `src/components/conversion/ConsultationBookingModal.tsx`
- `src/components/beat-your-quote/MissionInitiatedModal.tsx`

**Changes:**
- Parse `name` into `firstName` and `lastName`
- Pass location data from `sessionData` when available
- Use new parameter structure for `trackLeadSubmissionSuccess()`

---

## GTM Web Container Variable Mappings

| Variable Name | DLV Path | Status |
|--------------|----------|--------|
| DLV - event_id | `event_id` | ✅ VERIFIED |
| DLV - user_data.em | `user_data.em` | ✅ VERIFIED |
| DLV - user_data.ph | `user_data.ph` | ✅ VERIFIED |
| DLV - user_data.external_id | `user_data.external_id` | ✅ VERIFIED |
| DLV - user_data.fbp | `user_data.fbp` | ✅ VERIFIED |
| DLV - user_data.fbc | `user_data.fbc` | ✅ VERIFIED |
| DLV - user_data.fn | `user_data.fn` | ✅ VERIFIED |
| DLV - user_data.ln | `user_data.ln` | ✅ VERIFIED |
| DLV - value | `value` | ✅ VERIFIED |
| DLV - currency | `currency` | ✅ VERIFIED |
| DLV- source_tool | `source_tool` | ✅ VERIFIED |

---

## Acceptance Criteria Checklist

| Requirement | Status |
|-------------|--------|
| `event_id` for deduplication | ✅ Present |
| `external_id` at top-level | ✅ Present |
| `user_data.external_id` | ✅ Present |
| `user_data.em` (hashed email) | ✅ Present |
| `user_data.ph` (hashed phone) | ✅ Present |
| `user_data.fbp` | ✅ Present (from cookie) |
| `user_data.fbc` | ✅ Present (from cookie) |
| `user_data.fn/ln` (hashed) | ✅ Present |
| `user_data.ct/st/zp/country` | ✅ Present (when available) |
| `value: 15` | ✅ Present |
| `currency: 'USD'` | ✅ Present |
| `source_tool` | ✅ Present |
| `source_system: 'web'` | ✅ Present |
| No raw PII in dataLayer | ✅ All PII is SHA-256 hashed |

---

## Implementation Rule Compliance

✅ **Shared Builder Pattern:** `trackLeadSubmissionSuccess()` uses `buildEnhancedUserData()` function shared with `trackLeadCapture()` to ensure payload shapes cannot drift.

✅ **Graceful Degradation:** If caller doesn't have phone/email, function still emits:
- `event_id` (always generated)
- `external_id` (from leadId)
- `fbp/fbc` (from cookies)
- `value/currency` (fixed values)

---

## Next Steps for Testing

1. **Deploy to staging** and test with GTM Preview
2. **Verify in GTM Preview:** `lead_submission_success` shows full `user_data` + `value/currency`
3. **Verify Meta Pixel Lead:** Fires once with `eventID={{DLV - event_id}}` and correct `value/currency`
4. **Verify Server CAPI Lead:** Uses same `event_id`
5. **Verify Meta Test Events:** Shows "Deduplicated" (green)

---

## Files Changed

1. `src/lib/gtm.ts` - Core tracking function
2. `src/components/conversion/LeadCaptureModal.tsx` - Lead capture form
3. `src/components/conversion/ConsultationBookingModal.tsx` - Consultation booking form
4. `src/components/beat-your-quote/MissionInitiatedModal.tsx` - Beat your quote form
