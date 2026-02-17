

# Add More Spacing Between Pipeline and Rotating Value Props

## Change

In `src/components/quote-scanner/ScanPipelineStrip.tsx`, add a top margin to the `RotatingValueProp` call at line 965 by wrapping it in a div with `mt-10 md:mt-14` (40px mobile / 56px desktop). This creates clear visual separation between the pipeline cards and the rotating benefit text without touching any other component.

### File: `src/components/quote-scanner/ScanPipelineStrip.tsx`

**Line 965** -- wrap the existing call:

```tsx
// Before
<RotatingValueProp active={visible} />

// After
<div className="mt-10 md:mt-14">
  <RotatingValueProp active={visible} />
</div>
```

### What does NOT change
- The `RotatingValueProp` component itself (no internal edits)
- Pipeline cards, connectors, animations
- Mobile or desktop layout of the strip

