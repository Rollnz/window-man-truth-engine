
# Comprehensive Form Audit Report & Fix Plan

## 🔍 EXECUTIVE SUMMARY

This audit identifies **5 critical issues** and **12 accessibility/UX improvements** across the Window Truth Engine's form infrastructure. The issues fall into three categories:

1. **Identity Ownership Mismatch (403 Errors)** - Critical backend issue
2. **Focus Trap & Tab Order Failures** - Accessibility violations
3. **Missing Accessibility Attributes** - WCAG compliance gaps

---

## 🚨 CRITICAL FINDINGS

### Issue 1: Entity Ownership Validation Failure (403 Error)

**Symptoms:**
- `score-event` returns 403: `{"ok":false,"error":"Entity ownership validation failed"}`
- Console: `FunctionsHttpError: Edge Function returned a non-2xx status code`
- Occurs on MissionInitiatedModal submission

**Root Cause:**
The `save-lead` edge function extracts `clientId` from `sessionData.clientId`, but the frontend sends it inconsistently:
- `MissionInitiatedModal.tsx:125` sends `sessionData: { clientId: getOrCreateAnonId() }` ✅
- `ConsultationBookingModal.tsx:146` sends `sessionData: { clientId: getOrCreateAnonId() }` ✅  
- BUT `Consultation.tsx:56` sends `sessionData: { clientId, ...otherData }` where clientId comes from `getOrCreateAnonId()` at line 39

The **mismatch** happens when:
1. A lead is created with `client_id = 'abc123'`
2. User returns with a different browser/session, generating new `anon_id = 'xyz789'`
3. `score-event` compares `leads.client_id (abc123)` !== `request.anon_id (xyz789)` → 403

**Current Handling:**
The `useCanonicalScore` hook (lines 132-161) already silently handles ownership errors, but the error propagates to the UI through the `awardScore` promise chain.

**Fix Strategy:**
Wrap `awardScore` calls in try/catch with silent failure for ownership mismatches (already partially implemented but needs reinforcement in forms that still show toast on failure).

---

### Issue 2: Focus Trap Failures on Firefox

**Affected Components:**
| Page | Component | Issue |
|------|-----------|-------|
| /ai-scanner | ScannerLeadCaptureModal | Tab order broken - focus falls behind modal |
| /beat-your-quote | MissionInitiatedModal | Focus trap partially works but inconsistent |
| /consultation | ConsultationBookingModal | Missing DialogTitle/Description (console warning) |
| Site-wide | EstimateSlidePanel | `Function components cannot be given refs` warning |

**Root Causes:**

1. **Missing Radix DialogTitle/DialogDescription (WCAG violation)**
   - Console: `DialogContent requires a DialogTitle for accessibility`
   - Console: `Warning: Missing Description or aria-describedby for {DialogContent}`
   - TrustModal.tsx:64-80 only renders title/description when props are provided
   - MissionInitiatedModal.tsx:222 uses bare DialogContent without TrustModal, then conditionally renders DialogHeader

2. **Ref Forwarding Issues**
   - EstimateSlidePanel uses SheetContent which wraps Radix primitives
   - Console warning: `Function components cannot be given refs`
   - EMQValidatorOverlay has same issue

3. **Sheet Component Missing Accessible Title**
   - SheetContent.tsx doesn't require SheetTitle/SheetDescription
   - Radix Dialog expects accessible names for focus management

---

### Issue 3: Missing Form Accessibility Attributes

**Audit Results:**

| Component | inputMode | autoComplete | autoCapitalize | tabIndex |
|-----------|-----------|--------------|----------------|----------|
| ScannerStep1Contact | ✅ (Phase 1) | ✅ | ✅ | ✅ |
| ScannerStep2Project | ✅ (Phase 1) | ✅ | ✅ | ✅ |
| ContactDetailsStep | ✅ (Phase 1) | ✅ | ✅ | ✅ |
| MissionInitiatedModal | ❌ | ✅ | ❌ | ❌ |
| ConsultationBookingModal | ❌ | ✅ | ❌ | ❌ |
| ConsultationForm | ❌ | ✅ | ❌ | ❌ |
| KitchenTableGuideModal | ❌ | ❌ | ❌ | ❌ |
| SalesTacticsGuideModal | ❌ | ❌ | ❌ | ❌ |
| SpecChecklistGuideModal | ❌ | ❌ | ❌ | ❌ |
| ExitIntentModal | ❌ | ❌ | ❌ | ❌ |

---

## 📋 FORM-BY-FORM INVENTORY

### /ai-scanner (Quote Scanner)

**Forms Present:**
1. `ScannerLeadCaptureModal` → 3-step wizard (Contact → Project → Analysis)
   - Uses TrustModal ✅
   - Uses ScannerStep1Contact, ScannerStep2Project (Phase 1 fixes applied) ✅
   - **Issue:** Focus trap not working on Firefox

### /beat-your-quote

**Forms Present:**
1. `MissionInitiatedModal` → Lead capture after file upload
   - Does NOT use TrustModal (custom DialogContent styling)
   - **Issues:**
     - Missing accessible DialogTitle during scanning animation state
     - No inputMode on phone field
     - No autoCapitalize="off" on email
     - 403 ownership error on awardScore

2. `QuoteCheckerSection` → Upload/SMS/Call cards
   - Uses useUnifiedUpload for file handling
   - Leads to MissionInitiatedModal on success

### /consultation

**Forms Present:**
1. `ConsultationForm` (page-embedded, not modal)
   - Standard form with proper structure
   - **Issues:**
     - Missing inputMode attributes
     - No micro-copy/reassurance text
     - No submit guard for double-click prevention

