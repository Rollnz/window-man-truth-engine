

# Replace Fake Stats with Scanner Intelligence Bar

## The Problem You're Solving
Fabricated statistics ("$4.2M+ Overcharges Detected") undermine credibility. Users can sense when numbers are inflated. This creates cognitive dissonance — you're asking them to trust your scanner while showing them unverifiable claims.

## The Solution
Replace vanity metrics with **capability transparency**. Instead of "look what we've done," show "here's what we'll do for your quote." This builds trust through specificity, not scale.

---

## Implementation Plan

### 1. Create `ScannerIntelligenceBar.tsx`

**Location:** `src/components/audit/ScannerIntelligenceBar.tsx`

**Content:** 4 Feature Badge cards in a responsive grid

| Badge | Icon | Title | Description |
|-------|------|-------|-------------|
| 1 | `ShieldCheck` | HVHZ Compliance Check | Verifying Florida High-Velocity Hurricane Zone ratings |
| 2 | `Calculator` | Labor/Material Split | Uncovering hidden markups in 'bundled' line items |
| 3 | `FileWarning` | Contract Trap Detection | Scanning for 'Subject to Remeasure' and price-escalation clauses |
| 4 | `Clock` | Warranty Gap Analysis | Identifying hidden labor exclusions in 'Lifetime' promises |

**Visual Design:**
- Navy Blue background (`slate-900/80`)
- Cards with subtle blue borders (`border-primary/20`)
- Safety Orange icons (`text-orange-500`)
- White titles, `slate-400` descriptions
- No animated numbers — clean, static, trustworthy

### 2. Update `Audit.tsx`

Replace import:
```text
- import { AnimatedStatsBar } from '@/components/audit'
+ import { ScannerIntelligenceBar } from '@/components/audit'
```

Replace usage in JSX:
```text
- <AnimatedStatsBar />
+ <ScannerIntelligenceBar />
```

### 3. Update barrel export

Add export in `src/components/audit/index.ts`:
```text
export { ScannerIntelligenceBar } from './ScannerIntelligenceBar';
```

---

## Visual Comparison

**Before (Fake Stats):**
```text
┌─────────────────────────────────────────────────────────┐
│  $4.2M+     12,847+      94%        8,400+              │
│  Overcharges  Quotes    Detection   Homeowners          │
│  Detected    Analyzed    Rate       Protected           │
└─────────────────────────────────────────────────────────┘
```

**After (Scanner Intelligence):**
```text
┌─────────────────────────────────────────────────────────┐
│  🛡️ HVHZ Compliance     💰 Labor/Material Split        │
│  Verifying FL ratings   Uncovering hidden markups      │
│                                                         │
│  ⚠️ Contract Trap       ⏰ Warranty Gap Analysis       │
│  Scanning for clauses   Identifying exclusions         │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/audit/ScannerIntelligenceBar.tsx` | CREATE - New component |
| `src/components/audit/index.ts` | UPDATE - Add export |
| `src/pages/Audit.tsx` | UPDATE - Swap component |

---

## Why This Works Better

1. **Specificity builds trust** — "Contract Trap Detection" is concrete, "94% Detection Rate" is vague
2. **Florida-specific language** — "HVHZ Compliance" signals local expertise
3. **Educational framing** — Users learn what the scanner does, not just that it exists
4. **No verification anxiety** — Users can't question "8,400+ homeowners" if you don't claim it

