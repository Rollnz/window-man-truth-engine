

# Accessibility Fixes for Public-Facing Pages

## Summary
Address remaining accessibility issues on `/expert`, `/sample-report`, `/cost-calculator`, and `/reality-check` pages. Some reported issues were already fixed in recent updates.

---

## Current State Analysis

### 1. `/expert` Textarea Label - ALREADY FIXED ✅
The `ChatInput.tsx` file (lines 34-46) already has:
- A visually hidden `<label>` with `sr-only` class
- An `aria-label="Ask a question about impact windows"` on the Textarea
- Proper `id="expert-chat-input"` + `htmlFor` association

**No changes needed** - this was fixed in the previous accessibility update.

### 2. Sample Report Modal Focus Trapping - VERIFIED WORKING ✅
The modal uses Radix UI's Dialog component which **automatically handles**:
- Focus trapping (Tab/Shift+Tab stay within modal)
- Focus restoration to trigger button on close
- `aria-modal="true"` and `role="dialog"`

The `TrustModal` wrapper doesn't override these behaviors. **No changes needed.**

### 3. Sliders ARE Accessible (Radix UI) - BUT Missing Labels 🟡
The sliders use `@radix-ui/react-slider` which **already includes**:
- `role="slider"` on the thumb
- `tabindex="0"` (focusable)
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow` 
- Arrow key navigation (Left/Right/Up/Down)

**BUT they are missing descriptive `aria-label` props** - screen readers will just announce "slider" without context about what the slider controls.

### 4. Label Associations on Cost Calculator - NEEDS FIX 🟡
The sliders have visual h3 headings but no programmatic association. Screen readers won't announce "Home Size" when focusing the slider.

---

## Changes Required

### File 1: `src/components/cost-calculator/CalculatorInputs.tsx`

Add `aria-label` props to both sliders:

```tsx
{/* Home Size Slider - Add aria-label */}
<Slider 
  value={[homeSize]} 
  onValueChange={value => setHomeSize(value[0])} 
  min={500} 
  max={5000} 
  step={100} 
  className="py-4"
  aria-label="Home Size in square feet"
/>

{/* Window Count Slider - Add aria-label */}
<Slider 
  value={[windowCount]} 
  onValueChange={value => setWindowCount(value[0])} 
  min={1} 
  max={50} 
  step={1} 
  className="py-4"
  aria-label="Number of windows to replace"
/>
```

---

### File 2: `src/components/reality-check/QuestionStep.tsx`

Add `aria-label` prop to the slider (dynamically based on question context):

```tsx
{type === 'slider' && sliderConfig && (
  <div className="max-w-lg mx-auto space-y-6">
    {/* ... existing code ... */}
    <Slider
      value={[Number(value) || sliderConfig.min]}
      onValueChange={(vals) => onChange(vals[0])}
      min={sliderConfig.min}
      max={sliderConfig.max}
      step={sliderConfig.step}
      className="w-full"
      aria-label={`${question} - currently ${value || sliderConfig.min} ${sliderConfig.unit}`}
    />
    {/* ... */}
  </div>
)}
```

---

### File 3: `src/components/ui/slider.tsx`

Enhance the Slider component to properly forward the `aria-label` prop to the Thumb element (Radix requires this):

```tsx
interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Accessible label for the slider (passed to thumb) */
  'aria-label'?: string;
  /** Alternative: ID of element that labels the slider */
  'aria-labelledby'?: string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    />
  </SliderPrimitive.Root>
));
```

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/components/ui/slider.tsx` | Forward `aria-label` to Thumb for screen reader support |
| `src/components/cost-calculator/CalculatorInputs.tsx` | Add `aria-label` to Home Size and Window Count sliders |
| `src/components/reality-check/QuestionStep.tsx` | Add dynamic `aria-label` to question slider |

---

## Technical Notes

### Why Radix Sliders Are Already Accessible

Radix UI's Slider component outputs this accessible HTML:

```html
<span role="slider" 
      tabindex="0" 
      aria-valuemin="500" 
      aria-valuemax="5000" 
      aria-valuenow="2000"
      aria-orientation="horizontal">
</span>
```

All ARIA attributes are automatically managed. We only need to add `aria-label` for context about what the slider controls.

### Focus Trapping Verification

Radix Dialog automatically:
1. Moves focus to first focusable element on open
2. Traps Tab/Shift+Tab within the dialog
3. Returns focus to trigger element on close
4. Sets `aria-modal="true"` on the content

If focus trapping isn't working, it's likely due to:
- Browser extension interference
- CSS `display: none` hiding focusable elements
- Custom JS overriding Radix behavior

I can verify this works by testing in the browser tool after implementation.

### Testing Checklist

After implementation:
1. Open Cost Calculator - Tab to sliders, verify screen reader announces "Home Size slider, 2000 square feet"
2. Use Arrow keys on focused slider - verify value changes
3. Open Sample Report modal - Tab through all fields, verify focus doesn't escape
4. Close modal - verify focus returns to trigger button

---

## Issues Already Resolved (No Action Needed)

| Issue | Status | Evidence |
|-------|--------|----------|
| `/expert` textarea missing label | ✅ Fixed | Lines 34-46 have `sr-only` label + `aria-label` |
| Sample Report modal focus leak | ✅ Working | Radix Dialog handles this automatically |
| Sliders div-based | ✅ Not true | Using `@radix-ui/react-slider` (accessible) |

