

# Full-Bleed Threat Card Gallery

## Change
Make the Threat Card gallery span the full width of the viewport, breaking out of the `container` and `max-w` constraints.

## Technical Detail

In `src/components/home/FailurePointsSection.tsx`, the gallery div currently sits inside the `container` div. We need to either:
- Move it outside the container, or
- Use a CSS "break-out" technique with negative margins and `vw` units

The cleanest approach: close the `max-w-3xl` wrapper before the gallery, render the gallery at full width with its own padding, then reopen the wrapper for the closing quote.

Specifically, the gallery div (currently around line 146) changes from:
```
<div className="max-w-5xl mx-auto mt-12 mb-16 grid ...">
```
to a full-bleed break-out using relative positioning and viewport width:
```
<div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen mt-12 mb-16">
  <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 justify-items-center">
```

This makes the gallery stretch edge-to-edge while keeping the cards themselves centered within a generous `max-w-6xl` container. The surrounding text content remains at `max-w-3xl`.

### File modified
- `src/components/home/FailurePointsSection.tsx` — one block edit on the gallery wrapper
