# Fix "Confidence Shift" Card -- Theme-Locked Dark Glassmorphic Style

## What Changes

The "Confidence Shift" card (line 64 of `SecretPlaybookSection.tsx`) currently uses theme-aware tokens (`bg-card`, `text-foreground`, `text-muted-foreground`) which means it looks different in light vs dark mode. The user wants it locked to the dark style shown in the screenshot -- always dark, regardless of theme.

## Visual Target (from screenshot)

- Dark gradient background (deep navy/charcoal with a diagonal shift)
- White heading text ("The Confidence Shift")
- Light grey body text (muted white)
- Blue accent on "answers"
- Bottom callout bar: semi-transparent dark background with lighter border
- Rounded corners, subtle glassmorphic feel

## Implementation

**File**: `src/components/home/SecretPlaybookSection.tsx` (line 64 only)

Replace the current card's theme-aware classes with hardcoded dark values:


| Element          | Current                                                                                               | New                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Card wrapper     | `bg-gradient-to-br from-primary/10 via-card to-[hsl(var(--secondary)/0.05)] border border-primary/20` | `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 border border-white/10` |
| Heading          | `text-foreground`                                                                                     | `text-white`                                                                         |
| Body text        | `text-muted-foreground`                                                                               | `text-slate-100`                                                                     |
| Bold body        | `text-foreground`                                                                                     | `text-white`                                                                         |
| "answers" accent | `text-primary`                                                                                        | `text-sky-600` (visible on dark bg)                                                  |
| Inner callout    | `bg-background/50 border-border/50`                                                                   | `bg-white/5 border-white/10`                                                         |
| Callout italic   | `text-muted-foreground`                                                                               | `text-slate-400`                                                                     |
| Callout bold     | `text-foreground font-medium`                                                                         | `text-white font-medium`                                                             |


This ensures the card always renders as a dark glassmorphic surface with white/light text, matching the screenshot in both themes.

## What Does NOT Change

- All other cards, CTAs, section backgrounds, and content
- The text content itself (only styling classes change)
- No new CSS classes or files needed