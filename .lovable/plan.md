
# Audit Page Lead Modal & Secondary CTA Implementation

## Summary
Implement a comprehensive lead capture system for the `/audit` page with:
- Sample Report Gate Modal (4-field lead capture → redirect to /sample-report)
- Hero section dual CTAs (Primary: scan, Secondary: view sample)
- NoQuoteEscapeHatch integration with modal
- Centralized config constants
- Full GTM/dataLayer tracking

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/config/auditConfig.ts` | **Create** | Single source of truth for all copy |
| `src/components/audit/SampleReportGateModal.tsx` | **Create** | Lead capture modal component |
| `src/pages/Audit.tsx` | **Modify** | State, handlers, modal render |
| `src/components/audit/ScannerHeroWindow.tsx` | **Modify** | Add secondary CTA + urgency line |
| `src/components/audit/NoQuoteEscapeHatch.tsx` | **Modify** | Wire first card to modal callback |
| `src/types/sourceTool.ts` | **Modify** | Add `audit-sample-report` |
| `supabase/functions/_shared/sourceTools.ts` | **Modify** | Add `audit-sample-report` |

---

## File 1: `src/config/auditConfig.ts` (Create)

Central config for all audit page copy - single source of truth.

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// Audit Page Configuration - Single Source of Truth
// ═══════════════════════════════════════════════════════════════════════════

export const AUDIT_CONFIG = {
  // Sample Report Gate Modal
  sampleGate: {
    headline: "Don't Risk Your Biggest Asset",
    subheadline: 'See exactly what a "safe" quote looks like. View a sample report.',
    cta: 'Get My Sample Report',
    redirectTo: '/sample-report',
    redirectDelayMs: 1500,
    firstFocusId: 'sample-gate-firstName',
    loadingText: 'Sending...',
    successText: 'Success! Redirecting to your report…',
  },

  // Hero Section CTAs
  hero: {
    urgencyLine: 'Join 12,000+ Florida homeowners who checked their quote before signing.',
    primaryCtaLabel: 'Scan My Quote Free',
    sampleCtaLabel: 'No quote yet? View a sample audit',
    sampleCtaSubline: 'See exactly what we flag before you get a quote.',
    trustLine: '100% Private & Secure • No account needed to start',
  },

  // NoQuote Section
  noQuote: {
    sampleCardCta: 'Send Me the Sample',
  },
} as const;
```

---

## File 2: `src/components/audit/SampleReportGateModal.tsx` (Create)

Lead capture modal following existing patterns (SampleReportLeadModal + TrustModal).

### Props Interface

```typescript
interface SampleReportGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}
```

### Key Implementation Details

**1. Form State & Validation**
- Uses `useFormValidation` hook with `commonSchemas` (firstName, lastName, email, phone)
- All 4 fields required via schema validation
- Phone formatting via `formatPhoneNumber`

**2. Submission Flow**
- Validates all fields → calls `save-lead` edge function
- `sourceTool: 'audit-sample-report'`
- `formLocation: 'audit_sample_gate'`
- On success: show success state → redirect after delay

**3. Error Handling**
- Show error inline in modal (not global toast)
- Uses sonner `toast.error()` suppression pattern

**4. Focus Management**
- `autoFocus` on first input (firstName) via `id={AUDIT_CONFIG.sampleGate.firstFocusId}`
- On close: restore focus to `returnFocusRef.current`
- Reset form values and errors when modal closes

**5. GTM Tracking Events**
- `audit_sample_gate_open` - Modal opened
- `audit_sample_gate_close` - Modal closed without submit
- `audit_sample_gate_submit` - Form submitted
- `audit_sample_gate_success` - Lead captured (with lead_id)
- `audit_sample_gate_error` - Submission failed
- `lead_submission_success` - Enhanced conversions (via trackLeadSubmissionSuccess)

### Component Structure

