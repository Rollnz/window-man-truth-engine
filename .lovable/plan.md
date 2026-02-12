

# Make Video Container Fully Clickable for Mute Toggle

## What Changes

**File:** `src/components/quote-scanner/ScannerVideoSection.tsx`

### 1. Remove the standalone mute button
Delete the `<button>` element at lines 100-106 that currently handles mute toggling.

### 2. Make the entire video container clickable
Add an `onClick={toggleMute}` handler to the `<div className="relative rounded-xl overflow-hidden">` wrapper (line 83), along with `cursor-pointer` styling. This makes the full video area a tap/click target on both mobile and desktop.

### 3. Keep corner icon as a visual indicator (non-interactive)
Replace the old button with a passive `<div>` in the bottom-right corner showing the VolumeX/Volume2 icon. It will have:
- `pointer-events-none` so it doesn't intercept clicks
- Semi-transparent dark background pill for visibility over any video frame

### 4. Add a center flash indicator on toggle (UX enhancement)
When the user taps anywhere on the video:
- A large mute/unmute icon briefly appears in the center of the video
- It fades out after ~600ms using a CSS opacity transition
- This mimics the familiar YouTube/TikTok feedback pattern and eliminates confusion about whether a tap registered

### Technical Details

- New state: `showFlash` (boolean) + a `setTimeout` to clear it after 600ms
- The flash icon uses `absolute inset-0 flex items-center justify-center` with a fading `opacity` transition
- The `PlayButtonOverlay` click handler will use `e.stopPropagation()` to prevent the mute toggle from firing when clicking the play button (they share the same container)
- No layout shift -- all additions are absolutely positioned overlays
- Accessibility: the clickable container gets `role="button"` and a dynamic `aria-label`

