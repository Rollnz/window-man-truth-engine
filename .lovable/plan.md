
# Mobile UX & Responsiveness Update

## Summary
Address touch target sizes, mobile keyboard behavior, font size standards, and sticky header scroll offsets across the site to ensure full mobile accessibility and usability.

---

## Issues Found During Analysis

| Issue | Current State | Required State | Priority |
|-------|--------------|----------------|----------|
| **Slider handles** | `h-5 w-5` (20px) | 44px minimum | 🔴 High |
| **Mobile nav links** | `py-1` (~28px tall) | 44px minimum | 🟡 Medium |
| **Footer link targets** | No padding | 44px minimum | 🟡 Medium |
| **Textarea font size** | `text-sm` (14px) | `text-base` (16px) | 🟡 Medium |
| **Scroll-padding for anchors** | Not set | 70px+ (header height) | 🟡 Medium |
| **Expert keyboard scroll** | No handling | Auto-scroll on focus | 🟡 Medium |
| **Cost calculator buttons** | `grid-cols-2 sm:grid-cols-5` | Already responsive ✅ | - |

---

## Changes Required

### File 1: `src/components/ui/slider.tsx`

**Problem**: Thumb is only 20px (`h-5 w-5`), violating 44px touch target minimum.

**Solution**: Increase thumb to 44px with visible core and expanded touch area:

```tsx
<SliderPrimitive.Thumb 
  className="block h-11 w-11 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledBy}
/>
```

Change `h-5 w-5` to `h-11 w-11` (44px).

---

### File 2: `src/components/ui/textarea.tsx`

**Problem**: Uses `text-sm` (14px) which triggers iOS auto-zoom when focused.

**Solution**: Match Input component's font size strategy:

```tsx
<textarea
  className={cn(
    // Base styles - CRITICAL: text-base prevents iOS zoom
    "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    variantStyles,
    className,
  )}
  ref={ref}
  {...props}
/>
```

Change `text-sm` to `text-base md:text-sm` (16px on mobile, 14px on desktop).

---

### File 3: `src/components/home/Navbar.tsx`

**Problem**: Mobile menu links have minimal touch targets.

**Solution**: Add `min-h-[44px]` and padding to mobile navigation links:

```tsx
{/* Mobile Menu Links */}
<Link 
  to={ROUTES.TOOLS} 
  className="block text-sm text-muted-foreground hover:text-foreground min-h-[44px] flex items-center py-3" 
  onClick={() => setMobileMenuOpen(false)}
>
  Tools
</Link>
```

Apply `min-h-[44px] flex items-center py-3` to all mobile menu links.

---

### File 4: `src/components/navigation/MobileStickyFooter.tsx`

**Problem**: Secondary nav links have `py-1` (~28px total).

**Solution**: Expand touch targets to 44px:

```tsx
<div className="flex items-center justify-center gap-4 text-sm">
  <Link 
    to={FOOTER_NAV.HOME} 
    onClick={() => handleNavClick('home')} 
    className="text-slate-600 hover:text-slate-900 transition-colors min-h-[44px] flex items-center px-2"
  >
    Home
  </Link>
  {/* ... same for all links */}
</div>
```

Change `py-1` to `min-h-[44px] flex items-center px-2` for all footer nav links.

---

### File 5: `src/components/navigation/UnifiedFooter.tsx`

**Problem**: Footer links in the bottom row have no explicit touch target sizing.

**Solution**: Add minimum touch target height:

```tsx
<div className="flex items-center justify-center md:justify-end gap-4 md:gap-6 order-2 md:order-3">
  <Link 
    to={FOOTER_NAV.HOME} 
    onClick={() => handleNavClick('home')} 
    className="text-sm text-slate-600 hover:text-slate-900 transition-colors min-h-[44px] flex items-center"
  >
    Home
  </Link>
  {/* Apply to all footer links */}
</div>
```

Add `min-h-[44px] flex items-center` to all footer navigation links.

---

### File 6: `src/index.css`

