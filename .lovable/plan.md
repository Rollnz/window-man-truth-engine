

# Data Health Tab - Skeleton Loader UX Polish

## Overview
Replace basic "animate-pulse" loading states with proper shadcn/ui `Skeleton` components using the project's existing `badge-shimmer` animation class for a premium, professional loading experience.

## Current State
The tracking health components use inconsistent loading patterns:
- Basic `<div className="bg-muted animate-pulse">` divs
- No shimmer effect
- Layouts don't match actual content structure

## Implementation Plan

### Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/tracking-health/HealthStatusCard.tsx` | Replace loading state with Skeleton + shimmer |
| `src/components/admin/tracking-health/EMQScoreCard.tsx` | Replace loading state with Skeleton + shimmer |
| `src/components/admin/tracking-health/FixQueueCard.tsx` | Replace loading state with Skeleton + shimmer |
| `src/components/admin/tracking-health/DiagnosticsPanel.tsx` | Replace loading state with Skeleton + shimmer |

---

### 1. HealthStatusCard.tsx

**Before:**
```tsx
<div className="h-8 w-24 bg-muted animate-pulse rounded" />
<div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
```

**After:**
```tsx
import { Skeleton } from '@/components/ui/skeleton';

// In loading state:
<Card className="relative overflow-hidden">
  <CardHeader className="pb-2">
    <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
      <span>System Status</span>
      <Skeleton className="h-4 w-4 rounded-full badge-shimmer" />
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-3 w-3 rounded-full badge-shimmer" />
      <Skeleton className="h-8 w-24 badge-shimmer" />
    </div>
    <Skeleton className="h-4 w-full badge-shimmer" />
    <Skeleton className="h-4 w-3/4 badge-shimmer" />
  </CardContent>
</Card>
```

---

### 2. EMQScoreCard.tsx

**Before:**
```tsx
<div className="h-10 w-20 bg-muted animate-pulse rounded" />
<div className="h-4 w-28 bg-muted animate-pulse rounded mt-2" />
```

**After:**
```tsx
import { Skeleton } from '@/components/ui/skeleton';

// In loading state:
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
      <span>EMQ Score</span>
      <Skeleton className="h-4 w-4 badge-shimmer" />
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="flex items-baseline gap-2">
      <Skeleton className="h-10 w-16 badge-shimmer" />
      <Skeleton className="h-5 w-8 badge-shimmer" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4 badge-shimmer" />
      <Skeleton className="h-4 w-32 badge-shimmer" />
    </div>
    <Skeleton className="h-3 w-40 badge-shimmer" />
  </CardContent>
</Card>
```

---

### 3. FixQueueCard.tsx

**Before:**
```tsx
<div className="h-8 w-20 bg-muted animate-pulse rounded" />
<div className="h-9 w-full bg-muted animate-pulse rounded mt-3" />
```

**After:**
```tsx
import { Skeleton } from '@/components/ui/skeleton';

// In loading state:
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
      <span>Fix Queue</span>
      <Skeleton className="h-4 w-4 badge-shimmer" />
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="flex items-baseline gap-2">
      <Skeleton className="h-8 w-12 badge-shimmer" />
      <Skeleton className="h-4 w-16 badge-shimmer" />
    </div>
    <Skeleton className="h-9 w-full rounded-md badge-shimmer" />
    <div className="flex items-center gap-3">
      <Skeleton className="h-5 w-20 rounded-full badge-shimmer" />
      <Skeleton className="h-4 w-28 badge-shimmer" />
    </div>
  </CardContent>
</Card>
```

---

### 4. DiagnosticsPanel.tsx

**Before:**
```tsx
{[...Array(4)].map((_, i) => (
  <Card key={i}>
    <CardContent className="pt-6">
      <div className="h-6 w-24 bg-muted animate-pulse rounded mb-2" />
      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
    </CardContent>
  </Card>
))}
```

**After:**
```tsx
import { Skeleton } from '@/components/ui/skeleton';

// In loading state:
<div className="space-y-4">
  <div className="flex items-center gap-2">
    <Skeleton className="h-5 w-5 badge-shimmer" />
    <Skeleton className="h-6 w-56 badge-shimmer" />
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 badge-shimmer" />
            <Skeleton className="h-4 w-24 badge-shimmer" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-8 w-16 badge-shimmer" />
            <Skeleton className="h-4 w-4 rounded-full badge-shimmer" />
          </div>
          <Skeleton className="h-3 w-full badge-shimmer" />
        </CardContent>
      </Card>
    ))}
  </div>
  
  {/* Error Rate Bar skeleton */}
  <Card>
    <CardContent className="pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32 badge-shimmer" />
        <Skeleton className="h-5 w-12 rounded-full badge-shimmer" />
      </div>
      <Skeleton className="h-2 w-full badge-shimmer" />
      <Skeleton className="h-3 w-64 badge-shimmer" />
    </CardContent>
  </Card>
</div>
```

---

## Visual Comparison

```text
BEFORE                          AFTER
┌─────────────────────┐        ┌─────────────────────┐
│ System Status   🔄  │        │ System Status  ▓░░░ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓       │        │ ● ▓▓▓▓▓▓▓▓▓░░░░░░░ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │        │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ │
│                     │        │ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░ │
└─────────────────────┘        └─────────────────────┘
     Plain pulse                  Shimmer sweep →
```

## Technical Notes

- Import `Skeleton` from `@/components/ui/skeleton`
- Add `badge-shimmer` class for the sweeping shine animation
- Match skeleton dimensions to actual content for smooth transition
- Keep card structure consistent with loaded state

## Expected Result

| Aspect | Before | After |
|--------|--------|-------|
| Animation | Basic pulse | Premium shimmer sweep |
| Layout match | Rough | Exact content structure |
| Transition | Jarring | Smooth reveal |
| Professionalism | Basic | Premium feel |

