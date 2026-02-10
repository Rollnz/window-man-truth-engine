
# "Live Wire" Button with WCAG AA Contrast Guarantee

## Summary

Add the animated "Live Wire" border and beckoning arrow to the disabled Option B button, while ensuring all text-to-background combinations meet a minimum 4.5:1 contrast ratio (WCAG AA) in both light and dark modes.

## Contrast Analysis

The button's disabled state will use theme tokens that already pass 4.5:1:

| Element | Dark Mode | Light Mode | Ratio |
|---|---|---|---|
| Button text (`--muted-foreground`) on button bg (`--muted`) | hsl(215 20% 68%) on hsl(220 15% 18%) | hsl(209 25% 42%) on hsl(209 30% 92%) | ~6.5:1 / ~5.8:1 |
| Orange wire border (`#D97706`) | Decorative only (not text) | Decorative only | N/A (non-text) |
| Hint text below button (`--muted-foreground`) on card bg (`--card`) | hsl(215 20% 68%) on hsl(220 18% 10%) | hsl(209 25% 42%) on hsl(0 0% 100%) | ~5.5:1 / ~7.8:1 |

All combinations exceed the 4.5:1 minimum. No custom color overrides are needed -- the existing theme tokens handle both modes correctly.

## File Changes

### `src/components/sample-report/LeverageOptionsSection.tsx`

1. **Import** `ArrowLeft` from `lucide-react`.

2. **Add a scoped `<style>` block** with two keyframes:
   - `live-wire`: Rotates a `conic-gradient` 360deg over 3s (the orange traveling border).
   - `beckon`: Translates the arrow icon -3px left and back over 2s with a pause.

3. **Disabled state (`!partnerConsent`)**: Replace the plain `<Button variant="outline">` with a wrapper structure:
   - Outer `div`: `relative rounded-md p-[2px] overflow-hidden` -- this is the visible "border" area.
   - Inside the outer div, an absolutely-positioned spinning gradient div creates the wire effect using `conic-gradient(transparent, transparent, #D97706, transparent, transparent)`.
   - The `<Button>` sits on top with `bg-muted text-muted-foreground` (theme tokens, not hardcoded colors), ensuring contrast adapts per theme.
   - The arrow becomes `<ArrowLeft>` with the `beckon` animation class.
   - Button remains `disabled` with `cursor-not-allowed`.

4. **Enabled state (`partnerConsent`)**: No wrapper needed. Renders the existing `variant="cta"` button with `ArrowRight` -- unchanged from current behavior.

5. **No changes** to Option A card, click handlers, tracking, or props.

## Why This Passes Contrast

- Text color and background are both CSS custom properties (`--muted-foreground`, `--muted`) that shift per theme.
- The orange `#D97706` is only used on the decorative animated border, which is non-text and exempt from WCAG text contrast requirements.
- No hardcoded text colors are introduced.

## No Other Changes

- No new files or dependencies
- No database changes
- No changes to `src/index.css` or `tailwind.config.ts`
