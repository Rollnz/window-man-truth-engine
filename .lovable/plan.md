

# Prompt 1: Build the Scanner Engine & 3-Round Logic

## Overview

Refactor `QuoteScannerHero.tsx` from a pure-CSS animation into a JS-driven "Scanner Engine" with a `scanRound` state (1-2-3 cycle) and `scanProgress` (0.0 to 1.0) derived from `performance.now()`. This replaces `setInterval`-based timing with a drift-proof `requestAnimationFrame` loop. The existing text content stays untouched.

## Architecture

The component will use a single `useEffect` with `requestAnimationFrame` as the animation driver:

```text
scanStartTime = useRef(performance.now())

Every frame:
  elapsed = (now - scanStartTime) % 24000   // 3 rounds x 8000ms
  scanRound = Math.floor(elapsed / 8000) + 1  // 1, 2, or 3
  scanProgress = (elapsed % 8000) / 8000       // 0.0 -> 1.0
```

Both `scanRound` and `scanProgress` are derived from elapsed time -- no accumulated ticks, no drift when the browser tab is throttled.

## Layer Stack (bottom to top)

| Z-Index | Layer | Content |
|---------|-------|---------|
| z-0 | Layer 1: Dark Grid | Dark background with subtle CSS hex/grid pattern |
| z-[5] | Layer 2: Threat Container | Empty `div` for Prompt 2's WarningCards |
| z-[10] | Layer 3: Frosted Window | `window_background.jpg` with JS-driven `clip-path` |
| z-[20] | Layer 4: Dark Overlay | `bg-black/40` for text readability |
| z-[30] | Layer 5: Scan Line | 2px red glow, positioned via `top: {scanProgress * 100}%` |
| z-[40] | Layer 6: Content | Existing headline, badge, subtext (unchanged) |

## Key Changes from Current Implementation

### 1. Replace CSS `@keyframes` with JS-driven inline styles

The current component uses CSS `animation: xray-reveal 10s` and `animation: xray-line 10s`. These will be replaced with inline `style` props driven by React state:

- **Frosted Window layer:** `style={{ clipPath: \`inset(\${scanProgress * 100}% 0 0 0)\` }}`
- **Scan Line:** `style={{ top: \`\${scanProgress * 100}%\` }}`

This gives us programmatic control over the scan position, which Prompt 2 needs to sync card reveals to the laser position.

### 2. Add the `requestAnimationFrame` loop

```text
useEffect:
  if prefersReducedMotion -> return (no animation)
  scanStartRef = performance.now()
  rafId = requestAnimationFrame(tick)
  
  tick(now):
    elapsed = (now - scanStartRef) % 24000
    setScanProgress((elapsed % 8000) / 8000)
    setScanRound(Math.floor(elapsed / 8000) + 1)
    rafId = requestAnimationFrame(tick)
  
  cleanup: cancelAnimationFrame(rafId)
```

### 3. Add Layer 1: Dark Grid Background

Replace the `warnings_xray.webp` bottom layer with a dark background featuring a subtle CSS grid pattern using `background-image: linear-gradient(...)` repeating lines. This creates the "data/HUD" feel without an image dependency.

### 4. Add Layer 2: Empty Threat Container

An empty `div` at `z-[5]` with `className="absolute inset-0"` -- this is the mount point for Prompt 2's `WarningCard` components. It sits above the dark grid but below the frosted window, so cards are "revealed" as the clip-path unmasks them.

### 5. Mobile: Increase min-height

Change `min-h-[420px] md:min-h-[500px]` to `min-h-[600px]` so the scan line has room to sweep on mobile screens.

### 6. Reduced Motion Support

The `prefers-reduced-motion` check moves from CSS to JS. When active, the `requestAnimationFrame` loop doesn't start, `scanProgress` stays at 0, and the frosted window is shown statically (no clip-path masking).

## Console Logging

During development, the round transitions will log to console:
```
[ScannerHero] Round 1 (progress: 0.00)
[ScannerHero] Round 2 (progress: 0.00)
[ScannerHero] Round 3 (progress: 0.00)
```

This uses a `useEffect` watching `scanRound` to log only on transitions (not every frame).

## Files Changed

| File | Action |
|------|--------|
| `src/components/quote-scanner/QuoteScannerHero.tsx` | Rewrite: replace CSS animation with rAF engine, add 4-layer stack, add scanRound/scanProgress state |

No new files, no new dependencies, no changes to `QuoteScanner.tsx` (layout already correct from previous implementation).

## What This Does NOT Change

- All text content (badge, headline, subtext, CTA) stays identical
- The `ShimmerBadge` import and usage stays identical
- The `ScanSearch` icon stays identical
- The page layout (Hero -> UrgencyTicker -> ScanPipelineStrip) stays identical
- No new dependencies

