
# Visual Quality Assurance Fix for Full-Funnel Audit Page

## Problem Analysis

The `/admin/full-funnel-audit` page has severe contrast issues making text nearly unreadable. From the screenshot and code inspection:

### Root Causes Identified

1. **Accordion Component Global Override**
   - The `AccordionItem` component in `src/components/ui/accordion.tsx` has hardcoded styling:
     - `[background:var(--accordion,transparent)]` - Forces blue gradient on all accordions
     - `text-black` - Forces dark text regardless of theme
   - This works on public pages with intentional gradient backgrounds but breaks admin pages

2. **Badge Color Mismatch**
   - Status badges use `getStatusColor()` which returns `bg-primary/10 text-primary` 
   - These semi-transparent colors appear washed out against the blue gradient background

3. **Missing Theme Override**
   - The admin audit page needs to explicitly opt-out of the gradient accordion styling
   - Validation grid items inherit poor contrast from parent

---

## Technical Solution

### File 1: `src/pages/admin/FullFunnelAudit.tsx`

**Changes Required:**

| Section | Current Issue | Fix |
|---------|--------------|-----|
| AccordionItem | Inherits blue gradient + black text | Override with `[background:transparent] bg-card border border-border text-foreground` |
| AccordionContent validation grid | Inherits `text-black` | Add explicit `text-foreground` class |
| Score badges | Semi-transparent on gradient | Use solid badge variants with proper contrast |
| Event ID code blocks | `bg-muted` nearly invisible | Use `bg-background border border-border` for contrast |
| Network capture stats | `bg-muted/50` washed out | Use `bg-card border border-border` |
| Server-Side Parity text | Uses theme colors on gradient | Force `text-foreground` |

### Specific Code Changes

**1. Accordion Items - Override gradient styling:**
```tsx
<AccordionItem 
  key={result.eventName} 
  value={result.eventName}
  className="[background:transparent] bg-card border border-border rounded-lg mb-2"
>
```

**2. AccordionTrigger - Ensure text visibility:**
```tsx
<AccordionTrigger className="hover:no-underline text-foreground">
```

**3. Validation Grid Items - Force foreground text:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-foreground">
```

**4. Event ID Code Blocks - Higher contrast:**
```tsx
<code className="text-xs bg-background border border-border px-2 py-0.5 rounded text-foreground">
```

**5. Network Capture Stats - Card-style boxes:**
```tsx
<div className="text-center p-4 bg-card border border-border rounded-lg">
  <div className="text-2xl font-bold text-foreground">...</div>
  <div className="text-xs text-muted-foreground">...</div>
</div>
```

**6. Server-Side Parity Line - Ensure readable:**
```tsx
<span className="text-foreground">
  {report.serverSideParity.recommendation}
</span>
```

**7. Score Badges - Solid styling for visibility:**

Replace `getStatusColor()` returns with higher-contrast variants:
```tsx
const getStatusColor = (status: 'PASS' | 'PARTIAL' | 'FAIL') => {
  switch (status) {
    case 'PASS':
      return 'bg-primary text-primary-foreground border-primary';
    case 'PARTIAL':
      return 'bg-amber-500 text-white border-amber-500';
    case 'FAIL':
      return 'bg-destructive text-destructive-foreground border-destructive';
  }
};
```

---

## Visual Before/After

```text
BEFORE:
+------------------------------------------+
| [Blue Gradient Background]               |
| ⚡ scanner_upload    [9.0/10 - invisible]|
| text barely readable, badges washed out  |
+------------------------------------------+

AFTER:
+------------------------------------------+
| [Dark Card Background with Border]       |
| ⚡ scanner_upload    [9.0/10 - SOLID]    |
| High contrast text, visible badges       |
+------------------------------------------+
```

---

## Theme Alignment Verification

| Token | Expected Usage | Applied |
|-------|---------------|---------|
| `bg-background` | Page base | Yes (container) |
| `bg-card` | Elevated surfaces | Yes (accordions, stats) |
| `text-foreground` | Primary text | Yes (event names, validation) |
| `text-muted-foreground` | Secondary text | Yes (labels, hints) |
| `border-border` | Standard borders | Yes (all cards/accordions) |
| `text-primary` | Accent/links | Yes (pass indicators) |
| `text-destructive` | Errors/fails | Yes (fail indicators) |

---

## No New Components

All fixes use existing Tailwind utility classes on standard shadcn components:
- No new CSS files
- No new component imports
- Only inline class overrides

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/FullFunnelAudit.tsx` | Override accordion styling, fix badge contrast, update stat boxes |

## Implementation Notes

1. The `[background:transparent]` CSS-in-class syntax explicitly overrides the `var(--accordion)` gradient
2. Adding `bg-card` after the transparent override applies the theme-correct background
3. All text elements get explicit `text-foreground` to override the `text-black` from accordion component
4. Badge variants switched from semi-transparent (`bg-primary/10`) to solid fills for maximum contrast
