
# Kitchen Table Guide Form Enhancement & Multi-Step Upsell Flow

## Overview
This plan addresses form validation improvements, lead data persistence for prepopulation, the 403 ownership error, and creates a beautiful multi-step project questionnaire flow with a thank you page.

---

## Part 1: Fix the 403 Ownership Error

### Root Cause
The `KitchenTableGuideModal` uses `useLeadFormSubmit` which does NOT pass `clientId` in the sessionData payload. The `save-lead` edge function only extracts `clientId` from `sessionData.clientId`, so the lead is created with `client_id = null`. Later, when `score-event` attempts ownership validation, it compares the browser's `anon_id` against the null `client_id` and fails.

### Solution
The `useLeadFormSubmit` hook needs to automatically include `clientId: getOrCreateAnonId()` in every submission. This ensures the `save-lead` function always has a valid `client_id` to store.

**File:** `src/hooks/useLeadFormSubmit.ts`

```text
Changes:
1. Import getOrCreateAnonId from useCanonicalScore
2. Add clientId to the sessionData in the payload:
   sessionData: {
     clientId: getOrCreateAnonId(),
   }
```

This is a one-line fix that will resolve the 403 error globally for all forms using this hook.

---

## Part 2: Phone Field Validation & Formatting

### Requirements
- Accept exactly 10 digits
- Display as `(111) 222-3333` after 10th digit
- Store as `1XXXXXXXXXX` (with country code, no formatting) for backend/webhooks

### Implementation
1. **Create a new phone formatter** that limits input to 10 digits maximum
2. **Update the phone schema** to enforce exactly 10 digits
3. **Add a utility function** to convert display format to E.164 for storage

**Files:** 
- `src/hooks/useFormValidation.ts` - Already has `formatPhoneNumber`, but will verify it limits to 10 digits
- `src/lib/phoneFormat.ts` - Already has `normalizeToE164` for backend formatting
- `src/components/conversion/KitchenTableGuideModal.tsx` - Add formatter to phone field

---

## Part 3: First Name Minimum 3 Characters

### Implementation
Update the `commonSchemas.firstName` validation in `useFormValidation.ts` to require minimum 3 characters.

**File:** `src/hooks/useFormValidation.ts`

```text
firstName: z.string()
  .min(3, 'First name must be at least 3 characters')
  .max(50, 'First name is too long'),
```

---

## Part 4: Last Name "Subliminal Nudge" Red Border

### Requirements
- When user skips last name and focuses on email field, turn last name border red
- This is visual only - does not block submission

### Implementation
Add state tracking in `KitchenTableGuideModal` to detect when:
1. Email field gains focus
2. Last name is still empty

Apply a red border class to the last name input conditionally.

**File:** `src/components/conversion/KitchenTableGuideModal.tsx`

```text
const [lastNameNudge, setLastNameNudge] = useState(false);

// On email focus, check if lastName is empty
onFocus={() => {
  if (!values.lastName.trim()) {
    setLastNameNudge(true);
  }
}}

// Clear nudge if user fills lastName
useEffect(() => {
  if (values.lastName.trim()) {
    setLastNameNudge(false);
  }
}, [values.lastName]);
```

---

## Part 5: Lead Data Persistence for Prepopulation

### Current Issue
When user fills out the Kitchen Table Guide form and clicks an upsell button, the `ConsultationBookingModal` opens but fields are empty because the sessionData wasn't updated with the captured information.

### Solution
After successful form submission in `KitchenTableGuideModal`, persist the lead data to sessionData using `updateFields` from `useSessionData`. The `ConsultationBookingModal` already reads from `sessionData.firstName`, `sessionData.lastName`, etc.

**File:** `src/components/conversion/KitchenTableGuideModal.tsx`

```text
// After successful submit:
updateFields({
  firstName: values.firstName,
  lastName: values.lastName,
  email: values.email,
  phone: values.phone,
});
```

This ensures the consultation modal auto-populates with the user's data.

---

## Part 6: Multi-Step Project Questionnaire

### New User Flow (Alternative to Simple Prepopulation)
Instead of just prepopulating contact info, create a more detailed 3-step flow:

**Step 1: Success + Upsell Prompt** (already exists)
- "Your Guide is on its way to your Vault!"
- Two buttons: Book Measurement / Request Callback

**Step 2: Project Details** (new)
When user clicks either upsell button, show a project questionnaire:
- Property type: House, Condo, Townhome, Business, Other (radio buttons)
- Property status: New to me, Updating older property
- Reasons for windows (multi-select, up to 5 common reasons):
  - Hurricane/Storm Protection
  - Energy Efficiency / Lower Bills
  - Noise Reduction
  - Home Security
  - Increase Home Value
- Window count: 1-5, 5-10, 10-15, 15+
- Timeframe: In a hurry, 1-2 months, 2-4 months, Hopefully this year, Just researching

**Step 3: Location & Notes** (new)
- City (text input)
- Zip Code (text input)
- Remark (one-line optional)
- Complete button

**Step 4: Thank You Page** (new)
- Success message with company phone number
- Next steps they can expect

### Implementation Structure
Transform `KitchenTableGuideModal` to support 4 steps:
1. `form` - Initial contact form
2. `success` - Upsell prompt (current)
3. `project` - Project questionnaire (new)
4. `location` - City/Zip/Notes (new)
5. `thankyou` - Final confirmation (new)

**Files:**
- `src/components/conversion/KitchenTableGuideModal.tsx` - Add step state and all step views

---

## Technical Details

### Step State Management

```text
type ModalStep = 'form' | 'success' | 'project' | 'location' | 'thankyou';
const [step, setStep] = useState<ModalStep>('form');
```

### Project Details Form Fields

```text
const [projectDetails, setProjectDetails] = useState({
  propertyType: '',  // house | condo | townhome | business | other
  propertyStatus: '', // new | updating
  windowReasons: [] as string[], // multi-select array
  windowCount: '', // 1-5 | 5-10 | 10-15 | 15+
  timeframe: '', // hurry | 1-2 | 2-4 | this-year | researching
});
```

### Location Form Fields

```text
const [locationDetails, setLocationDetails] = useState({
  city: '',
  zipCode: '',
  remark: '',
});
```

### Styling Consistency
All steps will maintain the established modal styling:
- Blue gradient outer border
- Red/white radial gradient inner card
- Theme-locked text colors (slate-900, slate-600)
- Primary Blue CTA buttons

### Data Persistence
All collected data will be persisted to sessionData and included in the final save-lead call for CRM enrichment.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useLeadFormSubmit.ts` | Add clientId to payload for 403 fix |
| `src/hooks/useFormValidation.ts` | Update firstName min to 3 chars |
| `src/components/conversion/KitchenTableGuideModal.tsx` | Complete rewrite for multi-step flow, phone formatting, last name nudge |

---

## Thank You Page Content

```text
Headline: "You're All Set!"
Subtext: "Here's what happens next:"

Steps:
1. A window specialist will review your project details
2. You'll receive a call within 24 hours at your preferred time
3. We'll schedule your free, no-obligation measurement

Company Phone:
📞 (561) 468-5571
"Questions? Call us anytime - we're local and ready to help."

Button: "Return to Guide" (closes modal)
```

---

## Summary

This plan addresses all 8 requirements:
1. Phone normalization (10 digits, formatted display, E.164 storage)
2. First name minimum 3 characters
3. Last name red border nudge when skipped
4. Email validation (already in place via commonSchemas.email)
5. Lead data persistence for prepopulation
6. Multi-step project questionnaire (Steps 2 & 3)
7. 403 ownership error fix (clientId in payload)
8. Thank you page with phone number and next steps