2. `ConsultationBookingModal` (used elsewhere via CTAs)
   - Uses TrustModal ✅
   - **Issues:**
     - Missing accessible description (console warning)
     - No inputMode on phone

### Guide Modals (Site-wide)

**Forms Present:**
1. `KitchenTableGuideModal` - 5-step flow
2. `SalesTacticsGuideModal` - 5-step flow  
3. `SpecChecklistGuideModal` - 5-step flow

**Common Issues:**
- No inputMode/autoCapitalize on inputs
- No explicit tabIndex management
- Location step now has state dropdown (just implemented) ✅

### Floating CTA

**Forms Present:**
1. `EstimateSlidePanel` → 3-step wizard (Project → Contact → Address)
   - Uses SheetContent (Radix Sheet primitive)
   - **Issues:**
     - Ref forwarding warning in console
     - Sheet doesn't enforce accessible names

---

## 🛠️ IMPLEMENTATION PLAN

### Phase 2A: Critical Accessibility Fixes (Focus Traps)

1. **Update TrustModal.tsx**
   - Always render DialogTitle (use VisuallyHidden when no modalTitle prop)
   - Always render DialogDescription (use VisuallyHidden when no modalDescription)
   - This fixes Radix focus management

2. **Update MissionInitiatedModal.tsx**
   - Wrap with TrustModal instead of bare DialogContent
   - Add DialogTitle/DialogDescription for scanning state
   - Apply emailInputProps/phoneInputProps

3. **Update SheetContent in sheet.tsx**
   - Add SheetTitle with sr-only fallback
   - Ensure Radix can find accessible name

### Phase 2B: Form Attribute Standardization

4. **ConsultationBookingModal.tsx**
   - Import emailInputProps, phoneInputProps from formAccessibility
   - Add inputMode="email", inputMode="tel"
   - Add autoCapitalize="off" on email

5. **ConsultationForm.tsx**
   - Apply same attribute pattern
   - Add useSubmitGuard for double-click prevention
   - Add micro-copy per formMicroCopy constants

6. **KitchenTableGuideModal.tsx, SalesTacticsGuideModal.tsx, SpecChecklistGuideModal.tsx**
   - Apply emailInputProps/phoneInputProps to form step
   - Already use useFormValidation ✅

7. **ExitIntentModal.tsx**
   - Apply attribute pattern to all form fields

### Phase 2C: 403 Ownership Error Resilience

8. **MissionInitiatedModal.tsx** (lines 171-178)
   - Wrap awardScore in try/catch
   - Don't show toast on ownership failure (already silently handled by hook)

9. **Consultation.tsx** (lines 83-88)
   - Same pattern - Promise.allSettled already used ✅
   - Just ensure errors don't bubble to user

---

## 📁 FILES TO MODIFY

| File | Changes |
|------|---------|
| `src/components/forms/TrustModal.tsx` | Add VisuallyHidden fallback title/description |
| `src/components/ui/sheet.tsx` | Add sr-only SheetTitle fallback |
| `src/components/beat-your-quote/MissionInitiatedModal.tsx` | Use TrustModal, add input attributes |
| `src/components/conversion/ConsultationBookingModal.tsx` | Add inputMode/autoCapitalize |
| `src/components/consultation/ConsultationForm.tsx` | Add input attributes, useSubmitGuard |
| `src/components/conversion/KitchenTableGuideModal.tsx` | Add input attributes to form step |
| `src/components/conversion/SalesTacticsGuideModal.tsx` | Add input attributes to form step |
| `src/components/conversion/SpecChecklistGuideModal.tsx` | Add input attributes to form step |
| `src/components/authority/ExitIntentModal.tsx` | Add input attributes |

---

## 🧪 VERIFICATION CHECKLIST

After implementation:
- [ ] Tab through ScannerLeadCaptureModal fields on Firefox - focus stays in modal
- [ ] Tab through MissionInitiatedModal fields - no focus escape
- [ ] Tab through ConsultationBookingModal - no focus escape
- [ ] Tab through EstimateSlidePanel - focus stays in sheet
- [ ] Console shows no "DialogContent requires DialogTitle" warnings
- [ ] Console shows no "Function components cannot be given refs" warnings
- [ ] Submit form on /beat-your-quote - no 403 error toast appears
- [ ] Submit form on /consultation - submission completes even if awardScore fails
- [ ] Email fields don't auto-capitalize on mobile
- [ ] Phone fields show numeric keyboard on mobile

---

## 💡 TECHNICAL NOTES

### Why Radix Focus Traps Fail Without Accessible Names

Radix Dialog uses the `@radix-ui/react-focus-scope` package to trap focus. When a DialogContent lacks a DialogTitle, the browser's accessibility tree can't properly announce the modal, causing focus to "escape" to elements behind the overlay on certain browsers (especially Firefox).

The fix is to ALWAYS provide an accessible name, even if visually hidden:

```tsx
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

<DialogContent>
  <VisuallyHidden asChild>
    <DialogTitle>Modal Form</DialogTitle>
  </VisuallyHidden>
  {/* rest of content */}
</DialogContent>
```

### Identity Ownership Chain ("Golden Thread")

```
getOrCreateAnonId() → localStorage['wte-anon-id'] → UUID
                      ↓
           save-lead (sessionData.clientId)
                      ↓
           leads.client_id = UUID
                      ↓
           score-event compares:
             request.anon_id === leads.client_id
                      ↓
           Match? → 200 OK, points awarded
           Mismatch? → 403 (silently ignored)
```

The 403 is expected for returning users with new sessions. The frontend should never show an error toast for this.
