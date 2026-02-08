

# Context-Aware Icons for QuoteSafetyChecklist

## Overview
Replace the repetitive `CheckCircle` and `XCircle` icons with specific, semantically relevant icons from `lucide-react` to improve visual scannability and make each checklist item instantly recognizable.

---

## Current State

**Problem:** Every "What to Look For" item uses `CheckCircle` and every "Red Flag" uses `XCircle`. This is visually monotonous and doesn't help users quickly identify topics.

**Current Icons:**
- Line 2: `import { CheckCircle, XCircle, Upload, ChevronDown } from 'lucide-react';`
- Line 196: `<CheckCircle className="w-4 h-4 text-emerald-600..." />` (repeated 8x)
- Line 264: `<XCircle className="w-4 h-4 text-rose-600..." />` (repeated 8x)

---

## Icon Mapping

### "What to Look For" (Emerald/Green)

| Item Title | Icon | Rationale |
|------------|------|-----------|
| Impact rating clearly stated | `Shield` | Protection/safety rating |
| Design pressure specified per opening | `Wind` | Wind force resistance |
| Product manufacturer and model identified | `Factory` | Source/manufacturing |
| Detailed installation scope | `Hammer` | Construction work |
| Permit fees included or listed separately | `FileText` | Documentation/paperwork |
| Warranty terms clearly defined | `ShieldCheck` | Verified coverage |
| Payment schedule with milestones | `CalendarClock` | Timeline/scheduling |
| Notice of Right to Cancel included | `Undo2` | Ability to reverse/cancel |

### "Common Red Flags" (Rose/Red)

| Item Title | Icon | Rationale |
|------------|------|-----------|
| Vague "installation included" without details | `HelpCircle` | Unclear/questionable |
| No specific product models or specs | `PackageX` | Unknown/missing product |
| Pressure to sign same-day | `Timer` | Urgency/time pressure |
| Missing permit or inspection mentions | `AlertTriangle` | Danger/warning |
| Lump Sum Pricing (No Breakdown) | `Receipt` | Money/billing issue |
| Hidden "Disposal" or "Admin" Fees | `Trash2` | Waste/disposal costs |
| Missing Design Pressure Ratings | `Gauge` | Missing measurement |
| Vague Warranty Coverage | `ShieldAlert` | Coverage warning |

---

## Technical Implementation

### Step 1: Update Interface

Add an `icon` property to the `ChecklistItem` interface:

```typescript
import { LucideIcon } from 'lucide-react';

interface ChecklistItem {
  title: string;
  description: string;
  icon: LucideIcon;
}
```

### Step 2: Update Imports

Replace the current icon imports with the full set of context-aware icons:

```typescript
import { 
  // Section headers (keep for headers)
  CheckCircle, 
  XCircle,
  // General UI
  Upload, 
  ChevronDown,
  // "What to Look For" icons
  Shield,
  Wind,
  Factory,
  Hammer,
  FileText,
  ShieldCheck,
  CalendarClock,
  Undo2,
  // "Red Flags" icons
  HelpCircle,
  PackageX,
  Timer,
  AlertTriangle,
  Receipt,
  Trash2,
  Gauge,
  ShieldAlert,
} from 'lucide-react';
```

### Step 3: Update Data Arrays

**checklistItems (Green/Emerald):**

```typescript
const checklistItems: ChecklistItem[] = [
  {
    title: 'Impact rating clearly stated (e.g., Large Missile)',
    description: "Florida code requires specific ratings...",
    icon: Shield,
  },
  {
    title: 'Design pressure specified per opening',
    description: "This number (e.g., +50/-50)...",
    icon: Wind,
  },
  {
    title: 'Product manufacturer and model identified',
    description: "Generic terms like 'Impact Window'...",
    icon: Factory,
  },
  {
    title: 'Detailed installation scope (removal, disposal, etc.)',
    description: "A vague 'install included'...",
    icon: Hammer,
  },
  {
    title: 'Permit fees included or listed separately',
    description: "Permits are mandatory...",
    icon: FileText,
  },
  {
    title: 'Warranty terms (product + labor) clearly defined',
    description: "Manufacturer warranties cover...",
    icon: ShieldCheck,
  },
  {
    title: 'Payment schedule with milestones',
    description: "Never pay 100% upfront...",
    icon: CalendarClock,
  },
  {
    title: 'Notice of Right to Cancel included',
    description: "Florida law grants a 3-day...",
    icon: Undo2,
  },
];
```

