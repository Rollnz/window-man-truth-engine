

# Smart "Request Better Quote Options" Button -- 2-Click Activation Flow

## What Changes for the User

**Click 1 (on the grey button):** The checkbox automatically checks itself, and the button instantly transforms from grey/orange-border to the blue active CTA style. No modal yet.

**Click 2 (on the now-blue button):** The lead capture modal opens. After submitting, the user is redirected to the AI Scanner.

The checkbox still works independently too -- checking it manually also activates the button as before.

## Visual States

| State | Button Style | Checkbox |
|-------|-------------|----------|
| Initial | Grey background, orange border, clickable (not disabled) | Unchecked |
| After Click 1 | Orange #F97A1F CTA with arrow icon facing left | Checked |
| After Click 2 | Opens Lead Modal | Checked |

## Technical Details

### `src/components/sample-report/LeverageOptionsSection.tsx`

**1. Remove `disabled` from the grey button** -- make it clickable but visually muted.

**2. Add an onClick handler** that auto-checks the consent box:

```tsx
const handleInactiveButtonClick = () => {
  setPartnerConsent(true);
  trackEvent('sample_report_auto_consent', {
    location: 'leverage_options',
    trigger: 'button_click',
  });
};
```

**3. Replace the disabled `<Button>` block (lines 74-81)** with a clickable version:

```tsx
<Button
  variant="outline"
  size="lg"
  className="w-full bg-muted text-muted-foreground border-2 border-[#D97706] dark:border-[#D97706]"
  onClick={handleInactiveButtonClick}
>
  Request Better Quote Options
</Button>
```

Key differences from current code:
- `disabled` prop removed
- `cursor-not-allowed` class removed
- `onClick` added to trigger consent

**4. Remove the hint text** ("Check the box above to enable this option") on line 83 since the button now self-activates -- no need to tell users to find the checkbox.

**5. No changes** to the active (blue) button, the checkbox, the lead modal, or any other file.

