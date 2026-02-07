

# Strict Funnel Strategy Implementation
## Tasks 1, 2, 3, 5, 7

---

## Overview

This implementation transforms 5 "Money Pages" into a focused funnel by:
- Creating a minimal Funnel Navbar (Task 1)
- Removing PillarBreadcrumb badges (Task 2)
- Hiding MobileStickyFooter (Task 3)
- Fixing the AI Scanner dead end with a success state (Task 5)
- Removing RelatedToolsGrid distractions (Task 7)

---

## Task 1: Create Funnel-Mode Navbar

**Goal**: Strip all navigation links on Core 5 pages. Keep only Logo + "Call Window Man" + Vault icon.

### Changes to `src/components/home/Navbar.tsx`

Add `funnelMode?: boolean` prop that:
- Hides: Tools, Evidence, Intel Library, Beat Your Quote, ReadinessIndicator
- Shows: Logo, "Call Window Man" tel button, Vault icon-only login
- Keeps: Theme toggle on desktop

### Funnel Mode Layout
```text
Desktop: [Logo] ──────────────────── [📞 Call Window Man] [🔒] [🌙]
Mobile:  [Logo] ───────────────────────────────── [📞] [🔒] [☰]
```

### Pages to Pass `funnelMode={true}`

| Page | File | Current Navbar |
|------|------|----------------|
| Homepage | `src/pages/Index.tsx` | Line 104 |
| AI Scanner | `src/pages/QuoteScanner.tsx` | Line 117 |
| Beat Your Quote | `src/pages/BeatYourQuote.tsx` | Line 133 |
| Sample Report | `src/pages/SampleReport.tsx` | Lines 105, 116 |
| Audit | `src/pages/Audit.tsx` | No Navbar currently - Add one |

---

## Task 2: Hide PillarBreadcrumb on Core 5 Pages

**Goal**: Remove "Part of Risk & Code" badge that leaks users to pillar pages.

### Files to Modify

| File | Line | Component |
|------|------|-----------|
| `src/pages/QuoteScanner.tsx` | Lines 121-123 | `<PillarBreadcrumb toolPath="/ai-scanner" variant="badge" />` |
| `src/pages/BeatYourQuote.tsx` | Lines 136-138 | `<PillarBreadcrumb toolPath="/beat-your-quote" variant="dossier" />` |

**Action**: Delete these JSX blocks entirely.

---

## Task 3: Hide MobileStickyFooter on Core 5 Pages

**Goal**: Prevent sticky footer from blocking mobile viewport on money pages.

### Step 1: Add FUNNEL_ROUTES to `src/config/navigation.ts`

```typescript
/**
 * Funnel Routes - Pages optimized for paid traffic conversion
 * These pages hide distracting UI elements (sticky footer, floating CTAs)
 */
export const FUNNEL_ROUTES = [
  '/',
  '/audit',
  '/ai-scanner',
  '/sample-report',
  '/beat-your-quote',
] as const;
```

### Step 2: Modify `src/components/navigation/MobileStickyFooter.tsx`

Add route check at the top of the component:

```typescript
import { FUNNEL_ROUTES } from '@/config/navigation';

export function MobileStickyFooter() {
  const location = useLocation();
  
  // Hide on funnel pages to reduce distractions
  const isFunnelPage = FUNNEL_ROUTES.includes(location.pathname as any);
  if (isFunnelPage) return null;
  
  // ...rest of component
}
```

---

## Task 5: Fix AI Scanner Post-Submit Dead End (Critical)

**Goal**: Replace toast notification with persistent success state that drives users to Vault.

### Current Flow (Broken)
```text
User clicks "Continue with Email"
    → Lead saved ✓
    → Toast: "Saved! We'll help you..."
    → User left on same page (DEAD END)
```

### New Flow
```text
User clicks "Continue with Email"
    → Lead saved ✓
    → NoQuotePivotSection transforms to SUCCESS STATE:
    
    ┌────────────────────────────────────────────┐
    │  ✓ You're In. Your Vault is Ready.         │
    │                                            │
    │  "I just saved your place. When you get    │
    │   your first quote, upload it here and     │
    │   I'll tell you if it's worth signing."    │
    │                                            │
    │  [Open My Vault]  [Get Quote Checklist]    │
    └────────────────────────────────────────────┘
```

### Implementation Steps

**Step 1**: Add state to `src/pages/QuoteScanner.tsx`

```typescript
const [isNoQuoteSubmitted, setIsNoQuoteSubmitted] = useState(false);
```

**Step 2**: Update `onEmailSubmit` handler (lines 208-275)

Replace the toast with:
```typescript
if (result?.leadId) {
  // ...existing tracking code...
  setIsNoQuoteSubmitted(true);  // NEW: Trigger success state
  // Remove toast call
}
```

**Step 3**: Pass to `NoQuotePivotSection`:

```tsx
<NoQuotePivotSection 
  isLoading={isNoQuoteSubmitting}
  isSubmitted={isNoQuoteSubmitted}  // NEW PROP
  onGoogleAuth={...}
  onEmailSubmit={...}
/>
```

**Step 4**: Modify `src/components/quote-scanner/vault-pivot/NoQuotePivotSection.tsx`

