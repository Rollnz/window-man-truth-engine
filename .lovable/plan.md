

# Integrate ScanPipelineV2 into the AI Scanner Page

## What This Does

Adds a visually rich, scroll-triggered 3-step pipeline animation between the UrgencyTicker and the upload section on the `/ai-scanner` page. It shows users exactly how the AI processes their quote: OCR Extraction -> AI Analysis -> Red Flag Report, with flowing data beams, animated counters, and sonar-ping effects on each node.

## Approach

The provided component uses inline styles and raw CSS keyframes (no Tailwind). Rather than rewriting it entirely into Tailwind classes (which would lose fidelity on the complex animations), the plan is to:

1. **Create the component as-is**, adapted to TypeScript and project conventions (named export, Lucide icons where possible, `useIsMobile` hook reuse, `prefers-reduced-motion` respect).
2. **Keep the inline `<style>` block** for the custom keyframes (`particleX`, `particleY`, `sonarPing`, `iconFloat`, `sheenSweep`, `scanLine`, `gridPulse`, `borderGlow`) since these are component-scoped and too complex for Tailwind config.
3. **Remove the Google Fonts `<link>`** -- the project already has Inter loaded globally and uses `font-typewriter` for monospace.
4. **Wire it into `QuoteScanner.tsx`** between the `UrgencyTicker` and the upload `<section>`.

## Files to Create

### `src/components/quote-scanner/ScanPipelineStrip.tsx`

- Named export: `ScanPipelineStrip`
- TypeScript with proper interfaces for props
- Uses Lucide icons (`FileSearch`, `Brain`, `ShieldAlert`) instead of inline SVGs
- Uses `useIsMobile()` from `@/hooks/use-mobile` instead of custom resize listener
- Uses `useRef`, `useState`, `useEffect` for IntersectionObserver + phase sequencer
- Contains a `useAnimatedCounter` internal hook for the metric counters
- Contains a `ParticleStream` sub-component for the data flow beams
- Contains a `PipelineNode` sub-component for each step card
- All CSS keyframes in a scoped `<style>` tag inside the component
- Respects `prefers-reduced-motion`: if enabled, all steps render visible immediately, no animations
- Color constants use CSS variables where possible (`hsl(var(--primary))` for cyan accents, `hsl(var(--background))` for dark bg) to stay theme-consistent. The red flag color stays hardcoded (`#ff3d5a`) as it matches the existing claim-survival tool color.

## Files to Modify

### `src/pages/QuoteScanner.tsx`

Two changes:
1. Add import: `import { ScanPipelineStrip } from '@/components/quote-scanner/ScanPipelineStrip';`
2. Insert `<ScanPipelineStrip />` on a new line after the `UrgencyTicker` container div (after line 126) and before the upload `<section>` (line 129)

### `tailwind.config.ts`

No changes needed -- all animations are handled via the component's internal `<style>` block since they use container queries and complex multi-step sequences that don't map cleanly to Tailwind utilities.

## Key Adaptations from Provided Code

| Original | Adapted |
|---|---|
| Inline SVG icons | Lucide `FileSearch`, `Brain`, `ShieldAlert` |
| `window.innerWidth < 640` resize listener | `useIsMobile()` hook (breakpoint 768px, consistent with project) |
| Google Fonts `<link>` tag | Removed (Inter already loaded globally) |
| Hardcoded hex colors (`#00e5ff`, `#0a0e14`) | Mapped to CSS variables where feasible; some kept for gradient precision |
| `export default` | `export function ScanPipelineStrip()` (named export, project convention) |
| No reduced-motion handling | Added `prefers-reduced-motion` media query check |
| No TypeScript types | Full TypeScript interfaces for step data, component props |

## No Other Changes

- No database migrations
- No new dependencies
- No analytics events (purely visual)
- No changes to existing components

