

# Fix: "Its Window Man" Brand Text Color in Navbar

## The Problem
The brand text "Its Window Man" in the Navbar (`src/components/home/Navbar.tsx`, line 97) currently has a hardcoded inline style:
```
style={{ color: '#2278BF' }}
```
This was a manual workaround to make the text visible in light mode, but hardcoded hex values don't adapt to theme changes and bypass the design system.

## The Fix
**File:** `src/components/home/Navbar.tsx` (line 97)

Replace the hardcoded `style={{ color: '#2278BF' }}` with the theme-aware Tailwind class `text-primary`.

**Before:**
```html
<span style={{ color: '#2278BF' }}>Its Window Man</span>
```

**After:**
```html
<span className="text-primary">Its Window Man</span>
```

## Why This Works
- The project's `--primary` CSS variable is set to Industrial Blue (209 68% 38%) in the unified theme system (memory: `style/theme/unified-system-v6`).
- In dark mode, `--primary` resolves to a lighter, high-contrast blue that reads well on dark backgrounds.
- In light mode, `--primary` resolves to a darkened blue that meets 6:1 ARIA contrast compliance against the light `--background`.
- This single class handles both themes automatically with no hardcoded values.

## Scope
- **1 file changed**, **1 line modified**
- No other components affected
- No risk of regressions -- this simply replaces a static hex with the existing design token

