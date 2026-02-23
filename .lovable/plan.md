

# Add UrgencyTicker to Beat-Your-Quote Hero

## What's Changing

Place the existing `UrgencyTicker` component (the live "X quotes scanned / +Y today" stat bar) into the `DossierHero` section on `/beat-your-quote`. It will sit between the trust indicators and the bouncing scroll-down chevron -- visually at the bottom of the hero, above the scan line, right before the page scrolls to the next section.

## File: `src/components/beat-your-quote/DossierHero.tsx`

### 1. Add import (line 7)
```typescript
import { UrgencyTicker } from '@/components/social-proof';
```

### 2. Insert the ticker between the trust text and the scroll chevron (after line 164, before the scroll indicator div)

```tsx
{/* Live Scan Counter */}
<div className="mt-6 animate-fade-in">
  <UrgencyTicker variant="cyberpunk" size="sm" />
</div>
```

The `cyberpunk` variant matches the dark dossier aesthetic of this hero (dark background with cyan/emerald accents). Size `sm` keeps it compact so it doesn't compete with the upload dropzone.

### Summary

| Change | Detail |
|--------|--------|
| Import | `UrgencyTicker` from `@/components/social-proof` |
| Placement | After trust indicators, before scroll chevron |
| Variant | `cyberpunk` (dark glass with emerald/amber accents) |
| Size | `sm` (compact) |

One file, two additions (one import line, one JSX block). No new dependencies.
