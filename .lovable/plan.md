
# Fix Modal Dismissal, 400 Error, and EMQ Tracking Issues

## Overview
This plan addresses four distinct issues:
1. Modal closes too easily when clicking outside
2. 400 error on Step 3 due to `window_count` type mismatch
3. Missing EMQ data in `consultation_booked` event
4. Value/Currency expectations mismatch in EMQ validator

---

## Issue 1: Modal Dismissal Behavior

### Problem
The Radix UI Dialog component closes when clicking the overlay (outside the modal), causing accidental dismissals.

### Solution
Add `onInteractOutside` and `onPointerDownOutside` handlers to `DialogContent` to prevent default close behavior. The modal should only close via:
- The X button (default Radix close button)
- The "No thanks" text links within the modal content

### Implementation
**File:** `src/components/conversion/KitchenTableGuideModal.tsx`

Add event prevention props to DialogContent:

```text
<DialogContent 
  className="..."
  style={{ ... }}
  onInteractOutside={(e) => e.preventDefault()}
  onPointerDownOutside={(e) => e.preventDefault()}
  onEscapeKeyDown={(e) => e.preventDefault()}
>
```

This prevents:
- Clicking outside the modal from closing it
- Pressing Escape from closing it
- Mouse movements outside from triggering close

---

## Issue 2: 400 Error - `window_count` Type Mismatch

### Problem
The edge function schema expects:
```
window_count: z.number().int().min(0).max(500)
```

But the frontend sends strings like `"5-10"`, `"15+"` from the dropdown selection.

### Root Cause
In `handleLocationSubmit()`, the code passes:
```javascript
window_count: projectDetails.windowCount // "5-10" (string)
```

### Solution
Two options:

**Option A (Recommended)**: Update the edge function schema to accept the string format since this is a qualitative range, not an exact count.

**Option B**: Convert the string to a midpoint number in the frontend.

I recommend Option A because:
- The data is a range category, not an exact count
- Preserving the original selection is more accurate for CRM/analytics
- No data loss

### Implementation (Option A)
**File:** `supabase/functions/save-lead/index.ts`

Update the `aiContextSchema`:

```text
const aiContextSchema = z.object({
  source_form: z.string().max(100).optional().nullable(),
  specific_detail: z.string().max(1000).optional().nullable(),
  emotional_state: z.string().max(100).optional().nullable(),
  urgency_level: z.string().max(100).optional().nullable(),
  insurance_carrier: z.string().max(100).optional().nullable(),
  // Changed: Accept string ranges like "5-10", "15+"
  window_count: z.union([
    z.number().int().min(0).max(500),
    z.string().max(20)
  ]).optional().nullable(),
  // New fields for multi-step form
  upsell_type: z.string().max(50).optional().nullable(),
  property_type: z.string().max(50).optional().nullable(),
  property_status: z.string().max(50).optional().nullable(),
  window_reasons: z.array(z.string().max(100)).max(10).optional().nullable(),
  timeframe: z.string().max(50).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  zip_code: z.string().max(10).optional().nullable(),
  remark: z.string().max(1000).optional().nullable(),
}).optional().nullable();
```

---

## Issue 3: Missing EMQ Data in `consultation_booked` Event

### Problem
The current code uses a direct `trackEvent()` call with minimal data:

```javascript
trackEvent('consultation_booked', {
  sourceTool: 'kitchen-table-guide',
  upsell_type: upsellType,
  property_type: projectDetails.propertyType,
});
```

This is missing:
- `event_id` (required for deduplication)
- `user_data` with hashed email/phone (required for EMQ)
- `external_id` (required for cross-platform matching)
- `value` and `currency` (required for conversion value)

### Solution
Replace the direct `trackEvent()` call with the proper `trackConsultationBooked()` function which handles all PII hashing and EMQ requirements.

### Implementation
**File:** `src/components/conversion/KitchenTableGuideModal.tsx`

1. Import `trackConsultationBooked`:
```text
import { trackModalOpen, trackEvent, trackConsultationBooked } from '@/lib/gtm';
```

2. Update `handleLocationSubmit()` to use the proper tracking function:
```text
// Replace:
trackEvent('consultation_booked', {...});

// With:
await trackConsultationBooked({
  leadId: capturedLeadId || crypto.randomUUID(),
  email: values.email,
  phone: values.phone || undefined,
  firstName: values.firstName,
  lastName: values.lastName,
  sourceTool: 'kitchen-table-guide',
  eventId: `consultation_booked:${capturedLeadId || crypto.randomUUID()}`,
});
```

3. Also store the leadId from the initial form submission for use in later steps. The `useLeadFormSubmit` hook returns the leadId via its callback, so we need to capture it.

---

## Issue 4: Value/Currency Expectations in EMQ Validator

### Problem
The EMQ validator has outdated expected values:
- `lead_submission_success`: expects $15, actual is $100
- `consultation_booked`: expects $75, actual is $50

### Solution
Update the `EXPECTED_VALUES` in `emqValidator.ts` to match actual business values, AND update `trackConsultationBooked` to send the correct value.

### Implementation

**File 1:** `src/lib/emqValidator.ts`

Update the expected values to match actual tracking:
```text
export const EXPECTED_VALUES: Record<string, number> = {
  lead_submission_success: 100,  // Changed from 15 - full contact lead
  lead_captured: 15,             // Keep at 15 - email-only leads
  phone_lead: 25,
  consultation_booked: 75,       // Keep at 75
  booking_confirmed: 75,
};
```

**File 2:** `src/lib/gtm.ts`

Update `trackConsultationBooked` to send $75:
```text
// Change line ~884:
value: 75,  // Was 50

// And line ~899:
value: 75,
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/conversion/KitchenTableGuideModal.tsx` | 1. Add `onInteractOutside`, `onPointerDownOutside`, `onEscapeKeyDown` to prevent accidental close. 2. Use `trackConsultationBooked` instead of `trackEvent`. 3. Capture leadId from initial submission. |
| `supabase/functions/save-lead/index.ts` | Update `aiContextSchema` to accept string window_count and add new fields |
| `src/lib/emqValidator.ts` | Update `EXPECTED_VALUES` to match actual conversion values |
| `src/lib/gtm.ts` | Update `trackConsultationBooked` value from 50 to 75 |

---

## Technical Notes

### Lead ID Capture
The `useLeadFormSubmit` hook already returns the leadId via its internal callback. We need to extract it from the `submit()` response. Looking at the hook, it stores the leadId in `setLeadId` but doesn't return it directly.

To capture the leadId, we'll:
1. Use the `onSuccess` callback option which receives the leadId
2. Store it in `capturedLeadId` state for use in later steps

### Deduplication
Using deterministic event_id format `consultation_booked:{leadId}` ensures:
- Deduplication across browser and server events
- Alignment with the wm_event_log ledger

### Schema Flexibility
Adding `z.union([z.number(), z.string()])` for `window_count` maintains backward compatibility while supporting the new form structure.
