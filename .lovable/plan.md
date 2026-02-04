

# TestimonialCards Component Implementation

## Summary
Create a reusable testimonial carousel component and integrate it into the `/audit` page with dark theme styling above the VaultSection.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/TestimonialCards.tsx` | Create | Reusable testimonial carousel component |
| `src/pages/Audit.tsx` | Modify | Add TestimonialCards above VaultSection |

---

## File 1: `src/components/TestimonialCards.tsx`

### Props Interface

```tsx
interface TestimonialCardsProps {
  variant?: 'default' | 'dark';
  className?: string;
}
```

### Reviews Data (Embedded)

```tsx
const REVIEWS = [
  {
    id: 1,
    name: "Maria G.",
    location: "Miami, FL",
    platform: "Google Review",
    platformIcon: "🔍",
    stars: 5.0,
    headline: "He told me what to say before I even booked a quote.",
    body: "Window Man coached me before I talked to any contractors, gave me a checklist of questions, and helped me avoid a $45k upsell.",
    savings: "Saved $12,400 vs. first quote",
    avatarUrl: "https://i.pravatar.cc/200?img=47",
  },
  // ... 5 more reviews
];
```

### Key Features

1. **Lazy Loading with IntersectionObserver**
   - Component renders placeholder until 200px from viewport
   - Prevents layout shift with matching placeholder height

2. **GTM Tracking**
   - Impression tracking when section becomes visible
   - Interaction tracking on first carousel scroll/swipe

3. **Theme Variants**
   - `variant="default"`: Uses theme tokens (`bg-card`, `text-foreground`)
   - `variant="dark"`: Uses slate dark colors (`bg-slate-900/80`, `text-white`)

4. **Responsive Carousel**
   - Mobile: 1 card visible (`basis-full`)
   - Tablet: 2 cards visible (`md:basis-1/2`)
   - Desktop: 3 cards visible (`lg:basis-1/3`)

### Component Structure

```tsx
<section className={sectionClasses}>
  {/* Header */}
  <div className="text-center mb-10">
    <Badge>...</Badge>
    <h2 className="text-3xl md:text-4xl font-black text-white">
      Real Savings. Real Homeowners.
    </h2>
    <p className="text-slate-400">...</p>
  </div>

  {/* Carousel */}
  <Carousel opts={{ align: 'start', loop: true }}>
    <CarouselContent>
      {REVIEWS.map(review => (
        <CarouselItem key={review.id}>
          <Card className={cardClasses}>
            {/* Avatar + Name + Location */}
            {/* Star Rating */}
            {/* Headline */}
            {/* Body */}
            {/* Savings Badge */}
          </Card>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
</section>
```

### Dark Theme Card Styling

```tsx
// Dark variant classes
const cardClasses = variant === 'dark' 
  ? "bg-slate-900/80 border-slate-700/50 hover:border-success/30"
  : "bg-card border-success/20 hover:border-success/40";

const textClasses = variant === 'dark'
  ? "text-white"
  : "text-foreground";

const mutedClasses = variant === 'dark'
  ? "text-slate-400"
  : "text-muted-foreground";
```

### Header Styling (Matching /audit page)

```tsx
<h2 className={cn(
  "text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight",
  variant === 'dark' ? "text-white" : "text-foreground"
)}>
  Real Savings.{' '}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
    Real Homeowners.
  </span>
</h2>
```

---

## File 2: `src/pages/Audit.tsx`

### Changes Required

1. Add lazy import for TestimonialCards
2. Insert component above VaultSection in JSX

```tsx
// Add to lazy imports (line ~16)
const TestimonialCards = lazy(() => 
  import('@/components/TestimonialCards').then(m => ({ default: m.TestimonialCards }))
);

// Add to JSX (before VaultSection, around line 75)
<TestimonialCards variant="dark" />
<VaultSection />
```

---

## Visual Preview

### Header Style
- Font: `font-black` (900 weight)
- Size: `text-3xl md:text-4xl lg:text-5xl`
- Color: White with gradient accent span

### Card Style (Dark Variant)
- Background: `bg-slate-900/80`
- Border: `border-slate-700/50` → `hover:border-success/30`
- Avatar border: `border-success/30`
- Star rating: Success green (`text-success`)
- Savings badge: Success green with pulse dot

---

## Dependencies Used

| Dependency | Purpose |
|------------|---------|
| `embla-carousel-react` | Already installed - powers Carousel |
| `lucide-react` | Star, TrendingUp icons |
| `@/components/ui/carousel` | Existing shadcn carousel |
| `@/components/ui/card` | Existing shadcn card |
| `@/components/ui/badge` | Existing shadcn badge |
| `@/lib/gtm` | GTM tracking helper |

---

## Reusability

The component can be used on other pages with default styling:

```tsx
// On /audit page (dark theme)
<TestimonialCards variant="dark" />

// On other pages (default theme)
<TestimonialCards />
<TestimonialCards variant="default" />
```

---

## Testing Checklist

After implementation:
1. Navigate to /audit page - verify testimonials appear above Vault section
2. Test carousel swiping on mobile - verify smooth scroll-snap behavior
3. Click carousel arrows on desktop - verify navigation works
4. Check lazy loading - section should only render when approaching viewport
5. Verify dark theme styling matches surrounding /audit page sections
6. Test on multiple screen sizes - verify responsive card counts (1/2/3)

