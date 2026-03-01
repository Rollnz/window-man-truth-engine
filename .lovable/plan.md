

# Update WelcomeToast: Rebrand + Dual CTA + Mobile Stack + Modal Wiring

## Summary

Rebrand the homepage WelcomeToast, replace the single CTA with two buttons that open `PreQuoteLeadModalV2`, ensure mobile-friendly stacking, and wire dismiss/modal state correctly so the toast closes but the modal stays open.

## Changes (single file: `src/components/onboarding/WelcomeToast.tsx`)

### 1. Copy Updates
- **Headline**: "The WindowMan Truth Engine" --> "The WindowMan Truth Report"
- **Body**: "See your Readiness Score Explore tools..." --> "Audit your quote and save money."

### 2. Dual CTA Buttons
Replace the single "Start Learning" button with:
- **"I Have a Quote"** -- `variant="cta"`, `size="sm"`
- **"I Want a Quote"** -- `variant="outline"`, `size="sm"`

### 3. Mobile Responsiveness
Button container uses `flex flex-col sm:flex-row gap-2 sm:gap-3` so buttons stack full-width on mobile and sit side-by-side on desktop.

### 4. Component Wiring (dismiss toast, keep modal open)
- Add two state variables: `haveQuoteOpen` and `wantQuoteOpen`
- On button click: call `dismissToast()` first, then set the respective modal state to `true`
- Render two `PreQuoteLeadModalV2` instances **outside** the early `if (!showToast) return null` guard (so they persist after toast dismisses)
- Each modal wired with `isOpen={stateVar}` and `onClose={() => setStateVar(false)}`
- `ctaSource` set to `"homepage_toast_have_quote"` and `"homepage_toast_want_quote"` respectively

### 5. Cleanup
- Remove `handleStartScoring` function and its scroll-to-grid logic entirely
- Update tracking labels: `toast_click_have_quote` and `toast_click_want_quote`

### 6. Imports
- Add: `useState` from react, `PreQuoteLeadModalV2` from `@/components/LeadModalV2`

## Technical Detail

The key wiring pattern:

```text
WelcomeToast (always renders modals)
  |-- if showToast: render toast UI with two buttons
  |-- always: render PreQuoteLeadModalV2 x2 (controlled by local state)

Click "I Have a Quote":
  1. trackEngagement("toast_click_have_quote", ...)
  2. dismissToast()          // hides toast, sets localStorage
  3. setHaveQuoteOpen(true)  // opens modal (persists because modals render outside the guard)
```