```tsx
<Dialog open={isOpen} onOpenChange={handleOpenChange}>
  <TrustModal
    modalTitle={undefined} // Custom header inside
    headerAlign="center"
    className="sm:max-w-md bg-slate-900 border-t-orange-500"
  >
    {step === 'form' ? (
      <>
        {/* Lock Icon + Headline + Subheadline */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Lock className="w-7 h-7 text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{AUDIT_CONFIG.sampleGate.headline}</h2>
          <p className="text-slate-400 text-sm mt-2">{AUDIT_CONFIG.sampleGate.subheadline}</p>
        </div>

        {/* Form: firstName, lastName, email, phone */}
        <form onSubmit={handleSubmit}>
          <NameInputPair ... />
          <Input id="sample-gate-email" type="email" ... />
          <Input id="sample-gate-phone" type="tel" ... />
          
          {/* Error display (inline) */}
          {error && <p className="text-destructive text-sm">{error}</p>}
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? loadingText : AUDIT_CONFIG.sampleGate.cta}
          </Button>
        </form>
      </>
    ) : (
      /* Success state with spinner */
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-success mx-auto mb-4" />
        <p className="text-white font-medium">{AUDIT_CONFIG.sampleGate.successText}</p>
      </div>
    )}
  </TrustModal>
</Dialog>
```

### Dark Theme Styling (matching /audit page)

```tsx
// Override TrustModal white styling for dark theme
className="sm:max-w-md !bg-slate-900 !border-t-orange-500"

// Form inputs: white bg for legibility
<Input className="bg-white text-slate-900 border-slate-300" />

// Labels: white text
<Label className="text-white font-semibold" />
```

---

## File 3: `src/pages/Audit.tsx` (Modify)

### State & Refs to Add

```typescript
// Sample gate modal state
const [sampleGateOpen, setSampleGateOpen] = useState(false);
const sampleGateTriggerRef = useRef<HTMLElement | null>(null);

// Handler to open modal with focus tracking
const openSampleGate = useCallback(() => {
  sampleGateTriggerRef.current = document.activeElement as HTMLElement;
  setSampleGateOpen(true);
}, []);

// Close handler
const closeSampleGate = useCallback(() => {
  setSampleGateOpen(false);
  // Focus restoration happens in modal component
}, []);
```

### Updated Component Props

```tsx
<ScannerHeroWindow 
  onScanClick={scrollToUpload} 
  onViewSampleClick={openSampleGate}  // NEW
/>

<NoQuoteEscapeHatch 
  onViewSampleClick={openSampleGate}  // NEW
/>
```

### Modal Render (at bottom of JSX)

```tsx
{/* Sample Report Gate Modal */}
<SampleReportGateModal
  isOpen={sampleGateOpen}
  onClose={closeSampleGate}
  returnFocusRef={sampleGateTriggerRef}
/>
```

---

## File 4: `src/components/audit/ScannerHeroWindow.tsx` (Modify)

### Props Update

```typescript
interface ScannerHeroWindowProps {
  onScanClick: () => void;
  onViewSampleClick?: () => void;  // NEW - optional for backwards compat
}
```

### CTA Block Update (Window Sill Section)

**Order (vertical stack):**
1. Urgency line (muted)
2. Primary CTA button ("Scan My Quote Free")
3. Secondary CTA button (if `onViewSampleClick` provided)
4. Optional subline under secondary
5. Trust line with lock icon

```tsx
<div className="flex flex-col items-center space-y-4">
  {/* Urgency Line */}
  <p className="text-slate-400 text-sm text-center max-w-md">
    {AUDIT_CONFIG.hero.urgencyLine}
  </p>

  {/* Primary CTA - existing button with minor label update */}
  <Button onClick={onScanClick} ...>
    <Scan className="w-6 h-6 mr-3" />
    {AUDIT_CONFIG.hero.primaryCtaLabel}
  </Button>

  {/* Secondary CTA - only if callback provided */}
  {onViewSampleClick && (
    <div className="flex flex-col items-center space-y-2">
      <Button
        variant="outline"
        onClick={onViewSampleClick}
        className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        {AUDIT_CONFIG.hero.sampleCtaLabel}
      </Button>
      
      {/* Optional subline */}
      {AUDIT_CONFIG.hero.sampleCtaSubline && (
        <p className="text-slate-500 text-xs">
          {AUDIT_CONFIG.hero.sampleCtaSubline}
        </p>
      )}
    </div>
  )}

  {/* Trust Line */}
  <div className="flex items-center gap-2 text-slate-400 text-sm">
    <Lock className="w-4 h-4 text-emerald-500" />
    <span>{AUDIT_CONFIG.hero.trustLine}</span>
  </div>
</div>
```

