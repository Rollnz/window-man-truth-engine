

# Identity-Aware Gating: Fixing the Split-Brain

## The Problem

Today, there are **two separate "is this person known?"** checks that give different answers:

1. **leadAnchor** (cookie + localStorage): Stores only a UUID. Tells you *someone* converted, but not *what* they gave you.
2. **sessionData** (localStorage): Stores firstName, email, phone, etc. But only `ScannerLeadCaptureModal` writes PII here. The main `useLeadFormSubmit` hook (used by 16+ forms) sets the leadAnchor but **never persists contact fields to sessionData**.

Result: A user who converts via the Sample Report flow has a leadAnchor UUID but **empty sessionData**. When they hit the scanner, the gate doesn't know they're verified. They get asked for their info again.

## The Fix (3 Changes)

### Change 1: Persist PII to sessionData in useLeadFormSubmit

**File:** `src/hooks/useLeadFormSubmit.ts`

After the successful `setLeadAnchor(newLeadId)` call (~line 187), add a block that writes the contact fields back to sessionData:

```typescript
// Persist contact fields to sessionData for identity-aware gating
const { updateFields } = useSessionData(); // add to hook dependencies
updateFields({
  leadId: newLeadId,
  firstName: data.firstName,
  lastName: data.lastName,
  email: data.email,
  phone: data.phone,
});
```

This is the **single fix** that closes the gap. Every form that uses `useLeadFormSubmit` (all 16+) will now write contact data to the shared session store.

### Change 2: Add isVerifiedLead() to useLeadIdentity

**File:** `src/hooks/useLeadIdentity.ts`

Add a new computed property that checks for the **4-field completeness** required for gate bypass:

```typescript
const isVerifiedLead = useMemo(() => {
  const hasAnchor = !!getLeadAnchor();
  const hasContact = !!(
    sessionData.firstName &&
    sessionData.email &&
    sessionData.phone
  );
  return hasAnchor && hasContact;
}, [sessionData.firstName, sessionData.email, sessionData.phone]);
```

This returns `true` only when:
- A leadAnchor cookie/localStorage entry exists (proves server-side lead record), AND
- firstName, email, and phone are present in sessionData (proves PII completeness)

lastName is intentionally optional -- many forms only require first name.

### Change 3: Wire isVerifiedLead into the two scanner gates

**File:** `src/hooks/audit/useGatedScanner.ts` (the `/audit` page scanner)

In `completePreGate()`, check `isVerifiedLead()` before opening the modal. If verified, skip straight to analyzing:

```typescript
const completePreGate = useCallback(() => {
  setState(prev => {
    if (prev.phase !== 'pre-gate') return prev;

    if (isVerifiedLead) {
      // Known lead -- skip gate, go straight to analysis
      trackEvent('gate_auto_bypassed', { lead_id: existingLeadId });
      return { ...prev, phase: 'analyzing', isModalOpen: false };
    }

    return { ...prev, phase: 'uploaded', isModalOpen: true };
  });
}, [isVerifiedLead, existingLeadId]);
```

**File:** `src/hooks/useGatedAIScanner.ts` (the `/ai-scanner` page scanner)

Same pattern in `handleFileSelect()` -- if verified, skip the `uploaded` (modal) phase and jump to `locked` then auto-trigger `captureLead` with stored session data. Since this hook doesn't have a pre-gate interstitial, the bypass happens at file select time:

```typescript
const handleFileSelect = useCallback((file: File) => {
  // ... existing file setup ...

  if (isVerifiedLead) {
    // Auto-bypass: skip modal, start analysis immediately
    trackEvent('gate_auto_bypassed', { lead_id: existingLeadId, source: 'ai-scanner' });
    setState({ ...newState, phase: 'locked', isModalOpen: false });
    // Trigger analysis with stored session data
    autoAnalyze(file, scanAttemptId);
    return;
  }

  setState({ ...newState, phase: 'uploaded', isModalOpen: true });
}, [isVerifiedLead]);
```

## What This Does NOT Change

- **No new UI components.** The modal still exists for strangers -- it just gets skipped for known leads.
- **No database changes.** The leadAnchor cookie + sessionData localStorage are the identity store.
- **No changes to save-lead edge function.** The backend already handles duplicate lead submissions gracefully.
- **Sample Report flow already works.** `SampleReportLeadModal`, `SampleReportAccessGate`, and `PreQuoteLeadModalV2` all call either `useLeadFormSubmit` or `setLeadAnchor` directly. Change 1 ensures they all write to sessionData too.

## Files Modified

| File | Change |
|---|---|
| `src/hooks/useLeadFormSubmit.ts` | Persist firstName, lastName, email, phone to sessionData after successful lead save |
| `src/hooks/useLeadIdentity.ts` | Add `isVerifiedLead` boolean to the returned interface |
| `src/hooks/audit/useGatedScanner.ts` | Check `isVerifiedLead` in `completePreGate()` to auto-bypass modal |
| `src/hooks/useGatedAIScanner.ts` | Check `isVerifiedLead` in `handleFileSelect()` to auto-bypass modal |

## CRO Thinking (3 Moves Ahead)

1. **Move 1 (this plan):** Gate bypass for known leads. Paid traffic that re-enters doesn't hit friction. CAC drops.
2. **Move 2 (next):** "Welcome back, {firstName}" personalization in the scanner header when `isVerifiedLead` is true. Zero-cost trust signal.
3. **Move 3 (future):** Server-side lead verification via `verify-lead-exists` edge function. On page load, hydrate sessionData from the database using the leadAnchor UUID. This covers the edge case where a user clears localStorage but still has the cookie -- we can restore their identity from the backend.

