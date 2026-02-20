

# Fix text-primary and text-destructive Contrast in Light Mode

## Problem

Both `--primary` (209 68% 55%) and `--destructive` (0 84% 60%) use the same HSL values in light and dark mode. On light backgrounds (white/near-white), these produce contrast ratios of approximately 3.5:1 and 4:1 respectively -- well below the 6:1 target. In dark mode they're fine (high contrast against dark surfaces).

## Solution

Darken both tokens **in the light theme only** by reducing their lightness value. This fixes all `text-primary` and `text-destructive` usage site-wide (icons, links, badges, labels) without any component-level changes. Button backgrounds (`bg-primary`) simply become a slightly deeper blue/red, which is aesthetically better and maintains the white `primary-foreground` text.

## Exact Changes

**File: `src/index.css`** (1 file, 2 line changes)

In the `.light` theme block only:

| Token | Current | New | Contrast on white |
|---|---|---|---|
| `--primary` | `209 68% 55%` | `209 68% 38%` | ~6.3:1 (was ~3.5:1) |
| `--destructive` | `0 84% 60%` | `0 84% 40%` | ~6.5:1 (was ~4:1) |

Also update `--sidebar-primary` in `.light` to match: `209 68% 38%`.

Dark mode values remain unchanged (55% and 60% are already high-contrast on dark surfaces).

## What This Fixes

- All `text-primary` usage across About page, pillar components, hero badges, guide card icons, links, checklist icons, credential pills
- All `text-destructive` usage on the About page mission section ("The Problem We're Solving" heading, numbered badges)
- Every other page that uses these tokens in light mode

## What Does NOT Change

- Dark mode appearance (tokens unchanged)
- No component files modified
- No new tokens or dependencies
- Button text (`text-primary-foreground: white`) stays white on the now-deeper backgrounds
- Dossier page overrides its own `--primary` via `!important`, unaffected

