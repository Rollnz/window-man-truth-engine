

# Interactive Accordion QuoteSafetyChecklist with CRO Enhancements

## Overview
Transform the `QuoteSafetyChecklist` component from static list items into an interactive accordion pattern. Add 4 new red flags sourced from the AI Scanner capabilities, include detailed descriptions for all items that expand on click, and implement 3 CRO improvements to maximize user engagement and gather behavioral data.

---

## CRO Enhancements Summary

| Enhancement | Implementation | Goal |
|-------------|----------------|------|
| **Default Expanded State** | First "Red Flag" item opens automatically | Show value immediately without requiring clicks |
| **Expand All Toggle** | Subtle text button above each section | Power users can view all content at once |
| **Interaction Tracking** | `trackEvent` + console.log on item clicks | Learn which red flags resonate most for marketing |

---

## Data Structure Refactor

### New Interface
```typescript
interface ChecklistItem {
  title: string;
  description: string;
}
```

### Updated Data Arrays

**Section 1: What to Look For (8 items)**

| Title | Description |
|-------|-------------|
| Impact rating clearly stated | Florida code requires specific ratings (like 'Large Missile Level D') for hurricane zones. Without this explicit rating, your windows may not pass inspection or qualify for insurance discounts. |
| Design pressure specified per opening | This number (e.g., +50/-50) defines the exact wind force the window can withstand. It must match the specific wind zone requirements of your home's location. |
| Product manufacturer and model identified | Generic terms like 'Impact Window' aren't enough. You need the exact brand and model (e.g., 'PGT WinGuard') to verify performance specs and product approvals. |
| Detailed installation scope | A vague 'install included' leaves room for shortcuts. The quote should specify bucking, anchoring, waterproofing, and debris removal to ensure a code-compliant install. |
| Permit fees included or listed separately | Permits are mandatory for structural work. If fees aren't listed, you might be stuck paying them later, or worse—the contractor might be planning to skip the permit entirely. |
| Warranty terms clearly defined | Manufacturer warranties cover the product, but who covers the work? Ensure the contractor explicitly states how long their labor and workmanship is guaranteed (e.g., 5 years). |
| Payment schedule with milestones | Never pay 100% upfront. A legitimate schedule ties payments to completed steps (e.g., Deposit, Measurement, Delivery, Final Inspection) to protect your leverage. |
| Notice of Right to Cancel included | Florida law grants a 3-day 'cooling-off' period for home improvement contracts signed in your home. This mandatory disclosure protects you from high-pressure sales. |

**Section 2: Red Flags (4 existing + 4 new = 8 items)**

| Title | Description | Status |
|-------|-------------|--------|
| Vague "installation included" without details | This catch-all phrase often hides sub-standard materials. It usually allows them to skip critical finish work like stucco repair, drywall patching, or painting. | Existing |
| No specific product models or specs | If they won't name the window, you can't check its ratings. This is often a bait-and-switch tactic to swap in cheaper, lower-quality builder-grade windows later. | Existing |
| Pressure to sign same-day | Legitimate pricing is based on material costs, not timelines. 'Sign now or the price doubles' is a manipulation tactic designed to stop you from comparing quotes. | Existing |
| Missing permit or inspection mentions | Unpermitted work is illegal, uninsurable, and can force you to tear out the windows later. If they say 'you don't need a permit' for window replacement, run. | Existing |
| Lump Sum Pricing (No Breakdown) | Bundling everything into one big number ('$25,000 for everything') prevents you from seeing overcharged line items or verifying that you aren't paying for phantom services. | **NEW** |
| Hidden "Disposal" or "Admin" Fees | Some quotes leave out disposal costs, hitting you with a surprise bill for hauling away your old windows. Ensure 'removal and disposal' is explicitly written. | **NEW** |
| Missing Design Pressure Ratings | Design pressure determines if the window can actually withstand hurricane-force winds in your specific zone. Without this spec, you have no way to verify code compliance. | **NEW** |
| Vague Warranty Coverage (Labor vs. Product) | Contractors often hide that their labor warranty is much shorter than the product warranty. Demand separate durations for product, labor, and seal failure coverage. | **NEW** |

---

