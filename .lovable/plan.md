

# Add Image Parallax to Signup3 Hero (Matching Signup2)

## What Changes

Wrap the hero background image in a parallax container that moves on `mousemove`, exactly like Signup2 does with its background photo.

### Current Signup3 Hero Layers (top to bottom):
1. Radial gradient overlay (fixed)
2. Glow spot (fixed)
3. Grid pattern (parallax -- moves on mouse)
4. Hero image (STATIC -- no movement)
5. Dark terminal background

### Updated Signup3 Hero Layers:
1. Radial gradient overlay (fixed)
2. Glow spot (fixed)
3. Grid pattern (parallax -- moves on mouse, keep as-is)
4. **Hero image (parallax -- moves on mouse, NEW)**
5. Dark terminal background

## Technical Details

### File: `src/pages/Signup3.tsx`

**Change 1 -- Wrap the hero `<img>` in a parallax container:**

Replace the static image:
```tsx
<img src={heroImage} ... style={{ opacity: 0.3 }} />
```

With a parallax wrapper (matching Signup2's pattern):
```tsx
<div
  className="absolute inset-0 pointer-events-none overflow-hidden"
>
  <div
    className="absolute inset-0 will-change-transform"
    style={{
      transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.05)`,
      transition: 'transform 0.7s ease-out',
    }}
  >
    <img
      src={heroImage}
      alt=""
      aria-hidden="true"
      className="w-full h-full object-cover"
      style={{ opacity: 0.3 }}
    />
  </div>
</div>
```

Key details matching Signup2:
- `scale(1.05)` prevents edges from showing during translation
- `transition: transform 0.7s ease-out` for the slow cinematic drift (vs the grid's snappy 0.15s)
- Uses the same `mousePos` state already computed by `handleMouseMove`

**No other changes.** The grid parallax stays as-is (fast 0.15s). The image parallax adds the slower cinematic layer underneath. All colors, layout, and animations remain untouched.

### Files Modified

| File | Action |
|------|--------|
| `src/pages/Signup3.tsx` | **Edit** -- wrap hero image in parallax container |

No new dependencies or routes.

