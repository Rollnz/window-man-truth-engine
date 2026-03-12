

## Plan: Add Transparent Hand Scanner Image on Mobile

### Changes: 1 file copied, 1 file edited

**1. Copy asset**
- `user-uploads://hand_scannner_transparnet_1.webp` → `src/assets/hero/hand_scanner.webp`

**2. Edit `src/pages/Signup.tsx`**
- Import: `import handScannerImg from "@/assets/hero/hand_scanner.webp";`
- Insert a mobile-only image block at line 416, before the `<div className="space-y-6">` text column:

```tsx
{/* Mobile hero image — hidden on desktop where the right column is visible */}
<div className="flex justify-center lg:hidden col-span-full mb-4">
  <img
    src={handScannerImg}
    alt="Hand holding phone scanning a contractor quote with Window Man AI"
    className="w-72 h-auto drop-shadow-2xl"
    loading="eager"
  />
</div>
```

This image has proper transparency. It will float cleanly over the light page background on mobile viewports (under `lg` breakpoint). On desktop, the right-column card takes over and this image is hidden.

