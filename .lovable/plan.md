

# Modernize Fair Price Quiz Form -- V3 Final (Phone Optional at Gate)

## Summary

Upgrade BlurGate from a 2-field form (firstName, email) to a 4-field form (firstName, lastName, email, phone) and refactor the save-lead payload to match the V2 contract. Critically, only firstName and email are required to see results -- lastName and phone are optional at the gate to avoid adding friction to a quiz funnel.

---

## Critical Design Decision: Phone is Optional at Gate

The Fair Price Quiz funnel already has a post-results phone capture flow via `QuizResults` and `handlePhoneSubmit`. Making phone required at the BlurGate would add unnecessary friction and conflict with the existing funnel architecture. Instead:

- **Required to see results:** firstName, email
- **Optional at gate:** lastName, phone
- **Validation rule:** If phone is provided, it must be a valid 10-digit US number. If blank, submit proceeds without it.

---

## Changes

### 1. Update `src/components/fair-price-quiz/BlurGate.tsx`

**Signature change:**

```text
// OLD
onSubmit: (name: string, email: string) => void

// NEW
onSubmit: (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;  // formatted or empty string
}) => void
```

**Zod schema (phone optional):**

```text
const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().max(50, 'Last name is too long').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().refine(
    (val) => val === '' || val.replace(/\D/g, '').length === 10,
    { message: 'Please enter a valid 10-digit phone number' }
  ),
});
```

This means: empty phone passes validation. Non-empty phone must have exactly 10 digits after stripping formatting.

**Form fields (4 total, new layout):**

- Row 1: First Name + Last Name (`grid grid-cols-2 gap-3`)
- Row 2: Email (full width)
- Row 3: Phone (full width) with helper text: "Phone optional -- only needed if you want a 5-minute callback"

**Phone formatting:** Import `formatPhoneNumber` from `@/hooks/useFormValidation`. Apply during onChange to display `(XXX) XXX-XXXX` as user types.

**Form lock:** Replace naive `useState(false)` isSubmitting with `useFormLock` from `@/hooks/forms`:
- `isLocked` drives button disabled state
- `lockAndExecute` wraps the submit handler
- Auto-unlocks on error so user can retry

**Ticker stats integration:**
- Import `useTickerStats` from `@/hooks/useTickerStats`
- Hook returns `{ total, today, isLoading, isFromServer }` -- use `total`
- Replace static "2,847 homeowners" with: `{total.toLocaleString()} homeowners analyzed their quotes this month`
- No manual fallback needed -- the hook provides a deterministic client-side fallback on mount (never returns 0)

**Subtitle text update:** Change from "Enter your name and email to see your detailed breakdown" to "Enter your details to see your detailed breakdown"

### 2. Update `src/pages/FairPriceQuiz.tsx`

**State changes:**
- Replace `userName` (line 38) with `userFirstName` and `userLastName`
- Add `userPhone` state
- Keep `userEmail` as-is

**handleBlurGateSubmit refactor:**

Accept the new 4-field object. Build V2 payload:

```text
const clientId = getOrCreateAnonId();    // canonical Golden Thread FID
const sessionId = getOrCreateSessionId();
const attribution = getAttributionData();
const lastNonDirect = getLastNonDirectAttribution();
const phoneDigits = phone ? phone.replace(/\D/g, '') : '';

body: {
  email,
  firstName,
  lastName,
  phone: phoneDigits || null,              // null if empty, NOT empty string
  leadId: hookLeadId,                       // Golden Thread upsert
  sourceTool: 'fair-price-quiz',            // camelCase (V2 contract)
  flowVersion: 'fair_price_v2',
  sourcePage: window.location.pathname,
  sessionId,
  sessionData: {
    clientId,
    client_id: clientId,                    // save-lead checks both (line 549-552)
    ctaSource: 'fair-price-result',
    quizAnswers,
    analysis,
    leadScore,
  },
  attribution,                              // nested object, NOT spread
  lastNonDirect,                            // pass directly from helper, NO fbc->fbclid remap
  window_count: quizAnswers.windowCount,
}
```

