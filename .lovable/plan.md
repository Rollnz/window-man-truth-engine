

# Compact Mobile Lead Form Plan

## Overview

This plan makes the "Let's Personalize Your Audit" modal significantly more compact by removing visible labels from Email/Phone fields, using placeholder text for guidance, and tightening vertical spacing throughout.

---

## Changes Summary

| Location | Change |
|----------|--------|
| `SampleReportLeadModal.tsx` | Remove Email/Phone `<Label>` elements, update placeholders, reduce spacing |
| `NameInputPair.tsx` | Add optional `hideLabels` prop for consistent compact styling |

---

## Technical Implementation

### 1. SampleReportLeadModal.tsx Updates

#### A. Reduce Form Spacing

Change the form's vertical gap from `space-y-4` to `space-y-3`:

```tsx
// Line 228 - BEFORE
<form onSubmit={handleFormSubmit} className="space-y-4">

// AFTER
<form onSubmit={handleFormSubmit} className="space-y-3">
```

#### B. Remove Email Label + Update Placeholder

Replace lines 242-260 (Email section):

```tsx
{/* Email - label-free with sr-only for accessibility */}
<div>
  <label htmlFor="sr-email" className="sr-only">Email Address</label>
  <Input
    id="sr-email"
    name="email"
    placeholder="Email Address"
    {...getFieldProps('email')}
    {...emailInputProps}
    className={hasError('email') ? 'border-destructive focus-visible:ring-destructive' : ''}
    aria-invalid={hasError('email')}
    aria-describedby={hasError('email') ? 'sr-email-error' : undefined}
  />
  {hasError('email') && (
    <p id="sr-email-error" className="text-sm text-destructive font-medium mt-1">{getError('email')}</p>
  )}
</div>
```

**Key changes:**
- Remove visible `<Label>` element
- Add `sr-only` (screen-reader only) label for accessibility
- Remove `space-y-2` wrapper, use direct `<div>`
- Update placeholder: `"you@example.com"` → `"Email Address"`
- Error message gets `mt-1` instead of relying on `space-y-2`

#### C. Remove Phone Label + Update Placeholder

Replace lines 262-280 (Phone section):

```tsx
{/* Phone - label-free with sr-only for accessibility */}
<div>
  <label htmlFor="sr-phone" className="sr-only">Phone Number</label>
  <Input
    id="sr-phone"
    name="phone"
    placeholder="(555) 555-5555"
    {...getFieldProps('phone')}
    {...phoneInputProps}
    className={hasError('phone') ? 'border-destructive focus-visible:ring-destructive' : ''}
    aria-invalid={hasError('phone')}
    aria-describedby={hasError('phone') ? 'sr-phone-error' : undefined}
  />
  {hasError('phone') && (
    <p id="sr-phone-error" className="text-sm text-destructive font-medium mt-1">{getError('phone')}</p>
  )}
</div>
```

**Key changes:**
- Remove visible `<Label>` element
- Add `sr-only` label for accessibility
- Remove `space-y-2` wrapper
- Update placeholder: `"(555) 123-4567"` → `"(555) 555-5555"`
- Remove stale `sr-phone-hint` reference from `aria-describedby`

#### D. Reduce Partner Consent Padding

Change the partner consent box from `p-4` to `p-3`:

```tsx
// Line 283 - BEFORE
<div className="p-4 rounded-lg bg-slate-50 ...">

// AFTER
<div className="p-3 rounded-lg bg-slate-50 ...">
```

### 2. NameInputPair.tsx Updates (Optional Enhancement)

Add a `hideLabels` prop to allow label-free name fields for future use:

```tsx
// Add to props interface
hideLabels?: boolean;

// In component, wrap labels conditionally:
{!hideLabels && (
  <Label ...>{firstNameLabel} *</Label>
)}
{hideLabels && (
  <label htmlFor={firstNameId} className="sr-only">{firstNameLabel}</label>
)}
```

Then update the modal to use:

```tsx
<NameInputPair
  ...
  hideLabels
  size="compact"
/>
```

This removes visible "First Name" and "Last Name" labels too, making the entire form use placeholder-only guidance.

---

## Visual Comparison

