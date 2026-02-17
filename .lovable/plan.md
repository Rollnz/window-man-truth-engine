

# WindowMan "The Arbiter" -- BeatOrValidateSection (Gotcha-Hardened)

## What This Does

Places the `windowman_report.webp` mascot between Scenario A and B. Desktop: replaces the "OR" circle. Mobile: compact divider between stacked cards. All three gotchas from your review are addressed below.

---

## Gotcha Fixes Applied

### Gotcha 1: Breakpoint alignment
The grid already uses `grid-cols-1 lg:grid-cols-2` (line 45). The existing OR circle already uses `hidden lg:flex` (line 147). Both switch at `lg` (1024px). No md/lg mismatch exists -- visibility classes will stay at `lg` breakpoint, matching the grid exactly. No fix needed, confirmed safe.

### Gotcha 2: Overlap coverage
The existing OR circle is `w-20` (80px). The plan called for `w-28` (112px). With `gap-8` (32px), that is 80px of overlap -- too much.

**Fix applied:** Use `w-20 h-28` for the desktop image (same width as the old circle, taller to show the report). This keeps overlap at exactly 48px total (24px per card side), which the existing `p-8` (32px) padding on each card already absorbs. No text will be covered.

### Gotcha 3: Lopsided height
Both cards currently have identical content structure (icon + badge + title + paragraph + 3 bullets + result badge). They render at nearly equal height. However, to future-proof:

**Fix applied:** Use `top-[45%]` instead of `top-1/2` to pin WindowMan slightly above true center, aligning him with the card title area. This prevents him from drifting into footer whitespace if one card grows taller later.

---

## File Changes

### File: `src/components/audit/BeatOrValidateSection.tsx`

**1. Mobile divider** -- Insert between Card A (ends line 94) and Card B (starts line 96):

A flex row visible only below `lg`. Contains:
- Left gradient line (emerald fade)
- WindowMan image: `w-16 h-20`, `object-cover object-top`, rounded, bordered
- "OR" label below image
- Right gradient line (cyan fade)

**2. Desktop mascot** -- Replace lines 146-151 (the old OR circle) with:

An absolutely positioned container (`hidden lg:flex`) with:
- Glow ring: gradient blur behind image
- Image: `w-20 h-28`, `object-cover object-top`, rounded-2xl, border + ring
- "OR" pill badge below

Positioned at `left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 z-10`.

**3. No other changes.** Cards, header, bottom message, section wrapper all stay identical.

---

## Visual Result

```text
DESKTOP (lg+):
+------------------+  +----+  +------------------+
|                  |  | WM |  |                  |
|   Scenario A     |  |    |  |   Scenario B     |
|   (emerald)      |  | OR |  |   (cyan)         |
|                  |  +----+  |                  |
+------------------+          +------------------+

MOBILE (< lg):
+---------------------------+
|       Scenario A          |
+---------------------------+
  -----[ WM ]-----
         OR
+---------------------------+
|       Scenario B          |
+---------------------------+
```

## What Does NOT Change

- Card content, padding, hover effects, gradients
- Section header, badges, bottom "Either way" message
- Grid structure (`grid-cols-1 lg:grid-cols-2 gap-8`)
- No new dependencies or files (image already in lovable-uploads)

