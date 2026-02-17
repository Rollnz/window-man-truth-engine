

# Restyle Beat Your Quote FAQ to Match /sample-report Style

## The Problem
The `ToolFAQSection` on `/beat-your-quote` uses a blue gradient header and dossier-style accordion items. It looks inconsistent with the clean, card-based FAQ style used on `/sample-report`.

## The Fix
Swap `ToolFAQSection` for the `FAQSection` component from `src/components/sample-report/FAQSection.tsx`. This gives the clean look: centered "Common Questions" pill badge, bold heading, white card container with rounded corners, and simple divider-based accordion items.

## What Changes

### File 1: `src/pages/BeatYourQuote.tsx`

**Replace the import:**
- Remove: `import { ToolFAQSection } from '@/components/seo/ToolFAQSection'`
- Remove: `import { getToolFAQs } from '@/data/toolFAQs'`
- Add: `import { FAQSection } from '@/components/sample-report/FAQSection'`

**Replace the JSX (lines ~149-156):**

Current:
```
<ToolFAQSection
  toolPath="/beat-your-quote"
  faqs={getToolFAQs('beat-your-quote')}
  title="Beat Your Quote FAQs"
  description="How we help you negotiate better pricing"
  variant="dossier"
/>
```

New:
```
<FAQSection />
```

The `FAQSection` component already has its own FAQ content baked in, "Talk to Window Man" footer link, section tracking, and the clean card styling. No props needed beyond the optional `onOpenPreQuoteModal` if you want the "Talk to Window Man" link to open a modal.

## What Does NOT Change
- `InterrogationFAQ` section (stays as-is)
- `FAQSection` component (unchanged, reused from /sample-report)
- `ToolFAQSection` component (unchanged, still used on other pages)
- All other sections on /beat-your-quote (unchanged)

## Visual Result
The blue gradient header + dossier-styled accordions get replaced with:
- A centered "Common Questions" pill badge
- A bold "Frequently Asked Questions" heading
- A clean card container with border dividers between FAQ items
- A "Talk to Window Man" link at the bottom

| File | Change |
|------|--------|
| `src/pages/BeatYourQuote.tsx` | Swap `ToolFAQSection` for `FAQSection` from sample-report |
