

# Make "View a Real Sample AI Report" Text 1.5x Larger

## What Changes

The link text "View a Real Sample AI Report" in the Hero section currently uses `text-sm` (0.875rem / 14px). Scaling by 1.5x brings it to ~21px, which maps closest to Tailwind's `text-xl` (1.25rem / 20px) -- the nearest standard step.

### File: `src/components/home/HeroSection.tsx` (line 39)

Change the `<span>` class from `text-sm` to `text-xl`:

**Current:**
```tsx
<span className="border-b border-primary/50 group-hover:border-primary text-sm">
  View a Real Sample AI Report
</span>
```

**New:**
```tsx
<span className="border-b border-primary/50 group-hover:border-primary text-xl">
  View a Real Sample AI Report
</span>
```

## Note

This same link text also appears in two other homepage sections:
- `SecretPlaybookSection.tsx` (as a Button, already styled larger)
- `MarketRealitySection.tsx` (as a Button, already styled larger)

Those two are already full-size CTA buttons, so no change needed there. Only the Hero instance uses `text-sm`.

| File | Change |
|------|--------|
| `src/components/home/HeroSection.tsx` | `text-sm` to `text-xl` on the sample report link span |
