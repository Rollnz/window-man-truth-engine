

# Match "Before" Box to Reference Screenshot

## Key Visual Differences to Fix

### 1. Outer container styling (`QuoteUploadZone.tsx`)
- Change from `border-2 border-dashed` to a solid subtle border with shadow (`border border-border/40 shadow-xl rounded-2xl`)
- Change `overflow-hidden` to `overflow-visible` so callout badges can extend outside the card boundary (as shown in the reference where badges poke out beyond the card edges)
- Keep `aspect-square` and `bg-card/50`

### 2. Sample document styling (`SampleQuoteDocument.tsx`)
- Remove the dashed border (`border-dashed border-border/60`) and replace with no visible border — the document text should sit directly on the card background
- Adjust the inset and spacing to better match the reference layout (more breathing room at top)
- Add a subtle `Date: May 28, 2025` next to Customer line to match the reference

### 3. Upload CTA card (`QuoteUploadZone.tsx`)
- Remove the circular ScanSearch icon above the heading — the reference shows no icon circle
- Keep "Analyze Quote" heading in primary/green bold text
- Make the "Upload Your Quote" button dark/black (`bg-foreground text-background` or similar) to match the dark button in the reference
- Slightly reduce card max-width and padding for a tighter look

### 4. Callout positions fine-tuned (`QuoteUploadZone.tsx`)
- **Price Warning** (red, top-right): Shift to partially overflow outside the card boundary — `top-[15%] -right-3`
- **Warranty Issue** (yellow, left): Position at roughly 40% from top, partially behind center card — `top-[38%] -left-2`
- **Missing Scope** (red, bottom-left): Position to overflow bottom-left — `-bottom-2 -left-3`
- **Legal Clause** (red, bottom-right): Position to overflow bottom-right — `-bottom-2 -right-3`

### 5. Description text always visible (`EnhancedFloatingCallout.tsx`)
- Remove `hidden md:block` from description text — in the reference all descriptions are visible even at smaller sizes

## Files Modified

| File | Change |
|------|--------|
| `QuoteUploadZone.tsx` | Container border/overflow, remove icon circle, dark button, callout positions |
| `SampleQuoteDocument.tsx` | Remove dashed border, add date field, spacing tweaks |
| `EnhancedFloatingCallout.tsx` | Show description on all screen sizes |

## What Stays the Same
- All upload functionality (drag/drop, file input, analyzing state)
- Animation delays and stagger logic
- Callout color strategy (red/yellow)
- The forwardRef and scroll-to behavior

