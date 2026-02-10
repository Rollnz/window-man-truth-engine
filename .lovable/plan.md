

# Replace Static Trust Signal with Rotating Value Proposition Ticker

## What Changes

Replace the static `<p>` element at line 625-637 of `ScanPipelineStrip.tsx` with a new `RotatingValueProp` sub-component that cycles through 7 messages with a fade-out/slide-up/fade-in transition every 3 seconds.

## Messages Array

```typescript
const VALUE_PROPS = [
  { text: "⚠️ {80%} of quotes contain hidden errors. Find yours before you sign." },
  { text: "🔒 100% {Private} Analysis - Your contractor will never know." },
  { text: "💪 Shift the power dynamic. Negotiate with {facts}, not feelings." },
  { text: "🧐 See exactly what your contractor is hoping you won't notice." },
  { text: "🧠 Translates 'Contractor Jargon' into plain English warnings." },
  { text: "⏱️ Faster (and more accurate) than getting a {second opinion}." },
  { text: "⚖️ The only {unbiased}, non-commissioned review in the industry." },
];
```

Keywords wrapped in `{}` markers will be rendered in `hsl(var(--primary))` (brand blue). All other text stays `hsl(var(--muted-foreground))`.

## Animation Approach

- Two new scoped keyframes added to the existing `<style>` block:
  - `sp-vpFadeOut`: opacity 1 -> 0 + translateY(0) -> translateY(-8px) over 300ms
  - `sp-vpFadeIn`: opacity 0 -> 1 + translateY(8px) -> translateY(0) over 300ms
- A `useEffect` with a 3000ms `setInterval` increments a message index
- On each tick: apply fade-out animation, wait 300ms via setTimeout, swap text, apply fade-in animation
- Container has a fixed `minHeight: 40px` so layout never shifts
- Respects `prefers-reduced-motion`: no animation, just instant swap (or show all statically)
- Only starts cycling once `phase >= 3` (after the pipeline sequence completes)

## Component Structure

A new `RotatingValueProp` function component defined inside `ScanPipelineStrip.tsx` (no new file needed). It receives `active: boolean` (mapped to `phase >= 3`) and handles its own interval + animation state.

### Keyword Highlighting

A small helper function `renderHighlighted(text: string)` splits on `{...}` markers and returns spans -- highlighted keywords get `color: hsl(var(--primary)); fontWeight: 600`, rest stays muted.

## Styling

- `textAlign: 'center'`
- `fontSize: 12` (matches current 12px / ~text-xs)
- `color: hsl(var(--muted-foreground))` for base text
- `marginTop: 16` (same as current)
- Fixed height container to prevent layout jump
- Same entrance transition as current (fade in when phase >= 3)

## File Changes

| File | Change |
|---|---|
| `src/components/quote-scanner/ScanPipelineStrip.tsx` | Replace lines 624-637 (the static `<p>`) with the `RotatingValueProp` component call. Add the sub-component definition and two keyframes to the style block. |

No other files change. No new dependencies.

