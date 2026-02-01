

# Fix Card Component Theme Compatibility

## Summary
Reset the global `Card` component to use theme-aware CSS variables, fixing contrast issues on `/window-risk-and-code` and other pages.

---

## Changes to `src/components/ui/card.tsx`

### Card Component
**Line 7:**
```
Before: className={cn("rounded-lg border text-card-foreground shadow-sm bg-black", className)}
After:  className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
```

### CardContent Component
**Line 18:**
```
Before: className={cn("p-6 pt-0 bg-gray-700 border-2 border-current shadow-xl rounded-xl py-[10px]", className)}
After:  className={cn("p-6 pt-0", className)}
```

---

## What This Fixes
- `/window-risk-and-code` Related Guides section — cards will have proper contrast in both light and dark modes
- `/tools` page cards — will adapt to theme
- Auth pages — will adapt to theme
- All other standard Card usages site-wide

## What Stays Protected (No Changes Needed)
| Component/Page | Protection Method |
|----------------|-------------------|
| ImpactWindowCard (12 tool cards) | Uses dedicated `impact-window.css` with hardcoded hex values |
| `/audit` | Hardcoded `bg-slate-950 text-white` on container |
| `/beat-your-quote` | Hardcoded `dossier-bg` class and `bg-[#0A0F14]` |
| `/ai-scanner` | Remains theme-aware (per your request) |

---

## File to Modify

| File | Action |
|------|--------|
| `src/components/ui/card.tsx` | Replace `bg-black` with `bg-card`, reset CardContent to standard padding |

