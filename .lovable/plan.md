

# Add Sound Toggle to Scanner Video Section

## Problem

The video is intentionally muted for autoplay compliance (browsers block autoplay with sound). To allow users to hear audio, we need a mute/unmute toggle -- we cannot simply remove `muted` or autoplay will break.

## Changes to `src/components/quote-scanner/ScannerVideoSection.tsx`

### Add mute/unmute toggle button
- Add a `useState<boolean>` for `isMuted`, defaulting to `true`
- Render a small speaker icon button in the bottom-right corner of the video container
- Use `Volume2` (unmuted) and `VolumeX` (muted) icons from lucide-react
- On click, toggle `videoRef.current.muted` and update state
- Styling: `absolute bottom-4 right-4 z-10` with a semi-transparent dark background (`bg-black/50 hover:bg-black/70`), rounded-full, white icon, smooth transition

### Behavior
- Video still starts muted (required for autoplay)
- User taps the speaker icon to hear audio
- Icon swaps between VolumeX (muted) and Volume2 (unmuted)
- State persists during the session but resets on page reload

### No other files change

