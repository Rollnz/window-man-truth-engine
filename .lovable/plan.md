

# Replace Hardcoded Stats with Live Ticker Data on /proof and Site-Wide

## Problem
The `/proof` page hero uses a hardcoded `proofStats.totalHomeowners = 450` while the rest of the site uses live database-backed data via `useTickerStats()`. This creates inconsistency -- the ticker might show 3,500+ scans while the proof page says "450+ homeowners helped."

## Design: ProofHero Redesign

Replace the current "Florida Homeowners Helped" `EvidenceStat` tile with the `UrgencyTicker` component (using the `homepage` variant for the light trust-forward aesthetic). The ticker provides live "quotes scanned" count + "+X today" with a pulsing dot, which is far more compelling than a stale "450+."

**Layout change:** Go from a 4-column stat grid to:
- **Top row:** Full-width `UrgencyTicker` (variant="homepage", size="lg") centered above the stat cards
- **Bottom row:** 3 remaining stat cards (Avg. Overpricing, Total Savings, Insurance Premium Reduction) in a 3-column grid

Also update the inline copy from `{proofStats.totalHomeowners}+ Florida homeowners` to use the live `total` from `useTickerStats()`.

## Site-Wide Hardcoded Stats Audit

| Location | Hardcoded Value | Fix |
|---|---|---|
| **ProofHero.tsx** | `proofStats.totalHomeowners` (450) in text + EvidenceStat | Replace with `useTickerStats().total` + swap stat tile for `UrgencyTicker` |
| **Proof.tsx SEO** | "450+ Florida homeowners" in meta description + JSON-LD | Replace with generic "thousands of" (SEO strings can't be dynamic) |
| **CommunityImpact.tsx** | `value={450}` "Florida homes scanned" (appears twice: compact + full) | Replace with `useTickerStats().total` |
| **MiniTrustBar.tsx** | Default prop `"3,400+ Quotes Analyzed"` | Accept `total` from `useTickerStats` and format dynamically |
| **VariantB_DiagnosticQuiz.tsx** | `stat="3,400+ Quotes Analyzed"` | Pass live `total` formatted as stat string |
| **VariantD_UrgencyEvent.tsx** | Fallback `"3,400+ Quotes Analyzed"` | Same: pass live total |
| **ScannerSocialProof.tsx** | Already uses `useTickerStats()` | No change needed |
| **AnimatedStatsBar.tsx** | Already uses `useTickerStats()` | No change needed |
| **ScannerHeroWindow.tsx** | Already uses `useTickerStats()` | No change needed |
| **PathSelector.tsx** | Already uses `useTickerStats()` | No change needed |

## Technical Details

### File Changes

**1. `src/components/proof/EvidenceHero/ProofHero.tsx`**
- Import `UrgencyTicker` and `useTickerStats`
- Remove `proofStats` import (no longer needed here)
- Replace inline "450+ Florida homeowners" text with `{total.toLocaleString()}+`
- Replace the 4-column stat grid with:
  - Full-width `UrgencyTicker` (variant="homepage", size="lg", showToday=true)
  - 3-column grid for the remaining stats (Avg. Overpricing, Total Savings, Insurance Premium Reduction) using hardcoded values that are genuinely static business metrics

**2. `src/pages/Proof.tsx`**
- Update SEO description from "450+" to "thousands of" (static strings can't reference hooks)
- Update JSON-LD description similarly

**3. `src/components/authority/CommunityImpact.tsx`**
- Import `useTickerStats`
- Replace both `value={450}` instances with `total` from the hook

**4. `src/components/floating-cta/steps/choice-variants/shared/MiniTrustBar.tsx`**
- Change default `stat` prop from `"3,400+ Quotes Analyzed"` to accept dynamic values
- No hook here (it's a presentational component) -- callers pass the value

**5. `src/components/floating-cta/steps/choice-variants/VariantB_DiagnosticQuiz.tsx`**
- Import `useTickerStats`
- Pass `stat={`${total.toLocaleString()}+ Quotes Analyzed`}` to MiniTrustBar

**6. `src/components/floating-cta/steps/choice-variants/VariantD_UrgencyEvent.tsx`**
- Import `useTickerStats`
- Replace fallback `"3,400+ Quotes Analyzed"` with live total

**7. `src/data/proof/proofData.ts`**
- Remove `totalHomeowners` from `ProofStats` interface and `proofStats` object (no longer consumed anywhere after changes above)

### No new dependencies needed
`useTickerStats` is already module-level cached with `requestIdleCallback` deferred fetching, so adding it to 2-3 more components has negligible performance cost -- it returns the cached result instantly after the first fetch.

