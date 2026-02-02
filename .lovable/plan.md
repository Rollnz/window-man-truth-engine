
# Form Accessibility Hardening Plan

## Overview
Fix the SampleReportLeadModal to meet all 10 form best practices, focusing on accessibility (ARIA), mobile experience (keyboard types), and consistency (using TrustModal).

---

## Files to Modify

### 1. `src/components/sample-report/SampleReportLeadModal.tsx`

**Change A: Use TrustModal instead of raw Dialog**

Replace:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
```

With:
```tsx
import { Dialog } from '@/components/ui/dialog';
import { TrustModal } from '@/components/forms/TrustModal';
```

Update render to use TrustModal pattern:
```tsx
<Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
  <TrustModal
    modalTitle={step === 'form' ? "Almost There — Let's Personalize Your Audit" : undefined}
    modalDescription={step === 'form' ? "Enter your details to get your free AI-powered quote analysis" : undefined}
    className="sm:max-w-md"
  >
    {/* Step content */}
  </TrustModal>
</Dialog>
```

Benefits:
- Automatic FormSurfaceProvider for consistent input styling
- VisuallyHidden accessibility fallbacks for focus trap
- Consistent with other modals

---

**Change B: Add Mobile Keyboard Props**

Import the standardized props:
```tsx
import { emailInputProps, phoneInputProps } from '@/lib/formAccessibility';
```

Update Email input:
```tsx
<Input
  id="sr-email"
  name="email"
  placeholder="you@example.com"
  {...getFieldProps('email')}
  {...emailInputProps}  // Adds: type, autoComplete, inputMode, autoCapitalize, autoCorrect, spellCheck
  className={hasError('email') ? 'border-destructive focus-visible:ring-destructive' : ''}
  aria-invalid={hasError('email')}
  aria-describedby={hasError('email') ? 'sr-email-error' : undefined}
/>
{hasError('email') && (
  <p id="sr-email-error" className="text-sm text-destructive font-medium">{getError('email')}</p>
)}
```

Update Phone input:
```tsx
<Input
  id="sr-phone"
  name="phone"
  placeholder="(555) 123-4567"
  {...getFieldProps('phone')}
  {...phoneInputProps}  // Adds: type, autoComplete, inputMode
  className={hasError('phone') ? 'border-destructive focus-visible:ring-destructive' : ''}
  aria-invalid={hasError('phone')}
  aria-describedby={hasError('phone') ? 'sr-phone-error' : 'sr-phone-hint'}
/>
<p id="sr-phone-hint" className="text-xs text-muted-foreground">
  We'll text your report link and only call if you request it
</p>
{hasError('phone') && (
  <p id="sr-phone-error" className="text-sm text-destructive font-medium">{getError('phone')}</p>
)}
```

---

**Change C: Fix Partner Consent Checkbox Accessibility**

Add proper `id` and `htmlFor` association:
```tsx
<div className="p-4 rounded-lg bg-muted/30 border border-border/50">
  <div className="flex items-start gap-3">
    <Checkbox
      id="sr-partner-consent"
      checked={partnerConsent}
      onCheckedChange={(checked) => setPartnerConsent(checked === true)}
      className="mt-1"
      aria-describedby="sr-partner-consent-desc"
    />
    <label htmlFor="sr-partner-consent" className="cursor-pointer">
      <span className="text-sm font-medium text-foreground">
        Yes — share my project specs with vetted partners to get competing estimates
      </span>
      <p id="sr-partner-consent-desc" className="text-xs text-muted-foreground mt-1">
        Window Man may connect you with pre-screened contractors who can offer better pricing. Your contact info is never sold.
      </p>
    </label>
  </div>
</div>
```

---

**Change D: Fix Step 2 Touch Target Size**

Update "Continue to My Free Audit" button to meet 44px minimum:
```tsx
<button
  type="button"
  onClick={handleContinueClick}
  className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-3 min-h-[44px]"
>
  <span>Continue to My Free Audit</span>
  <ArrowRight className="w-4 h-4" />
</button>
```

---

**Change E: Update Step 2 Success Header for TrustModal**

Since TrustModal handles the header, update Step 2 to show success state inline:
```tsx
{step === 'call-offer' && (
  <div className="space-y-6 py-4">
    {/* Success indicator */}
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
        <Check className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Great! We've received your info.
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Want answers now? Call WindowMan directly for free.
      </p>
    </div>
    
    {/* Call CTA */}
    <a href="tel:+15614685571" onClick={handleCallClick} className="block">
      <Button variant="cta" size="lg" className="w-full h-auto py-4 ...">
        ...
      </Button>
    </a>
    
    {/* Continue link with proper touch target */}
    <button type="button" onClick={handleContinueClick} className="... min-h-[44px]">
      ...
    </button>
  </div>
)}
```

---

## Summary of Changes

| Issue | Fix | Impact |
|-------|-----|--------|
| Not using TrustModal | Switch to TrustModal | Consistent styling + Firefox focus trap fix |
| Missing inputMode | Add emailInputProps/phoneInputProps | Correct mobile keyboards |
| Missing ARIA | Add aria-invalid + aria-describedby | Screen reader error announcements |
| Checkbox association | Add id/htmlFor | Larger tap target + better accessibility |
| Touch target < 44px | Add min-h-[44px] | Easier mobile tapping |

---

## Implementation Order

1. Update imports (TrustModal, formAccessibility props)
2. Replace DialogContent with TrustModal wrapper
3. Add ARIA attributes to email/phone inputs
4. Add inputMode/autocomplete props to inputs
5. Fix partner consent checkbox accessibility
6. Fix Step 2 touch target size
7. Test keyboard navigation (Tab through all fields)
8. Test mobile keyboards (email @, phone numpad)
9. Test screen reader announcements
