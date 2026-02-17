

# Add "Contractor Sales Tactics" Image to Sales Tactics Guide Hero

## What Changes (User Perspective)

The red circular placeholder with a Target icon in the hero section gets replaced with the uploaded "Contractor Sales Tactics" brain image. The two overlay badges ("Contractor Playbook" pill and "Includes 11 Named Tactics" callout) stay exactly where they are. The image loads efficiently with lazy loading and proper optimization attributes.

## Why This Is the Best Plan

1. **Minimal change, maximum impact.** Only one file is edited (SalesTacticsGuide.tsx) and one asset is copied. The overlays already look great -- we keep them untouched.
2. **No layout breakage.** The current box uses a fixed `w-64 sm:w-80 h-80` div with a gradient background and a centered icon. We replace the gradient div with an `<img>` tag inside the same container, using `object-cover` to fill the space. The rounded corners and card border stay intact.
3. **Aspect-ratio friendly.** The uploaded image is roughly 4:3. The current box is taller than wide (80x80 rem area inside a w-80 container). We adjust to `aspect-[4/3]` and let width drive height naturally, so the image isn't cropped awkwardly. The overlays remain absolutely positioned relative to the parent.
4. **Performance.** The image is below-the-fold on mobile (the text column stacks first), so `loading="lazy"` is correct. We add `decoding="async"` and explicit `width`/`height` attributes to prevent layout shift (CLS).
5. **Asset in `public/`.** Since this is a static content image (not a React component asset), placing it in `public/images/` follows the existing pattern used by other guide pages (`claim-kit-book.webp`, `defense-kit-book.webp`, etc.) and avoids unnecessary bundling.

## Technical Changes

### Step 1: Copy the uploaded image

Copy `user-uploads://sales_tactics.webp` to `public/images/sales-tactics-brain.webp`

This follows the existing naming convention in `public/images/`.

### Step 2: Edit `src/pages/SalesTacticsGuide.tsx`

**Replace lines 106-109** (the gradient placeholder div):

Current:
```tsx
<div className="relative bg-card rounded-xl shadow-2xl p-2 border border-border">
  <div className="w-64 sm:w-80 h-80 bg-gradient-to-br from-destructive/20 to-primary/20 rounded-lg flex items-center justify-center">
    <Target className="w-24 h-24 text-destructive/50" />
  </div>
```

New:
```tsx
<div className="relative bg-card rounded-xl shadow-2xl p-2 border border-border">
  <img
    src="/images/sales-tactics-brain.webp"
    alt="Contractor sales tactics brain map showing price inflation, fear-based upselling, and psychological pressure points"
    className="w-64 sm:w-80 aspect-[4/3] object-cover rounded-lg"
    loading="lazy"
    decoding="async"
    width={640}
    height={480}
  />
```

**What stays the same:**
- The "Contractor Playbook" red pill badge (lines 111-114) -- unchanged
- The "Includes 11 Named Tactics" bottom-left callout (lines 117-120) -- unchanged
- The blurred red background glow (line 103) -- unchanged
- The outer positioning wrapper -- unchanged

**What's removed:**
- The `Target` icon import can stay (it's still used in Section 3), so no import changes needed.
- The gradient placeholder div and centered icon are replaced by the image.

### Summary

| Item | Detail |
|------|--------|
| Files modified | 1 (`src/pages/SalesTacticsGuide.tsx`) |
| Assets added | 1 (`public/images/sales-tactics-brain.webp`) |
| Lines changed | 4 (replace gradient div + icon with img tag) |
| Overlays affected | None -- both kept as-is |
| Performance | `loading="lazy"`, `decoding="async"`, explicit dimensions for CLS prevention |