**Problem**: No `scroll-padding-top` set, so anchor links and focus scroll cause content to hide under the sticky header.

**Solution**: Add global scroll padding matching header height:

```css
@layer base {
  html {
    /* Prevent content from hiding under sticky header when using anchor links or focus scroll */
    scroll-padding-top: 70px;
  }
  
  /* Slightly more padding on mobile to account for safe-area-inset-top */
  @media (max-width: 767px) {
    html {
      scroll-padding-top: 80px;
    }
  }
}
```

---

### File 7: `src/components/expert/ChatInput.tsx`

**Problem**: When mobile keyboard opens, textarea may be obscured.

**Solution**: Add `scrollIntoView` on focus to ensure visibility:

```tsx
import { useState, KeyboardEvent, useRef, useEffect } from 'react';

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll textarea into view when focused (handles mobile keyboard)
  const handleFocus = () => {
    // Small delay to allow mobile keyboard to fully appear
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300);
  };

  return (
    <div className="flex gap-2 p-4 border-t border-border bg-background/80 backdrop-blur">
      <label htmlFor="expert-chat-input" className="sr-only">
        Ask a question about impact windows, energy savings, or your specific situation
      </label>
      <Textarea 
        ref={textareaRef}
        id="expert-chat-input"
        value={input} 
        onChange={e => setInput(e.target.value)} 
        onKeyDown={handleKeyDown} 
        onFocus={handleFocus}
        placeholder="Ask about impact windows, energy savings, or your specific situation..." 
        className="min-h-[60px] max-h-[120px] resize-none" 
        disabled={isLoading || disabled}
        aria-label="Ask a question about impact windows"
      />
      {/* Send button unchanged */}
    </div>
  );
}
```

Add `ref` to textarea and `onFocus` handler with `scrollIntoView`.

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/components/ui/slider.tsx` | Increase thumb to 44px (`h-11 w-11`) |
| `src/components/ui/textarea.tsx` | Add `text-base md:text-sm` for iOS zoom prevention |
| `src/components/home/Navbar.tsx` | Add 44px touch targets to mobile menu links |
| `src/components/navigation/MobileStickyFooter.tsx` | Expand secondary nav touch targets to 44px |
| `src/components/navigation/UnifiedFooter.tsx` | Add 44px touch targets to footer links |
| `src/index.css` | Add `scroll-padding-top: 70px` for sticky header offset |
| `src/components/expert/ChatInput.tsx` | Add mobile keyboard scroll handling |

---

## Technical Notes

### Why 44px?
- Apple Human Interface Guidelines specify 44pt minimum
- Material Design specifies 48dp minimum  
- WCAG 2.5.5 requires 44×44 CSS pixels for AAA compliance
- 44px is the widely accepted accessible touch target size

### Cost Calculator Layout
The button grids already use `grid-cols-2 sm:grid-cols-5` which correctly stacks to 2 columns on mobile. No changes needed.

### iOS Zoom Prevention
iOS Safari automatically zooms in when an input with `font-size < 16px` is focused. The fix is ensuring all inputs use `text-base` (16px) on mobile. The Input component already does this (`text-base md:text-sm`). Textarea needs the same treatment.

### Slider Visual Balance
Increasing slider thumb to 44px may look visually large. Consider adding inner styling:
- Outer 44px invisible touch area
- Inner 20-24px visible circle

Alternative implementation (if 44px visible is too large):
```tsx
<SliderPrimitive.Thumb 
  className="relative block h-11 w-11 touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:h-5 after:w-5 after:rounded-full after:border-2 after:border-primary after:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
/>
```

---

## Testing Checklist

After implementation:
1. Test slider adjustment on mobile device - verify easy thumb dragging
2. Tap all navbar links on mobile - verify no mis-taps
3. Tap footer links - verify adequate spacing
4. Focus input on iOS Safari - verify no auto-zoom
5. Click anchor links - verify content not hidden under header
6. Open mobile keyboard on /expert - verify textarea stays visible
7. Test all interactive elements with Tab key - verify visible focus rings
