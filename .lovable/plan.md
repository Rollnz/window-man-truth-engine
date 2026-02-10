

# Fix: Consistent Orange Border in Both Themes

## What the button will look like

**Light mode**: Muted gray background, muted gray text, solid 2px orange (#D97706) border. No animation, no glow.

**Dark mode**: Identical -- muted background, muted text, solid 2px orange (#D97706) border. No animation, no glow.

Right now the `variant="outline"` base styles add a `dark:border-muted-foreground/40` override that can wash out the orange in dark mode. The fix is to add `dark:border-[#D97706]` to force the same orange in dark mode.

## File Change

### `src/components/sample-report/LeverageOptionsSection.tsx`

Update the disabled Button className (line ~79) from:

```
className="w-full bg-muted text-muted-foreground border-2 border-[#D97706] cursor-not-allowed"
```

to:

```
className="w-full bg-muted text-muted-foreground border-2 border-[#D97706] dark:border-[#D97706] cursor-not-allowed"
```

Single class addition. Nothing else changes.

