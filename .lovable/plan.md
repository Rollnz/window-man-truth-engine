

# "Why AI Instead of a Human Advisor?" Comparison Section

## What and Why

A two-column comparison section showing the shortcomings of traditional window advisors vs. the AI Scanner's advantages. Positioned between `ScannerSocialProof` and `TestimonialCards` to provide logical justification before emotional proof (testimonials).

## Theming Strategy: Semantic Tokens Only

All colors use the project's design system variables -- zero hardcoded Tailwind colors for backgrounds, text, or borders.

| Element | Class Used | Why |
|---------|-----------|-----|
| Section BG | `bg-background` | Adapts to both themes automatically |
| Cards | `bg-card border-border` | Uses card surface tokens |
| Primary accent text | `text-primary` | Maps to Industrial Blue (#3993DD) |
| Muted text | `text-muted-foreground` | Correct secondary text token |
| Headings | `text-foreground` | Main text color |
| Destructive accents | `text-destructive` | Red for "bad" bullet icons |
| Badge | `bg-primary/10 text-primary` | Tinted primary token |
| Grid overlay | Uses `pattern-grid` utility | Already exists in index.css |
| Card elevation | `elev-md` class | Existing shadow utility |

No `bg-slate-*`, `text-sky-*`, or `dark:` overrides needed.

## Import Strategy: Static Import

All existing sections on QuoteScanner.tsx (`ScannerSocialProof`, `TestimonialCards`, `QuoteSafetyChecklist`, etc.) use standard static imports. This new component will follow the same pattern to avoid introducing inconsistent Suspense boundaries.

```
import { AIComparisonSection } from '@/components/quote-scanner/AIComparisonSection';
```

## Component Architecture

### Single New Component

**File:** `src/components/quote-scanner/AIComparisonSection.tsx`

- **Props:** `uploadRef?: React.RefObject<HTMLDivElement>`
- **Responsibilities:** Render comparison cards, CTA with analytics, section-view tracking
- **No sub-components** -- self-contained

### Visual Layout

```text
[AI ADVANTAGE] badge (bg-primary/10 text-primary)

Why AI Instead of a Human Advisor?
Subtitle text (text-muted-foreground)

+---------------------------+  +---------------------------+
| border-destructive/30     |  | border-primary/30         |
| Traditional Advisors      |  | AI Quote Scanner          |
|                           |  |                           |
| x Bullet 1 (destructive) |  | check Bullet 1 (primary)  |
| x Bullet 2               |  | check Bullet 2            |
| x Bullet 3               |  | check Bullet 3            |
| x Bullet 4               |  | check Bullet 4            |
+---------------------------+  +---------------------------+

        [ Try the AI Quote Scanner ]
        (bg-primary text-primary-foreground)
```

### Content

**Traditional Advisors (left card):**
- Commission bias and hidden sales pressure
- Inconsistent advice from door-to-door reps
- Cannot compare every product and code requirement
- Limited time, human error, no audit trail

**AI Quote Scanner (right card):**
- Reads every line item and clause instantly
- Flags hidden risks and overpricing with data
- Zero commission bias -- works only for you
- 24/7 consistent logic, updated to FL building code

### Analytics Integration

**CTA click** (uses existing `trackEvent` from `@/lib/gtm`):
```tsx
trackEvent('cta_click', {
  location: 'ai_comparison_section',
  destination: 'scanner',
  cta_label: 'Try the AI Quote Scanner',
});
```
Plus `data-id="cta-ai-comparison"` for GTM targeting.

**Section view** (IntersectionObserver, fires once at 50% visibility):
```tsx
trackEvent('section_view', {
  section: 'ai_comparison',
  page: 'quote-scanner',
});
```

### CSS Additions (index.css)

Minimal -- only a subtle pulse animation for the decorative Brain icon between cards:

```css
@keyframes tech-pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.08); opacity: 1; }
}
.animate-tech-pulse {
  animation: tech-pulse 3s ease-in-out infinite;
}
```

Wrapped in `@media (prefers-reduced-motion: no-preference)` for accessibility. Uses existing `pattern-grid` utility for the section background overlay.

### Accessibility

- All decorative icons: `aria-hidden="true"`
- Card headings use `h3` under the section `h2`
- Animation disabled for `prefers-reduced-motion: reduce`
- CTA is a `Button` component with visible focus ring
- All text meets WCAG AA contrast via semantic tokens

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add `animate-tech-pulse` keyframe (6 lines) |
| `src/components/quote-scanner/AIComparisonSection.tsx` | New component |
| `src/pages/QuoteScanner.tsx` | Static import + render between SocialProof and TestimonialCards |