Add `isSubmitted?: boolean` prop and render success UI when true:

```tsx
interface NoQuotePivotSectionProps {
  onGoogleAuth?: () => void;
  onEmailSubmit?: (data: {...}) => void;
  isLoading?: boolean;
  isSubmitted?: boolean;  // NEW
}

export function NoQuotePivotSection({ 
  onGoogleAuth, onEmailSubmit, isLoading, isSubmitted 
}: NoQuotePivotSectionProps) {
  
  // SUCCESS STATE
  if (isSubmitted) {
    return (
      <div className="max-w-[680px] mx-auto p-8 md:p-10 rounded-xl border border-border/40 bg-background">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          
          {/* Success Message */}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            You're In. Your Vault is Ready.
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            I just saved your place. When you get your first quote, 
            upload it here and I'll tell you if it's worth signing.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/vault">
                <Vault className="w-5 h-5 mr-2" />
                Open My Vault
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/spec-checklist-guide">
                Get Quote Checklist
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // EXISTING FORM UI
  return (
    <div className="max-w-[680px] mx-auto...">
      {/* ...existing code... */}
    </div>
  );
}
```

---

## Task 7: Remove RelatedToolsGrid from Core 5 Pages

**Goal**: Stop leaking users to 15+ secondary tools.

### Files to Modify

| File | Lines | Section |
|------|-------|---------|
| `src/pages/QuoteScanner.tsx` | 297-302 | RelatedToolsGrid section |
| `src/pages/BeatYourQuote.tsx` | 168-173 | RelatedToolsGrid section |

**Action**: Delete these JSX blocks and their imports.

### QuoteScanner.tsx - Remove lines 297-302:
```tsx
{/* Related Tools - "Enforce Your Rights" section */}
<RelatedToolsGrid
  title={getFrameControl('quote-scanner').title}
  description={getFrameControl('quote-scanner').description}
  tools={getSmartRelatedTools('quote-scanner', sessionData.toolsCompleted)}
/>
```

### BeatYourQuote.tsx - Remove lines 168-173:
```tsx
{/* Related Tools */}
<RelatedToolsGrid
  title={getFrameControl('beat-your-quote').title}
  description={getFrameControl('beat-your-quote').description}
  tools={getSmartRelatedTools('beat-your-quote', sessionData.toolsCompleted)}
/>
```

Also remove unused imports:
- `getSmartRelatedTools`, `getFrameControl` from `@/config/toolRegistry`
- `RelatedToolsGrid` from `@/components/ui/RelatedToolsGrid`

---

## Files Summary

| File | Changes | Risk |
|------|---------|------|
| `src/config/navigation.ts` | Add `FUNNEL_ROUTES` array | Very Low |
| `src/components/home/Navbar.tsx` | Add `funnelMode` prop with simplified UI | Medium |
| `src/components/navigation/MobileStickyFooter.tsx` | Add route-based visibility check | Low |
| `src/pages/Index.tsx` | Pass `funnelMode={true}` | Very Low |
| `src/pages/Audit.tsx` | Add Navbar with `funnelMode={true}` | Low |
| `src/pages/QuoteScanner.tsx` | Remove breadcrumb, grid, add success state | Medium |
| `src/pages/SampleReport.tsx` | Pass `funnelMode={true}` | Very Low |
| `src/pages/BeatYourQuote.tsx` | Remove breadcrumb, grid, pass `funnelMode={true}` | Low |
| `src/components/quote-scanner/vault-pivot/NoQuotePivotSection.tsx` | Add `isSubmitted` prop with success UI | Low |

---

## Implementation Order

| Step | Task | Description |
|------|------|-------------|
| 1 | Task 3 | Add FUNNEL_ROUTES to navigation.ts |
| 2 | Task 3 | Hide MobileStickyFooter on funnel routes |
| 3 | Task 1 | Add funnelMode to Navbar component |
| 4 | Task 1 | Apply funnelMode to all 5 Core pages |
| 5 | Task 2 | Remove PillarBreadcrumb from QuoteScanner |
| 6 | Task 2 | Remove PillarBreadcrumb from BeatYourQuote |
| 7 | Task 7 | Remove RelatedToolsGrid from QuoteScanner |
| 8 | Task 7 | Remove RelatedToolsGrid from BeatYourQuote |
| 9 | Task 5 | Add success state to NoQuotePivotSection |
| 10 | Task 5 | Wire success state in QuoteScanner |

---

## Before/After Comparison

### AI Scanner Before
```text
[Full Navbar: Logo, Tools, Evidence, Intel, Beat Quote, Theme, Vault]
[PillarBreadcrumb: "Part of Risk & Code"]
...scanner content...
[Email Submit → Toast → DEAD END]
[RelatedToolsGrid: 6+ tool links]
[MobileStickyFooter: Beat, Scan, Home, Tools]
```

### AI Scanner After
```text
[Funnel Navbar: Logo, Call Window Man, Vault icon, Theme]
...scanner content...
[Email Submit → Success State → "Open My Vault" + "Get Checklist"]
(No related tools grid)
(No mobile sticky footer)
```

---

## Phone Number for "Call Window Man"

Using existing constant from codebase: `+15614685571`

Display format: `(561) 468-5571`

