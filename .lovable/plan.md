
# Add Window Man Office Image Between "We Work for Homeowners" and "Radical Transparency"

## What Changes

### 1. Copy the uploaded image into the project
Copy `user-uploads://windowman_office.webp` to `src/assets/windowman-office.webp` so it can be imported as an ES6 module for proper bundling and optimization.

### 2. Insert the image in `WhoIsWindowManSection.tsx`

Place the image between lines 127 ("We work for homeowners.") and 129 (the "RADICAL TRANSPARENCY" card), wrapped in the existing `AnimateOnScroll` component with a slide-up animation.

The image block will:
- Use `AnimateOnScroll` with `direction="up"` and a ~500ms duration for the slide-up entrance
- Apply `loading="lazy"` and `decoding="async"` for performance (matching the project's lazy-load standard)
- Include explicit `width`/`height` attributes to prevent CLS (Cumulative Layout Shift)
- Be centered with `max-w-2xl mx-auto` and rounded corners with a subtle border/shadow for visual polish
- Have a descriptive `alt` tag for accessibility
- Add vertical spacing (`my-10`) to breathe between the text and the Radical Transparency section

### Improvements Beyond the Basic Addition
- A subtle caption below the image: "Your advocate. Not your salesman." to reinforce the messaging
- A soft gradient overlay at the bottom edge of the image for seamless blending into the section background
- `will-change` cleanup after animation completes (handled automatically by `AnimateOnScroll`)

## File Changes

| File | Change |
|------|--------|
| `src/assets/windowman-office.webp` | New file (copied from upload) |
| `src/components/home/WhoIsWindowManSection.tsx` | Import image + `AnimateOnScroll`, insert image block between lines 127-128 |

## Technical Details

The inserted JSX (after line 127, before the Radical Transparency `div`):

```tsx
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import windowmanOfficeImg from '@/assets/windowman-office.webp';

// ... inside the component, after "We work for homeowners." paragraph:

<AnimateOnScroll direction="up" duration={600} threshold={0.2} className="my-10">
  <div className="max-w-2xl mx-auto">
    <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-lg">
      <img
        src={windowmanOfficeImg}
        alt="Window Man reviewing a quote report at his desk"
        className="w-full h-auto"
        loading="lazy"
        decoding="async"
        width={1456}
        height={816}
      />
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
    <p className="text-center text-sm text-muted-foreground mt-3 italic">
      Your advocate. Not your salesman.
    </p>
  </div>
</AnimateOnScroll>
```
