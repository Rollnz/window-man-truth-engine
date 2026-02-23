

# Dark Mode Default for No-Preference Users

## Problem

Currently, `darkMode: ["class"]` means Tailwind's `dark:` utilities only activate when the `.dark` class is present on `<html>`. This works because `next-themes` adds it. But if JS hasn't loaded yet (flash of unstyled content) or the theme provider is removed, users with `no-preference` see the light theme.

## Solution

Change `tailwind.config.ts` line 5 to use the `variant` strategy so dark styles apply for both `prefers-color-scheme: dark` and `prefers-color-scheme: no-preference`:

```typescript
darkMode: [
  'variant',
  [
    '@media (prefers-color-scheme: dark) { & }',
    '@media (prefers-color-scheme: no-preference) { & }',
  ],
],
```

This is a one-line change in `tailwind.config.ts`.

## Important Consideration

This removes the dependency on the `.dark` class for dark mode activation. The `next-themes` provider in `src/main.tsx` currently uses `attribute="class"` and `defaultTheme="dark"`, which adds the `.dark` class. With the `variant` strategy, Tailwind's `dark:` utilities will instead be governed by the CSS media queries above -- meaning the `.dark` class from `next-themes` will no longer control Tailwind dark styles.

Since this project is dark-only (no light mode toggle exists, `enableSystem={false}`), this is fine -- the media queries ensure dark is always the default. The `next-themes` provider remains harmless but becomes redundant for Tailwind styling.

## Technical Details

- **File changed:** `tailwind.config.ts` (line 5 only)
- **No other files need changes**
- **Tailwind v3.4.19** supports the `variant` strategy
- All existing `dark:` utility classes throughout the project will continue to work, just activated by CSS media queries instead of the `.dark` class

