

## Plan: Make Accordion Gradient Permanent Across All Themes

### Overview
Move the accordion background gradient from the light-theme-only block to the global `:root` block, ensuring it never changes regardless of theme.

### The Problem
The `--accordion` CSS variable is currently defined only inside the `.light` block in `src/index.css`. When dark mode is active, this variable is undefined, causing the accordion background to fall back to transparent.

### The Solution
Move the variable to the global `:root` block where it will apply to ALL themes.

### File Changes

#### `src/index.css`

**Step 1: Add to `:root` block (around line 13)**

Add after the mobile footer variable:
```css
:root {
  /* Mobile sticky footer height (used by PublicLayout for bottom padding) */
  --mobile-sticky-footer-h: 104px;

  /* Accordion - PERMANENT, theme-independent */
  --accordion: linear-gradient(to bottom, #cfe7fa 0%, #6393c1 100%);

  /* ============================================================
     GLOBAL THEME — Dark (default)
     ...
```

**Step 2: Remove from `.light` block (lines 150-151)**

Delete these lines:
```css
/* Accordion */
--accordion: linear-gradient(to bottom, #cfe7fa 0%, #6393c1 100%);
```

### Technical Details

| Aspect | Before | After |
|--------|--------|-------|
| Location | `.light` block only | Global `:root` block |
| Dark theme | Falls back to transparent | Gradient applies |
| Light theme | Gradient works | Gradient works (unchanged) |
| Override protection | None | Top of cascade, applies everywhere |

### Result
- Accordion gradient is now **permanent** across all themes
- Combined with the earlier `text-black` class, font remains black
- No theme or state can override this styling

### Files Modified
1. `src/index.css` - Move variable from `.light` to `:root`

