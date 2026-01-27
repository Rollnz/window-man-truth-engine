

# Fix Plan: save-lead `window_count` Integer Conversion Bug

## Problem Identified

The `save-lead` edge function fails with PostgreSQL error `22P02` (invalid input syntax for type integer: "10-15") when **updating** existing leads because the UPDATE path (line 594) passes raw strings directly to the database, bypassing the conversion logic that exists for INSERT operations.

## Technical Root Cause

| Path | Line | Current Code | Behavior |
|------|------|--------------|----------|
| INSERT | 507-520 | Inline IIFE with conversion | Converts `"10-15"` to `12` |
| UPDATE | 594 | `aiContext?.window_count || undefined` | Passes raw string `"10-15"` |

## Fix Implementation

### Step 1: Create Helper Function

Add a reusable helper near the top of the file (after the existing helper functions, around line 230):

```typescript
/**
 * Convert window_count string ranges to midpoint integers
 * Handles: "1-5" -> 3, "5-10" -> 7, "10-15" -> 12, "15+" -> 20
 */
function convertWindowCount(wc: unknown): number | null {
  if (wc === null || wc === undefined) return null;
  if (typeof wc === 'number') return wc;
  if (typeof wc === 'string') {
    if (wc === '15+' || wc === '15-plus') return 20;
    const match = wc.match(/^(\d+)-(\d+)$/);
    if (match) {
      return Math.floor((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2);
    }
    const num = parseInt(wc, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}
```

### Step 2: Fix UPDATE Path (Line 594)

Change from:
```typescript
window_count: aiContext?.window_count || undefined,
```

To:
```typescript
window_count: convertWindowCount(aiContext?.window_count),
```

### Step 3: Simplify INSERT Path (Lines 507-520)

Replace the inline IIFE with the helper:
```typescript
window_count: convertWindowCount(aiContext?.window_count),
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/save-lead/index.ts` | Add helper function + fix UPDATE path + simplify INSERT path |

## Affected Products

All guide modals with multi-step upsell flows that capture window count:
- Kitchen Table Defense Guide (`/kitchen-table-guide`)
- Sales Tactics Decoder (`/sales-tactics-guide`)
- Spec Checklist Guide (`/spec-checklist-guide`)

## Verification Steps

1. Open `/kitchen-table-guide`
2. Submit email form (Step 1: Contact)
3. Accept upsell to continue questionnaire
4. Select a window count range like "10-15"
5. Complete remaining steps (location, etc.)
6. Confirm no 500 error
7. Verify in database: `leads.window_count` should be `12` (not `"10-15"`)

## Risk Assessment

- **Low Risk**: Single-file backend change
- **No Database Migration**: No schema changes needed
- **No Frontend Changes**: Modals remain unchanged
- **Backwards Compatible**: Numeric values still work correctly

