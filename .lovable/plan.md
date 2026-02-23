

# Fix: Hardcoded `text-black` Color Contrast Across FAQ Components

## Problem
Multiple FAQ sections and other components use hardcoded `text-black` for text color. This works in light mode but breaks in dark mode where the background is dark, making text invisible. This violates the project's unified theme standard which prohibits hardcoded hex/color values in favor of semantic theme tokens.

## Root Cause
The base `AccordionContent` component already applies `text-muted-foreground` by default. Individual components override this with `text-black`, which forces black text regardless of theme -- invisible on dark backgrounds.

## Files to Fix

### Primary Target: `src/components/seo/ToolFAQSection.tsx`
This is the component used on `/cost-calculator` and 5 other tool pages.

| Line | Current | Fix |
|------|---------|-----|
| 59 | `text-black font-bold` | `text-foreground font-bold` |
| 66 | `text-black` (in default variant) | `text-foreground` |

The dossier/gradient variants already correctly use `text-white` and stay untouched.

**Pages affected:** `/cost-calculator`, `/free-estimate`, `/reality-check`, `/ai-scanner`, `/comparison`, `/risk-diagnostic`

### `src/pages/FAQ.tsx` (line 56)
- `text-black` on AccordionContent -> remove it (let base `text-muted-foreground` apply)

### `src/components/quote-scanner/ScannerFAQSection.tsx` (lines 73, 75)
- Question: `text-black` -> `text-foreground`
- Answer: `text-black` -> remove (inherits `text-muted-foreground`)

### `src/components/fair-price-quiz/WhyVaultFAQ.tsx` (line 45)
- AccordionContent `text-black` -> `text-foreground`

### `src/components/spec-checklist/FAQSection.tsx` (line 33)
- `text-primary-foreground` on answer text -> `text-muted-foreground`

## Non-FAQ Files (Same Pattern, Bonus Fix)

These also use `text-black` on theme-aware backgrounds:

| File | Lines | Fix |
|------|-------|-----|
| `SecretPlaybookSection.tsx` | 24 | `text-black` -> `text-foreground` |
| `FailurePointsSection.tsx` | 86, 96, 99, 102, 108 | `text-black` -> `text-foreground` |
| `WeaponizeAuditSection.tsx` | 13, 14 | `text-black` -> `text-foreground` |
| `KitchenTableGuideModal.tsx` | 371, 376 | `text-black` -> `text-foreground` |
| `SalesTacticsGuideModal.tsx` | 371, 376 | `text-black` -> `text-foreground` |
| `SpecChecklistGuideModal.tsx` | 400, 405 | `text-black` -> `text-foreground` |

## The Rule
- `text-foreground` for primary/heading text (adapts to both themes)
- `text-muted-foreground` for body/secondary text (adapts to both themes)
- `text-white` only on locked dark backgrounds (dossier, gradient variants)
- `text-black` is prohibited on theme-aware surfaces

## Scope
- ~12 files modified
- ~25 line changes (all single-token replacements)
- Zero structural changes -- only swapping color classes

