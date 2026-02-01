

# Fix Mobile Carousel in RedFlagGallery

## Objective
Make the "An Independent Standard Audit" carousel fully functional on mobile with touch swiping, scroll snapping, visible navigation, and pagination dots.

---

## Implementation Approach

**Strategy:** Replace transform-based carousel with native CSS scroll snapping for mobile, while preserving desktop arrow navigation.

---

## Changes to `RedFlagGallery.tsx`

### 1. Mobile Arrow Visibility

**Current:**
```text
className="... hidden md:block"
```

**New:**
```text
className="... block" (always visible)
- Smaller size on mobile: w-8 h-8 md:w-12 md:h-12
- Repositioned: bottom of carousel on mobile, sides on desktop
```

### 2. Enable Touch Swiping with Scroll Snap

**Current container:**
```text
<div className="overflow-hidden px-2">
  <div className="flex ..." style={{ transform: `translateX(...)` }}>
```

**New container (mobile-first):**
```text
<div className="overflow-x-auto snap-x snap-mandatory md:overflow-hidden scrollbar-hide">
  <div className="flex gap-4 md:gap-6 md:transition-transform" 
       style on desktop only>
```

### 3. Card Scroll Snapping

**Add to each card:**
```text
snap-center  // Cards snap to center when swiped
```

### 4. Pagination Dots

**New component at bottom:**
```text
<div className="flex justify-center gap-2 mt-6 md:hidden">
  {RED_FLAGS.map((_, index) => (
    <button 
      onClick={() => scrollToCard(index)}
      className={cn(
        "w-2 h-2 rounded-full transition-colors",
        index === activeIndex ? "bg-orange-500" : "bg-slate-600"
      )}
    />
  ))}
</div>
```

### 5. Track Active Card on Scroll

**New hook logic:**
- Add `ref` to scroll container
- Use `IntersectionObserver` or `scroll` event to detect which card is centered
- Update `activeIndex` state for pagination dots

---

## Technical Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                   RedFlagGallery                        │
├─────────────────────────────────────────────────────────┤
│  State:                                                 │
│    - currentIndex (for desktop arrows)                  │
│    - activeIndex (for mobile pagination sync)           │
│                                                         │
│  Refs:                                                  │
│    - scrollContainerRef (for scroll position tracking)  │
├─────────────────────────────────────────────────────────┤
│  Desktop (md+):                                         │
│    - Transform-based navigation (existing)              │
│    - Large arrows on sides                              │
│    - No pagination dots                                 │
├─────────────────────────────────────────────────────────┤
│  Mobile (<md):                                          │
│    - Native scroll with snap-x snap-mandatory           │
│    - Small arrows repositioned below                    │
│    - Touch swiping enabled by overflow-x-auto           │
│    - Pagination dots visible                            │
└─────────────────────────────────────────────────────────┘
```

---

## File Modifications

| File | Changes |
|------|---------|
| `src/components/audit/RedFlagGallery.tsx` | Add scroll snap classes, pagination dots, responsive arrows, scroll tracking |
| `src/index.css` (optional) | Add `.scrollbar-hide` utility if not present |

---

## CSS Classes Used

| Purpose | Tailwind Classes |
|---------|------------------|
| Scroll container | `overflow-x-auto snap-x snap-mandatory` |
| Card snapping | `snap-center` |
| Hide scrollbar | `scrollbar-hide` (custom utility) |
| Arrow sizing | `w-8 h-8 md:w-12 md:h-12` |
| Pagination dots | `w-2 h-2 rounded-full` |
| Active dot | `bg-orange-500` |
| Inactive dot | `bg-slate-600` |

---

## Mobile UX After Fix

```text
User swipes left/right
       ↓
Cards snap to center (snap-center)
       ↓
Pagination dots update to show position
       ↓
User can also tap arrows below carousel
       ↓
Tapping dots jumps to specific card
```

---

## Key Implementation Details

1. **Scroll tracking**: Use `scrollContainerRef.current.scrollLeft` to calculate which card is active
2. **Programmatic scroll**: `scrollContainerRef.current.scrollTo({ left: cardWidth * index, behavior: 'smooth' })`
3. **Responsive behavior**: Mobile uses native scroll, desktop uses transform (via responsive classes)
4. **No framer-motion**: Pure CSS/Tailwind solution for better performance

---

## Success Criteria

1. Touch swiping works smoothly on mobile
2. Cards snap cleanly to center position
3. Arrows visible and functional on all screen sizes
4. Pagination dots show current position and are tappable
5. Desktop arrow navigation unchanged

