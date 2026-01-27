

# Fix Skeleton forwardRef Warning + Magic Link Error Handling

## Overview

This plan addresses two specific issues:
1. **React forwardRef warning** in the `Skeleton` component
2. **Missing user-facing error handling** for magic link authentication failures

---

## Issue 1: Skeleton forwardRef Warning

### Problem
The `Skeleton` component is a function component that receives refs (likely from the `AnalysisSkeleton` component or other parent components), causing React to emit a warning: "Function components cannot be given refs."

### Current Code (`src/components/ui/skeleton.tsx`)
```typescript
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
```

### Solution
Wrap the component with `React.forwardRef` to properly forward refs to the underlying `<div>` element.

### New Code
```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";

export { Skeleton };
```

---

## Issue 2: Magic Link Error Handling

### Problem
When the magic link fails to send (lines 146-150), the error is only logged to the console. Users see no feedback and may be confused about what happened.

### Current Code (`src/components/claim-survival/ClaimVaultSyncButton.tsx`)
```typescript
if (authError) {
  console.error('Magic link error:', authError);
  setIsLoading(false);
  return;
}
```

### Solution
Add proper user-facing error handling using the `toast` function from `@/hooks/use-toast`, with:
1. Import the `toast` function
2. Display a toast notification with the error message
3. Track the error event for analytics

### Changes Required

| Location | Change |
|----------|--------|
| Line 1 | Import `toast` from `@/hooks/use-toast` |
| Lines 146-150 | Add toast notification for auth error |
| Lines 161-163 | Add toast notification for catch block errors |

### New Code for Error Handling

```typescript
// Line 1 - Add import:
import { toast } from '@/hooks/use-toast';

// Lines 146-150 - Replace with:
if (authError) {
  console.error('Magic link error:', authError);
  toast({
    title: "Couldn't send access link",
    description: authError.message || "Please check your email address and try again.",
    variant: "destructive",
  });
  trackEvent('vault_sync_error', {
    source_tool: 'claim-survival-kit',
    error_type: 'magic_link_failed',
    error_message: authError.message,
  });
  setIsLoading(false);
  return;
}

// Lines 161-163 - Replace catch block with:
} catch (err) {
  console.error('Vault sync error:', err);
  toast({
    title: "Something went wrong",
    description: "We couldn't save your analysis. Please try again.",
    variant: "destructive",
  });
  trackEvent('vault_sync_error', {
    source_tool: 'claim-survival-kit',
    error_type: 'sync_failed',
    error_message: err instanceof Error ? err.message : 'Unknown error',
  });
} finally {
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/skeleton.tsx` | Wrap with `React.forwardRef`, add `displayName` |
| `src/components/claim-survival/ClaimVaultSyncButton.tsx` | Add toast import, add error toasts with analytics |

---

## Technical Notes

1. **forwardRef Pattern**: This follows the shadcn/ui convention used in other components like `Button`, `Input`, etc.

2. **Toast Variant**: Using `variant: "destructive"` for error states provides red styling to indicate failure.

3. **Error Tracking**: Added `vault_sync_error` events to GTM for analytics visibility into failure rates.

4. **Error Messages**: The Supabase auth error object includes a `.message` property that provides user-friendly error descriptions (e.g., "Invalid email format").

---

## Expected Outcome

After implementation:
- ✅ No more React forwardRef console warnings
- ✅ Users see red toast notification when magic link fails
- ✅ Users see error toast when sync process fails
- ✅ Error events tracked in GTM for debugging
- ✅ Skeleton component can accept refs from parent components

