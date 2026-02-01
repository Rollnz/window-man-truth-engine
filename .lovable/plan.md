
# Fix FAQ Contrast on /window-verification-system

## Problem Summary
The FAQ accordion has a permanent blue gradient background, but the answer text uses `text-muted-foreground` which changes with the theme. In dark mode, the text becomes light gray on a blue background = unreadable.

## Solution
Remove the `text-muted-foreground` override from the AccordionContent usage. The base accordion component already has `text-black` hardcoded specifically because the background is theme-independent.

---

## Implementation

### File: `src/pages/WindowVerificationSystem.tsx`

**Line 221 - Change:**
```
Before: <AccordionContent className="text-muted-foreground">
After:  <AccordionContent>
```

This allows the base component's `text-black` class to apply, ensuring black text on the blue background in both light and dark modes.

---

## Visual Result

```text
BEFORE:
┌─────────────────────────────────────────────┐
│  Blue gradient background                    │
│  "Essential documents include..."            │
│   ^ Light gray text (dark mode) = BAD        │
└─────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────┐
│  Blue gradient background                    │
│  "Essential documents include..."            │
│   ^ Black text (both modes) = GOOD           │
└─────────────────────────────────────────────┘
```

---

## Technical Details

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/WindowVerificationSystem.tsx` | Remove `className="text-muted-foreground"` from AccordionContent | Let base `text-black` apply for proper contrast |

## Impact
- Only affects `/window-verification-system` page
- No changes to base accordion component needed
- Text will be black in both light and dark modes, matching the permanent blue background
