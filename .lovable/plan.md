

# Audit: "Run Analysis" Feature -- Fix Console Warnings

## Status: Core Feature Is Working

After a thorough code audit and edge function log review, the entire "Run Analysis" pipeline is functioning correctly end-to-end:

- The AI extraction uses tool calling with the correct 5-field schema
- The try/catch writes `failed` to the DB on any error (no silent failures)
- The external link buttons generate signed URLs and open in new tabs
- The Sparkles buttons call `triggerAnalysis(file.id)` per-file
- The RPC accepts `pending` status for admin overrides
- The optimistic UI has rollback + 2-minute timeout synced to DB
- Edge function logs confirm successful analysis runs

## Only Issue: Two React Console Warnings

The console shows "Function components cannot be given refs" warnings from two components. These are cosmetic (no broken functionality) but should be cleaned up.

### Root Cause

Radix UI's `TooltipTrigger` with `asChild` tries to pass a `ref` to its child. Two shadcn components are plain function components without `forwardRef`:

1. **`Badge`** in `src/components/ui/badge.tsx` -- used inside `TooltipTrigger asChild` in `SalesIntelCard.tsx`
2. **`Tooltip`** in `src/components/ui/tooltip.tsx` -- the `Tooltip` wrapper is a plain function, not a `forwardRef` component

### Fix

| # | File | Change |
|---|------|--------|
| 1 | `src/components/ui/badge.tsx` | Wrap `Badge` with `React.forwardRef` |
| 2 | `src/components/ui/tooltip.tsx` | Wrap `Tooltip` with `React.forwardRef` (or add displayName) |

**badge.tsx change:**
```typescript
// Before:
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div ... />;
}

// After:
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} ... />;
  }
);
Badge.displayName = "Badge";
```

**tooltip.tsx change:**
```typescript
// Before:
const Tooltip = ({ delayDuration = 0, ...props }: TooltipProps) => (
  <TooltipPrimitive.Root delayDuration={delayDuration} {...props} />
);

// After (add displayName -- Root doesn't need forwardRef):
const Tooltip = ({ delayDuration = 0, ...props }: TooltipProps) => (
  <TooltipPrimitive.Root delayDuration={delayDuration} {...props} />
);
Tooltip.displayName = "Tooltip";
```

These are the only changes needed. No edge function, hook, or UI logic changes required.

