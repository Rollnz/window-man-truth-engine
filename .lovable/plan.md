

# Multi-Color Border Beam Upgrade

## Summary

Replace the current single-color orange border beam with a multi-color beam that shifts through orange, amber, and gold as it travels around the button perimeter.

## File Changes

### `src/components/sample-report/LeverageOptionsSection.tsx`

**Single change**: Update the `conic-gradient` in the spinning overlay div (around line 82) to include a wider color spectrum:

Current:
```css
conic-gradient(from 0deg, transparent 0%, transparent 70%, #D97706 80%, #F59E0B 85%, #D97706 90%, transparent 100%)
```

New:
```css
conic-gradient(from 0deg, transparent 0%, transparent 65%, #D97706 72%, #F59E0B 78%, #EAB308 82%, #F59E0B 86%, #D97706 92%, transparent 100%)
```

This creates a beam that fades from deep orange to bright amber to gold and back, giving a richer "living energy" feel while staying within the warm color family established by the theme.

## No Other Changes

- No new files, dependencies, or database changes
- Keyframe animation name and speed unchanged
- Button styling, contrast, and accessibility unchanged
- All other components untouched

