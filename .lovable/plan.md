

# Problem Agitation Section Implementation

## Summary
Create a new emotionally-driven "Problem Agitation" section featuring the frustrated man image with psychologically-crafted bullet points about hidden fees and inflated quotes. This section will be placed between `ScannerIntelligenceBar` and `UploadZoneXRay` to maximize conversion by agitating the problem before presenting the solution.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/audit/ProblemAgitationSection.tsx` | **Create** | New emotionally-charged section component |
| `src/components/audit/index.ts` | **Modify** | Export new component |
| `src/pages/Audit.tsx` | **Modify** | Insert component between IntelligenceBar and UploadZone |

---

## File 1: `src/components/audit/ProblemAgitationSection.tsx` (Create)

### Section Structure

```text
┌──────────────────────────────────────────────────────────────┐
│                 PROBLEM AGITATION SECTION                     │
│                     (py-16 md:py-24)                          │
├──────────────────────────────────────────────────────────────┤
│  [Mobile: Image ABOVE text - emotion first]                  │
│                                                               │
│  ┌─────────────────┐  ┌────────────────────────────────────┐ │
│  │                 │  │  Headline:                          │ │
│  │   Frustrated    │  │  "Your Quote is a Minefield        │ │
│  │   Man Image     │  │   of Hidden Costs."                │ │
│  │                 │  │                                     │ │
│  │  (X-ray glow    │  │  Subheadline:                       │ │
│  │   border)       │  │  "Contractors rely on your          │ │
│  │                 │  │   confusion to inflate margins."   │ │
│  │                 │  │                                     │ │
│  │                 │  │  • The "Padding" Trap               │ │
│  │                 │  │  • The Discount Illusion            │ │
│  │                 │  │  • Hidden Disposal Fees             │ │
│  │                 │  │  • Low-Ball Labor                   │ │
│  └─────────────────┘  └────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Key Technical Features

**1. Semantic HTML5 + Accessibility**
```tsx
<section 
  aria-labelledby="problem-agitation-heading"
  className="relative py-16 md:py-24 bg-slate-950 overflow-hidden"
>
```

**2. Responsive Two-Column Grid**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
  {/* Image Column - First on mobile (order-1 lg:order-none) */}
  {/* Text Column */}
</div>
```

**3. Lazy Loading Image with SEO Alt Text**
```tsx
<img
  src="/lovable-uploads/[image-id].webp"
  alt="Frustrated homeowner reviewing a confusing window replacement quote with hidden fees"
  loading="lazy"
  className="w-full h-auto rounded-2xl"
