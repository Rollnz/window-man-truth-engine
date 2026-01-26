

# Plan: Open ConsultationBookingModal on CTA Button Clicks

## Overview
Update buttons containing keywords ("Book", "Schedule", "Call", "Measurement") to open the `ConsultationBookingModal` instead of navigating to another page. This provides a better conversion experience by keeping users on-page.

---

## Component Reference
**Modal Name:** `ConsultationBookingModal`  
**Location:** `src/components/conversion/ConsultationBookingModal.tsx`

**Current Fields:**
- First Name* (required)
- Last Name (optional)
- Email* (required)  
- Phone* (required)
- Best Time to Call* (required dropdown: Morning, Afternoon, Evening, ASAP)
- Additional Notes (optional textarea)

---

## Files to Modify

### 1. Privacy Page (`src/pages/legal/Privacy.tsx`)
**Current:** "Book an Inspection" button navigates to `/free-estimate`

**Change:** 
- Add state for modal visibility
- Import `ConsultationBookingModal` and `useSessionData`
- Replace `<Link>` with a `<Button onClick>` that opens the modal
- Render the modal at the bottom of the component

### 2. Terms Page (`src/pages/legal/Terms.tsx`)
**Same changes as Privacy page**

### 3. About Page (`src/pages/About.tsx`)
**Same changes** - "Book an Inspection" button will open modal

### 4. FAQ Page (`src/pages/FAQ.tsx`)
**Same changes** - "Book an Inspection" button will open modal

### 5. Defense Page (`src/pages/Defense.tsx`)
**Same changes** - "Book an Inspection" button will open modal

---

## Implementation Pattern

Each page will follow this pattern:

```text
1. Add imports:
   - ConsultationBookingModal from @/components/conversion/ConsultationBookingModal
   - useSessionData from @/hooks/useSessionData
   - useState from react

2. Add state:
   const [showConsultationModal, setShowConsultationModal] = useState(false);
   const { sessionData } = useSessionData();

3. Replace Link with Button:
   Before: <Button asChild><Link to={ROUTES.FREE_ESTIMATE}>Book an Inspection</Link></Button>
   After:  <Button onClick={() => setShowConsultationModal(true)}>Book an Inspection</Button>

4. Add modal at component bottom:
   <ConsultationBookingModal
     isOpen={showConsultationModal}
     onClose={() => setShowConsultationModal(false)}
     onSuccess={() => setShowConsultationModal(false)}
     sessionData={sessionData}
     sourceTool="[page-name]"
   />
```

---

## Technical Details

### Source Tool Values
Each page will use a unique `sourceTool` value for analytics tracking:
- Privacy page: `"privacy-cta"`
- Terms page: `"terms-cta"`
- About page: `"about-cta"`
- FAQ page: `"faq-cta"`
- Defense page: `"defense-cta"`

### No Database Changes Required
The `source_tool` enum in the database already supports free-form text values, so no migration is needed.

---

## Summary of Changes

| File | Button Text | Current Behavior | New Behavior |
|------|-------------|------------------|--------------|
| Privacy.tsx | "Book an Inspection" | Navigates to /free-estimate | Opens modal |
| Terms.tsx | "Book an Inspection" | Navigates to /free-estimate | Opens modal |
| About.tsx | "Book an Inspection" | Navigates to /free-estimate | Opens modal |
| FAQ.tsx | "Book an Inspection" | Navigates to /free-estimate | Opens modal |
| Defense.tsx | "Book an Inspection" | Navigates to /free-estimate | Opens modal |

---

## Optional Enhancement: Add "How Many Windows" Field
If you want the modal to also ask "How many windows?", I can add that field to `ConsultationBookingModal` as a second phase. This would require:
1. Adding a `windowCount` field to the form validation
2. Adding an input field between Phone and Preferred Time
3. Passing `windowCount` to the `save-lead` function

Let me know if you'd like this enhancement included.

