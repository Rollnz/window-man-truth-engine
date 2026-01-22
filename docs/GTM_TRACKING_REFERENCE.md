# GTM Tracking Reference

> **Last Updated:** January 2026  
> **GTM Container ID:** `GTM-NHVFR5QZ`  
> **EMQ Target:** 9.5+ (Meta CAPI) / Enhanced Conversions (Google)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Conversion Events (High-Value)](#conversion-events-high-value)
3. [Lead Capture Events](#lead-capture-events)
4. [Engagement Events](#engagement-events)
5. [EMQ Compliance Checklist](#emq-compliance-checklist)
6. [PII Hashing Standards](#pii-hashing-standards)
7. [Usage Examples](#usage-examples)

---

## Architecture Overview

The tracking engine (`src/lib/gtm.ts`) implements a **two-tier system**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     truthEngine (window.truthEngine)             │
├─────────────────────────────────────────────────────────────────┤
│  Primary Conversions (Async + PII Hashing)                       │
│  ├── trackLeadSubmissionSuccess ($15)                           │
│  ├── trackPhoneLead ($25)                                       │
│  ├── trackConsultationBooked ($75)                              │
│  └── trackBookingConfirmed ($75)                                │
├─────────────────────────────────────────────────────────────────┤
│  Secondary Signals (Sync, no value)                             │
│  ├── trackLeadCapture                                           │
│  ├── trackToolCompletion                                        │
│  ├── trackModalOpen                                             │
│  └── trackFormSubmit                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Conversion Events (High-Value)

These events carry **monetary value** and are used for ROAS optimization.

| Event Name | Value | EMQ Status | Required Fields |
|------------|-------|------------|-----------------|
| `lead_submission_success` | $15 | ✅ Compliant | `leadId`, `email` |
| `phone_lead` | $25 | ✅ Compliant | `leadId`, `phone`, `sourceTool` |
| `consultation_booked` | $75 | ✅ Compliant | `leadId`, `email`, `phone` |
| `booking_confirmed` | $75 | ✅ Compliant | `leadId`, `email` |

### `trackLeadSubmissionSuccess`

**Purpose:** Standard lead form submission  
**Value:** $15  
**Async:** Yes (PII hashing)

```typescript
await trackLeadSubmissionSuccess({
  leadId: 'uuid-here',
  email: 'user@example.com',
  phone: '555-123-4567',      // Optional
  sourceTool: 'quote-scanner',
  name: 'John Doe',           // Optional
});
```

**dataLayer Output:**
```javascript
{
  event: 'lead_submission_success',
  lead_id: 'uuid-here',
  event_id: 'generated-uuid',  // CAPI deduplication
  external_id: 'uuid-here',    // Cross-platform identity
  value: 15,
  currency: 'USD',
  user_data: {
    sha256_email_address: '64-char-hex',  // Google EC
    sha256_phone_number: '64-char-hex',   // Google EC
    em: '64-char-hex',                     // Meta CAPI
    ph: '64-char-hex',                     // Meta CAPI
    external_id: 'uuid-here',
  }
}
```

---

### `trackPhoneLead`

**Purpose:** Lead captured with phone number (higher intent)  
**Value:** $25  
**Async:** Yes (PII hashing + E.164 normalization)

```typescript
await trackPhoneLead({
  leadId: 'uuid-here',
  phone: '555-123-4567',       // Required - normalized to +15551234567
  email: 'user@example.com',   // Optional
  sourceTool: 'floating-estimate-form',
});
```

---

### `trackConsultationBooked`

**Purpose:** Consultation/callback request submitted  
**Value:** $75  
**Async:** Yes (PII hashing)

```typescript
await trackConsultationBooked({
  leadId: 'uuid-here',
  email: 'user@example.com',
  phone: '555-123-4567',
  sourceTool: 'expert-system',
  metadata: { windowCount: 5 },
});
```

---

### `trackBookingConfirmed`

**Purpose:** Final booking confirmation (highest intent)  
**Value:** $75  
**Async:** Yes (PII hashing)

```typescript
await trackBookingConfirmed({
  leadId: 'uuid-here',
  email: 'user@example.com',
  phone: '555-123-4567',
  name: 'John Doe',
  preferredTime: 'Afternoon',
  sourceTool: 'consultation-modal',
  windowCount: 8,
  estimatedProjectValue: 15000,
  urgencyLevel: 'high',
});
```

---

## Lead Capture Events

These events track the **lead capture funnel** without monetary value.

### `trackLeadCapture`

**Purpose:** Initial lead capture (Phase 4 canonical event)  
**Value:** None (scoring only)  
**Async:** Yes

```typescript
await trackLeadCapture(
  {
    leadId: 'uuid-here',
    visitorId: 'client-id',
    intentTier: 2,
    leadSource: 'quote-scanner',
  },
  'user@example.com',
  '555-123-4567',
  {
    hasAddress: true,
    hasProjectDetails: true,
    hasName: true,
  }
);
```

**Includes:**
- Lead scoring breakdown
- Routing priority
- CRM tags
- 15+ metadata parameters

---

## Engagement Events

| Function | Event Name | Purpose |
|----------|------------|---------|
| `trackModalOpen` | `modal_open` | Modal displayed to user |
| `trackFormStart` | `form_start` | User begins filling form |
| `trackFormSubmit` | `form_submit` | Form submission (success/fail) |
| `trackFormAbandonment` | `form_abandonment` | User abandoned form |
| `trackToolCompletion` | `tool_completion` | Tool/quiz completed |
| `trackScanResult` | `ai_scan_complete` | AI scan finished |
| `trackVaultSyncClicked` | `vault_sync_clicked` | Vault sync initiated |
| `trackVaultActivation` | `vault_activation` | Vault activated |
| `trackPriceAnalysisViewed` | `price_analysis_viewed` | Price analysis shown |
| `trackScannerUploadCompleted` | `scanner_upload_completed` | File upload finished |
| `trackOfflineConversion` | `offline_conversion` | CRM status update |

---

## EMQ Compliance Checklist

All conversion events MUST meet these requirements for EMQ 9.5+:

### ✅ Required Fields

| Field | Purpose | Format |
|-------|---------|--------|
| `event_id` | CAPI deduplication | UUID v4 (`crypto.randomUUID()`) |
| `external_id` | Cross-platform identity | Lead ID (UUID) |
| `user_data.em` | Meta email matching | SHA-256 (lowercase, trimmed) |
| `user_data.ph` | Meta phone matching | SHA-256 (E.164 format) |
| `user_data.sha256_email_address` | Google EC email | SHA-256 (lowercase, trimmed) |
| `user_data.sha256_phone_number` | Google EC phone | SHA-256 (E.164 format) |

### ✅ Validation Rules

1. **Email Normalization:** `toLowerCase().trim()` before hashing
2. **Phone Normalization:** Convert to E.164 (`+1XXXXXXXXXX`) before hashing
3. **Hash Format:** 64-character lowercase hexadecimal
4. **Event ID:** Unique per event (not reused)
5. **External ID:** Persistent across sessions (from `leadAnchor`)

---

## PII Hashing Standards

### Email Hashing

```typescript
import { sha256 } from '@/lib/gtm';

// Automatically lowercased and trimmed
const hashedEmail = await sha256('User@Example.COM  ');
// Returns: 64-char hex of 'user@example.com'
```

### Phone Hashing

```typescript
import { hashPhone } from '@/lib/gtm';

// Normalized to E.164 then hashed
const hashedPhone = await hashPhone('(555) 123-4567');
// Returns: 64-char hex of '+15551234567'
```

### Combined User Data

```typescript
// buildEnhancedUserData handles both platforms
const userData = await buildEnhancedUserData({
  email: 'user@example.com',
  phone: '555-123-4567',
  leadId: 'uuid-here',
});

// Returns:
{
  sha256_email_address: '...',  // Google EC
  sha256_phone_number: '...',   // Google EC
  em: '...',                     // Meta CAPI
  ph: '...',                     // Meta CAPI
  external_id: 'uuid-here',
}
```

---

## Usage Examples

### Form Submission Flow

```typescript
// 1. Form submitted successfully
const leadId = await saveLeadToBackend(formData);

// 2. Store identity for future signals
setLeadAnchor(leadId);

// 3. Fire conversion event
await trackLeadSubmissionSuccess({
  leadId,
  email: formData.email,
  phone: formData.phone,
  sourceTool: 'quote-builder',
});

// 4. If consultation requested
if (formData.wantsConsultation) {
  await trackBookingConfirmed({
    leadId,
    email: formData.email,
    phone: formData.phone,
    preferredTime: formData.preferredTime,
    sourceTool: 'quote-builder',
  });
}
```

### High-Value Signal Pattern

```typescript
import { logHighValueSignal } from '@/lib/highValueSignals';

// Signal linked to existing lead via leadAnchor
await logHighValueSignal('voice_estimate_confirmed', {
  sourceTool: 'floating-estimate-form',
  value: 30,
  estimateDetails: { windowCount: 5 },
});
```

---

## Conversion Value Reference

| Event | Value | Tier | Notes |
|-------|-------|------|-------|
| `lead_submission_success` | $15 | Standard | Email capture |
| `phone_lead` | $25 | High Intent | Phone capture |
| `voice_estimate_confirmed` | $30 | High Intent | Voice flow completion |
| `consultation_booked` | $75 | Highest | Booking request |
| `booking_confirmed` | $75 | Highest | Confirmed booking |

---

## Testing

Run the test suite to validate compliance:

```bash
npm run test -- src/lib/__tests__/gtm-tracking.test.ts
npm run test -- src/lib/__tests__/voice-tracking.test.ts
npm run test -- src/lib/__tests__/lead-capture-integration.test.ts
```

---

## Debug Mode

In development, all GTM pushes are logged to console:

```typescript
// Enable verbose logging
if (import.meta.env.DEV) {
  console.log('[GTM] event pushed', eventData);
}
```

Access the tracking engine globally:

```javascript
// In browser console
window.dataLayer  // View all pushed events
```

---

## Critical Rules

1. **NEVER push unhashed PII** to dataLayer
2. **ALWAYS await** async tracking functions
3. **ALWAYS use object parameter** syntax (not positional args)
4. **NEVER skip** `event_id` for conversion events
5. **ALWAYS link** to `leadId` via `leadAnchor` for attribution

---

*For questions, see the test files or the source at `src/lib/gtm.ts`*
