

# Fix DialogTitle and DialogDescription Text Color

## The Problem

`DialogTitle` and `DialogDescription` in `src/components/ui/dialog.tsx` both use the class `text-primary-foreground` as their default text color.

`--primary-foreground` is a color designed for text rendered **on top of** the primary (blue) background -- it resolves to white/near-white. When these components render inside a white modal card, you get white-on-white text, making the heading and description invisible or extremely low contrast.

The TrustModal component already works around this by overriding with `text-slate-900 dark:text-slate-900`, so TrustModal-based forms are fine. But any dialog that uses the raw `DialogTitle`/`DialogDescription` (like the "Request Your Quote" cost calculator modal) gets broken contrast.

## The Fix

Change the default class on both components from `text-primary-foreground` to `text-foreground`.

`text-foreground` is the correct semantic token -- it automatically resolves to dark text in light mode and light text in dark mode, giving proper contrast on standard dialog backgrounds in both themes.

TrustModal already applies its own color overrides, so it remains unaffected.

## Changes

**File: `src/components/ui/dialog.tsx`**

| Component | Line | Current | New |
|---|---|---|---|
| DialogTitle | 50 | `text-primary-foreground` | `text-foreground` |
| DialogDescription | 55 | `text-primary-foreground` | `text-foreground` |

No other files need to change.

