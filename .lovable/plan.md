

# Sticky Note Callout Text Color Fix

## Summary
Update the sticky note callouts on the `/audit` page to use explicit, vibrant text colors instead of dynamic theme-based colors.

---

## Current State (Lines 335-340)

```tsx
<AlertTriangle className={cn("w-4 h-4 mt-0.5 flex-shrink-0", callout.textColor)} />
<div>
  <p className={cn("font-bold text-sm", callout.textColor)}>{callout.title}</p>
  <p className={cn("text-xs mt-1 leading-tight text-black", callout.textColor)}>
    {callout.text}
  </p>
</div>
```

**Problem**: The `callout.textColor` (e.g., `text-amber-900`) creates muted, less vibrant text.

---

## Changes Required

### File: `src/components/audit/UploadZoneXRay.tsx`

| Element | Current | New |
|---------|---------|-----|
| Header (`callout.title`) | `cn("font-bold text-sm", callout.textColor)` | `"font-bold text-sm text-black"` |
| Body (`callout.text`) | `cn("text-xs mt-1 leading-tight text-black", callout.textColor)` | `"text-xs mt-1 leading-tight text-slate-900"` |
| Icon (AlertTriangle) | `cn("w-4 h-4 mt-0.5 flex-shrink-0", callout.textColor)` | `"w-4 h-4 mt-0.5 flex-shrink-0 text-black"` |

---

## Updated Code

```tsx
<div className="flex items-start gap-2">
  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-black" />
  <div>
    <p className="font-bold text-sm text-black">{callout.title}</p>
    <p className="text-xs mt-1 leading-tight text-slate-900">
      {callout.text}
    </p>
  </div>
</div>
```

---

## Optional Cleanup

The `textColor` property in `XRAY_CALLOUTS` (lines 17, 29, 41) can be removed since it's no longer used. However, keeping it won't cause any issues if you prefer to retain it for potential future use.

---

## Visual Result

| Element | Color | Appearance |
|---------|-------|------------|
| Header | `text-black` (#000) | Bold, high contrast |
| Body | `text-slate-900` (#0f172a) | Clear, slightly softer than pure black |
| Icon | `text-black` (#000) | Matches header for consistency |

All colors will be vibrant against the amber/orange/red sticky note backgrounds.

