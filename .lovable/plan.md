
# Fix FAQ Accordion Text Contrast Across Site

## Problem
The `text-muted-foreground` class is theme-aware, but the accordion background (`--accordion`) is a **permanent blue gradient** that doesn't change with themes. In dark mode, this creates light-on-light text that fails WCAG contrast requirements.

## Solution
Replace `text-muted-foreground` with hardcoded `text-black` in all FAQ accordion content areas that use the permanent blue gradient background. This matches the working pattern in `ToolFAQSection.tsx`.

---

## Files to Modify

### 1. `src/components/quote-scanner/ScannerFAQSection.tsx`
**Line 73:** Change `text-muted-foreground` to `text-black`

```diff
- <AccordionContent className="text-sm text-muted-foreground pb-4">{faq.answer}</AccordionContent>
+ <AccordionContent className="text-sm text-black pb-4">{faq.answer}</AccordionContent>
```

### 2. `src/pages/WindowRiskAndCode.tsx`
**Line 210:** Change `text-muted-foreground` to `text-black`

```diff
- <AccordionContent className="text-muted-foreground">
+ <AccordionContent className="text-black">
```

### 3. `src/pages/WindowCostTruth.tsx`
**Line 185:** Change `text-muted-foreground` to `text-black`

```diff
- <AccordionContent className="text-muted-foreground">
+ <AccordionContent className="text-black">
```

### 4. `src/pages/WindowSalesTruth.tsx`
**Line 193:** Change `text-muted-foreground` to `text-black`

```diff
- <AccordionContent className="text-muted-foreground">
+ <AccordionContent className="text-black">
```

### 5. `src/pages/FAQ.tsx`
**Line 56:** Change `text-muted-foreground` to `text-black`

```diff
- <AccordionContent className="space-y-3 text-muted-foreground">
+ <AccordionContent className="space-y-3 text-black">
```

### 6. `src/components/fair-price-quiz/WhyVaultFAQ.tsx`
**Line 45:** Change `text-muted-foreground` to `text-black`

```diff
- <AccordionContent className="text-muted-foreground pl-8">
+ <AccordionContent className="text-black pl-8">
```

---

## Why This Works

1. **Consistent with working pattern:** `ToolFAQSection.tsx` already uses `text-black` for answer text (line 66)
2. **Theme-locked to theme-locked:** The blue gradient doesn't change, so neither should the text
3. **WCAG Compliant:** Black text on light-blue gradient provides excellent contrast (~12:1 ratio)
4. **Project guideline compliant:** Follows the existing `memory/style/ui/faq-contrast-standard` rule

---

## Visual Result

| Theme | Before | After |
|-------|--------|-------|
| Light | Dark gray text ✓ | Black text ✓ |
| Dark | Light gray text ✗ (unreadable) | Black text ✓ |

Both themes will now have consistent, highly legible black text on the permanent blue accordion backgrounds.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/components/quote-scanner/ScannerFAQSection.tsx` | `text-muted-foreground` → `text-black` |
| `src/pages/WindowRiskAndCode.tsx` | `text-muted-foreground` → `text-black` |
| `src/pages/WindowCostTruth.tsx` | `text-muted-foreground` → `text-black` |
| `src/pages/WindowSalesTruth.tsx` | `text-muted-foreground` → `text-black` |
| `src/pages/FAQ.tsx` | `text-muted-foreground` → `text-black` |
| `src/components/fair-price-quiz/WhyVaultFAQ.tsx` | `text-muted-foreground` → `text-black` |
