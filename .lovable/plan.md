
# Lead Capture Form Double-Submit Protection

## Problem Summary

All 15+ lead capture forms in the codebase use a naive `useState(false)` pattern for loading state:

```typescript
const [isLoading, setIsLoading] = useState(false);
// ...
setIsLoading(true);
try {
  await fetch(...);
} finally {
  setIsLoading(false);
}
```

This pattern has three critical vulnerabilities:

1. **Race Condition**: If a user double-clicks fast enough, both clicks can fire before `setIsLoading(true)` propagates
2. **Unmount Crash**: If the modal closes during submission, React throws a memory leak warning
3. **Enter Key Bypass**: The `disabled` prop only affects click handlers, not keyboard submission

---

## Solution: Enhanced `useFormLock` Hook

### Architecture Decision: "Lockout" Not "Debounce"

As specified, this is NOT a traditional debounce (wait-then-fire). It's a **lockout** pattern:

```text
┌──────────────────────────────────────────────────────────────────┐
│  Click 1 → IMMEDIATELY EXECUTE → Lock engaged                   │
│  Click 2 → BLOCKED (lock active)                                 │
│  Click 3 → BLOCKED (lock active)                                 │
│  Promise resolves → Lock released (minimum 500ms elapsed)        │
│  Click 4 → IMMEDIATELY EXECUTE → Lock engaged                   │
└──────────────────────────────────────────────────────────────────┘
```

### Hook Design

**Create: `src/hooks/forms/useFormLock.ts`**

```typescript
interface UseFormLockOptions {
  /** Minimum time to show loading state (prevents flicker) - default: 500ms */
  minLoadingMs?: number;
  /** Generate idempotency key for network protection - default: true */
  enableIdempotency?: boolean;
  /** Callback when submission is blocked */
  onBlocked?: () => void;
}

interface UseFormLockReturn {
  /** Whether form is locked (use for button disabled state) */
  isLocked: boolean;
  /** Current idempotency key (send in request headers) */
  idempotencyKey: string | null;
  /** Wrap async handler - executes immediately, blocks subsequent calls */
  lockAndExecute: <T>(handler: () => Promise<T>) => Promise<T | undefined>;
  /** Manual unlock (rarely needed - handled automatically) */
  unlock: () => void;
}
```

### Implementation Features

| Requirement | Implementation |
|-------------|----------------|
| Leading Edge Execution | Immediate `setIsLocked(true)` + handler execution |
| Promise Awareness | Lock held until Promise settles (resolve OR reject) |
| Exception Safety | `finally` block always runs, even on throw |
| Unmount Safety | `useRef` for `isMounted` flag, checked before setState |
| Minimum Loading Duration | `Promise.all([handler(), sleep(minLoadingMs)])` |
| Idempotency Keys | Generate UUID on lock, expose for headers |
| Enter Key Guard | Works with `<form onSubmit>` pattern, not just button clicks |

### Key Implementation Details

**1. Immediate Lock (No Debounce Delay)**
```typescript
const lockAndExecute = useCallback(async (handler) => {
  // Synchronous guard - prevents race condition
  if (isLockedRef.current) {
    onBlocked?.();
    return undefined;
  }
  isLockedRef.current = true;
  setIsLocked(true);
  
  // ... execute handler
}, []);
```

**2. Unmount Safety**
```typescript
useEffect(() => {
  isMountedRef.current = true;
  return () => { isMountedRef.current = false; };
}, []);

// Later, in finally block:
if (isMountedRef.current) {
  setIsLocked(false);
}
```

**3. Minimum Loading Duration (Anti-Flicker)**
```typescript
const [result] = await Promise.all([
  handler(),
  minLoadingMs > 0 ? sleep(minLoadingMs) : Promise.resolve(),
]);
```

**4. Idempotency Key Generation**
```typescript
const idempotencyKeyRef = useRef<string | null>(null);

// On lock engage:
if (enableIdempotency) {
  idempotencyKeyRef.current = crypto.randomUUID();
}

// Exposed for use in headers:
headers: {
  'Idempotency-Key': idempotencyKey,
}
```

---

## Migration Strategy

### Phase 1: Create the Hook

Create `src/hooks/forms/useFormLock.ts` with full implementation.

### Phase 2: Update High-Priority Forms

