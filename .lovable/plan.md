

# Hardened Smart Lead Suppression

## What Changes (User Perspective)

1. User clicks "No Quote Yet?" in the Hero, fills out the form, completes the flow.
2. User scrolls down and clicks "No Quote Yet? View a Sample Audit" on the After card.
3. The modal opens, skips the form, and shows the Timeline step with a "Welcome back" message. No double data entry.
4. Same-CTA repeat clicks are still suppressed (no spam).

## Technical Changes

### File 1: CREATE `src/hooks/forms/useLeadSuppression.ts`

Custom hook encapsulating all sessionStorage suppression logic.

**Returns:**
```text
hasGlobalLead    -- storedLeadId exists OR global_completed flag is true
hasCompletedCta  -- this specific ctaSource was completed
storedLeadId     -- lead ID from sessionStorage (or null)
markCompleted()  -- sets global flag + per-CTA flag (callback, not render side-effect)
```

**Storage keys:**
- `wm_prequote_v2_lead_id` -- existing, unchanged
- `wm_prequote_v2_global_completed` -- new global flag
- `wm_prequote_v2_completed_${ctaSource}` -- new per-CTA flag

**Safety details:**
- All reads are synchronous (safe in render). All writes happen inside the `markCompleted` callback only.
- If `ctaSource` is falsy, falls back to `'unknown'` and logs a dev-mode `console.warn`.
- Legacy cleanup: removes stale `wm_prequote_v2_completed` key inside a `useEffect` (not during render).
- `hasGlobalLead` is defined broadly: `!!storedLeadId || globalCompletedFlag`. This means a user who completed Step 1 but closed early is still recognized as returning (critique point C).

### File 2: EDIT `src/hooks/forms/index.ts`

Add barrel export for `useLeadSuppression`.

### File 3: EDIT `src/components/LeadModalV2/PreQuoteLeadModalV2.tsx`

**A. Remove old helpers (lines 44, 63-77)**

Delete `COMPLETION_SESSION_KEY`, `hasCompletedInSession`, `markCompletedInSession`. Keep `SESSION_KEY`, `getStoredLeadId`, `storeLeadId` (still needed for Step 1 writes).

**B. Wire up the hook**

```typescript
const { hasGlobalLead, hasCompletedCta, storedLeadId, markCompleted } =
  useLeadSuppression(ctaSource);
```

**C. Suppression logic**

Replace lines 134-135:

```typescript
const suppressOpen = hideAfterCompletion && hasCompletedCta;
```

Same CTA completed = suppress. Different CTA = open with skip.

**D. leadId initialization (critique point 1)**

Replace line 141:

```typescript
const [leadId, setLeadId] = useState<string | null>(storedLeadId ?? null);
```

Plus a safety guard for mount-order race conditions:

```typescript
useEffect(() => {
  if (hasGlobalLead && !leadId && storedLeadId) {
    setLeadId(storedLeadId);
  }
}, [hasGlobalLead, storedLeadId, leadId]);
```

**E. Step reset on open (critique point A)**

`useState('capture')` only runs on mount, not on re-open. Replace the initial `useState` with `'capture'` and add a deterministic "on open" effect:

```typescript
const [step, setStep] = useState<StepType>('capture');

useEffect(() => {
  if (!isOpen) return;
  if (hasGlobalLead && storedLeadId) {
    setStep('timeline');
  } else {
    setStep('capture');
  }
}, [isOpen, hasGlobalLead, storedLeadId]);
```

This fires every time the modal opens, ensuring step always matches reality. The existing "reset on close" effect (lines 163-195) is updated to not conflict -- it only resets qualification data and scoring, not the step (the "on open" effect owns that).

**F. Re-engagement tracking with ref guard (critique point B)**

```typescript
const reengagedRef = useRef(false);

useEffect(() => {
  if (!isOpen) {
    reengagedRef.current = false;
    return;
  }
  if (reengagedRef.current) return;

  const didSkip = hasGlobalLead && !!storedLeadId && step === 'timeline';
  if (!didSkip) return;

  reengagedRef.current = true;
  trackEvent('prequote_modal_reengaged', {
    cta_source: ctaSource,
    lead_id: storedLeadId,
    skip_capture: true,
  });
}, [isOpen, hasGlobalLead, storedLeadId, step, ctaSource]);
```

Fires exactly once per modal open. Resets when modal closes. Correct deps, no stale values.

**G. Mark completion (line 497)**

Replace `markCompletedInSession()` with `markCompleted()` (sets both global + per-CTA keys). This only fires when the user explicitly closes the result screen (critique point D -- lifecycle agreement).

**H. Render guard for capture step (line 534)**

Replace `!(hideAfterCompletion && hasCompletedLead)` with `!suppressOpen` to use the new logic consistently.

### File 4: EDIT `src/components/LeadModalV2/LeadStepTimeline.tsx`

Add optional `isReturning` prop. When true, prepend "Welcome back -- " to the heading:

```typescript
interface LeadStepTimelineProps {
  onSelect: (value: Timeline) => void;
  selected: Timeline | null;
  isReturning?: boolean;
}
```

Heading becomes:
```tsx
{isReturning ? 'Welcome back — when' : 'When'} are you planning your window project?
```

Passed from PreQuoteLeadModalV2:
```tsx
<LeadStepTimeline
  onSelect={handleTimelineSelect}
  selected={qualification.timeline}
  isReturning={hasGlobalLead && !!storedLeadId}
/>
```

## Files Summary

| File | Action |
|------|--------|
| `src/hooks/forms/useLeadSuppression.ts` | Create |
| `src/hooks/forms/index.ts` | Edit (add export) |
| `src/components/LeadModalV2/PreQuoteLeadModalV2.tsx` | Edit |
| `src/components/LeadModalV2/LeadStepTimeline.tsx` | Edit |

## Edge Cases Handled

- **useState only runs on mount**: "On open" effect sets step deterministically each time (critique A)
- **Re-engagement fires once per open**: Ref guard + correct deps (critique B)
- **Early close after Step 1**: `hasGlobalLead` checks `storedLeadId` existence, not just completion flag (critique C)
- **markCompleted lifecycle**: Only fires on explicit result screen close (critique D)
- **Missing ctaSource**: Falls back to `'unknown'`, logs dev warning
- **Legacy storage key**: Cleaned up in useEffect
- **sessionStorage unavailable**: All reads return false/null, all writes silently fail
- **leadId null on skip**: Guard useEffect syncs from storage
- **Multiple instances mounted**: All read from same storage, stay in sync

