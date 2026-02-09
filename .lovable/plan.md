

# Fix UrgencyTicker: Mobile Layout & Theme Colors

## What and Why

The UrgencyTicker component has two issues:
1. **Mobile text wrapping** - On small screens, "quotes scanned" and "+6 today" break onto multiple lines because there's no `whitespace-nowrap` and the `lg` size uses padding/text sizes that overflow.
2. **Dark mode muddy backgrounds** - The `homepage` and `minimal` variants use transparency-based colors (`bg-primary/5`) that blend poorly with dark backgrounds, creating an unclear visual.

## Changes (Single File)

**File:** `src/components/social-proof/UrgencyTicker.tsx`

### 1. Update `variantStyles` with explicit theme tokens

Replace transparency-based colors with explicit `dark:` variants:

- **cyberpunk**: No changes (already dark-only)
- **minimal**: `bg-slate-100 dark:bg-slate-800`, `border-slate-200 dark:border-slate-700`, explicit text colors
- **homepage**: `bg-sky-50 dark:bg-slate-800/90`, `border-sky-200 dark:border-slate-700`, sky-tinted text tokens

### 2. Update `sizeStyles` with responsive values

Add responsive breakpoints so mobile gets compact sizing:

| Size | Mobile | sm+ |
|------|--------|-----|
| sm | `px-2 py-1`, `text-[10px]` | `px-3 py-1.5`, `text-xs` |
| md | `px-2.5 py-1.5`, `text-xs` | `px-4 py-2.5`, `text-sm` |
| lg | `px-3 py-2`, `text-sm` | `px-5 py-3`, `text-base` |

### 3. Add layout enforcement classes

- Container: add `whitespace-nowrap`
- Left section: add `flex-shrink-0`
- Right section: add `flex-shrink-0`
- Gap: `gap-1.5 sm:gap-2` for tighter mobile spacing

These three changes together guarantee a single-row, non-wrapping pill layout on all screen sizes with clean, readable colors in both themes.