/>
```

**4. X-Ray Glow Effect on Image**
```tsx
<div className="relative group">
  {/* Outer glow ring */}
  <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 via-primary/20 to-orange-500/30 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
  
  {/* Inner border with scan effect */}
  <div className="relative border-2 border-orange-500/40 rounded-2xl overflow-hidden">
    <img ... />
    
    {/* Scan line overlay */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan-down" />
    </div>
  </div>
</div>
```

**5. Typography - Truth Engine Style**
```tsx
{/* Headline */}
<h2 
  id="problem-agitation-heading"
  className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight"
>
  Your Quote is a{' '}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
    Minefield
  </span>{' '}
  of Hidden Costs.
</h2>

{/* Subheadline */}
<p className="text-lg md:text-xl text-slate-400 leading-relaxed">
  Contractors rely on your confusion to inflate their margins.{' '}
  <span className="text-orange-400 font-medium">Don't let them.</span>
</p>
```

**6. Agitation Bullet Points with Named Traps**

| Trap Name | Description | Icon |
|-----------|-------------|------|
| The "Padding" Trap | Paying for 'miscellaneous' materials that don't exist | AlertTriangle |
| The Discount Illusion | "Limited Time Offer" is the standard price inflated 20% first | PercentCircle |
| Hidden Disposal Fees | $500+ cleanup costs buried in fine print | FileWarning |
| Low-Ball Labor | Low labor costs = uninsured sub-contractors | HardHat |

```tsx
<ul className="space-y-4">
  {AGITATION_POINTS.map((point) => (
    <li key={point.title} className="flex gap-4 items-start group">
      {/* Icon container with glow */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
        <point.icon className="w-5 h-5 text-orange-400" />
      </div>
      
      <div>
        <span className="text-white font-semibold block">
          {point.title}
        </span>
        <span className="text-slate-400 text-sm">
          {point.description}
        </span>
      </div>
    </li>
  ))}
</ul>
```

### Copy Constants (embedded in component)

```typescript
const PROBLEM_CONTENT = {
  headline: 'Your Quote is a Minefield of Hidden Costs.',
  subheadline: "Contractors rely on your confusion to inflate their margins. Don't let them.",
  imageAlt: 'Frustrated homeowner reviewing a confusing window replacement quote with hidden fees',
};

const AGITATION_POINTS = [
  {
    icon: AlertTriangle,
    title: 'The "Padding" Trap',
    description: "Are you paying for 'miscellaneous' materials that don't exist?",
  },
  {
    icon: PercentCircle,
    title: 'The Discount Illusion',
    description: "That 'Limited Time Offer' is usually the standard price—inflated 20% first.",
  },
  {
    icon: FileWarning,
    title: 'Hidden Disposal Fees',
    description: "Many quotes hide $500+ in cleanup costs in the fine print.",
  },
  {
    icon: HardHat,
    title: 'Low-Ball Labor',
    description: "Unusually low labor costs often mean uninsured sub-contractors on your property.",
  },
];
```

---

## File 2: `src/components/audit/index.ts` (Modify)

Add export:
```typescript
export { ProblemAgitationSection } from './ProblemAgitationSection';
```

---

## File 3: `src/pages/Audit.tsx` (Modify)

### Changes Required

1. Add lazy import for ProblemAgitationSection
2. Insert between ScannerIntelligenceBar and UploadZoneXRay Suspense block

```tsx
// Add to lazy imports (around line 18)
const ProblemAgitationSection = lazy(() => 
  import('@/components/audit/ProblemAgitationSection').then(m => ({ default: m.ProblemAgitationSection }))
);

// Insert in JSX structure (around line 72-73)
<ScannerIntelligenceBar />

{/* Problem Agitation - below the fold, lazy loaded */}
<Suspense fallback={<div className="h-96" />}>
  <ProblemAgitationSection />
</Suspense>

{/* Below the fold - lazy loaded */}
<Suspense fallback={<LoadingSkeleton />}>
  <div ref={uploadRef}>
    <UploadZoneXRay ... />
  </div>
  ...
```

---

## Visual Preview

### Desktop (lg+)
```text
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │                  │    │  Your Quote is a MINEFIELD        │  │
│  │   [Frustrated    │    │  of Hidden Costs.                 │  │
│  │    Man Image]    │    │                                   │  │
│  │                  │    │  Contractors rely on your...      │  │
│  │   (orange glow   │    │                                   │  │
│  │    border)       │    │  ⚠ The "Padding" Trap             │  │
│  │                  │    │  % The Discount Illusion          │  │
│  │                  │    │  📄 Hidden Disposal Fees           │  │
│  │                  │    │  🏗 Low-Ball Labor                 │  │
│  └──────────────────┘    └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (< lg)
```text
┌─────────────────────┐
│  ┌───────────────┐  │
│  │               │  │
│  │  [Frustrated  │  │
│  │   Man Image]  │  │
│  │               │  │
│  └───────────────┘  │
│                     │
│  Your Quote is a    │
│  MINEFIELD of       │
│  Hidden Costs.      │
│                     │
│  Contractors rely...│
│                     │
│  ⚠ The "Padding"    │
│    Trap             │
│  ...                │
└─────────────────────┘
```

---

## Technical Specifications

| Spec | Implementation |
|------|----------------|
| **Semantic HTML** | `<section aria-labelledby="...">` |
| **Lazy Loading** | `loading="lazy"` on image + lazy component import |
| **SEO Alt Text** | "Frustrated homeowner reviewing a confusing window replacement quote with hidden fees" |
| **Vertical Padding** | `py-16 md:py-24` (proper breathing room) |
| **X-Ray Glow** | Orange gradient blur + scan line overlay |
| **Typography** | Inter, tracking-tight, font-black headers |
| **Mobile-First** | Image above text on mobile via `order-1 lg:order-none` |
| **Performance** | GPU-accelerated glow via `transform-gpu` |
| **Reduced Motion** | Scan animation respects `prefers-reduced-motion` |

---

## Testing Checklist

After implementation:
1. Navigate to /audit page - verify new section appears between Intelligence Bar and Upload Zone
2. Check image loads lazily (Network tab shows deferred load)
3. Verify orange X-ray glow effect on image container
4. Test mobile layout - image should appear above text
5. Test desktop layout - two-column side-by-side
6. Verify scan line animation on image (if motion allowed)
7. Check SEO - inspect `<section>` has `aria-labelledby` pointing to heading
8. Test reduced motion - animations should be disabled

