
# EMQ Score Investigation: Root Cause Analysis and Fix Plan

## Executive Summary
The EMQ score is critically low (2.1/10) because the calculation includes ALL events from `wm_event_log`, but **56% of events are anonymous engagement events** that occur BEFORE users provide their email. The EMQ metric should only measure conversion event quality, not anonymous engagement.

## Root Causes Identified

### 1. Architectural Issue: EMQ Includes Non-Conversion Events (PRIMARY CAUSE)

**Evidence from Database:**
| Event Type | Total Events | With Email Hash | Coverage |
|------------|-------------|-----------------|----------|
| Conversion (lead_*, booking_confirmed) | 137 | 108 | **78.8%** |
| Engagement (scanner_*, etc.) | 171 | 1 | **0.6%** |

The EMQ calculation in `admin-tracking-health/index.ts` queries ALL events:
```sql
SELECT email_sha256, phone_sha256... FROM wm_event_log
```

But scanner events (`scanner_upload_completed`, `scanner_analysis_completed`) are **intentionally anonymous** - they occur when users upload quotes BEFORE providing their contact info.

### 2. Code Bug: `booking_confirmed` Events Missing PII

**File**: `src/components/conversion/ConsultationBookingModal.tsx` (lines 247-254)

**Current Code (BROKEN)**:
```typescript
await logBookingConfirmed({
  preferredTime: values.preferredTime,
  bookingType: 'consultation',
  windowCount: sessionData.windowCount,
  projectValue: sessionData.fairPriceQuizResults?.quoteAmount,
  urgencyLevel: sessionData.urgencyLevel,
  leadId: data.leadId,
  // MISSING: email and phone!
});
```

**Database Evidence**: All 5 `booking_confirmed` events have `email_sha256: null` despite having valid `lead_id`.

### 3. Variable Coverage in `lead_captured` Events

Some source tools have lower email hash coverage:
| Source Tool | Events | With Email | Coverage |
|-------------|--------|------------|----------|
| expert-system | 3 | 3 | 100% |
| quote-scanner | 2 | 2 | 100% |
| beat-your-quote | 22 | 14 | 63.6% |
| floating-estimate-form | 7 | 3 | 42.9% |
| fair-price-quiz | 3 | 1 | 33.3% |

---

## Implementation Plan

### Phase 1: Fix EMQ Calculation (Backend)

**File**: `supabase/functions/admin-tracking-health/index.ts`

Filter the EMQ query to only include conversion events:

```typescript
// BEFORE (includes all events)
const { data: currentEmqData } = await supabase
  .from('wm_event_log')
  .select('email_sha256, phone_sha256, user_data, fbp, fbc')
  .gte('event_time', dateFilter.start)
  .lte('event_time', dateFilter.end)
  .limit(5000);

// AFTER (conversion events only)
const CONVERSION_EVENT_NAMES = [
  'lead_submission_success',
  'lead_captured',
  'booking_confirmed',
  'consultation_booked',
  'phone_lead_captured',
  'voice_estimate_confirmed',
  'cv_fallback',
];

const { data: currentEmqData } = await supabase
  .from('wm_event_log')
  .select('email_sha256, phone_sha256, user_data, fbp, fbc')
  .in('event_name', CONVERSION_EVENT_NAMES)
  .gte('event_time', dateFilter.start)
  .lte('event_time', dateFilter.end)
  .limit(5000);
```

**Expected Result**: EMQ score will jump from 2.1 to approximately **7.9-8.5** (based on 78.8% conversion event coverage).

### Phase 2: Fix booking_confirmed PII Capture (Frontend)

**File**: `src/components/conversion/ConsultationBookingModal.tsx`

Add email and phone to the `logBookingConfirmed` call:

```typescript
await logBookingConfirmed({
  preferredTime: values.preferredTime,
  bookingType: 'consultation',
  windowCount: sessionData.windowCount,
  projectValue: sessionData.fairPriceQuizResults?.quoteAmount,
  urgencyLevel: sessionData.urgencyLevel,
  leadId: data.leadId,
  email: values.email,      // ADD THIS
  phone: values.phone,      // ADD THIS
});
```

### Phase 3: Audit Lead Capture Forms (Investigation)

Review why some source tools have lower PII coverage on `lead_captured` events:

1. `beat-your-quote` (63.6%) - Check if PII is passed to tracking
2. `floating-estimate-form` (42.9%) - Likely missing PII in event payload
3. `fair-price-quiz` (33.3%) - Likely missing PII in event payload

This requires auditing each lead capture component to ensure they pass `email` and `phone` to the event logging functions.

---

## Technical Details

### Files to Modify

1. `supabase/functions/admin-tracking-health/index.ts`
   - Add conversion event filter to EMQ query
   - Update previous period query with same filter
   - Add debug logging for event counts

2. `src/components/conversion/ConsultationBookingModal.tsx`
   - Pass email/phone to `logBookingConfirmed()`

3. **Future audit** (out of scope for immediate fix):
   - Various lead capture components using `lead_captured` event

### Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| EMQ Score | 2.1/10 | 8.5+/10 |
| Conversion Email Coverage | 78.8% | 95%+ |
| booking_confirmed with PII | 0% | 100% |

### Risk Assessment

- **Low Risk**: EMQ calculation change is read-only
- **Low Risk**: Adding PII to existing function call
- **No Breaking Changes**: All changes are additive
