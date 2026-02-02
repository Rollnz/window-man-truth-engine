
# Fix Plan: React Ref Warning in Sheet Component

## Problem Summary

The Sheet component uses `VisuallyHidden.Root asChild` with Radix Dialog primitives, causing React ref forwarding warnings. While not fatal, these warnings pollute the console and indicate improper component composition.

---

## Root Cause

```text
CURRENT (Broken):
┌─────────────────────────────────────────────────┐
│  VisuallyHidden.Root asChild                    │
│  └── SheetPrimitive.Title (no ref forwarding)   │
│      └── React tries to pass ref → WARNING      │
└─────────────────────────────────────────────────┘
```

The `asChild` prop expects the child to accept a ref, but Radix Dialog primitives like `Title` and `Description` don't forward refs properly in this context.

---

## Solution

Remove the `asChild` prop from `VisuallyHidden.Root`. The component will still provide accessibility benefits (hidden from visual UI but available to screen readers) without the ref conflict.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/sheet.tsx` | Remove `asChild` from VisuallyHidden.Root (lines 75, 78) |
| `src/components/forms/TrustModal.tsx` | Same pattern fix (lines 84, 93, 101, 104) |

---

## Technical Changes

### 1. `src/components/ui/sheet.tsx` (Lines 75-80)

**Before:**
```tsx
<VisuallyHidden.Root asChild>
  <SheetPrimitive.Title>Panel</SheetPrimitive.Title>
</VisuallyHidden.Root>
<VisuallyHidden.Root asChild>
  <SheetPrimitive.Description>Side panel content</SheetPrimitive.Description>
</VisuallyHidden.Root>
```

**After:**
```tsx
<VisuallyHidden.Root>
  <SheetPrimitive.Title>Panel</SheetPrimitive.Title>
</VisuallyHidden.Root>
<VisuallyHidden.Root>
  <SheetPrimitive.Description>Side panel content</SheetPrimitive.Description>
</VisuallyHidden.Root>
```

### 2. `src/components/forms/TrustModal.tsx` (Lines 84-106)

Apply the same fix - remove `asChild` from all `VisuallyHidden.Root` usages:

**Before:**
```tsx
<VisuallyHidden.Root asChild>
  <DialogTitle>Form Modal</DialogTitle>
</VisuallyHidden.Root>
```

**After:**
```tsx
<VisuallyHidden.Root>
  <DialogTitle>Form Modal</DialogTitle>
</VisuallyHidden.Root>
```

---

## Why This Works

| Approach | Behavior |
|----------|----------|
| `asChild` | Merges props to child (requires ref forwarding) |
| No `asChild` | Wraps child in a span (no ref requirement) |

Both approaches achieve the same accessibility goal - the content is visually hidden but announced to screen readers. The non-`asChild` approach simply adds a small wrapper element, which has no visual or functional impact.

---

## Verification

After applying fixes:
1. Console should be free of ref warnings
2. Sheet/Dialog accessibility remains functional (test with screen reader)
3. No visual changes to any UI

---

## Risk Assessment

| Area | Risk | Notes |
|------|------|-------|
| Breaking changes | None | No API or behavior change |
| Accessibility | None | Same screen reader behavior |
| Visual | None | Hidden elements remain hidden |
| Test impact | None | No test assertions on implementation details |