---

## File 5: `src/components/audit/NoQuoteEscapeHatch.tsx` (Modify)

### Props Update

```typescript
interface NoQuoteEscapeHatchProps {
  onViewSampleClick?: () => void;  // NEW
}
```

### Add Sample Report Card as First Option

Insert new card at position 0 in the grid (before Calculator):

```tsx
const ALTERNATIVES = [
  // NEW: Sample Report Card (first position)
  {
    icon: FileText,
    title: 'View Sample Report',
    description: 'See exactly what our AI flags before you get your own quote. No commitment needed.',
    cta: AUDIT_CONFIG.noQuote.sampleCardCta,
    action: 'modal', // Special marker for callback vs href
    color: 'orange',
    gradient: 'from-orange-500 to-amber-400',
  },
  // Existing cards follow...
  {
    icon: Calculator,
    title: 'Get an Instant Estimate',
    ...
  },
];
```

### Conditional Rendering for Action Type

```tsx
{alt.action === 'modal' && onViewSampleClick ? (
  <Button
    variant="outline"
    onClick={onViewSampleClick}
    className="w-full ..."
  >
    {alt.cta}
    <ArrowRight className="w-4 h-4 ml-2" />
  </Button>
) : (
  <Link to={alt.href}>
    <Button variant="outline" className="w-full ...">
      {alt.cta}
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </Link>
)}
```

---

## File 6 & 7: Source Tools Updates

### `src/types/sourceTool.ts`

Add to SOURCE_TOOLS array:
```typescript
'audit-sample-report', // Audit page sample report gate
```

### `supabase/functions/_shared/sourceTools.ts`

Add to SOURCE_TOOLS array (must match frontend):
```typescript
'audit-sample-report',
```

---

## GTM Event Summary

| Event Name | Trigger | Key Properties |
|------------|---------|----------------|
| `audit_sample_gate_open` | Modal opens | `trigger_element` |
| `audit_sample_gate_close` | Modal closes without submit | `time_open_ms` |
| `audit_sample_gate_submit` | Form submitted | `has_phone` |
| `audit_sample_gate_success` | Lead captured | `lead_id`, `source_tool` |
| `audit_sample_gate_error` | API error | `error_message` |
| `lead_submission_success` | Enhanced conversions | Full EMQ payload |

---

## Focus Management Flow

```text
User clicks "View Sample" button
  ↓
sampleGateTriggerRef.current = document.activeElement (the button)
setSampleGateOpen(true)
  ↓
Modal opens → autoFocus on firstName input
  ↓
User submits OR closes
  ↓
Modal closes → focus restored to sampleGateTriggerRef.current
```

---

## Technical Considerations

1. **Dark Theme Override**: The TrustModal defaults to white background. Need to override with `!bg-slate-900` for audit page consistency.

2. **Form Reset on Close**: useEffect watching `isOpen` to reset form state when modal closes.

3. **Redirect vs Navigate**: Use `window.location.href` for redirect (not React Router navigate) to ensure full page load of /sample-report.

4. **Error Toast Suppression**: Don't show global toast on error - only inline error in modal.

5. **Backwards Compatibility**: `onViewSampleClick` is optional in both hero and NoQuote components.

---

## Testing Checklist

After implementation:
1. Click "No quote yet? View a sample audit" in hero → modal opens
2. Click "Send Me the Sample" in NoQuote section → same modal opens
3. Tab through form fields → focus stays in modal
4. Submit with empty fields → validation errors appear
5. Submit valid form → success state → redirect to /sample-report
6. Press ESC or click outside → modal closes, focus returns to trigger
7. Open modal, close without submit → form resets on next open
8. Check GTM dataLayer for all 6 events
9. Verify on mobile: buttons are full-width, touch targets ≥44px
