

## Plan: Import PowerToolFlow as Portable Widget (Mobile-Only)

This is a direct "copy as-is" import from [WmTester](/projects/95d1ac58-e05e-46aa-842d-b01b9c56fdc7). No restyling, no backend wiring. Four files created, one file edited.

### Files to create

**1. `src/styles/design-system.ts`** — Exact copy from WmTester (169 lines). Exports `DS`, `DS_PAGE_STYLES`, `contrastColor`, `contrastClass`, `semanticGlow`, `ELEVATION`, `pageWrapperStyle`.

**2. `src/components/ds/TrustFooter.tsx`** — Exact copy (20 lines). Imports `DS` from `@/styles/design-system`.

**3. `src/components/ds/UrgencyBadge.tsx`** — Exact copy (28 lines). Imports `DS` from `@/styles/design-system`.

**4. `src/components/PowerToolFlow.tsx`** — Exact copy of WmTester's `src/pages/PowerToolFlow.tsx` (1,650 lines). All imports already use `@/styles/design-system`, `@/components/ds/TrustFooter`, `@/components/ds/UrgencyBadge` — paths match, no changes needed.

### File to edit

**5. `src/pages/Signup.tsx`** — Insert between line 465 (`</section>` end of hero) and line 467 (Split Conversion Zone `<section>`):

```tsx
import PowerToolFlow from '@/components/PowerToolFlow';

// Between the two sections:
<div className="lg:hidden">
  <PowerToolFlow />
</div>
```

### What the user sees

- **Desktop**: Nothing changes. The `lg:hidden` wrapper hides the entire widget.
- **Mobile**: A dark-themed "FREE POWER TOOL" CTA button with trust badges appears between "What you'll get" and "I Have a Quote." Tapping it opens the 2-step lead modal → animated terminal scan → score reveal → full demo Truth Report. All demo data, no real API calls.

### Important note on demo-mode page takeover

When the user completes the lead modal, `PowerToolFlow` returns `<DemoScanPage>` which renders full-viewport (`min-h-screen`) dark pages (terminal, score reveal, report). Since the widget is inside `lg:hidden`, this takeover only occurs on mobile. The sticky bottom bar and demo banner CTAs link to `/ai-scanner` and `/consultation` — these routes should exist in the app (or will be wired later).

### No database, backend, or dependency changes needed

Purely frontend. The component uses inline styles and its own design tokens. No new npm packages required.

