

# Accessibility and Visibility Audit -- Lead Capture Infrastructure

## A) Audit Findings Report

### Inventory of Lead Capture Surfaces (12 entry points)

| # | Component | Location | Surface Type |
|---|---|---|---|
| 1 | TrueCostCalculator modal | /cost-calculator | Raw Dialog (bg-background) |
| 2 | PreQuoteLeadModalV2 (Step 1) | site-wide modal | Raw Dialog (bg-background) |
| 3 | PreQuoteLeadModalV2 (Steps 2-5 + Result) | site-wide modal | Raw Dialog (bg-background) |
| 4 | ConsultationBookingModal | site-wide modal | TrustModal (bg-white forced) |
| 5 | EbookLeadModal | site-wide modal | TrustModal (bg-white forced) |
| 6 | KitchenTableGuideModal | site-wide modal | Raw DialogContent (bg-background) |
| 7 | SalesTacticsGuideModal | site-wide modal | Raw DialogContent (bg-background) |
| 8 | SpecChecklistGuideModal | site-wide modal | Raw DialogContent (bg-background) |
| 9 | QuoteUploadGateModal | /audit, /beat-your-quote | Raw DialogContent (bg-[#e5e5e5]) |
| 10 | ExplainScoreGate | /audit scanner | Dark surface (custom in-modal) |
| 11 | BlurGate (Fair Price Quiz) | /fair-price-quiz | White card on bg-background |
| 12 | FloatingEstimatePanel (SlidePanel) | site-wide Sheet | Sheet (bg-background) |
| 13 | ConsultationForm (page-level) | /consultation | Page bg (bg-background) |

---

### Findings Table

| # | Component | Page/Flow | State | Failure | Rule Violated | Severity | Fix |
|---|---|---|---|---|---|---|---|
| 1 | **DialogDescription** | /cost-calculator modal | Default | `text-foreground` on `bg-background` is fine now, BUT `DialogDescription` should be muted (secondary text) not same weight as title. Currently both use `text-foreground` making them visually identical -- description doesn't read as secondary. | UX hierarchy | P2 | Change DialogDescription default to `text-muted-foreground` instead of `text-foreground`. |
| 2 | **PreQuoteLeadModalV2 X button** | All pages (modal) | Default (dark mode) | Dialog close X button inherits no explicit text color. On `bg-background` (dark: hsl(220 20% 6%)), the X icon (`h-4 w-4`) has no color class and relies on `opacity-70` of inherited color. Works in light, very faint in dark. | 3:1 icon contrast | P1 | Add `text-foreground` to DialogPrimitive.Close in dialog.tsx. |
| 3 | **KitchenTableGuideModal labels** | Form step | Default | Labels use `className="sr-only"` -- placeholder-only fields with no persistent visible label for first name, last name, email, phone. Placeholder disappears on input. | WCAG 1.3.1, 3.3.2 - persistent labels | P0 | Remove `sr-only` from Labels; show visible label text above each input. |
| 4 | **KitchenTableGuideModal inputs** | Form step (dark mode) | Default | `inputBaseClass` = `"bg-white border ... border-black"`. The `border-black` on `bg-white` input works, but the modal itself uses raw `DialogContent` which means `bg-background`. In dark mode, white inputs on dark bg is fine. But text inside inputs: the Input component's variant resolves to `'default'` (no FormSurfaceProvider), applying `dark:bg-slate-800 dark:text-slate-100` which OVERRIDES the explicit `bg-white` set in inputBaseClass via Tailwind merge. Result: **dark background input with dark border-black** -- nearly invisible field boundary. | 3:1 boundary contrast | P0 | Wrap KitchenTableGuideModal form content in `<FormSurfaceProvider surface="trust">` OR use explicit `variant="trust"` on each Input. |
| 5 | **KitchenTableGuideModal success/project/location steps** | Post-submit steps (dark mode) | Default | Text uses hardcoded `text-slate-900`, `text-slate-600`, `text-slate-700` which are nearly invisible on dark `bg-background` (hsl(220 20% 6%)). | 5:1 text contrast | P0 | Either: (a) wrap entire modal in a forced-white card surface, or (b) replace hardcoded slate colors with semantic tokens (`text-foreground`, `text-muted-foreground`). |
| 6 | **SalesTacticsGuideModal / SpecChecklistGuideModal** | Same architecture as Kitchen Table | Dark mode, all steps | Same issues as findings #3-5 -- identical code pattern with sr-only labels, hardcoded slate text on dark bg, and default Input variant on dark surface. | P0 | Same fix as #4 and #5. |
| 7 | **ExplainScoreGate** | /audit scanner modal | Default | Form inputs use explicit `className="h-10 bg-white text-slate-900 border-slate-300"` directly on Input, which conflicts with the default FormSurface variant being applied underneath. The explicit classes win (good), but there is no `aria-required` on required fields, and the NameInputPair label override `[&_label]:text-white` is a fragile selector pattern. | aria-required missing | P1 | Add `aria-required="true"` to required fields. Add `variant="trust"` to Inputs for explicit clarity. |
| 8 | **QuoteUploadGateModal** | /audit, /beat-your-quote | Default | Modal bg is `bg-[#e5e5e5]` (light grey). Inputs are `bg-white` with `border-slate-300`. The contrast between input border (slate-300 ~= #cbd5e1) and modal bg (#e5e5e5) is approximately 1.15:1 -- well below 3:1 boundary contrast requirement. Input fields visually blend into the modal surface. | 3:1 boundary contrast | P1 | Darken input borders to `border-slate-400` or `border-slate-500`, OR darken modal bg to create sufficient contrast. |
| 9 | **PreQuoteLeadModalV2 (LeadStep1Capture)** | All pages | Dark mode | Uses raw DialogContent with no TrustModal wrapper. Labels use semantic `text-foreground` (good). Inputs use default FormSurface variant which applies `dark:bg-slate-800`. On dark `bg-background` (hsl(220 20% 6%)), the slate-800 input border (`dark:border-slate-600`) against dark background has low contrast. | 3:1 boundary contrast | P1 | Either use `variant="trust"` on inputs or strengthen `dark:border-slate-500` in the default formSurfaceStyles. |
| 10 | **TrueCostCalculator modal labels** | /cost-calculator | Default | Labels use `text-muted-foreground` via `"text-xs font-bold uppercase text-muted-foreground"`. In light mode, muted-foreground is hsl(209 25% 42%) on white bg -- this passes. But the `text-xs` (12px) size with `uppercase` makes them hard to scan. More critically: no `aria-required` attributes on any field. | Missing aria-required | P1 | Add `aria-required="true"` to required inputs. |
| 11 | **Error messages missing aria-invalid** | LeadStep1Capture, ContactDetailsStep, BlurGate | Error state | Several forms apply `border-destructive` on error but do NOT set `aria-invalid="true"` on the input. LeadStep1Capture has it. ContactDetailsStep has it. BlurGate does NOT. | WCAG 3.3.1 | P1 | Add `aria-invalid={!!errors.fieldName}` to all inputs in BlurGate. |
| 12 | **ConsultationBookingModal phone label** | site-wide | Default | Phone label uses `text-slate-900` hardcoded instead of `text-foreground`. In dark mode inside TrustModal (bg-white forced), this works. But if TrustModal ever changes, this is fragile. Similarly, "Best Time to Call" label uses `text-slate-900`. | Fragility / consistency | P2 | Replace `text-slate-900` with `text-foreground` in TrustModal children (the FormSurfaceProvider should handle input styling, but labels need attention). |
| 13 | **FloatingEstimatePanel (ContactDetailsStep)** | Sheet panel, all pages | Dark mode | Sheet uses `bg-background`. Inputs use default FormSurface variant. Same dark-mode boundary contrast issue as finding #9. | 3:1 boundary | P1 | Add `<FormSurfaceProvider surface="trust">` in Sheet, or strengthen default dark borders. |
| 14 | **ConsultationForm (page-level)** | /consultation | Default | Uses Card component with `bg-card`. In dark mode, cards are dark, inputs are dark -- this works with semantic tokens. Labels properly use `text-foreground`. This form is the GOLD STANDARD for accessibility (fieldset, legend, aria-required, aria-invalid, aria-describedby, role="alert", AlertCircle icons). | -- | PASS | No fix needed. Use as reference pattern. |
| 15 | **No error summary on submit** | All forms except ConsultationForm | Error state | When validation fails, individual field errors appear but there is no summary at form top and no auto-scroll/focus to first error (except ConsultationForm which does focus first error field). | WCAG 3.3.1 best practice | P2 | Add focus-first-error pattern from ConsultationForm to all other forms. |
| 16 | **Placeholder-only inputs** | KitchenTableGuideModal | Default | First name, last name, email, phone all use `sr-only` labels with placeholder as only visible instruction. When user types, they lose all context of what field they're in. | WCAG 1.3.1, 3.3.2 | P0 | Show visible labels (remove sr-only). |
| 17 | **Missing autoComplete attributes** | BlurGate, KitchenTableGuideModal | Default | BlurGate inputs lack `autoComplete` attributes entirely. KitchenTableGuideModal has them via getFieldProps but inconsistently. | Browser autofill broken | P2 | Add `autoComplete="given-name"`, `"family-name"`, `"email"`, `"tel"` to all relevant inputs. |

---

### Top 10 Highest-Impact Fixes (Priority Order)

1. **P0: KitchenTable/SalesTactics/SpecChecklist Guide Modals -- dark mode text invisible** (Findings #5, #6). Hardcoded `text-slate-900` on dark backgrounds. Replace with semantic tokens or force white card surface.

2. **P0: KitchenTable/SalesTactics/SpecChecklist Guide Modals -- placeholder-only inputs** (Findings #3, #16). Remove `sr-only` from Labels so fields have persistent visible labels.

3. **P0: KitchenTable/SalesTactics/SpecChecklist Guide Modals -- input variant conflict in dark mode** (Finding #4). FormSurface default variant overrides explicit `bg-white`. Wrap in `FormSurfaceProvider surface="trust"` or use `variant="trust"`.

4. **P1: QuoteUploadGateModal -- input border blends into bg-[#e5e5e5]** (Finding #8). Strengthen borders to `border-slate-500`.

5. **P1: PreQuoteLeadModalV2 -- dark mode input boundary contrast** (Finding #9). Strengthen default dark FormSurface borders from `dark:border-slate-600` to `dark:border-slate-500`.

6. **P1: DialogDescription default color** (Finding #1). Change from `text-foreground` to `text-muted-foreground` to create visual hierarchy between title and description.

7. **P1: Dialog X close button color** (Finding #2). Add explicit `text-foreground` to ensure visibility in both themes.

8. **P1: Missing aria-required across multiple forms** (Findings #7, #10). Add `aria-required="true"` to all required inputs in ExplainScoreGate, TrueCostCalculator, BlurGate.

9. **P1: BlurGate missing aria-invalid** (Finding #11). Add `aria-invalid` to all inputs in error state.

10. **P1: FloatingEstimatePanel dark mode input contrast** (Finding #13). Add FormSurfaceProvider or strengthen borders.

---

## B) Tokenized Fix Plan

### CSS Token Definitions

The project already uses CSS custom properties extensively. The fix focuses on strengthening existing tokens rather than creating a parallel system. The key change is in the `formSurfaceStyles` object in `FormSurfaceProvider.tsx`:

```typescript
// src/components/forms/FormSurfaceProvider.tsx -- UPDATED default dark borders

export const formSurfaceStyles = {
  default: {
    input: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-500 placeholder:text-slate-500 dark:placeholder:text-slate-400',
    //                                                                       ^^^ changed from slate-600 to slate-500 for 3:1 boundary
    select: {
      trigger: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-500',
      content: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600',
      item: 'focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-slate-100',
    },
  },
  trust: {
    // No changes needed -- already forces white bg with visible borders
    input: 'bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 shadow-sm',
    select: {
      trigger: 'bg-white text-slate-900 border-slate-300 shadow-sm',
      content: 'bg-white text-slate-900 border-slate-200 shadow-lg',
      item: 'focus:bg-slate-100 focus:text-slate-900',
    },
  },
} as const;
```

### Dialog Component Token Fix

```typescript
// src/components/ui/dialog.tsx

// DialogDescription: Change to muted for visual hierarchy
className={cn("text-sm text-muted-foreground", className)}

// DialogPrimitive.Close: Add explicit foreground color
className="absolute right-4 top-4 rounded-sm text-foreground opacity-70 ..."
```

### Guide Modal Architecture Fix

All three guide modals (Kitchen Table, Sales Tactics, Spec Checklist) need the same structural fix:

1. Wrap DialogContent children in a forced-white card
2. OR change all hardcoded `text-slate-*` to semantic tokens
3. Remove `sr-only` from labels
4. Add `<FormSurfaceProvider surface="trust">` around form sections

The recommended approach is option (1): wrap the entire modal body in a white-forced container with `FormSurfaceProvider`, matching how TrustModal works but without switching to TrustModal (which would change the modal's lock behavior).

```tsx
// Pattern for guide modals:
<DialogContent className="sm:max-w-md bg-white dark:bg-white text-slate-900 dark:text-slate-900 p-0">
  <FormSurfaceProvider surface="trust">
    {/* All modal content here -- labels and text use text-slate-900 safely */}
  </FormSurfaceProvider>
</DialogContent>
```

### QuoteUploadGateModal Border Fix

```tsx
// Change input borders from border-slate-300 to border-slate-500
// on bg-[#e5e5e5] surface
className="h-10 bg-white text-slate-900 border-slate-500"
```

---

## C) Verification Checklist (10-minute QA run)

### Pre-requisites
- Open app in Chrome
- Have both light and dark mode accessible (toggle in site header or OS setting)

### Checklist

| # | Check | Steps | Expected | Pass/Fail |
|---|---|---|---|---|
| 1 | **Dialog title/description visible** | Open /cost-calculator, click "Request Your Quote" | Title is bold dark text, description is lighter muted text, both readable | |
| 2 | **Dialog X button visible (dark mode)** | Switch to dark mode, open any Dialog | X close button clearly visible against dialog background | |
| 3 | **KitchenTableGuideModal (dark mode)** | Switch to dark, trigger Kitchen Table Guide CTA | All text visible, inputs have white bg with visible borders, labels visible above inputs (not placeholder-only) | |
| 4 | **KitchenTableGuideModal success step (dark mode)** | Submit form in dark mode | Success screen text ("Your Guide is on its way") is readable | |
| 5 | **QuoteUploadGateModal input borders** | Upload a quote on /audit or /beat-your-quote | Input field boundaries clearly distinguishable from grey modal background | |
| 6 | **PreQuoteLeadModalV2 (dark mode)** | Trigger any PreQuote CTA in dark mode | Input fields have visible borders against dark dialog | |
| 7 | **Keyboard tab through all forms** | Tab through every form (no mouse) | Focus ring visible on every control, logical order, no traps | |
| 8 | **Error states visible** | Submit each form empty | Red border + error text appears, aria-invalid set, screen reader announces errors | |
| 9 | **Mobile iOS zoom** | Open any form on iOS Safari | Inputs do NOT trigger zoom (font-size >= 16px) | |
| 10 | **Chrome autofill** | Let Chrome autofill a lead form | Autofilled text remains readable (not white-on-yellow or invisible) | |
| 11 | **FloatingEstimatePanel (dark mode)** | Open floating CTA panel in dark mode | Contact step inputs have visible borders and text | |
| 12 | **BlurGate (Fair Price Quiz)** | Complete quiz, reach gate | Labels readable, form submits, errors show with aria-invalid | |

### Screen Reader Spot-Check (2 minutes)
1. Open VoiceOver (Mac) or NVDA (Windows)
2. Open any lead capture modal
3. Confirm: modal title is announced, first input is focused, required fields announce "required"
4. Submit empty form: confirm error messages are announced via aria-live

---

## Summary

| Category | P0 | P1 | P2 | Pass |
|---|---|---|---|---|
| Visibility/Contrast | 3 | 4 | 1 | -- |
| Labels/Placeholders | 1 | -- | -- | -- |
| ARIA/Screen Reader | -- | 2 | 1 | -- |
| Autofill/Browser | -- | -- | 1 | -- |
| Gold Standard | -- | -- | -- | 1 (ConsultationForm) |
| **Total** | **4** | **6** | **3** | **1** |

The highest-risk items are the three Guide Modals (Kitchen Table, Sales Tactics, Spec Checklist) which are completely broken in dark mode -- invisible text, invisible inputs, and no persistent labels. These are P0 and block form completion for dark mode users.

## Implementation Approach

The fix breaks into 4 work units:

1. **dialog.tsx** (2 lines): Fix DialogDescription color and X button color
2. **FormSurfaceProvider.tsx** (1 line): Strengthen dark border from slate-600 to slate-500
3. **Guide Modals x3** (largest change): Force white surface, show labels, wrap in FormSurfaceProvider
4. **Scatter fixes**: aria-required on ExplainScoreGate/TrueCostCalculator/BlurGate, aria-invalid on BlurGate, border-slate-500 on QuoteUploadGateModal

