

# Animate the Hero Score Card on the Sample Report Page

## What Changes

The right-side "Quote Safety Score / SAMPLE" card in `HeroSection.tsx` currently renders with static, pre-filled values. We will add the same animation treatment as `ScoreboardSection`:

1. **Score counter**: The "62" counts up from 0 to 62 on mount using requestAnimationFrame (same pattern as `AnimatedScore` in ScoreboardSection)
2. **SVG ring fill**: The circular progress ring animates from empty to 62% using a CSS transition on `strokeDashoffset`
3. **Pillar bars stagger**: Each of the 5 bars in `PreviewBars` starts at 0% width and fills to its target with a staggered delay (50ms between each)

## Why It Works for CRO

- Animated elements draw the eye to the score card, reinforcing the "your quote could look like this" message
- Motion creates a sense of the AI "calculating" -- builds perceived value before the user even scrolls
- Matches the ScoreboardSection animation language, so the page feels cohesive

## Zero Performance Impact

- No IntersectionObserver needed (hero is always in viewport on load)
- Animations trigger on mount via a simple `useEffect(() => setIsVisible(true), [])`
- Uses CSS transitions for bars and ring (GPU-accelerated), rAF for the number counter
- No new dependencies

## Technical Changes

### File: `src/components/sample-report/HeroSection.tsx`

**1. Add mount-triggered visibility state**

Inside `HeroSection`, add:
```tsx
const [isVisible, setIsVisible] = useState(false);
useEffect(() => { setIsVisible(true); }, []);
```

**2. Animate the score number**

Replace the static `<span className="text-3xl font-bold">62</span>` with an inline animated counter (same rAF pattern as ScoreboardSection's `AnimatedScore`):
- Counts from 0 to 62 over 1500ms with ease-out cubic
- Triggered when `isVisible` becomes true

**3. Animate the SVG ring**

Currently the ring's `strokeDasharray` is pre-calculated. Change it to:
- Start with full dashoffset (empty ring)
- Transition to the 62% offset when `isVisible` is true
- Add `transition-all duration-[1500ms] ease-out` class

**4. Animate the PreviewBars**

Update the `PreviewBars` component to accept an `isVisible` prop:
- Bars start at `width: 0%`
- Transition to their target width with `transition-all duration-700`
- Each bar gets a staggered `transitionDelay` (e.g., 0ms, 100ms, 200ms, 300ms, 400ms)
- Pillar score numbers also count up (reuse the same rAF pattern)

### No other files change.

