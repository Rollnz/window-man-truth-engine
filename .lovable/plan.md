

# Break the Grid: Threat Card Gallery Layout Update

## What's Changing
The Threat Card gallery currently sits inside the same `max-w-3xl` container as the text content (~768px). We'll widen it to break out of that constraint, add generous vertical spacing, increase gaps between cards, and enhance the "floating" depth effect.

## Visual Changes
- **Gallery max-width**: Increase from `max-w-3xl` (~768px) to `max-w-5xl` (~1024px), creating a ~250px wider footprint than the surrounding text
- **Vertical breathing room**: Increase top margin (`mt-12`) and keep bottom margin (`mb-16`) so cards don't crowd the accordion or the quote block
- **Card gaps**: Increase from `gap-6` to `gap-8` (desktop) for more horizontal breathing room
- **Card size**: Bump `max-w-[220px]` to `max-w-[260px]` so cards fill the wider container proportionally
- **Enhanced depth**: Stronger shadow (`shadow-2xl`) at rest, plus the existing hover lift

## Technical Details

### File: `src/components/home/FailurePointsSection.tsx`
One block edit on the Threat Card gallery div (around line 144):

**Current:**
```html
<div className="max-w-3xl mx-auto mb-16 grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
```

**Updated to:**
```html
<div className="max-w-5xl mx-auto mt-12 mb-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 justify-items-center">
```

And each card image class changes from:
```
max-w-[220px] ... shadow-xl -translate-y-2
```
to:
```
max-w-[260px] ... shadow-2xl -translate-y-3
```

No new files, no new components, no new dependencies. Just two class string updates in the existing file.
