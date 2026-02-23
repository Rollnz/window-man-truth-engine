

# Multi-Expand Autopilot Insights + UX Polish Suggestions

## Design Change: Multi-Expand

A 3-line change in the `AutopilotCard` component (lines 913, 944, 948):

1. **State**: `useState<string | null>(null)` becomes `useState<string[]>([])`
2. **Check**: `expandedId === insight.id` becomes `expandedIds.includes(insight.id)`
3. **Toggle**: Clicking adds the ID if absent, removes it if present:
   ```typescript
   setExpandedIds(prev =>
     prev.includes(insight.id)
       ? prev.filter(id => id !== insight.id)
       : [...prev, insight.id]
   );
   ```

No risk of conflicts. This is the only accordion-style component on the page.

---

## UX Improvement Suggestions (Lead Design Engineer Review)

After reviewing the full 1,568-line page, here are targeted improvements:

### 1. "Expand All / Collapse All" Button for Autopilot

Since we're enabling multi-expand, add a small "Expand All" / "Collapse All" toggle in the `AutopilotCard` header. When there are 3-5 insights, users will want to scan them all at once without clicking each one individually.

### 2. Sticky Budget Alert Banner

The `BudgetAlertBanner` renders at the top of the page, but if the user scrolls down to investigate insights, they lose sight of the critical alert. Making it `sticky top-0 z-50` ensures the emergency stays visible while they work through fixes.

### 3. "Run Full Test" Button Should Be More Prominent

The primary action ("Run Full Test") is buried below 10 cards of diagnostic data. Adding a secondary fixed/sticky action button (or floating action button) at the bottom-right of the viewport would let users re-run tests without scrolling back up.

### 4. Color-Code the Certification Badge Dynamically

Currently the badge always shows a green "All 10 Steps Active" seal. It would be more honest (and useful) to reflect the actual system health:
- Green seal when health is `healthy`
- Amber seal when health is `warning` or `conflict`
- Red seal when health is `critical`

This gives the badge real diagnostic value instead of being purely decorative.

### 5. Toast Feedback on "Copy Fix Request" Is Easy to Miss

The copy confirmation uses a small toast. Since the Autopilot is action-oriented, replacing the toast with an inline checkmark animation on the button itself (similar to the Budget Alert's "Copied!" state) provides faster, more visible feedback without the toast competing with other notifications.

---

## Implementation Scope

The multi-expand change touches only `src/pages/admin/TrackingTest.tsx`, modifying 3 lines inside `AutopilotCard`. Zero risk, zero side effects.

The UX suggestions above are optional follow-ups and not included in this build unless requested.