**New imports to add:**
- `getOrCreateSessionId` from `@/lib/tracking`
- `getLastNonDirectAttribution` from `@/lib/attribution`
- `trackLeadSubmissionSuccess` from `@/lib/gtm`
- `getOrCreateAnonId` from `@/hooks/useCanonicalScore`

**Phase transition gate (critical fix):**

Currently `setPhase('results')` fires unconditionally on line 179, even if save-lead fails. Fix:

- Only call `setPhase('results')` inside the success branch (when `data?.leadId` exists)
- On error: show destructive toast via sonner, do NOT transition
- `useFormLock` auto-unlocks on error so user can retry

**Tracking (after successful save-lead, non-blocking):**

```text
await Promise.allSettled([
  trackLeadCapture(
    { leadId: newLeadId, sourceTool: 'fair_price_quiz', conversionAction: 'form_submit' },
    email,
    undefined,
    { hasName: true, hasPhone: !!phoneDigits, hasProjectDetails: !!quizAnswers.windowCount }
  ),
  trackLeadSubmissionSuccess({
    leadId: newLeadId,
    email,
    phone: phoneDigits || undefined,
    firstName,
    lastName: lastName || undefined,
    sourceTool: 'fair-price-quiz',
    eventId: newLeadId,               // raw UUID for Meta CAPI dedup (matches server-side)
    value: 100,                        // Tier 5 VBB
  }),
]);
```

**eventId rationale:** Use raw `leadId` UUID as `eventId`, per the Meta deduplication standard (no prefix).

**handlePhoneSubmit update (line 182-243):**
- Use `userPhone` as default if already captured at gate
- Update its internal save-lead call to use `sourceTool` (camelCase) instead of legacy `source_tool`

**Downstream userName references:**
- `QuizResults` receives `userName` prop -- pass `userFirstName` instead
- Session `updateFields` call: pass `name: firstName` (keeps backward compat with session schema)

### 3. lastNonDirect / fbclid note

`getLastNonDirectAttribution()` returns an `AttributionData` object which has `fbc` (not `fbclid`). The save-lead Zod schema expects `lastNonDirect.fbclid`. By passing `lastNonDirect` directly without remapping, `fbc` will be stripped by Zod and `fbclid` will be undefined. This is acceptable -- we do not fabricate `fbclid` from `fbc` since they are semantically different Facebook identifiers. The `fbc` value is already captured separately in the root `attribution` object.

---

## Files Changed

| File | Action |
|------|--------|
| `src/components/fair-price-quiz/BlurGate.tsx` | Update: 4 fields (phone optional), useFormLock, formatPhoneNumber, useTickerStats, new onSubmit signature |
| `src/pages/FairPriceQuiz.tsx` | Update: V2 payload with nested attribution/lastNonDirect, split name state, phone-optional logic, error-gated phase transition, trackLeadSubmissionSuccess |

No new files. No new dependencies. No database changes.

---

## Verification Checklist

After implementation, confirm:

1. Form submits successfully with only firstName + email (phone blank)
2. Form submits successfully with all 4 fields filled
3. Phone validation rejects partial input (e.g. 7 digits) but allows empty
4. save-lead payload has `attribution` as nested object (not spread at root)
5. save-lead payload has `lastNonDirect` as nested object (no fbc->fbclid remap)
6. save-lead payload has `phone: null` when phone is empty (not empty string)
7. `sourceTool` is camelCase `'fair-price-quiz'` (not snake_case `source_tool`)
8. `flowVersion: 'fair_price_v2'` appears in payload
9. Phase transition only happens on successful save-lead response
10. Form re-enables on error (useFormLock auto-unlock)
11. Ticker shows live count (not static "2,847")
12. `hasPhone` in trackLeadCapture is `true` only when phone was provided
13. `eventId` in trackLeadSubmissionSuccess is raw leadId UUID (no prefix)

