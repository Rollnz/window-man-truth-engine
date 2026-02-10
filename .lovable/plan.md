

# Wire firstName Greeting Badge into SampleReportHeader

## Changes

### 1. `src/components/sample-report/SampleReportHeader.tsx`

- Add `firstName?: string` to `SampleReportHeaderProps` interface
- Destructure `firstName` in the component
- Add safety logic and badge rendering inside the left-side div, after the title spans:

```tsx
const safeFirstName = firstName?.trim().slice(0, 24);
```

Badge markup (inside the existing left-side `flex items-center gap-3` div, after the two title `<span>` elements):

```tsx
{safeFirstName && safeFirstName.length >= 2 && (
  <span className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full hidden sm:inline">
    Hi, {safeFirstName}
  </span>
)}
```

Guards:
- `trim()` strips whitespace junk
- `slice(0, 24)` prevents layout blowups from long names
- `length >= 2` filters one-letter garbage data
- `shrink-0` prevents flex compression against CTAs
- `hidden sm:inline` keeps it desktop-only

### 2. `src/pages/SampleReport.tsx` (line ~120)

Pass the existing `firstNameFromNav` variable (already defined on line 30) to the header:

```tsx
<SampleReportHeader
  firstName={firstNameFromNav}
  onOpenLeadModal={handleOpenLeadModal}
  onOpenPreQuoteModal={handleOpenPreQuoteModal}
/>
```

## What Is NOT Changing

- Page title / H1 -- untouched
- Right-side CTAs layout -- untouched
- PreQuoteLeadModal -- zero edits
- Tracking, submission, routing -- untouched

