

# Remove Partner Consent Checkbox - Complete Cleanup Plan

## Overview

Remove the "Partner Share" checkbox section entirely and clean up all related code across both files to eliminate TypeScript errors and reduce mobile form friction.

---

## Files to Modify

| File | Changes |
|------|---------|
| `SampleReportLeadModal.tsx` | Delete checkbox UI, remove state/props, clean up imports |
| `SampleReport.tsx` | Remove `preCheckPartnerConsent` state and prop passing |

---

## Technical Implementation

### 1. SampleReportLeadModal.tsx Changes

#### A. Remove Checkbox Import (Line 17)

```tsx
// DELETE this line:
import { Checkbox } from '@/components/ui/checkbox';
```

#### B. Remove from Props Interface (Line 39)

```tsx
// DELETE this line:
preCheckPartnerConsent?: boolean;
```

#### C. Remove from Destructuring (Line 51)

```tsx
// DELETE this line:
preCheckPartnerConsent = false,
```

#### D. Remove State (Line 59)

```tsx
// DELETE this line:
const [partnerConsent, setPartnerConsent] = useState(preCheckPartnerConsent);
```

#### E. Update useEffect Reset (Lines 76-88)

```tsx
// BEFORE
useEffect(() => {
  if (isOpen) {
    setStep('form');
    setCapturedLeadId(null);
    setPartnerConsent(preCheckPartnerConsent);  // DELETE
    
    trackEvent('sample_report_lead_modal_open', {
      cta_source: ctaSource,
      has_existing_lead: !!getLeadAnchor(),
    });
  }
}, [isOpen, ctaSource, preCheckPartnerConsent]);  // Remove from deps

// AFTER
useEffect(() => {
  if (isOpen) {
    setStep('form');
    setCapturedLeadId(null);
    
    trackEvent('sample_report_lead_modal_open', {
      cta_source: ctaSource,
      has_existing_lead: !!getLeadAnchor(),
    });
  }
}, [isOpen, ctaSource]);
```

#### F. Update Payload (Lines 117-121)

```tsx
// BEFORE
sessionData: {
  clientId: getOrCreateClientId(),
  partnerConsent,
  ctaSource,
},

// AFTER
sessionData: {
  clientId: getOrCreateClientId(),
  ctaSource,
},
```

#### G. Update Analytics Event (Line 154)

```tsx
// DELETE this line:
partner_consent: partnerConsent,
```

#### H. Delete Partner Consent UI Block (Lines 279-298)

Delete this entire section:

```tsx
{/* Partner Consent */}
<div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-50 border border-slate-200 dark:border-slate-200">
  <div className="flex items-start gap-3">
    <Checkbox
      id="sr-partner-consent"
      checked={partnerConsent}
      onCheckedChange={(checked) => setPartnerConsent(checked === true)}
      className="mt-1"
      aria-describedby="sr-partner-consent-desc"
    />
    <label htmlFor="sr-partner-consent" className="cursor-pointer">
      <span className="text-sm font-medium text-slate-900 dark:text-slate-900">
        Yes — share my project specs with vetted partners to get competing estimates
      </span>
      <p id="sr-partner-consent-desc" className="text-xs text-slate-500 dark:text-slate-500 mt-1">
        Window Man may connect you with pre-screened contractors who can offer better pricing. Your contact info is never sold.
      </p>
    </label>
  </div>
</div>
```

---

### 2. SampleReport.tsx Changes

#### A. Remove State (Line 35)

```tsx
// DELETE this line:
const [preCheckPartnerConsent, setPreCheckPartnerConsent] = useState(false);
```

#### B. Update Handler Signature (Line 63)

```tsx
// BEFORE
const handleOpenLeadModal = (ctaSource: string, preCheckConsent = false) => {

// AFTER
const handleOpenLeadModal = (ctaSource: string) => {
```

#### C. Remove State Setter (Line 77)

```tsx
// DELETE this line:
setPreCheckPartnerConsent(preCheckConsent);
```

#### D. Remove Prop from Component (Lines 121-127)

```tsx
// BEFORE
<SampleReportLeadModal
  isOpen={showLeadModal}
  onClose={() => setShowLeadModal(false)}
  onSuccess={handleLeadModalSuccess}
  ctaSource={modalCtaSource}
  preCheckPartnerConsent={preCheckPartnerConsent}
/>

// AFTER
<SampleReportLeadModal
  isOpen={showLeadModal}
  onClose={() => setShowLeadModal(false)}
  onSuccess={handleLeadModalSuccess}
  ctaSource={modalCtaSource}
/>
```

---

## Visual Result

### Final Form Layout

```
┌────────────────────────────────────────┐
│   Let's Personalize Your Audit         │
├────────────────────────────────────────┤
│   ┌──────────────┐   ┌──────────────┐  │
│   │ First Name   │   │ Last Name    │  │
│   └──────────────┘   └──────────────┘  │
│                         ↑ 12px gap     │
│   ┌────────────────────────────────┐   │
│   │ Email Address                  │   │
│   └────────────────────────────────┘   │
│                         ↑ 12px gap     │
│   ┌────────────────────────────────┐   │
│   │ (555) 555-5555                 │   │
│   └────────────────────────────────┘   │
│                         ↑ 12px gap     │
│   ┌────────────────────────────────┐   │
│   │      Get My Free Audit         │   │
│   └────────────────────────────────┘   │
│                                        │
│   🔒 No spam. No obligation...         │
└────────────────────────────────────────┘

Estimated Height: ~220px (fits all mobile screens)
```

---

## Implementation Checklist

| Step | File | Change | Risk |
|------|------|--------|------|
| 1 | `SampleReportLeadModal.tsx` | Remove `Checkbox` import | None |
| 2 | `SampleReportLeadModal.tsx` | Remove `preCheckPartnerConsent` from props interface | None |
| 3 | `SampleReportLeadModal.tsx` | Remove from destructuring | None |
| 4 | `SampleReportLeadModal.tsx` | Remove `partnerConsent` state | None |
| 5 | `SampleReportLeadModal.tsx` | Remove from useEffect reset + deps | None |
| 6 | `SampleReportLeadModal.tsx` | Remove from payload sessionData | None |
| 7 | `SampleReportLeadModal.tsx` | Remove from analytics event | None |
| 8 | `SampleReportLeadModal.tsx` | Delete Partner Consent UI block | None |
| 9 | `SampleReport.tsx` | Remove `preCheckPartnerConsent` state | None |
| 10 | `SampleReport.tsx` | Update `handleOpenLeadModal` signature | None |
| 11 | `SampleReport.tsx` | Remove `setPreCheckPartnerConsent` call | None |
| 12 | `SampleReport.tsx` | Remove prop from `<SampleReportLeadModal>` | None |

---

## Testing Checklist

After implementation:

- [ ] Form renders without TypeScript errors
- [ ] Form fits on iPhone SE (375×667) without scrolling
- [ ] Lead submission still works correctly
- [ ] Analytics events fire with correct data (no `partner_consent` field)
- [ ] Modal opens/closes without errors
- [ ] Navigation to scanner works after submission

