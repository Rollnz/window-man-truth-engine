

# Update EMQ Validator to Match wmTracking Canonical Events

## Problem
The `emqValidator.ts` file still references deprecated event names (`lead_submission_success`, `lead_captured`, etc.) and their old dollar values. This causes:
- The EMQ Validator Overlay to silently ignore all 5 canonical `wm_` events
- The "Run Test" button's `wm_lead` event to never appear in the validator
- Value/currency checks to fail (expecting $100 instead of $10 for leads)

## Files to Change

### 1. `src/lib/emqValidator.ts` (the only file that needs modification)

**A. Replace `EXPECTED_VALUES` with canonical wmTracking values:**

```
Before:
  lead_submission_success: 100
  lead_captured: 15
  phone_lead: 25
  consultation_booked: 75
  booking_confirmed: 75

After:
  wm_lead: 10
  wm_qualified_lead: 100
  wm_scanner_upload: 500
  wm_appointment_booked: 1000
  wm_sold: 5000
```

**B. Replace `CONVERSION_EVENTS` array:**

```
Before:
  ['lead_submission_success', 'lead_captured', 'phone_lead',
   'consultation_booked', 'booking_confirmed']

After:
  ['wm_lead', 'wm_qualified_lead', 'wm_scanner_upload',
   'wm_appointment_booked', 'wm_sold']
```

**C. Add `client_id` and `session_id` validation** as two new check rows in `validateEMQEvent()`, increasing `totalChecks` from 5 to 7. These are bonus checks (passed = true when present, not penalized when absent) so existing HIGH scores are preserved.

### 2. No other files change
- `trackingVerificationTest.ts` -- already correct (targets `wm_lead`, expects $10)
- `EMQValidatorOverlay.tsx` -- no code changes needed; it calls `isConversionEvent()` which will automatically start matching `wm_` events after the fix
- `wmTracking.ts` -- untouched

## Implementation Order
1. Update `EXPECTED_VALUES` and `CONVERSION_EVENTS` constants
2. Add identity field checks to `validateEMQEvent()`
3. Verify no test files import the old constants by name (they don't -- tests use wmTracking directly)

## Potential Challenges
- The `FullFunnelAudit.tsx` page has an icon map referencing `lead_submission_success` -- this is cosmetic only (icon lookup) and unrelated to validation logic, so it won't break. It can be cleaned up separately.
- The legacy bridge in `wmTracking.ts` still fires `lead_submission_success` as an RT event. The updated validator will correctly ignore it (RT events are not in `CONVERSION_EVENTS`), which is the desired behavior.

## What Success Looks Like
After this change:
- Submitting a lead form fires `wm_lead`
- The EMQ Validator Overlay auto-opens and shows the event with score HIGH (5/5 or 7/7)
- The tracking test page reports PASS with projected EMQ 9.5+
- Value shows $10 USD (not $100)
- `client_id` and `session_id` presence is validated

