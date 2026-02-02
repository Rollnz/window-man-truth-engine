

# Add Section Tracking to Sample Report Components

## Overview

Add `useSectionTracking` refs to all 8 sample-report section components to enable scroll-depth analytics. This is a **minimal, surgical update** - only adding the tracking hook and ref attachment, without modifying any existing logic, event names, or component behavior.

## Changes by Component

### 1. HeroSection.tsx
**Lines affected:** 1, 34, 44

- Add import: `import { useSectionTracking } from '@/hooks/useSectionTracking';`
- Add hook call: `const sectionRef = useSectionTracking('hero');`
- Add ref to section: `<section ref={sectionRef} className="relative py-16...">`

### 2. ComparisonSection.tsx
**Lines affected:** 1, 24, 26

- Add import: `import { useSectionTracking } from '@/hooks/useSectionTracking';`
- Add hook call: `const sectionRef = useSectionTracking('comparison');`
- Add ref to section: `<section ref={sectionRef} className="py-16...">`

### 3. ScoreboardSection.tsx (Special Case)
**Lines affected:** 4, 50

This component already has its own `IntersectionObserver` for animation. Instead of adding a second observer, we'll add the tracking call inside the existing observer:

- Add import: `import { useSectionTracking } from '@/hooks/useSectionTracking';` at line 1
- Add tracking ref alongside animation ref at line 48
- Fire tracking event inside existing observer callback at line 50

**Alternative approach (cleaner):** Create a separate tracking ref and merge both refs on the section element using a callback ref pattern. However, the simplest approach is to just add the `trackEvent` call directly inside the existing observer when `isIntersecting` is true.

### 4. PillarAccordionSection.tsx
**Lines affected:** 1, 42, 47

- Add import: `import { useSectionTracking } from '@/hooks/useSectionTracking';`
- Add hook call: `const sectionRef = useSectionTracking('pillar_accordion');`
- Add ref to section: `<section ref={sectionRef} className="py-16...">`

### 5. HowItWorksSection.tsx
**Lines affected:** 1, 11, 13

- Add import: `import { useSectionTracking } from '@/hooks/useSectionTracking';`
- Add hook call: `const sectionRef = useSectionTracking('how_it_works');`
- Add ref to section: `<section ref={sectionRef} className="py-16...">`

### 6. LeverageOptionsSection.tsx
**Lines affected:** 1, 11, 28

- Add import: `import { useSectionTracking } from '@/hooks/useSectionTracking';`
- Add hook call: `const sectionRef = useSectionTracking('leverage_options');`
- Add ref to section: `<section ref={sectionRef} className="py-16...">`

### 7. CloserSection.tsx
**Lines affected:** 1, 7, 12

- Add import: `import { useSectionTracking } from '@/hooks/useSectionTracking';`
- Add hook call: `const sectionRef = useSectionTracking('closer');`
- Add ref to section: `<section ref={sectionRef} className="py-20...">`

### 8. FAQSection.tsx
**Lines affected:** 1, 44, 47

- Add import: `import { useSectionTracking } from '@/hooks/useSectionTracking';`
- Add hook call: `const sectionRef = useSectionTracking('faq');`
- Add ref to section: `<section ref={sectionRef} className="py-16...">`

## Technical Details

### ScoreboardSection Special Handling

The existing observer fires when 30% visible (`threshold: 0.3`). The `useSectionTracking` hook fires at 50%. Two options:

**Option A (Recommended):** Add tracking inside existing observer
```typescript
const observer = new IntersectionObserver(([entry]) => { 
  if (entry.isIntersecting) { 
    setIsVisible(true); 
    // Add tracking here (one-time)
    if (!hasTrackedSection.current) {
      hasTrackedSection.current = true;
      trackEvent('sample_report_section_view', {
        section: 'scoreboard',
        lead_id: getLeadAnchor(),
        visibility_ratio: entry.intersectionRatio,
        timestamp: Date.now()
      });
    }
    observer.disconnect(); 
  } 
}, { threshold: 0.3 });
```

**Option B:** Use callback ref to merge two refs
```typescript
const trackingRef = useSectionTracking('scoreboard');
const animationRef = useRef<HTMLElement>(null);

const mergedRef = useCallback((node: HTMLElement | null) => {
  animationRef.current = node;
  (trackingRef as React.MutableRefObject<HTMLElement | null>).current = node;
}, []);
```

I recommend **Option A** for simplicity - fewer moving parts.

## What This Does NOT Change

- Existing `trackEvent` calls (e.g., `sample_report_upload_click`, `partner_share_opt_in`)
- Component logic, props, or state
- Styling or layout
- Any other event names

## Analytics Events After Implementation

When users scroll through the sample report, these events will fire to GTM:

| Section | Event Name | Section Value |
|---------|------------|---------------|
| Hero | `sample_report_section_view` | `hero` |
| Comparison | `sample_report_section_view` | `comparison` |
| Scoreboard | `sample_report_section_view` | `scoreboard` |
| Pillar Accordion | `sample_report_section_view` | `pillar_accordion` |
| How It Works | `sample_report_section_view` | `how_it_works` |
| Leverage Options | `sample_report_section_view` | `leverage_options` |
| Closer | `sample_report_section_view` | `closer` |
| FAQ | `sample_report_section_view` | `faq` |

## Implementation Order

1. HeroSection, ComparisonSection, HowItWorksSection, CloserSection, FAQSection (simple additions)
2. PillarAccordionSection, LeverageOptionsSection (already have state, but no observer)
3. ScoreboardSection (has existing observer - requires merge)

## Validation

After implementation, verify in browser console (dev mode):
- Navigate to `/sample-report`
- Scroll through page
- Confirm `📊 GTM Event: sample_report_section_view` logs for each section (8 total)

