

## Updated Plan: Desktop Hero Image with Tight, Overlapping Layout

### Changes to `src/pages/Signup.tsx`

**1. Remove the mobile-only image wrapper** (lines 430-438) — the image will now live in the right column for all viewports.

**2. Replace the standalone Card (lines 466-476)** with a new right-column container:

```tsx
{/* Right column: image + value prop as one cohesive module */}
<div className="flex flex-col items-center gap-0">
  {/* Scanner image — height-constrained on desktop */}
  <div className="relative z-10 -mb-6">
    <img
      src={handScannerImg}
      alt="Hand holding phone scanning a contractor quote with Window Man AI"
      className="w-72 lg:w-80 max-h-[300px] object-contain drop-shadow-2xl"
      loading="eager"
    />
  </div>

  {/* What you'll get card — overlapped by image */}
  <Card className="p-6 pt-10 space-y-3 border-border/40 w-full">
    <h3 className="font-semibold text-lg">What you'll get</h3>
    <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-4">
      <li>Final grade (A− to F) + pillar scores</li>
      <li>Hidden fees, commission traps, and scope omissions</li>
      <li>Negotiation bullets tailored to your quote</li>
    </ul>
    <p className="text-xs text-muted-foreground pt-2">
      Security-first Vault access. Email + phone verification required to unlock results.
    </p>
  </Card>
</div>
```

**Key details:**
- `max-h-[300px]` + `object-contain` — image never exceeds 300px tall, preserving fold visibility
- `-mb-6` on the image wrapper — pulls the card up so the image overlaps its top edge (premium overlap effect)
- `pt-10` on the Card — adds padding so card content isn't hidden behind the overlapping image
- `z-10` on image — ensures it layers above the card border
- `gap-0` on the flex container — image and card sit flush, with overlap controlled by negative margin
- Image visible on all viewports (no `lg:hidden`), responsive width via `w-72 lg:w-80`

### Files

| File | Action |
|---|---|
| `src/pages/Signup.tsx` | Edit (lines 430-476) |