Apply to forms handling real leads (money on the line):

| Form | File | Priority |
|------|------|----------|
| LeadCaptureModal | `src/components/conversion/LeadCaptureModal.tsx` | 🔴 Critical |
| ConsultationBookingModal | `src/components/conversion/ConsultationBookingModal.tsx` | 🔴 Critical |
| SampleReportAccessGate | `src/components/sample-report/SampleReportAccessGate.tsx` | 🔴 Critical |
| EbookLeadModal | `src/components/conversion/EbookLeadModal.tsx` | 🟡 High |
| IntelLeadModal | `src/components/intel/IntelLeadModal.tsx` | 🟡 High |
| PhoneCaptureModal | `src/components/sample-report/PhoneCaptureModal.tsx` | 🟡 High |
| ExplainScoreGate | `src/components/audit/scanner-modal/ExplainScoreGate.tsx` | 🟡 High |

### Phase 3: Update Parent-Controlled Forms

Forms where `isSubmitting` comes from parent:

| Form | Parent | Action |
|------|--------|--------|
| LeadModal (quote-builder) | `useQuoteBuilder.ts` | Apply lock in parent hook |

### Migration Pattern

**Before:**
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateAll()) return;
  
  setIsLoading(true);
  try {
    await fetch(...);
    // success handling
  } catch (error) {
    // error handling
  } finally {
    setIsLoading(false);
  }
};

<Button disabled={isLoading || !isFormValid}>
```

**After:**
```typescript
import { useFormLock } from '@/hooks/forms';

const { isLocked, idempotencyKey, lockAndExecute } = useFormLock();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateAll()) return;
  
  await lockAndExecute(async () => {
    await fetch(..., {
      headers: {
        ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
      },
    });
    // success handling (errors auto-unlock)
  });
};

<Button disabled={isLocked || !isFormValid}>
```

---

## Deprecation of Existing Hook

The existing `useSubmitGuard` hook will be:
1. Marked as `@deprecated` with migration instructions
2. Left in place for any external usages
3. Eventually removed in a future cleanup

---

## Files to Create/Modify

| Action | File |
|--------|------|
| **Create** | `src/hooks/forms/useFormLock.ts` |
| **Modify** | `src/hooks/forms/index.ts` (export new hook) |
| **Modify** | `src/hooks/forms/useSubmitGuard.ts` (add @deprecated) |
| **Modify** | `src/components/conversion/LeadCaptureModal.tsx` |
| **Modify** | `src/components/conversion/ConsultationBookingModal.tsx` |
| **Modify** | `src/components/sample-report/SampleReportAccessGate.tsx` |
| **Modify** | `src/components/conversion/EbookLeadModal.tsx` |
| **Modify** | `src/components/intel/IntelLeadModal.tsx` |
| **Modify** | `src/components/sample-report/PhoneCaptureModal.tsx` |
| **Modify** | `src/components/audit/scanner-modal/ExplainScoreGate.tsx` |

---

## Success Criteria

After implementation:
- [ ] Rapid double-clicks on any lead form submit button result in exactly 1 API call
- [ ] Enter key in form fields triggers the same protection as click
- [ ] Modal close during submission does not throw React warnings
- [ ] Loading spinner shows for at least 500ms (no flicker)
- [ ] Console shows `[useFormLock] Blocked duplicate submission` on double-click
- [ ] No changes to user-visible behavior (still immediate response on first click)

---

## Technical Notes

### Why Not Just Fix `useSubmitGuard`?

The existing hook has the right idea but:
1. Uses `isSubmitting` state in the guard check (can race with React batching)
2. No `useRef` for synchronous lock
3. No unmount safety
4. Auto-reset timeout is confusing (30s default)

A clean implementation is simpler than patching.

### Backend Idempotency (Future Enhancement)

The hook generates `Idempotency-Key` headers, but the backend (`save-lead`) doesn't currently check them. This is by design:
- The hook prevents client-side duplicates (immediate value)
- Backend idempotency requires database-level deduplication (future work)
- The header is there, ready for when backend support is added

### Why 500ms Minimum Loading?

User research shows that instant feedback (< 200ms) feels "broken" to users. A 500ms minimum:
- Provides visual confirmation that something happened
- Prevents UI jitter on fast networks
- Matches user expectations for "real" form submission