## Visual Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ SECTION HEADER WITH EXPAND ALL TOGGLE                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✗ Common Red Flags                          [Expand All]        │   │
│  │     [text-xs text-muted-foreground hover:text-primary]          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ FIRST ITEM - EXPANDED BY DEFAULT                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✗ Vague "installation included" without details         ▲       │   │
│  │ [bg-white / dark:bg-rose-500/10]                                │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ This catch-all phrase often hides sub-standard materials.       │   │
│  │ It usually allows them to skip critical finish work like        │   │
│  │ stucco repair, drywall patching, or painting.                   │   │
│  │ [bg-slate-50 / dark:bg-zinc-900/50]                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ OTHER ITEMS - COLLAPSED BY DEFAULT                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✗ No specific product models or specs                   ▼       │   │
│  │ [bg-white / dark:bg-rose-500/10]                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Default Expanded State

Initialize the state with the first red flag item already expanded:

```typescript
// Initialize with first red flag expanded by default
const [expandedItems, setExpandedItems] = useState<Set<string>>(() => 
  new Set(['red-0']) // First red flag item ID
);
```

### 2. Expand All Toggle

Add state and handler for expand/collapse all:

```typescript
// Expand all state
const allGoodExpanded = checklistItems.every((_, idx) => 
  expandedItems.has(`good-${idx}`)
);
const allRedExpanded = redFlags.every((_, idx) => 
  expandedItems.has(`red-${idx}`)
);

const toggleAllItems = (section: 'good' | 'red', items: ChecklistItem[]) => {
  setExpandedItems(prev => {
    const next = new Set(prev);
    const allExpanded = items.every((_, idx) => next.has(`${section}-${idx}`));
    
    if (allExpanded) {
      // Collapse all
      items.forEach((_, idx) => next.delete(`${section}-${idx}`));
    } else {
      // Expand all
      items.forEach((_, idx) => next.add(`${section}-${idx}`));
    }
    return next;
  });
};
```

Toggle button JSX:

```tsx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
    Common Red Flags
  </h3>
  <button
    onClick={() => toggleAllItems('red', redFlags)}
    className="text-xs text-slate-500 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
  >
    {allRedExpanded ? 'Collapse All' : 'Expand All'}
  </button>
</div>
```

### 3. Interaction Tracking

Import analytics and track clicks in the toggle function:

```typescript
import { trackEvent } from '@/lib/gtm';

const toggleItem = (id: string, title: string, section: 'good' | 'red') => {
  setExpandedItems(prev => {
    const next = new Set(prev);
    const isExpanding = !next.has(id);
    
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    
    // CRO: Track which items users are curious about
    if (isExpanding) {
      console.log(`📊 Checklist Expand: [${section}] "${title}"`);
      trackEvent('checklist_item_expand', {
        section: section, // 'good' or 'red'
        item_title: title,
        item_id: id,
      });
    }
    
    return next;
  });
};
```

### 4. Complete Accordion Item Component

```tsx
{redFlags.map((item, idx) => {
  const itemId = `red-${idx}`;
  const isExpanded = expandedItems.has(itemId);
  
  return (
    <div
      key={itemId}
      className={cn(
        "rounded-lg overflow-hidden",
        "bg-white border border-rose-200 shadow-sm",
        "dark:bg-rose-500/10 dark:border-rose-500/30 dark:shadow-none"
      )}
    >
      {/* Trigger/Header */}
      <button
        onClick={() => toggleItem(itemId, item.title, 'red')}
        className={cn(
          "w-full flex items-center gap-3 p-3 text-left",
          "hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-colors"
        )}
        aria-expanded={isExpanded}
      >
        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
        <span className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-300">
          {item.title}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-slate-400 dark:text-zinc-500 transition-transform duration-200",
          isExpanded && "rotate-180"
        )} />
      </button>
      
      {/* Expandable Content */}
      <div className={cn(
        "grid transition-all duration-200",
        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}>
        <div className="overflow-hidden">
          <div className={cn(
            "px-3 pb-3 pt-2 border-t",
            "bg-slate-50 border-rose-100",
            "dark:bg-zinc-900/50 dark:border-rose-500/20"
          )}>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
})}
```

---

## Full Data Content

### checklistItems Array (8 items)