**redFlags (Red/Rose):**

```typescript
const redFlags: ChecklistItem[] = [
  {
    title: 'Vague "installation included" without details',
    description: "This catch-all phrase...",
    icon: HelpCircle,
  },
  {
    title: 'No specific product models or specs',
    description: "If they won't name the window...",
    icon: PackageX,
  },
  {
    title: 'Pressure to sign same-day for "special pricing"',
    description: "Legitimate pricing is based on...",
    icon: Timer,
  },
  {
    title: 'Missing permit or inspection mentions',
    description: "Unpermitted work is illegal...",
    icon: AlertTriangle,
  },
  {
    title: 'Lump Sum Pricing (No Breakdown)',
    description: "Bundling everything into one big number...",
    icon: Receipt,
  },
  {
    title: 'Hidden "Disposal" or "Admin" Fees',
    description: "Some quotes leave out disposal costs...",
    icon: Trash2,
  },
  {
    title: 'Missing Design Pressure Ratings',
    description: "Design pressure determines if...",
    icon: Gauge,
  },
  {
    title: 'Vague Warranty Coverage (Labor vs. Product)',
    description: "Contractors often hide that...",
    icon: ShieldAlert,
  },
];
```

### Step 4: Update Render Logic

Replace the static icon references with dynamic rendering using the `item.icon` property:

**For "What to Look For" items (line ~196):**

```tsx
// Before:
<CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />

// After:
<item.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
```

**For "Red Flags" items (line ~264):**

```tsx
// Before:
<XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />

// After:
<item.icon className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
```

---

## Visual Result

```text
┌────────────────────────────────────────────────────────────────────┐
│ ✓ What to Look For                                                 │
├────────────────────────────────────────────────────────────────────┤
│  🛡️ Impact rating clearly stated (e.g., Large Missile)        ▼  │
│  💨 Design pressure specified per opening                      ▼  │
│  🏭 Product manufacturer and model identified                  ▼  │
│  🔨 Detailed installation scope (removal, disposal, etc.)      ▼  │
│  📄 Permit fees included or listed separately                  ▼  │
│  ✅ Warranty terms (product + labor) clearly defined           ▼  │
│  📅 Payment schedule with milestones                           ▼  │
│  ↩️ Notice of Right to Cancel included                         ▼  │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ ✗ Common Red Flags                                                 │
├────────────────────────────────────────────────────────────────────┤
│  ❓ Vague "installation included" without details              ▲  │
│     This catch-all phrase often hides sub-standard materials...    │
│  📦 No specific product models or specs                        ▼  │
│  ⏱️ Pressure to sign same-day for "special pricing"            ▼  │
│  ⚠️ Missing permit or inspection mentions                      ▼  │
│  🧾 Lump Sum Pricing (No Breakdown)                            ▼  │
│  🗑️ Hidden "Disposal" or "Admin" Fees                          ▼  │
│  📊 Missing Design Pressure Ratings                            ▼  │
│  🛡️⚠️ Vague Warranty Coverage (Labor vs. Product)              ▼  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Preserved Elements

| Element | Status |
|---------|--------|
| Section header icons (`CheckCircle`, `XCircle`) | **Kept** - Lines 164, 232 unchanged |
| Color scheme (emerald/rose) | **Kept** - Same Tailwind classes |
| Icon sizing (`w-4 h-4`) | **Kept** - Consistent with current |
| Dark mode support | **Kept** - Same `dark:text-*` classes |
| Accordion behavior | **Unchanged** |
| Analytics tracking | **Unchanged** |

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/quote-scanner/QuoteSafetyChecklist.tsx` | MODIFY | Update imports, add `icon` to interface and data arrays, render dynamic icons |

