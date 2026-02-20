

# Remove FAQ Sections from All Truth Pillar Pages

## Problem
All 4 truth pillar pages render an accordion FAQ section that uses the base `AccordionItem` component with hardcoded `text-black` and a blue gradient background (`var(--accordion)`). These look ugly, break dark mode, and clash with the redesigned pillar styling.

## What Changes

Remove the entire rendered FAQ `<section>` block from each of these 4 files:
- `src/pages/WindowCostTruth.tsx` (lines 133-156)
- `src/pages/WindowRiskAndCode.tsx` (lines 156-179)
- `src/pages/WindowSalesTruth.tsx` (lines 137-160)
- `src/pages/WindowVerificationSystem.tsx` (lines 161-184)

Also remove the now-unused accordion imports from each file:
```
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
```

## What Stays
- The `faqs` data array in each file stays -- it feeds `generateFAQSchema(faqs)` which outputs invisible JSON-LD structured data for Google (good for SEO, zero visual impact).
- All other sections (Hero, StatBar, ContentBlock, CalloutCard, GuideCards, ReviewedByBadge, CTASection, ExitIntentModal) remain untouched.

## No Other Changes
- No component files modified
- No database or edge function changes
- No styling or config changes

