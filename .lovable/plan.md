
# Post-Submission Success State for KitchenTableGuideModal

## Overview
Transform the modal to show an upsell view after successful form submission, instead of immediately closing. The success view will maintain the exact same styling (blue gradient outer, red/white radial inner card) and offer two clear action paths to higher-intent conversions.

## Current Behavior
- Form submits via `useLeadFormSubmit`
- On success: calls `onSuccess?.()`, then `onClose()`
- Modal closes immediately after toast notification

## Proposed Behavior
- Form submits successfully
- Modal **stays open** but content transitions to a Success View
- User sees upsell options with two buttons
- Clicking either button opens the appropriate modal (ConsultationBookingModal)
- Declining closes the modal

---

## Implementation Details

### 1. Add Success State to Modal
Add a `showSuccess` state variable to track whether the form has been submitted.

```text
const [showSuccess, setShowSuccess] = useState(false);
```

### 2. Modify Form Submission Handler
Update `handleSubmit` to set `showSuccess = true` on success instead of immediately closing:

```text
if (success) {
  setShowSuccess(true);  // Show upsell view
  onSuccess?.();         // Notify parent (optional callback)
  // Remove: onClose();  // Don't close yet
}
```

### 3. Remove Auto-Redirect
The current `useLeadFormSubmit` configuration includes `redirectTo: ROUTES.QUOTE_SCANNER`. This will be removed so the modal can show the success state instead of navigating away.

### 4. Add ConsultationBookingModal Integration
Import and add state to control the consultation modal:

```text
import { ConsultationBookingModal } from './ConsultationBookingModal';
const [showConsultation, setShowConsultation] = useState(false);
```

### 5. Success View Content
The inner white card will conditionally render either the form or the success view:

**Success View Structure:**
- Checkmark icon in primary color circle
- Headline: "Your Guide is on its way to your Vault!"
- Subtext: "While you wait, would you like to skip the guesswork?"
- Primary Button: "Book a Free Measurement" (variant="cta")
- Secondary Button: "Request a 5-Minute Callback" (variant="secondary-action")
- Text link at bottom: "No thanks, I'll review the guide first" (closes modal)

### 6. Button Actions
- **Book a Free Measurement**: Opens `ConsultationBookingModal` with sourceTool passed appropriately
- **Request a 5-Minute Callback**: Opens same modal (same endpoint, just different framing)
- **Decline link**: Closes the modal via `onClose()`

### 7. Reset State on Modal Close
When the modal closes and reopens, the form should reset to its initial state:

```text
useEffect(() => {
  if (!isOpen) {
    setShowSuccess(false);
  }
}, [isOpen]);
```

---

## Styling Preservation

All styling remains locked to the established pattern:
- **Outer container**: Blue gradient background (unchanged)
- **Inner card**: Red/white radial gradient with heavy box-shadow (unchanged)
- **Text colors**: `text-slate-900` for headings, `text-slate-600` for descriptions
- **Button styles**: Primary uses `variant="cta"`, Secondary uses `variant="secondary-action"`
- **Input fields**: `bg-white border border-black` (form only)

---

## Analytics Tracking
Add tracking for upsell interactions:
- `trackEvent('upsell_shown', { sourceTool: 'kitchen-table-guide', upsell_type: 'consultation' })`
- `trackEvent('upsell_accepted', { ... })` when a button is clicked
- `trackEvent('upsell_declined', { ... })` when decline link is clicked

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/conversion/KitchenTableGuideModal.tsx` | Add success state, remove redirect, add conditional rendering, integrate ConsultationBookingModal |

---

## Technical Notes

1. **No new components needed** - The success view is simple enough to be inline JSX within the modal
2. **ConsultationBookingModal reuse** - Leverages existing consultation booking infrastructure
3. **Golden Thread maintained** - The `leadId` captured during guide submission carries through to any consultation booking
4. **Theme-locked styling** - All colors are hardcoded inline (not using theme tokens) to maintain the established visual consistency
