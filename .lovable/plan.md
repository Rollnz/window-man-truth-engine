

## Add Background Scanning Video to "X-Ray Vision for Your Wallet" Section

### What Changes

Modify `src/components/audit/HowItWorksXRay.tsx` to add a full-bleed looping video behind the entire section. The video will be heavily blurred and darkened so the foreground content remains crisp and readable.

### How It Works

- A `<video>` element is placed inside the existing background `div` (lines 47-50), sitting behind the gradient blobs
- The video uses `preload="none"` and an `IntersectionObserver` (threshold 0.25) to begin playback only when the section scrolls into view -- identical pattern to the existing `ScannerVideoSection`
- Heavy blur (`blur-[24px]`) plus a dark overlay (`bg-slate-950/70`) ensure text contrast is unaffected
- `prefers-reduced-motion` check: if enabled, the video never loads or plays -- the current static gradient blobs remain as the sole background
- Video pauses when scrolled out of view (IntersectionObserver disconnect pattern)
- `muted`, `loop`, `playsInline` attributes for silent autoplay compliance on all browsers

### Technical Details

**File:** `src/components/audit/HowItWorksXRay.tsx`

1. Add `useRef`, `useState`, `useEffect` imports from React
2. Add a `videoRef` and a `sectionRef`
3. Add a `useEffect` that:
   - Checks `prefers-reduced-motion` -- if true, skips everything
   - Creates an `IntersectionObserver` on the section
   - On intersection: sets `video.preload = 'auto'` then calls `video.play()` (with `.catch()` fallback)
   - On exit: calls `video.pause()`
4. Insert a `<video>` element inside the existing background `div`:
   - Source: `https://itswindowman-videos.b-cdn.net/window_estimate_ai_scan_animated.mp4`
   - Classes: `absolute inset-0 w-full h-full object-cover blur-[24px] scale-110 opacity-30`
   - The `scale-110` prevents blur edge artifacts from showing
   - A sibling overlay `div` with `bg-slate-950/70` darkens the video further
5. Existing gradient blobs remain on top of the video layer for added depth
6. All foreground content stays at `relative z-10` (already the case via the `container relative` div)

**No other files are modified.** No new dependencies. No performance regression -- the video is lazy-loaded, paused when off-screen, and skipped entirely for reduced-motion users.

