

# Hero Background Image Implementation

## Summary
Add the uploaded image (`unmask_your_quote.webp`) as a blurred parallax background to the `QuoteScannerHero` component on `/ai-scanner`, creating a premium glassmorphism effect while maintaining WCAG AA text contrast.

---

## Files to Modify/Create

### 1. Copy Image to Public Directory
**Action**: Copy `user-uploads://unmask_your_quote.webp` → `public/images/quote-scanner/hero-bg.webp`

Using `public/` because:
- Background images in CSS `style` props need direct URL access
- Parallax backgrounds can't use ES6 imports effectively

### 2. Update `src/components/quote-scanner/QuoteScannerHero.tsx`

**Implementation Strategy**: Three-layer glassmorphism stack

```text
┌────────────────────────────────────────────────┐
│  Layer 3: Content (z-10)                       │
│  - Badge, Icon, Headline, Subtext              │
│  - Text locked to white for contrast           │
├────────────────────────────────────────────────┤
│  Layer 2: Dark Overlay (z-[1])                 │
│  - bg-gradient-to-b from-black/60 to-black/40  │
│  - Ensures text readability                    │
├────────────────────────────────────────────────┤
│  Layer 1: Background Image (z-0)               │
│  - filter: blur(4px)                           │
│  - background-attachment: fixed (desktop only) │
│  - opacity-30 for subtlety                     │
└────────────────────────────────────────────────┘
```

**Code Changes**:

```tsx
export function QuoteScannerHero() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden min-h-[50vh] flex items-center">
      {/* Layer 1: Background Image with Parallax */}
      <div 
        className="absolute inset-0 z-0 scale-105"
        style={{
          backgroundImage: `url('/images/quote-scanner/hero-bg.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll', // Mobile default
          filter: 'blur(4px)',
          transform: 'translateZ(0)', // GPU acceleration
        }}
        aria-hidden="true"
      />
      
      {/* Parallax for desktop only via media query */}
      <style>{`
        @media (min-width: 768px) {
          .parallax-bg {
            background-attachment: fixed !important;
          }
        }
      `}</style>
      
      {/* Layer 2: Dark Overlay for Contrast */}
      <div 
        className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/50 to-background"
        aria-hidden="true"
      />
      
      {/* Layer 3: Content */}
      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <ShimmerBadge className="mb-6" />
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <ScanSearch className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          {/* Headline - Locked to white for image overlay */}
          <h1 className="display-h1 text-lift text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            Is Your Window Quote Fair?{' '}
            <span className="text-primary">AI Analysis in 60 Seconds</span>
          </h1>
          
          {/* Subtext - Slightly muted white */}
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Stop guessing. Upload a photo of your contractor's quote and let our AI flag hidden risks, 
            missing scope, and overpricing — in seconds.
          </p>
        </div>
      </div>
    </section>
  );
}
```

---

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| `filter: blur(4px)` instead of 8px | Preserves more image detail while still creating depth |
| `scale-105` on background | Prevents blur edges from showing white borders |
| `backgroundAttachment: scroll` mobile | Avoids iOS Safari parallax bugs |
| Desktop parallax via CSS | No JS = no jank, better performance |
| Text locked to `text-white` | Theme-locked since background is fixed tone |
| Icon container `bg-white/10 backdrop-blur-sm` | Glassmorphism consistency with hero |
| `min-h-[50vh]` | Ensures hero presence without excessive scroll |

---

## Performance Considerations

1. **Image Optimization**: The `.webp` format is already optimized
2. **No `fetchPriority="high"`**: Since it's a CSS background, browser handles loading automatically
3. **GPU Acceleration**: `transform: translateZ(0)` forces GPU rendering
4. **No JavaScript**: Pure CSS parallax avoids runtime costs

---

## Accessibility

- `aria-hidden="true"` on decorative background layers
- Text contrast maintained via dark overlay (meets WCAG AA 4.5:1)
- No flashing or motion that could trigger vestibular disorders

---

## Build Order

1. Copy image to `public/images/quote-scanner/hero-bg.webp`
2. Update `QuoteScannerHero.tsx` with three-layer structure
3. Test on desktop (parallax visible) and mobile (static background)

---

## Theme Compatibility Note

Per your `color-request-protocol-v2` memory: This hero uses a **theme-locked surface** (the image is fixed-tone), so text is hardcoded to `text-white` rather than adaptive `text-foreground`. This is intentional and correct for this use case.

