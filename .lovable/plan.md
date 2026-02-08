

# Add Testimonial Carousel to AI Scanner Page

## Overview
Add the `TestimonialCards` component to the `/ai-scanner` page with enhanced auto-scroll behavior and a slide-up entrance animation. Place it between `ScannerSocialProof` (Robert K. quote) and `QuoteSafetyChecklist` ("Spot the Difference") to stack social proof before educational content.

---

## Placement in Page Flow

```text
QuoteScannerHero
    ↓
UrgencyTicker  
    ↓
Upload/Results Section
    ↓
NoQuotePivotSection (Vault Pivot)
    ↓
ScannerSocialProof (mini-testimonials)
    ↓
┌──────────────────────────────────────┐
│  ★ NEW: TestimonialCards Carousel   │  ← INSERT HERE
└──────────────────────────────────────┘
    ↓
QuoteSafetyChecklist ("Spot the Difference")
    ↓
WindowCalculatorTeaser
    ↓
...rest
```

---

## Technical Implementation

### Part 1: Add Auto-Play Plugin to Embla Carousel

The existing carousel uses `embla-carousel-react`. To enable auto-scroll, we'll add the official `embla-carousel-autoplay` plugin.

**Install dependency:**
```bash
npm install embla-carousel-autoplay
```

**Update TestimonialCards.tsx:**
```typescript
import Autoplay from 'embla-carousel-autoplay';

// In the Carousel component:
<Carousel
  opts={{
    align: 'start',
    loop: true,
  }}
  plugins={[
    Autoplay({
      delay: 5000,           // 5 seconds per card
      stopOnInteraction: true,
      stopOnMouseEnter: true, // Pause on hover
    }),
  ]}
>
```

### Part 2: Mobile Behavior (Disable Auto-Play)

Use the `useIsMobile()` hook to conditionally apply the autoplay plugin:

```typescript
import { useIsMobile } from '@/hooks/use-mobile';

const isMobile = useIsMobile();

const plugins = isMobile 
  ? [] 
  : [Autoplay({ delay: 5000, stopOnMouseEnter: true })];
```

### Part 3: Slide-Up Entrance Animation

Add IntersectionObserver-triggered animation for the container:

```typescript
// In TestimonialCards.tsx
const [hasAnimated, setHasAnimated] = useState(false);

useEffect(() => {
  // Existing IntersectionObserver logic already sets isInView
  if (isInView && !hasAnimated) {
    setHasAnimated(true);
  }
}, [isInView, hasAnimated]);

// Apply animation class
<section 
  ref={sectionRef} 
  className={cn(
    sectionClasses,
    "transition-all duration-700 ease-out",
    hasAnimated 
      ? "opacity-100 translate-y-0" 
      : "opacity-0 translate-y-8"
  )}
>
```

### Part 4: Mobile Arrow Visibility

On mobile, keep arrows visible but smaller for touch accessibility:

```typescript
// Arrows remain visible on mobile (current behavior is fine)
// Just ensure they're properly sized:
<CarouselPrevious className="md:-left-12 -left-4 h-8 w-8 md:h-8 md:w-8" />
<CarouselNext className="md:-right-12 -right-4 h-8 w-8 md:h-8 md:w-8" />
```

### Part 5: Respect prefers-reduced-motion

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const plugins = (isMobile || prefersReducedMotion)
  ? [] 
  : [Autoplay({ delay: 5000, stopOnMouseEnter: true })];
```

### Part 6: Update QuoteScanner.tsx

Add the import and place between existing sections:

```tsx
// Add import
import { TestimonialCards } from '@/components/TestimonialCards';

// In the JSX (line ~268-270):
<ScannerSocialProof />
<TestimonialCards variant="default" className="animate-fade-in" />  {/* NEW */}
<QuoteSafetyChecklist uploadRef={uploadRef} />
```

---

## Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| **Lazy loading** | Already uses IntersectionObserver with 200px rootMargin |
| **Placeholder** | Returns empty section until in view (line 158-166) |
| **Avatar images** | Already uses pravatar.cc CDN with small sizes |
| **CSS animations** | Uses Tailwind transitions (GPU-accelerated) |
| **Plugin load** | Autoplay plugin is tiny (~2KB gzipped) |

---

## Visual Behavior Summary

### Desktop
```text
┌────────────────────────────────────────────────────────────┐
│  ◀  [Card 1] [Card 2] [Card 3]  ▶                         │
│      ←─── Auto-scrolls every 5s ───→                      │
│      (Pauses on hover, respects reduced-motion)           │
└────────────────────────────────────────────────────────────┘
     ↑
     └── Slides up from bottom when entering viewport
```

### Mobile
```text
┌────────────────────────────────────────────────────────────┐
│  ◀ [    Card 1 (full width)    ] ▶                        │
│      ← Swipe to navigate →                                │
│      (No auto-scroll)                                     │
└────────────────────────────────────────────────────────────┘
     ↑
     └── Slides up from bottom when entering viewport
```

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `package.json` | **ADD DEPENDENCY** | `embla-carousel-autoplay` |
| `src/components/TestimonialCards.tsx` | **MODIFY** | Add autoplay plugin, slide-up animation, mobile detection, reduced-motion support |
| `src/pages/QuoteScanner.tsx` | **MODIFY** | Import and add TestimonialCards between ScannerSocialProof and QuoteSafetyChecklist |

---

## Expected Result

1. User scrolls to the testimonials section
2. Cards slide up from the bottom (smooth 700ms animation)
3. On desktop: Cards auto-scroll right-to-left every 5 seconds
4. User hovers → auto-scroll pauses
5. On mobile: User swipes left/right, arrows visible
6. Users with `prefers-reduced-motion`: No auto-scroll, instant visibility

