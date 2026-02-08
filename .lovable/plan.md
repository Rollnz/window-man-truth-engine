

# Fix: StatusBadge Crash — Mismatched Lead Quality Values

## Problem Summary

The `/admin/leads` page crashes because the `QualityBadge` component receives `lead_quality` values from the database that aren't mapped in the TypeScript configuration.

**Database values:** `window_shopper` (52), `curious` (9), `qualified` (9), `engaged` (2), `hot` (1)

**TypeScript config:** Only maps `cold`, `warm`, `hot`, `qualified`

When the component receives an unmapped value like `"window_shopper"`, it crashes trying to access `.color` on `undefined`.

---

## Solution

Update `src/types/crm.ts` and `src/components/crm/StatusBadge.tsx` to:

1. Add missing quality values to the TypeScript type and config
2. Add a defensive fallback in the badge component to prevent crashes on unknown values

---

## Implementation Details

### Step 1: Update `src/types/crm.ts`

Expand `LeadQuality` type and `LEAD_QUALITY_CONFIG` to include all database values:

```typescript
// Before
export type LeadQuality = "cold" | "warm" | "hot" | "qualified";

// After
export type LeadQuality = 
  | "cold" 
  | "warm" 
  | "hot" 
  | "qualified"
  | "window_shopper"  // Low intent browser
  | "curious"         // Medium interest
  | "engaged";        // Active but not yet qualified
```

Add new entries to `LEAD_QUALITY_CONFIG`:

```typescript
export const LEAD_QUALITY_CONFIG: Record<LeadQuality, { label: string; color: string }> = {
  cold: { label: "Cold", color: "bg-blue-100 text-blue-800" },
  warm: { label: "Warm", color: "bg-amber-100 text-amber-800" },
  hot: { label: "Hot", color: "bg-orange-100 text-orange-800" },
  qualified: { label: "Qualified", color: "bg-green-100 text-green-800" },
  // New values from database
  window_shopper: { label: "Window Shopper", color: "bg-slate-100 text-slate-600" },
  curious: { label: "Curious", color: "bg-sky-100 text-sky-700" },
  engaged: { label: "Engaged", color: "bg-purple-100 text-purple-700" },
};
```

### Step 2: Add Defensive Fallback in `StatusBadge.tsx`

Even with the config updated, add a fallback to prevent future crashes from unknown values:

```typescript
// QualityBadge component - add safe fallback
export const QualityBadge = forwardRef<HTMLSpanElement, QualityBadgeProps>(
  ({ quality, size = 'sm' }, ref) => {
    // Defensive fallback for unknown quality values
    const config = LEAD_QUALITY_CONFIG[quality] ?? {
      label: quality || 'Unknown',
      color: 'bg-gray-100 text-gray-600',
    };
    
    return (
      <span 
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          config.color,
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        )}
      >
        {config.label}
      </span>
    );
  }
);
```

### Step 3: Add Same Fallback to `StatusBadge`

Apply the same defensive pattern to `StatusBadge` for `status` values:

```typescript
export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, size = 'sm' }, ref) => {
    // Defensive fallback for unknown status values
    const config = LEAD_STATUS_CONFIG[status] ?? {
      title: status || 'Unknown',
      color: 'bg-gray-500',
      description: 'Unknown status',
    };
    
    return (
      <span 
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          config.color,
          'text-white',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        )}
      >
        {config.title}
      </span>
    );
  }
);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/types/crm.ts` | Add `window_shopper`, `curious`, `engaged` to `LeadQuality` type and `LEAD_QUALITY_CONFIG` |
| `src/components/crm/StatusBadge.tsx` | Add defensive fallback (nullish coalescing) to both badge components |

---

## Expected Result

After this fix:
- The `/admin/leads` page will load without crashing
- All existing quality values will display with appropriate colors
- Future unknown values will gracefully show a gray "Unknown" badge instead of crashing

