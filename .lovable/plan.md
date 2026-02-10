

# Replace ScanPipelineStrip with AIScannerHero (4-Scene Forensic Pipeline)

## What Changes

Replace the current 3-step `ScanPipelineStrip` component with a significantly upgraded 4-scene animated pipeline featuring rich SVG illustrations, particle beam connectors, rotating orbit rings, circuit trace backgrounds, and a "Forensic Ally" banner.

## New Visual Architecture

The pipeline expands from 3 simple icon cards to 4 illustrated scene cards:

```text
Desktop (7-column grid):
  [ Extraction ] ─beam─ [ AI Brain ] ─beam─ [ Database ] ─beam─ [ Red Flag Report ]
       PDF doc        orbit rings      cylinder DB        flagged report
       + scan lines   + neural nodes   + data rows        + checklist items

Mobile (vertical stack):
  [ Extraction ]  (220px)
       |  beam
  [ AI Brain ]    (240px)
       |  beam
  [ Database ]    (180px)
       |  beam (red)
  [ Red Flag ]    (210px)
```

## File Changes

### `src/components/quote-scanner/ScanPipelineStrip.tsx` -- Full Rewrite

The existing 719-line component is replaced entirely with the new design. Key elements:

**Sub-components (all internal, no new files):**

| Component | Purpose |
|---|---|
| `GlobalStyles` | Scoped keyframes for all animations (replaces current `SCOPED_STYLES`) |
| `ParticleBeam` | Horizontal/vertical data flow connectors with animated particles |
| `CircuitTraces` | SVG background pattern for scene cards |
| `ForensicBadge` | "FORENSIC ALLY" branding banner with animated hexagon icon |
| `ExtractionScene` | Scene 1: PDF document with scan lines and extracted data fragments |
| `AIBrainScene` | Scene 2: Neural chip with rotating orbit rings and connection nodes |
| `DatabaseScene` | Scene 3: Cylinder database icon with pulsing data rows |
| `RedFlagScene` | Scene 4: Report card with flag/check/warn items and corner decorations |
| `VerticalBeam` | Mobile-specific vertical connector between stacked cards |
| `RotatingValueProp` | Preserved from current implementation (rotating ticker below pipeline) |

**Preserved from current component:**
- `RotatingValueProp` sub-component and `VALUE_PROPS` array (the rotating ticker)
- `renderHighlighted` utility function
- Named export: `export function ScanPipelineStrip()`
- `useIsMobile()` hook from `@/hooks/use-mobile`
- IntersectionObserver scroll-trigger pattern
- `prefers-reduced-motion` respect

**Adaptations from provided code:**
- `export default function AIScannerHero()` becomes `export function ScanPipelineStrip()` (named export, matching existing import in QuoteScanner.tsx)
- Remove Google Fonts `<link>` tag (Inter already loaded globally, JetBrains Mono replaced with project's existing monospace stack)
- Custom `window.innerWidth < 768` resize listener replaced with `useIsMobile()` hook
- All inline SVGs kept as-is (too complex for Lucide replacements -- custom illustrated scenes)
- Color constants: keep hardcoded hex values for gradient precision (cyan `#00e5ff`, red `#ff3d5a`, dark bg `#0b1018`) since these are illustration-specific and don't need to follow the theme system
- TypeScript types added to all component props
- `setTimeout(() => setVisible(true), 300)` fallback removed (IntersectionObserver is sufficient)

**Layout:**
- Desktop: `gridTemplateColumns: "1fr auto 1.3fr auto 0.8fr auto 1fr"` with scene cards in columns 1/3/5/7 and horizontal `ParticleBeam` connectors in columns 2/4/6
- Mobile: `flexDirection: column` with `VerticalBeam` connectors (44px height) between cards
- Last beam connector (Database to Red Flag) uses `color={C.red}` instead of cyan
- Banner (`ForensicBadge`) stacks vertically on mobile

**Animations (all via scoped `<style>` block):**
- `streamRight` / `streamDown`: Particle flow through beam connectors
- `sonarPing`: Active node highlight pulses
- `breathe`: Subtle opacity breathing on orbit ring nodes
- `coreGlow`: Box-shadow pulse on AI brain chip
- `rotate` / `rotateReverse`: Orbit ring rotation (AI Brain scene)
- `flagWave`: Red flag icon wobble
- `scanLine`: Vertical scan sweep on Extraction scene
- `textFlicker`: Subtle text opacity flicker
- `dataFlow`: Stroke-dashoffset animation on circuit traces
- `checkPop`: Checkmark entrance animation
- `dbPulse`: Database cylinder breathing

### `src/pages/QuoteScanner.tsx` -- No Changes

The import `import { ScanPipelineStrip } from '@/components/quote-scanner/ScanPipelineStrip'` and the `<ScanPipelineStrip />` placement remain identical. The component name and export are preserved.

### `src/components/quote-scanner/QuoteScannerHero.tsx` -- No Changes

The hero section above remains untouched.

## What Does NOT Change

- No new files created (single file rewrite)
- No new dependencies
- No database changes
- No analytics events modified
- QuoteScanner.tsx import and placement unchanged
- RotatingValueProp ticker preserved with identical behavior

