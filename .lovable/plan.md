

# Fix: React forwardRef Warning on PageLoader

## Problem
`PageLoader` is defined as a plain arrow function in `src/App.tsx` (line 81). React emits a `forwardRef` warning when it or React Router attempts to forward a ref to this component.

## Solution
Convert `PageLoader` from a plain arrow function to a `forwardRef`-wrapped component, matching the pattern already used elsewhere in the codebase (e.g., `NavLink`, `FloatingEstimateButton`).

## Changes

**File: `src/App.tsx`**

Replace (lines 81-84):
```tsx
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);
```

With:
```tsx
import { forwardRef } from "react";

const PageLoader = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
PageLoader.displayName = "PageLoader";
```

Note: `forwardRef` is not yet imported at the top of `App.tsx`, so it will be added to the existing React import line. The `displayName` assignment follows the project convention seen in all shadcn/ui components.

## Impact
- Silences the console warning
- Zero visual or behavioral change
- Follows existing project patterns