### Before (Current)
```
┌────────────────────────────────────────┐
│   Let's Personalize Your Audit         │
├────────────────────────────────────────┤
│                                        │
│   First Name *          Last Name      │  ← Labels
│   ┌──────────────┐   ┌──────────────┐  │
│   │ John         │   │ Smith        │  │
│   └──────────────┘   └──────────────┘  │
│                         ↑ 16px gap     │
│   Email Address                        │  ← Label
│   ┌────────────────────────────────┐   │
│   │ you@example.com                │   │
│   └────────────────────────────────┘   │
│                         ↑ 16px gap     │
│   Phone Number                         │  ← Label
│   ┌────────────────────────────────┐   │
│   │ (555) 123-4567                 │   │
│   └────────────────────────────────┘   │
│                         ↑ 16px gap     │
│   ┌────────────────────────────────┐   │
│   │ ☐ Yes — share with partners... │   │
│   │    (description text)          │   │
│   └────────────────────────────────┘   │
│                         ↑ 16px gap     │
│   ┌────────────────────────────────┐   │
│   │      Get My Free Audit         │   │
│   └────────────────────────────────┘   │
│                                        │
│   🔒 No spam. No obligation...         │
└────────────────────────────────────────┘

Height: ~380px+ (requires scroll on small phones)
```

### After (Compact)
```
┌────────────────────────────────────────┐
│   Let's Personalize Your Audit         │
├────────────────────────────────────────┤
│   ┌──────────────┐   ┌──────────────┐  │
│   │ First Name   │   │ Last Name    │  │  ← Placeholder only
│   └──────────────┘   └──────────────┘  │
│                         ↑ 12px gap     │
│   ┌────────────────────────────────┐   │
│   │ Email Address                  │   │  ← Placeholder only
│   └────────────────────────────────┘   │
│                         ↑ 12px gap     │
│   ┌────────────────────────────────┐   │
│   │ (555) 555-5555                 │   │  ← Placeholder only
│   └────────────────────────────────┘   │
│                         ↑ 12px gap     │
│   ┌────────────────────────────────┐   │
│   │ ☐ Yes — share with partners... │   │
│   │    (description text)          │   │
│   └────────────────────────────────┘   │
│                         ↑ 12px gap     │
│   ┌────────────────────────────────┐   │
│   │      Get My Free Audit         │   │
│   └────────────────────────────────┘   │
│                                        │
│   🔒 No spam. No obligation...         │
└────────────────────────────────────────┘

Height: ~290px (fits iPhone SE without scroll)
```

**Space Savings:**
- Removed 4 label rows (~80px)
- Reduced 5 gaps from 16px to 12px (~20px)
- Reduced consent padding (~8px)
- **Total reduction: ~100px+ height**

---

## Accessibility Compliance

| Concern | Solution |
|---------|----------|
| Screen readers | `sr-only` labels remain for assistive tech |
| Focus indicators | Unchanged - visible focus rings preserved |
| Error messages | Still appear below inputs with `role="alert"` |
| Placeholder contrast | Tailwind defaults meet WCAG AA for placeholders |

---

## Implementation Order

| Step | File | Change | Risk |
|------|------|--------|------|
| 1 | `NameInputPair.tsx` | Add `hideLabels` prop | Low |
| 2 | `SampleReportLeadModal.tsx` | Add `hideLabels` to NameInputPair | Low |
| 3 | `SampleReportLeadModal.tsx` | Replace Email section (remove label, update placeholder) | Low |
| 4 | `SampleReportLeadModal.tsx` | Replace Phone section (remove label, update placeholder) | Low |
| 5 | `SampleReportLeadModal.tsx` | Change form spacing to `space-y-3` | Low |
| 6 | `SampleReportLeadModal.tsx` | Change consent padding to `p-3` | Low |

---

## Testing Checklist

After implementation, verify:

- [ ] Form fits on iPhone SE (375×667) without scrolling
- [ ] Placeholder text is visible and clear in all fields
- [ ] Screen reader announces field names correctly
- [ ] Error messages still appear below invalid fields
- [ ] Focus moves correctly between fields with Tab key
- [ ] Autofill still works for name/email/phone fields

