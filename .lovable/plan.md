

## Fix: PreQuoteLeadModalV2 Flash-Close Regression

### Root Cause

The modal opens visually (`open={isOpen}` on the Dialog), and then a `useEffect` notices the session-completion flag and calls `onClose()` one frame later. This creates the open-then-immediately-close flash seen in the session replay.

The sequence:
1. User clicks CTA, parent sets `showPreQuoteModal = true`
2. Dialog renders with `open={true}` — modal appears on screen
3. React commits, effects run
4. `useEffect` reads `hasCompletedInSession() === true` and calls `onClose()`
5. Parent sets `showPreQuoteModal = false` — modal disappears (flash)

### Fix (2 changes in PreQuoteLeadModalV2.tsx)

**Change 1 — Prevent Dialog from opening when suppressed (line 513)**

Replace:
```
<Dialog open={isOpen} onOpenChange={onClose}>
```
With:
```
const suppressOpen = hideAfterCompletion && hasCompletedLead;

<Dialog open={isOpen && !suppressOpen} onOpenChange={onClose}>
```

This ensures the Dialog never visually opens when the session flag is set, eliminating the flash entirely.

**Change 2 — Remove the redundant useEffect suppression branch (lines 162-166)**

Remove:
```
if (isOpen && hideAfterCompletion && hasCompletedLead) {
  onClose();
  return;
}
```

This branch is no longer needed since the Dialog itself will never open. Removing it also eliminates the `onClose` dependency from the effect, which was causing unnecessary effect re-runs.

**Change 3 — Add accessibility attributes to fix console errors**

Add `DialogTitle` (visually hidden) and `aria-describedby={undefined}` to the `DialogContent` to resolve the Radix accessibility warnings showing in the console.

### Verification

After the fix:
- Clean slate (clear sessionStorage): modal opens normally, stays open through all 5 steps, only suppresses after result screen dismiss
- Dirty slate (completion flag set): modal never flashes — Dialog stays closed
- No console errors from missing DialogTitle

