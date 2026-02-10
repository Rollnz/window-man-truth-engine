

# Refactor "Scan Your Quote" CTA with Analytics Tracking

## What and Why

The current button inside the Bad Contract card has no analytics tracking. When moved to a standalone CTA below the comparison grid, we need to know *which* pitch motivated the scan (hero vs. red-flags section). This is critical CRO data.

## Changes (Single File)

**File:** `src/components/quote-scanner/QuoteSafetyChecklist.tsx`

### 1. Remove CTA from Bad Contract card (lines 293-307)

Delete the `<div className="p-4 pt-0">` block containing the current button inside the Bad Contract column.

### 2. Create tracked click handler

Add a new `handleRedFlagsCTAClick` function next to the existing `handleScrollToUpload`:

```tsx
const handleRedFlagsCTAClick = () => {
  // 1. Fire GTM analytics event (existing trackEvent pattern)
  trackEvent('cta_click', {
    location: 'red_flags_section',
    destination: 'scanner',
    cta_label: 'Scan Your Quote for Red Flags',
  });

  // 2. Scroll to scanner upload zone
  handleScrollToUpload();
};
```

This uses the already-imported `trackEvent` from `@/lib/gtm` (line 31).

### 3. Add standalone CTA below the grid (after line 399)

Insert a centered button block between the grid closing `</div>` and the container closing `</div>`:

```tsx
{/* Section CTA - Below both columns */}
<div className="flex justify-center mt-10">
  <Button
    onClick={handleRedFlagsCTAClick}
    data-id="cta-red-flags-section"
    size="lg"
    className={cn(
      "gap-2 px-8 py-6 text-base font-bold",
      "bg-rose-600 text-white hover:bg-rose-700 border-0",
      "shadow-lg hover:shadow-xl",
      "dark:bg-rose-500 dark:hover:bg-rose-400",
      "dark:shadow-[0_0_20px_rgba(244,63,94,0.3)]",
      "transition-all duration-200"
    )}
  >
    <Upload className="w-5 h-5" />
    Scan Your Quote for Red Flags
  </Button>
</div>
```

### What gets tracked

| Field | Value | Purpose |
|-------|-------|---------|
| `event` | `cta_click` | Standard GTM event name |
| `location` | `red_flags_section` | Distinguishes from hero CTA |
| `destination` | `scanner` | Where the click leads |
| `cta_label` | `Scan Your Quote for Red Flags` | Exact button text |
| `data-id` | `cta-red-flags-section` | GTM/external script targeting |

This lets you compare conversion rates: "hero CTA" vs. "red flags CTA" in Google Analytics or any GTM-connected platform.

