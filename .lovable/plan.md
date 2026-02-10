

# Add "Why AI Instead of Human Advisors?" Section

## What This Does

Creates a new `AIComparisonSection` component with a dark cyberpunk aesthetic (dark slate background, circuit-grid pattern, pulsing brain icon, animated data stream) and places it above the `TestimonialCards` on the AI Scanner page.

## Reference Screenshot Description

The image shows a full-width dark section (`bg-slate-950`) with:
- A subtle 3D beveled tile/circuit grid background pattern
- Top-left: small uppercase cyan label "WHY AI INSTEAD OF HUMAN ADVISORS?"
- Below that: a pill badge "AI ADVANTAGE" with a brain icon
- Large bold hero heading: "Unbiased Comparison." (white) + "Data Driven insight." (cyan/primary) + "Updated Daily" (white)
- Body paragraph explaining the AI advantage
- Two side-by-side comparison cards at the bottom:
  - Left: "Traditional Human Advisors" with red glow border, listing 3 drawbacks with bullet markers
  - Right: "AI Advisor Engine" with blue glow border, listing 3 benefits with checkmark icons
- Right side: a large glowing brain icon inside a pulsing circle with animated ring
- Below the brain: a frosted glass "Live data stream / Analyzing scenarios" bar with animated horizontal pulses
- A tagline: "Even if you never read the fine print, your AI co-pilot does."
- A cyan "Try the AI Quote Scanner" CTA button with shimmer effect
- Decorative floating dot nodes in corners
- Bottom-left: small uppercase footer text "INNOVATION AT SCALE..."

## Files to Create/Modify

### 1. NEW: `src/components/quote-scanner/AIComparisonSection.tsx`

A self-contained component with embedded CSS (via a `<style>` tag injected in a useEffect or inline style block). Contains:

**Layout (desktop):** Two-column grid (`lg:grid-cols-2`). Left column has copy + comparison cards. Right column has the brain visual + data stream + CTA.

**Layout (mobile):** Single column. Brain visual appears first (via `order-first`), then copy + cards below.

**Visual effects (all CSS-based, no images):**
- `.tp-section` wrapper with `bg-slate-950` and `overflow-hidden`
- `.tp-circuit-bg` background using CSS linear gradients to create the grid pattern
- Radial gradient overlays for subtle colored glows
- `.tp-brain-shell` with `@keyframes tp-brain-pulse` (scale + box-shadow animation)
- `.tp-brain-color-pulse` on the Brain icon (color cycles between light blue and brand blue)
- `.tp-stream-pulse` horizontal bars animating left-to-right inside the data stream container
- `.tp-node` floating dots with `@keyframes tp-node-pulse` (float up/down)
- `.tp-glow-problem` (red glow border) and `.tp-glow-solution` (blue glow border) on comparison cards
- `.shimmer-cta` button with a sweeping white highlight animation
- Full `@media (prefers-reduced-motion: reduce)` support -- all animations disabled
- Mobile calming: reduced opacity, smaller grid, slower brain pulse

**CTA button:** Smooth-scrolls to the scanner upload zone (accepts `uploadRef` prop) and fires `trackEvent('cta_click', { location: 'ai_comparison_section', destination: 'scanner' })`. Includes `data-id="cta-ai-comparison"` for GTM targeting.

**Imports needed:** `Brain`, `AlertTriangle`, `CheckCircle2`, `ArrowRight` from lucide-react; `trackEvent` from `@/lib/gtm`; `cn` from `@/lib/utils`.

### 2. MODIFY: `src/pages/QuoteScanner.tsx`

- Import `AIComparisonSection` from `@/components/quote-scanner/AIComparisonSection`
- Insert `<AIComparisonSection uploadRef={uploadRef} />` on line 270, directly above `<TestimonialCards variant="default" />`

## Props Interface

```tsx
interface AIComparisonSectionProps {
  uploadRef?: React.RefObject<HTMLDivElement>;
}
```

## Color Palette (Fixed Dark Theme)

| Element | Color |
|---------|-------|
| Background | `bg-slate-950` |
| Grid lines | `rgba(39,118,245,0.08)` |
| Section label | `text-cyan-400` |
| Hero heading accent | `text-cyan-400` (or `text-primary`) |
| Body text | `text-slate-300` |
| Problem card glow | `rgba(248,113,113,0.6)` red |
| Solution card glow | `rgba(39,118,245,0.7)` blue |
| Brain glow | `rgba(39,118,245,...)` |
| CTA button | `bg-cyan-500 text-slate-900` |
| Footer text | `text-cyan-500/60` |

## Accessibility

- All animations respect `prefers-reduced-motion`
- Comparison cards use semantic headings
- CTA is a focusable button element
- Sufficient color contrast on all text (light text on dark bg)
