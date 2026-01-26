
# Add Blue Gradient and Multi-Step Modal to Sales Tactics Guide

## Overview
This plan implements two changes to the Sales Tactics Guide page:
1. Add the blue gradient background to the form section (SECTION 4)
2. Create a replica of the Kitchen Table Guide Modal for this page, named "SalesTacticsGuideModal"

---

## Part 1: Blue Gradient Background

### Current State
The form section (lines 288-348) uses `bg-primary text-primary-foreground` as its background.

### Target State
Replace with the user-provided gradient:
```css
background: linear-gradient(135deg, #d2dfed 0%, #c8d7eb 19%, #a6c0e3 36%, #a6c0e3 36%, #c8d7eb 51%, #bed0ea 51%, #c8d7eb 51%, #afc7e8 62%, #bad0ef 69%, #99b5db 88%, #799bc8 100%)
```

### Implementation
**File:** `src/pages/SalesTacticsGuide.tsx`

Update SECTION 4 (line 288):
```text
// Change FROM:
<section className="py-16 sm:py-24 bg-primary text-primary-foreground">

// Change TO:
<section 
  className="py-16 sm:py-0 text-white text-xl text-center"
  style={{ background: 'linear-gradient(135deg, #d2dfed 0%, #c8d7eb 19%, #a6c0e3 36%, #a6c0e3 36%, #c8d7eb 51%, #bed0ea 51%, #c8d7eb 51%, #afc7e8 62%, #bad0ef 69%, #99b5db 88%, #799bc8 100%)' }}
>
```

---

## Part 2: Create SalesTacticsGuideModal Component

### Overview
Create a new modal component that replicates the Kitchen Table Guide Modal structure but with content specific to the "11 Sales Tactics" guide.

### Key Differences from KitchenTableGuideModal
| Aspect | KitchenTableGuideModal | SalesTacticsGuideModal |
|--------|------------------------|------------------------|
| Title | "Kitchen Table Defense Kit" | "11 Sales Tactics You Need to Know" |
| sourceTool | 'kitchen-table-guide' | 'sales-tactics-guide' |
| Modal name | 'kitchen_table_guide' | 'sales_tactics_guide' |
| aiContext.source_form | 'kitchen-table-guide-upsell' | 'sales-tactics-guide-upsell' |

### New Component
**File:** `src/components/conversion/SalesTacticsGuideModal.tsx`

This will be an exact replica of `KitchenTableGuideModal.tsx` with:
1. Updated title: "11 Sales Tactics You Need to Know"
2. Updated subtitle: "Free PDF • Instant Access"
3. Updated `sourceTool`: 'sales-tactics-guide'
4. Updated tracking modal name: 'sales_tactics_guide'
5. Updated `aiContext.source_form`: 'sales-tactics-guide-upsell'

### Structure (5-step flow)
1. **Form Step**: 2x2 grid (First Name, Last Name, Email, Phone)
2. **Success Step**: Upsell prompt with "Book a Free Measurement" and "Request a 5-Minute Callback"
3. **Project Step**: Property type, status, window reasons, window count, timeframe
4. **Location Step**: City, Zip Code, Remark
5. **Thank You Step**: Confirmation with phone number

---

## Part 3: Update SalesTacticsGuide Page

### Changes Required
1. Import the new modal component
2. Add modal state management
3. Replace inline form with button that opens modal
4. Update the form section layout to match Kitchen Table Guide style

### Implementation Details

**File:** `src/pages/SalesTacticsGuide.tsx`

1. **Add import** for the new modal:
```typescript
import { SalesTacticsGuideModal } from '@/components/conversion/SalesTacticsGuideModal';
```

2. **Add modal state**:
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
```

3. **Replace SECTION 4** form with:
   - Blue gradient background
   - Form card with radial gradient
   - Updated title: "11 Sales Tactics You Need to Know"
   - Same 2x2 input grid pattern
   - Modal trigger button

4. **Add modal component** at the end of the page:
```typescript
<SalesTacticsGuideModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/conversion/SalesTacticsGuideModal.tsx` | CREATE | New modal component (replica of KitchenTableGuideModal) |
| `src/pages/SalesTacticsGuide.tsx` | MODIFY | Add gradient, modal state, update form section |

---

## Technical Notes

### Form Validation
The modal will use the same validation patterns:
- `firstName`: min 3 characters (commonSchemas.firstName)
- `email`: standard email validation (commonSchemas.email)
- `phone`: 10-digit formatting via `formatPhoneNumber`

### EMQ Compliance
All tracking will use:
- `trackModalOpen` for modal open event
- `trackConsultationBooked` for upsell completion (with proper event_id, user_data, value/currency)
- Deterministic event_id format: `consultation_booked:{leadId}`

### Modal Behavior
- Locked-open UX (no dismiss on outside click or Escape)
- Only closes via X button or "No thanks" links
- Uses same blue gradient and radial form card styling

### Edge Function Compatibility
The modal will submit to the same `save-lead` edge function with:
- `sourceTool`: 'sales-tactics-guide'
- Upsell submissions use `sourceTool`: 'consultation'
- All `window_count` values will be handled by the existing string-to-integer conversion logic
