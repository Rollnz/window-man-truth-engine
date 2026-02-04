
# Fix Scan Line Image Reveal - Single Synced Strip

## What You Want
A single ~1 inch horizontal strip of the background image that moves **in perfect sync** with the blue scan line, traveling from top to bottom. The rest of the image stays completely invisible - like the scan line is a "window" momentarily revealing what's behind the glass.

## Current Problem
The existing animation uses a complex mask with multiple fade zones and separate timing, causing the image reveal to drift out of sync with the blue scan line.

## Solution

### Technical Approach
I'll sync the image reveal directly with the existing `scanDown` animation by:

1. **Single Narrow Mask**: Create a horizontal band mask that's exactly ~10% of the container height (approximately 55px on a 550px container ≈ 1 inch)

2. **Perfect Sync via Same Keyframes**: Instead of separate `mystery-reveal` keyframes, use the exact same `top` positioning movement as the blue scan line:
   - Start: `top: -10%` (off-screen above)
   - End: `top: 110%` (off-screen below)
   - Same 4s ease-in-out infinite timing

3. **Simpler Implementation**: Position the masked image as a narrow horizontal strip that animates its `top` property, matching the scan line exactly

### Code Changes

**File: `src/components/audit/ScannerHeroWindow.tsx`**

Replace the current mystery-reveal implementation (lines 99-131) with:

```tsx
{/* Mystery Window Image - Revealed by scan line */}
<div className="absolute inset-0 overflow-hidden pointer-events-none">
  <div 
    className="absolute w-full animate-scan-down"
    style={{
      height: '10%', // ~55px strip = approximately 1 inch
      backgroundImage: `url(${windowMysteryImage})`,
      backgroundSize: '100% 1000%', // Scale so full image spans 10x the strip height
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      filter: 'saturate(0.6) brightness(0.55) contrast(1.2)',
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
    }}
  />
</div>
```

This approach:
- Uses the **same `animate-scan-down` class** as the blue scan line (guaranteed perfect sync)
- Creates a 10% tall strip with soft edges via the mask gradient
- Shows the correct portion of the background image at each position
- Removes all custom keyframe animation code (simpler, less error-prone)

### Visual Result
```text
┌─────────────────────────────────────┐
│                                     │  ← Glass pane (dark)
│  ════════════════════════════════   │  ← Blue scan line
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  ← ~1 inch image reveal strip (moves with scan)
│                                     │
│         Hero Text Content           │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

Both the blue line and the image strip move down together as one unit, with the image strip positioned just below/behind the scan line.
