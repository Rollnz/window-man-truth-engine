

# Center Phone Number in Desktop Navigation

## Summary

Move the phone number CTA so it is visually centered in the navbar on desktop (funnel mode pages). Currently it sits in a `div` between the logo and right-side controls, but `justify-between` pushes it off-center. The fix uses `absolute` positioning so the phone number is perfectly centered regardless of left/right content widths.

## What Changes

### File: `src/components/home/Navbar.tsx` (lines 64-74)

**Current:** The funnel-mode phone number is a flex child inside the `justify-between` container, so it lands wherever the remaining space puts it -- not truly centered.

**New:** Apply `absolute left-1/2 -translate-x-1/2` to the phone number wrapper so it centers within the navbar bar regardless of the logo or right-side icon widths. The parent container already has `relative` implicitly from being a positioned flex container, but we will add `relative` explicitly to ensure correctness.

### Changes at a glance

| Line(s) | Change |
|---------|--------|
| 34 | Add `relative` to the inner `div` class so the absolutely-positioned phone number centers within it |
| 64-74 | Replace the funnel-mode phone `div` with an absolutely-centered version: `absolute left-1/2 -translate-x-1/2` |

### Resulting markup (funnel mode, desktop)

```text
<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between relative">
  [Logo - left]

  {funnelMode && (
    <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
      <Button ...>
        <Phone /> (561) 468-5571
      </Button>
    </div>
  )}

  [Theme toggle + vault icon - right]
</div>
```

No changes to mobile layout. Non-funnel mode (nav links) is unaffected.