```typescript
const checklistItems: ChecklistItem[] = [
  {
    title: 'Impact rating clearly stated (e.g., Large Missile)',
    description: "Florida code requires specific ratings (like 'Large Missile Level D') for hurricane zones. Without this explicit rating, your windows may not pass inspection or qualify for insurance discounts."
  },
  {
    title: 'Design pressure specified per opening',
    description: "This number (e.g., +50/-50) defines the exact wind force the window can withstand. It must match the specific wind zone requirements of your home's location."
  },
  {
    title: 'Product manufacturer and model identified',
    description: "Generic terms like 'Impact Window' aren't enough. You need the exact brand and model (e.g., 'PGT WinGuard') to verify performance specs and product approvals."
  },
  {
    title: 'Detailed installation scope (removal, disposal, etc.)',
    description: "A vague 'install included' leaves room for shortcuts. The quote should specify bucking, anchoring, waterproofing, and debris removal to ensure a code-compliant install."
  },
  {
    title: 'Permit fees included or listed separately',
    description: "Permits are mandatory for structural work. If fees aren't listed, you might be stuck paying them later, or worse—the contractor might be planning to skip the permit entirely."
  },
  {
    title: 'Warranty terms (product + labor) clearly defined',
    description: "Manufacturer warranties cover the product, but who covers the work? Ensure the contractor explicitly states how long their labor and workmanship is guaranteed (e.g., 5 years)."
  },
  {
    title: 'Payment schedule with milestones',
    description: "Never pay 100% upfront. A legitimate schedule ties payments to completed steps (e.g., Deposit, Measurement, Delivery, Final Inspection) to protect your leverage."
  },
  {
    title: 'Notice of Right to Cancel included',
    description: "Florida law grants a 3-day 'cooling-off' period for home improvement contracts signed in your home. This mandatory disclosure protects you from high-pressure sales."
  },
];
```

### redFlags Array (8 items)

```typescript
const redFlags: ChecklistItem[] = [
  {
    title: 'Vague "installation included" without details',
    description: "This catch-all phrase often hides sub-standard materials. It usually allows them to skip critical finish work like stucco repair, drywall patching, or painting."
  },
  {
    title: 'No specific product models or specs',
    description: "If they won't name the window, you can't check its ratings. This is often a bait-and-switch tactic to swap in cheaper, lower-quality builder-grade windows later."
  },
  {
    title: 'Pressure to sign same-day for "special pricing"',
    description: "Legitimate pricing is based on material costs, not timelines. 'Sign now or the price doubles' is a manipulation tactic designed to stop you from comparing quotes."
  },
  {
    title: 'Missing permit or inspection mentions',
    description: "Unpermitted work is illegal, uninsurable, and can force you to tear out the windows later. If they say 'you don't need a permit' for window replacement, run."
  },
  {
    title: 'Lump Sum Pricing (No Breakdown)',
    description: "Bundling everything into one big number ('$25,000 for everything') prevents you from seeing overcharged line items or verifying that you aren't paying for phantom services."
  },
  {
    title: 'Hidden "Disposal" or "Admin" Fees',
    description: "Some quotes leave out disposal costs, hitting you with a surprise bill for hauling away your old windows. Ensure 'removal and disposal' is explicitly written."
  },
  {
    title: 'Missing Design Pressure Ratings',
    description: "Design pressure determines if the window can actually withstand hurricane-force winds in your specific zone. Without this spec, you have no way to verify code compliance."
  },
  {
    title: 'Vague Warranty Coverage (Labor vs. Product)',
    description: "Contractors often hide that their labor warranty is much shorter than the product warranty. Demand separate durations for product, labor, and seal failure coverage."
  },
];
```

---

## Analytics Event Schema

When a user expands an accordion item, the following event is pushed:

```typescript
trackEvent('checklist_item_expand', {
  section: 'red' | 'good',    // Which column was clicked
  item_title: string,          // Full title text for analysis
  item_id: string,             // 'red-0', 'good-3', etc.
});
```

**Console Output Example:**
```
📊 Checklist Expand: [red] "Lump Sum Pricing (No Breakdown)"
```

This data enables:
- Identifying which red flags get the most clicks (marketing headline candidates)
- A/B testing item order based on engagement
- Heat mapping user interest patterns

---

## Accessibility Considerations

- `aria-expanded` attribute on trigger buttons
- Keyboard navigation (Enter/Space to toggle)
- Visible focus rings maintained
- All text meets 5:1 contrast ratio
- Smooth CSS Grid animation (no layout shift)

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/quote-scanner/QuoteSafetyChecklist.tsx` | MODIFY | Refactor to interactive accordion, add 4 new red flags, add descriptions, implement CRO enhancements (default expanded, expand all toggle, analytics tracking) |

---

## Expected Result

- **8 expandable "What to Look For" items** with emerald theme
- **8 expandable "Red Flag" items** with rose theme (4 existing + 4 new)
- **First red flag item expanded by default** to show immediate value
- **"Expand All / Collapse All" toggle** above each section
- **Analytics events fired** on every item expansion for marketing insights
- **Smooth CSS Grid animation** for expand/collapse
- **ChevronDown icon** rotates 180 degrees when expanded
- **Theme-aware styling** maintained exactly as implemented

