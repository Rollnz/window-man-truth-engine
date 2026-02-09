

# Add "Why AI vs Humans" Comparison Section

## What and Why

A new visually rich section comparing traditional human advisors to the AI engine. It uses a fixed-dark aesthetic (always `bg-slate-950`) so it looks identical in light and dark mode. Placed above `TestimonialCards` on the AI Scanner page to build trust before social proof.

The CTA button ("Try the AI Quote Scanner") fires a GTM `trackEvent` then smooth-scrolls to the upload zone, matching the Red Flags CTA pattern.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/quote-scanner/AIComparisonSection.tsx` | **Create** -- new component |
| `src/index.css` | **Modify** -- add animation/utility CSS at end |
| `src/pages/QuoteScanner.tsx` | **Modify** -- import + render above TestimonialCards |

## Component: AIComparisonSection.tsx

**Props:** `{ uploadRef: RefObject<HTMLDivElement> }`

**Structure (adapted from source):**
- Section wrapper: `bg-slate-950` with circuit-board grid background (CSS class)
- Two-column grid (reverses on mobile so brain visual shows first)
- Left column: heading, "AI Advantage" badge, description paragraph, two comparison cards (Traditional = red glow, AI Engine = blue glow)
- Right column: pulsing brain icon in glowing circle, live data stream indicator, CTA button
- Decorative floating node dots at corners

**Key differences from source:**
- Replaces the source's `<a href>` CTA with a `<Button>` using `onClick={handleCTAClick}`
- Uses existing `trackEvent` from `@/lib/gtm` (same pattern as `QuoteSafetyChecklist`)
- Uses existing `Button` component from `@/components/ui/button`
- Uses `lucide-react` icons already installed: `AlertTriangle`, `CheckCircle2`, `Brain`, `ArrowRight`
- All hardcoded dark colors (no `dark:` prefixes needed since section is always dark)

**Analytics handler:**
```
const handleCTAClick = () => {
  trackEvent('cta_click', {
    location: 'ai_comparison_section',
    destination: 'scanner',
    cta_label: 'Try the AI Quote Scanner',
  });
  uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
```

Button gets `data-id="cta-ai-comparison"` for GTM targeting.

## CSS Additions (appended to src/index.css)

Ported from `technical-philosophy.css`, prefixed with `tp-` to avoid collisions:

- `.tp-section` / `.tp-circuit-bg` -- grid background pattern
- `.tp-section::before` -- radial gradient overlay
- `@keyframes tp-brain-pulse` / `.tp-brain-shell` -- brain glow animation (3s)
- `@keyframes tp-brain-color-pulse` / `.tp-brain-color-pulse` -- icon color cycle (5s)
- `@keyframes tp-stream-pulse` / `.tp-stream-pulse` -- data stream bar sweep (4s)
- `@keyframes tp-node-pulse` / `.tp-node` / `.tp-node-emerald` / `.tp-node-rose` -- floating corner dots
- `.tp-glow-problem` / `.tp-glow-solution` -- card border glow effects
- `@keyframes tp-ping` / `.tp-ping` -- live indicator ping
- `.shimmer-cta` -- CTA button shimmer sweep
- `@media (prefers-reduced-motion: reduce)` -- disables all animations
- `@media (max-width: 768px)` -- reduced animation intensity on mobile

## Page Integration: QuoteScanner.tsx

```
Current order:                    New order:
  ScannerSocialProof                ScannerSocialProof
  TestimonialCards        -->       AIComparisonSection   <-- NEW
  QuoteSafetyChecklist              TestimonialCards
                                    QuoteSafetyChecklist
```

Import and render with `uploadRef={uploadRef}`.

## Analytics Tracking

| Field | Value |
|-------|-------|
| `event` | `cta_click` |
| `location` | `ai_comparison_section` |
| `destination` | `scanner` |
| `cta_label` | `Try the AI Quote Scanner` |
| `data-id` | `cta-ai-comparison` |

## Accessibility

- `prefers-reduced-motion: reduce` stops all animations, keeps static glow states
- Semantic heading hierarchy (`h2` for section title)
- Button uses native `<button>` via shadcn `Button` component
- Color contrast: white text on slate-950 background exceeds WCAG AA

