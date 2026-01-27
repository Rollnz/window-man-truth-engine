
# Create SpecChecklistGuideModal - Homeowner's Spec Sheet

## Overview
Create a 5-step multi-step conversion modal for the Spec Checklist Guide page, mirroring the Kitchen Table Guide Modal flow. This replaces the current simple `EbookLeadModal` with a full upsell funnel.

---

## Part 1: Create the Modal Component

### File: `src/components/conversion/SpecChecklistGuideModal.tsx`

Create a new component that replicates `KitchenTableGuideModal.tsx` with these specific changes:

| Property | KitchenTableGuideModal | SpecChecklistGuideModal |
|----------|------------------------|-------------------------|
| Title | "Kitchen Table Defense Kit" | "Homeowner's Spec Sheet" |
| Subtitle | "Free PDF • Instant Access" | "Free PDF • Instant Access" |
| `sourceTool` | `'kitchen-table-guide'` | `'spec-checklist-guide'` |
| Modal tracking name | `'kitchen_table_guide'` | `'spec_checklist_guide'` |
| `aiContext.source_form` | `'kitchen-table-guide-upsell'` | `'spec-checklist-guide-upsell'` |
| Success message | "Your Guide is on its way..." | "Your Spec Sheet is on its way..." |
| Return button text | "Return to Guide" | "Return to Checklist" |

### 5-Step Flow Structure
1. **Form Step** (2x2 grid):
   - First Name (required, min 3 chars)
   - Last Name (optional, with "subliminal nudge" logic)
   - Email (required)
   - Phone (optional, formatted as `(XXX) XXX-XXXX`)
   - Submit button: "Send Me the Spec Sheet"
   - Trust signals: No Spam, No Sales Calls, No Contractor Handoff

2. **Success/Upsell Step**:
   - Confirmation checkmark
   - "Your Spec Sheet is on its way to your Vault!"
   - "Would you like to skip the guesswork?"
   - Primary CTA: "Book a Free Measurement"
   - Secondary CTA: "Request a 5-Minute Callback"
   - Decline link: "No thanks, I'll review the checklist first"

3. **Project Step** (questionnaire):
   - Property Type (House, Condo, Townhome, Business, Other)
   - Property Status (New to me / One I'm updating)
   - Window Reasons (multi-select checkboxes)
   - Window Count (1-5, 5-10, 10-15, 15+)
   - Timeframe (In a hurry through Just researching)

4. **Location Step**:
   - City (with MapPin icon)
   - Zip Code (5 digits max)
   - Optional remark field

5. **Thank You Step**:
   - Green confirmation checkmark
   - "You're All Set!" heading
   - 3-step next steps list
   - Company phone number: (561) 468-5571
   - Return button: "Return to Checklist"

### Modal Behavior
- **Locked-Open UX**: Prevent dismissal via outside clicks or Escape key
- Uses `onInteractOutside`, `onPointerDownOutside`, `onEscapeKeyDown` with `e.preventDefault()`
- Only closable via X button or "No thanks" links
- Blue gradient background with radial gradient form card (same as Kitchen Table)

---

## Part 2: Update SpecChecklistHero Component

### File: `src/components/spec-checklist/SpecChecklistHero.tsx`

**Changes**:
1. Replace `EbookLeadModal` import with `SpecChecklistGuideModal` import
2. Update the modal component usage from `<EbookLeadModal>` to `<SpecChecklistGuideModal>`
3. Adjust the `onSuccess` handler to work with the new modal pattern

---

## Part 3: Update MainCTASection Component

### File: `src/components/spec-checklist/MainCTASection.tsx`

**Changes**:
1. Add `useState` for modal open state
2. Import `SpecChecklistGuideModal`
3. Change the form to a button that opens the modal
4. Add blue gradient background to the section (same gradient as Kitchen Table)
5. Add the modal component at the end

The section will use this gradient:
```css
background: linear-gradient(135deg, #d0e4f7 0%, #73b1e7 16%, #0a77d5 34%, #539fe1 61%, #539fe1 61%, #87bcea 100%)
```

---

## Part 4: Update SecondaryCTASection Component

### File: `src/components/spec-checklist/SecondaryCTASection.tsx`

**Changes**:
1. Add `useState` for modal open state
2. Import `SpecChecklistGuideModal`
3. Change the inline form to a button that opens the modal
4. Add the modal component at the end

---

## Technical Notes

### Form Validation
- `firstName`: min 3 characters (commonSchemas.firstName)
- `email`: standard email validation (commonSchemas.email)
- `phone`: 10-digit formatting via `formatPhoneNumber`

### EMQ Compliance
All tracking will use:
- `trackModalOpen` for modal open event
- `trackConsultationBooked` for upsell completion (with proper event_id, user_data, value/currency)
- Deterministic event_id format: `consultation_booked:{leadId}`

### Edge Function Compatibility
The modal will submit to the existing `save-lead` edge function with:
- `sourceTool`: `'spec-checklist-guide'`
- Upsell submissions use `sourceTool`: `'consultation'`
- All `window_count` values handled by existing string-to-integer conversion logic

### Session Persistence
- Lead data from step 1 persisted via `useSessionData().updateFields`
- Auto-populates subsequent questionnaire steps

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/conversion/SpecChecklistGuideModal.tsx` | CREATE |
| `src/components/spec-checklist/SpecChecklistHero.tsx` | MODIFY |
| `src/components/spec-checklist/MainCTASection.tsx` | MODIFY |
| `src/components/spec-checklist/SecondaryCTASection.tsx` | MODIFY |

---

## Summary
This implementation creates a unified, high-converting lead capture experience for the Spec Checklist Guide page that matches the proven Kitchen Table Defense Kit flow. The "Homeowner's Spec Sheet" branding maintains consistency with the page's professional documentation theme while maximizing upsell opportunities.
