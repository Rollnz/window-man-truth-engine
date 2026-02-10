

# Bulletproof Video Section for AI Scanner

## Overview

Enhance the previously approved `ScannerVideoSection` plan with 4 production-grade optimizations: poster image, WebM source, explicit dimensions, and network-aware autoplay.

## New File: `src/components/quote-scanner/ScannerVideoSection.tsx`

### Core behavior (unchanged from prior plan)
- Native `<video>` tag, no third-party JS
- `preload="none"` -- zero bytes downloaded on page load
- IntersectionObserver triggers loading at 25% visibility
- Muted, looping, inline autoplay
- Full-width responsive layout with `aspect-video`

### Enhancement 1: Poster attribute
- Add a `poster` prop pointing to a WebP still frame hosted on Bunny CDN
- URL: `https://itswindowman-videos.b-cdn.net/scanner-poster.webp`
- Prevents the "black box flash" while video loads its first frame
- You will need to upload a screenshot/first-frame image to Bunny at that path (or change the URL to match your actual poster file)

### Enhancement 2: WebM + MP4 dual source
- Use `<source>` children instead of a single `src` attribute
- WebM first (30-50% smaller on Chrome/Edge/Firefox), MP4 fallback for Safari

```text
<video poster="..." ...>
  <source src="https://itswindowman-videos.b-cdn.net/Windowmanscanner.webm" type="video/webm" />
  <source src="https://itswindowman-videos.b-cdn.net/Windowmanscanner.mp4" type="video/mp4" />
</video>
```

- You will need to create/upload the `.webm` version to Bunny CDN. If unavailable at launch, the component gracefully falls back to MP4 only.

### Enhancement 3: Explicit width/height
- Add `width={1920}` and `height={1080}` to the `<video>` element
- Gives the browser an intrinsic aspect ratio before CSS loads, eliminating CLS

### Enhancement 4: Network-aware autoplay
- Inside the IntersectionObserver callback, check `navigator.connection?.saveData`
- If Data Saver is active: skip autoplay, show poster image with a centered play button overlay
- On play button click: call `video.play()` manually
- Also respects `prefers-reduced-motion` (existing plan item)

### Component structure

```text
ScannerVideoSection
  |-- useRef<HTMLVideoElement> for video control
  |-- useRef<HTMLDivElement> for observer target
  |-- useState<boolean> showPlayButton (true when data-saver or reduced-motion)
  |-- useEffect: IntersectionObserver
  |     |-- threshold: 0.25
  |     |-- on intersect:
  |           |-- check saveData -> if true, show play button, return
  |           |-- check prefers-reduced-motion -> if true, show play button, return
  |           |-- set video.preload = "auto", call video.play()
  |           |-- unobserve
  |-- JSX:
       <section class="py-12 md:py-16">
         <div class="container px-4 text-center mb-8">
           <h2>"See the AI Scanner in Action"</h2>
           <p>subtext</p>
         </div>
         <div ref={wrapperRef} class="w-full px-4 md:px-8 lg:px-16">
           <div class="relative rounded-xl overflow-hidden">
             <video
               ref={videoRef}
               poster="...scanner-poster.webp"
               width={1920}
               height={1080}
               muted loop playsInline
               preload="none"
               class="w-full aspect-video object-cover"
               aria-label="AI Quote Scanner demonstration video"
             >
               <source src="...Windowmanscanner.webm" type="video/webm" />
               <source src="...Windowmanscanner.mp4" type="video/mp4" />
             </video>
             {showPlayButton && <PlayButtonOverlay onClick={handlePlay} />}
           </div>
         </div>
       </section>
```

The play button overlay is a simple centered circle with a Play icon from lucide-react, semi-transparent background, `cursor-pointer`, and `hover:scale-110`.

## Changes to `src/pages/QuoteScanner.tsx`

- Import `ScannerVideoSection`
- Place it between line 193 (end of upload/results section) and line 195 (Vault Pivot section)

```text
  </section>  {/* upload/results grid */}

  <ScannerVideoSection />

  {/* Vault Pivot Conversion Engine */}
  <section className="py-8 md:py-12">
    <SoftInterceptionAnchor />
```

## Pre-requisites (action items for you)

1. **Poster image**: Upload a WebP screenshot of the video's first frame to Bunny CDN at `https://itswindowman-videos.b-cdn.net/scanner-poster.webp` (or provide the actual URL so we can update the component)
2. **WebM version**: Convert and upload the video as WebM to Bunny CDN at `https://itswindowman-videos.b-cdn.net/Windowmanscanner.webm`. If not available yet, the component will fall back to MP4 only -- no errors.

## What Does NOT Change

- No existing components modified (except one import + JSX line in QuoteScanner.tsx)
- No new npm dependencies
- Zero impact on initial page load (preload="none" + lazy observer)
- No tracking events added (can be layered on later)

