

# Pivot Sample Report: Pre-Quote CTA Hierarchy + EMQ Value Fix

## Problem Analysis

### Issue 1: Button Hierarchy
In `src/components/sample-report/HeroSection.tsx` (lines 82-91), the buttons are currently:
- **Primary (CTA)**: "Upload My Quote" 
- **Secondary (outline)**: "Don't Have a Quote Yet? Get Ready"

This prioritizes users who already have quotes, but the page goal is now to capture early-stage homeowners.

### Issue 2: EMQ Value Undefined
In `src/components/sample-report/PreQuoteLeadModal.tsx` (lines 151-161), only `trackLeadCapture` is called:

```typescript
// Current code - MISSING trackLeadSubmissionSuccess
await trackLeadCapture(
  { leadId: result.leadId, sourceTool: 'sample_report', conversionAction: 'pre_quote_signup' },
  formData.email,
  formData.phone,
  { hasName: true, hasPhone: true }
);
```

Compare to `SampleReportAccessGate.tsx` which calls BOTH:
```typescript
trackLeadCapture({ ... });
trackLeadSubmissionSuccess({ ..., value: 50 });  // <-- THIS IS MISSING
```

The missing `trackLeadSubmissionSuccess` call means Meta CAPI receives no conversion value for pre-quote leads.

---

## Solution

### Part 1: Swap Button Hierarchy

**File**: `src/components/sample-report/HeroSection.tsx`

**Lines 82-92** - Swap button variants AND positions:

```typescript
// BEFORE
<div className="flex flex-col sm:flex-row gap-4 pt-4">
  <Button variant="cta" size="lg" className="group" onClick={handleUploadClick}>
    <Upload className="w-5 h-5 mr-2" />
    Upload My Quote
    <ArrowRight ... />
  </Button>
  <Button variant="outline" size="lg" className="group" onClick={handleNoQuoteClick}>
    Don't Have a Quote Yet? Get Ready
    <ArrowRight ... />
  </Button>
</div>

// AFTER
<div className="flex flex-col sm:flex-row gap-4 pt-4">
  <Button variant="cta" size="lg" className="group" onClick={handleNoQuoteClick}>
    Don't Have a Quote Yet? Get Ready
    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
  </Button>
  <Button variant="outline" size="lg" className="group" onClick={handleUploadClick}>
    <Upload className="w-5 h-5 mr-2" />
    Upload My Quote
    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
  </Button>
</div>
```

---

### Part 2: Add EMQ Conversion Value for Pre-Quote Leads

**File**: `src/components/sample-report/PreQuoteLeadModal.tsx`

**Step A**: Add import for `trackLeadSubmissionSuccess`

```typescript
// Line 9 - Update import
import { trackLeadCapture, trackLeadSubmissionSuccess } from '@/lib/gtm';
```

**Step B**: Add `trackLeadSubmissionSuccess` call after `trackLeadCapture` (lines 151-165)

**Value Strategy**: Pre-quote leads are the main goal of the page and represent early-funnel intent. Set value to **$75** (higher than the $50 for quote uploads, but less than $100 for full conversions).

```typescript
// BEFORE (lines 150-165)
if (result?.leadId) {
  await trackLeadCapture(
    { leadId: result.leadId, sourceTool: 'sample_report', conversionAction: 'pre_quote_signup' },
    formData.email,
    formData.phone,
    { hasName: true, hasPhone: true }
  );
  
  setSubmittedName(formData.firstName);
  setIsSuccess(true);
  onSuccess?.(result.leadId);
}

// AFTER
if (result?.leadId) {
  // Track both lead_captured AND lead_submission_success for full EMQ
  Promise.allSettled([
    trackLeadCapture(
      { leadId: result.leadId, sourceTool: 'sample_report', conversionAction: 'pre_quote_signup' },
      formData.email,
      formData.phone,
      { hasName: true, hasPhone: true }
    ),
    trackLeadSubmissionSuccess({
      leadId: result.leadId,
      email: formData.email,
      phone: formData.phone.replace(/\D/g, ''),
      firstName: formData.firstName,
      lastName: formData.lastName,
      sourceTool: 'sample-report',
      eventId: `pre_quote_lead:${result.leadId}`,
      value: 75,  // Higher value than quote uploads ($50) - main page goal
    }),
  ]).catch(err => console.warn('[PreQuoteLeadModal] Non-fatal tracking error:', err));
  
  setSubmittedName(formData.firstName);
  setIsSuccess(true);
  onSuccess?.(result.leadId);
}
```

---

## Technical Details

### Conversion Value Hierarchy (After Fix)

| Flow | Value | Rationale |
|------|-------|-----------|
| Pre-quote signup (NEW) | $75 | Main page goal, early-funnel, nurture-ready |
| Quote upload (existing) | $50 | Has quote, ready to analyze |
| Standard lead (default) | $15 | Minimal engagement |

### Why `Promise.allSettled`?

Using `Promise.allSettled` instead of `await` ensures:
1. Tracking failures don't block the success UI
2. Both tracking calls fire in parallel (faster)
3. User sees success state immediately

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/sample-report/HeroSection.tsx` | Swap button variants and positions |
| `src/components/sample-report/PreQuoteLeadModal.tsx` | Add `trackLeadSubmissionSuccess` with $75 value |

---

## Visual Result

**Before:**
```
[Upload My Quote] (solid blue)  [Don't Have a Quote Yet?] (outline)
```

**After:**
```
[Don't Have a Quote Yet? Get Ready] (solid blue)  [Upload My Quote] (outline)
```

