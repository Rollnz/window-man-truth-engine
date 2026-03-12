

# Plan: Comprehensive Scanner Brain Test Suite

The existing `scanner-brain/scoring.test.ts` already has basic happy/sad path tests. The `vitest.config.ts` already includes `scanner-brain/**/*.{test,spec}.{js,ts,jsx,tsx}`. So this is about **expanding coverage** with edge cases that matter for the app's core mission: protecting Florida homeowners from predatory window contractors.

## What to Add

### 1. Hard Cap Edge Cases (Florida Statute Enforcement)
The app's core value proposition is statutory protection. Every cap path needs isolated testing:
- **Owner-builder language** (F.S. 489.103) → cap at 25
- **Deposit exactly 50%** → no cap (boundary); **51%** → cap at 55 (F.S. 501.137)
- **Payment before completion** (F.S. 489.126) → cap at 40
- **Tempered-only risk** without laminated → cap at 30
- **Multiple caps simultaneously** → lowest ceiling wins (e.g., no license + high deposit = 25, not 55)
- **Cap priority**: verify that when both no-license (25) and deposit-over-50 (55) apply, the result is 25

### 2. Price Per Opening Scenarios
This is what homeowners compare — it must be accurate:
- No price found → "N/A"
- No opening count → "N/A"
- Zero openings → "N/A" (no division by zero)
- `openingCountHint` fallback when `openingCountEstimate` is null
- Rounding to nearest $50

### 3. Price Score Brackets
The sweet spot ($1200–$1800) should score highest. Test all 5 brackets:
- Below $1000 → 40
- $1000–$1199 → 65
- $1200–$1800 → 95
- $1801–$2500 → 75
- Over $2500 → 55 (or 65 with premium indicators)

### 4. Curve Function Behavior
- Score ≤70 → unchanged
- Score 71 → barely above 70
- Score 100 raw → curved down significantly (A+ should be rare)

### 5. Custom Weights (Dynamic Weight Injection)
- Verify custom weights shift pillar emphasis (e.g., safety=1.0 and all else 0 → overall = safety score)

### 6. Warning and Missing Item Caps
- Verify warnings capped at 6 items max
- Verify missing items capped at 6 items max

### 7. Forensic Summary Edge Cases
- Score exactly at risk-level boundaries (30, 50, 70)
- Quote with all positives but one hard cap → still shows positives? (no — score < 75 after cap)
- Questions generated for each deficiency type

### 8. Safe Preview Boundary Tests
- Score 30 → critical, score 31 → high, score 50 → high, score 51 → moderate, score 70 → moderate, score 71 → acceptable
- `hasCriticalCap` only true when cap ceiling ≤ 30

### Files to Modify
- **`scanner-brain/scoring.test.ts`** — rewrite with comprehensive edge case coverage (~200 lines)
- **`vitest.config.ts`** — already includes scanner-brain glob, no changes needed

