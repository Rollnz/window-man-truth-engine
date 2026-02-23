

# Fix: Call Agents Command Center - Dark Mode Contrast + UX Polish

## Problem Summary

The `/admin/call-agents` page uses hardcoded light-mode-only colors throughout: `text-gray-500`, `bg-gray-100`, `bg-white`, `bg-gray-50`, `bg-red-50`, `border-gray-200/300`, etc. On the dark background, these produce invisible text, jarring white surfaces, and broken contrast. The screenshot confirms: dropdown options are nearly invisible, filter pills blend into the background, and empty-state text disappears.

## Affected Files (6 files, ~80 line changes)

### 1. `src/components/admin/ActivityFilterBar.tsx`
The worst offender visible in the screenshot.

| Line | Current | Fix |
|------|---------|-----|
| 32 | `bg-white` on select dropdown | `bg-background text-foreground` |
| 32 | `border-gray-300` | `border-border` |
| 63 | Inactive pill: `bg-gray-100 text-gray-600 hover:bg-gray-200` | `bg-muted text-muted-foreground hover:bg-muted/80` |
| 76 | Refresh button: `border-gray-300 hover:bg-gray-50` | `border-border hover:bg-muted` |
| 77 | Refresh icon: `text-gray-600` | `text-muted-foreground` |

### 2. `src/components/admin/ActivityFeed.tsx`
Loading skeletons, error banners, empty states.

| Lines | Current | Fix |
|-------|---------|-----|
| 44 | `bg-gray-100` skeleton | `bg-muted` |
| 49 | `bg-red-50 border-red-200` error | `bg-destructive/10 border-destructive/30` |
| 50 | `text-red-700` | `text-destructive` |
| 53 | `text-red-600` retry link | `text-destructive` |
| 60 | `text-gray-300` empty icon | `text-muted-foreground/50` |
| 63, 70 | `text-gray-600` empty title | `text-muted-foreground` |
| 64, 72 | `text-gray-400` empty subtitle | `text-muted-foreground/70` |
| 80 | `border-gray-200 divide-gray-100` list wrapper | `border-border divide-border` |
| 93 | Load More button: `border-gray-300 text-gray-600 hover:bg-gray-50` | `border-border text-muted-foreground hover:bg-muted` |

### 3. `src/components/admin/ActivityRow.tsx`
Row hover, expanded panel, detail grid.

| Lines | Current | Fix |
|-------|---------|-----|
| 45 | `hover:bg-gray-50` row hover | `hover:bg-muted/50` |
| 48 | `text-gray-500` timestamp | `text-muted-foreground` |
| 66 | `text-gray-400` duration | `text-muted-foreground/70` |
| 85 | `text-gray-400` chevron | `text-muted-foreground` |
| 94 | `bg-gray-50 border-gray-200` expanded panel | `bg-muted/50 border-border` |
| 98, 108, 119 | `text-gray-500` section labels | `text-muted-foreground` |
| 111 | `bg-white border-gray-200 text-gray-700` transcript box | `bg-background border-border text-foreground` |
| 124, 130, 147, 159, 165 | `text-gray-500` detail labels | `text-muted-foreground` |
| 125, 131, 148, 161, 166 | `text-gray-800` detail values | `text-foreground` |
| 140 | `text-gray-400 hover:text-gray-600` copy button | `text-muted-foreground hover:text-foreground` |
| 175 | `bg-red-50 border-red-200` error box | `bg-destructive/10 border-destructive/30` |
| 176 | `text-red-600` | `text-destructive` |
| 177 | `text-red-700` | `text-destructive` |

### 4. `src/components/admin/SearchFilterBar.tsx`
Agent tab filter toggle buttons.

| Lines | Current | Fix |
|-------|---------|-----|
| 35 | Inactive: `bg-gray-100 text-gray-600 hover:bg-gray-200` | `bg-muted text-muted-foreground hover:bg-muted/80` |

### 5. `src/components/admin/AudioPlayer.tsx`
Player surfaces and time labels.

| Lines | Current | Fix |
|-------|---------|-----|
| 107 | `bg-red-50 border-red-200 text-red-700` error state | `bg-destructive/10 border-destructive/30 text-destructive` |
| 113 | `text-blue-600` retry link | `text-primary` |
| 121 | `bg-gray-50` player wrapper | `bg-muted/50` |
| 148, 151 | `text-gray-500` time labels | `text-muted-foreground` |

### 6. `src/pages/admin/CallAgentsConfig.tsx`
Tab bar uses hardcoded gray for inactive tabs.

| Lines | Current | Fix |
|-------|---------|-----|
| 102 | `border-gray-200` tab bar border | `border-border` |
| 108 | Inactive tab: `text-gray-500 hover:text-gray-700` | `text-muted-foreground hover:text-foreground` |
| 116 | Same for Activity tab | Same fix |

---

## Top 3 UX/Design Improvements (Beyond Contrast Fixes)

### 1. Upgrade the `<select>` dropdown to a styled component
The native `<select>` in ActivityFilterBar looks like a foreign element. Replace it with a shadcn `Select` component (already installed) for visual consistency with the rest of the design system -- proper rounded corners, focus rings, and theme-aware styling.

### 2. Unify the tab bar with the design system
The custom tab bar (lines 99-118 in CallAgentsConfig) uses raw `<button>` elements with hardcoded border colors. Replace with shadcn `Tabs` / `TabsList` / `TabsTrigger` for consistent sizing, focus states, and keyboard navigation (arrow keys, Home/End). This also gives you proper ARIA `role="tablist"` for free.

### 3. Add status-aware card borders to StatsCards
Currently all stat cards have static left borders (blue, purple, green/red). When there are active errors or low success rates, the cards should pulse or glow subtly to draw attention. Add a `ring-1 ring-red-500/30` on the Errors card when `errors_24h > 0`, creating a visual urgency signal without being distracting.

---

## Scope
- **6 files modified**
- ~80 single-token class replacements (gray-* to theme tokens)
- 3 UX upgrades (select component, tabs component, status card glow)
- Zero structural/logic changes

