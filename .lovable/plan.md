

# Centralized Auth Error Recovery -- Final Production-Safe Implementation

## Summary

Create a centralized edge function wrapper that automatically handles 401 errors across all ~39 caller files, with full protection against double-POSTs, thundering herd race conditions, data loss on redirect, zombie requests, error type stripping, and large upload/streaming edge cases.

---

## New Files (4)

### 1. `src/lib/authRefreshLock.ts` -- Singleton Refresh Lock

Prevents the "thundering herd" problem where 5+ hooks fire 401s simultaneously and spam the refresh endpoint. Uses a global promise singleton: if a refresh is already in-flight, all subsequent 401s piggyback on the same promise.

### 2. `src/lib/edgeFunction.ts` -- Two Wrapper Functions

**`invokeEdgeFunction(name, options)`**
- Drop-in replacement for `supabase.functions.invoke()`
- Accepts `isIdempotent?: boolean` flag (defaults to `false`)
- On 401: refreshes session via the lock, then:
  - If `isIdempotent: true`: auto-retries silently (safe for read-only calls like `get-ticker-stats`)
  - If `isIdempotent: false`: throws `SessionRefreshedError` so the caller can show a friendly "please try again" message
- Preserves original error objects (no type stripping)
- Retries exactly once (no infinite loop risk)

**`fetchEdgeFunction(name, options)`**
- Drop-in replacement for the raw `fetch()` + `getSession()` + Authorization header pattern
- On 401: refreshes session via the lock, then:
  - If method is `GET`: auto-retries silently
  - If method is `POST/PATCH/PUT/DELETE`: throws `SessionRefreshedError`
- Preserves original error objects
- Retries exactly once

### 3. `src/components/auth/SessionExpiredOverlay.tsx` -- Dead Session Modal

Instead of a hard redirect that destroys form data, this component:
- Listens for a custom `auth:session-expired` DOM event
- Renders a modal *over* the current page (preserving all form state underneath)
- Shows "Session expired -- please log in to continue" with a login button
- The login button navigates to `/auth?redirect=<current_path>`
- Mounted once in `App.tsx`

### 4. `SessionRefreshedError` class in `src/lib/errors.ts`

A custom error class that callers can check for to show a friendly info toast ("Session re-synced! Please click submit one more time.") instead of a scary red error toast.

---

## Modified Core Files (2)

### `src/lib/authErrorHandler.ts`

- Uses `refreshWithLock()` from the new lock module instead of calling `supabase.auth.refreshSession()` directly
- Returns a result object `{ was401: boolean; refreshed: boolean }` instead of just `boolean`
- On dead session (refresh failed): dispatches `auth:session-expired` custom event instead of doing a hard `window.location.href` redirect
- Never redirects directly -- the overlay component handles UI

### `src/App.tsx`

- Mount `<SessionExpiredOverlay />` alongside existing toasters

---

## Caller File Refactors (~35 files)

### Pattern A: `supabase.functions.invoke()` to `invokeEdgeFunction()` (17 files)

Simple import swap. Each call changes from:
```
import { supabase } from '@/integrations/supabase/client';
const { data, error } = await supabase.functions.invoke('fn-name', { body });
```
To:
```
import { invokeEdgeFunction } from '@/lib/edgeFunction';
const { data, error } = await invokeEdgeFunction('fn-name', { body });
```

For **read-only/idempotent** functions, add the flag:
```
const { data, error } = await invokeEdgeFunction('get-ticker-stats', { isIdempotent: true });
```

**Idempotent (safe to auto-retry):**
- `useTickerStats.ts` -> `get-ticker-stats`
- `useCanonicalScore.ts` -> `score-event` (append-only, has dedup)
- `useCRMLeads.ts` -> `mark-qualified-conversion` (server-gated dedup)

**Non-idempotent (throw SessionRefreshedError):**
- All `save-lead` callers (11 files): `ScannerLeadCaptureModal`, `EstimateSlidePanel`, `MissionInitiatedModal`, `SampleReportLeadModal`, `SalesTacticsGuideModal`, `KitchenTableGuideModal`, `PreQuoteLeadModal`, `PreQuoteLeadModalV2`, `QuoteScanner`, `FairPriceQuiz`, `Consultation`
- `EmailResultsButton` -> `email-vault-summary`
- `DocumentUploadModal` -> `send-email-notification`
- `useCRMLeads.ts` -> `crm-disposition`
- `ScannerLeadCaptureModal` -> `crm-leads` (PATCH)
- `FairPriceQuiz` -> `trigger-phone-call`
- `useSessionSync.ts` -> `sync-session` (simplified, remove direct handleAuthError)

### Pattern B: Raw `fetch()` to `fetchEdgeFunction()` (16 files)

Replace manual `fetch()` + `session.access_token` + URL construction with `fetchEdgeFunction()`.

**GET requests (auto-retry safe):**
- `useCRMLeads.ts` -> `crm-leads` (GET fetch)
- `useLeadDetail.ts` -> `admin-lead-detail` (GET)
- `useLeadFinancials.ts` -> `admin-lead-detail` (GET)
- `useRevenue.ts` -> `admin-revenue`
- `useCallActivity.ts` -> `admin-call-activity`
- `useCallAgents.ts` -> `admin-update-call-agent` (GET)
- `useExecutiveProfit.ts` -> `admin-executive-profit`
- `useAttributionROAS.ts` -> `admin-attribution-roas`
- `useLeadNavigation.ts` -> `crm-leads`
- `useGlobalSearch.ts` -> `admin-global-search`
- `useWebhookReceipts.ts` -> `admin-webhook-receipts`
- `SessionAnalysisPanel.tsx` -> `admin-attribution`
- `LeadDetailPanel.tsx` -> `admin-attribution`
- `AttributionHealthDashboard.tsx` -> `crm-leads` (GET), `admin-attribution`
- `useAnalyticsDashboard.ts` -> `admin-analytics` etc.
- `useSmokeTest.ts` / `SmokeTestButton.tsx` -> `admin-smoke-test`

**Non-GET requests (throw SessionRefreshedError):**
- `useCallAgents.ts` -> `admin-update-call-agent` (PATCH, POST, PUT)
- `useLeadFinancials.ts` -> `admin-lead-detail` (POST)
- `useLeadDetail.ts` -> `admin-trigger-analysis` (POST)
- `DispatchWindowManButton.tsx` -> `admin-direct-dial` (POST)
- `PhoneCallOpsPanel.tsx` -> `admin-phonecallbot-health` (POST)
- `IntelLeadModal.tsx` -> `save-lead` (POST)
- `PhoneCaptureModal.tsx` -> `crm-leads` (PATCH)
- `useAnalyticsDashboard.ts` -> admin functions (POST/PATCH)

### NOT Modified (Excluded)

| File | Reason |
|------|--------|
| `useDocumentUpload.ts` | Anonymous upload (FormData, no auth header) |
| `useQuoteUpload.ts` | Anonymous upload (FormData, no auth header) |
| `src/lib/aiRequest.ts` | Uses anon key, not user tokens |
| Edge function-to-edge function calls | Server-side, not affected |

---

## Error Handling UX in Callers

When refactoring catch blocks, any `SessionRefreshedError` will be handled with a **friendly info toast** instead of a destructive error toast:

```typescript
import { SessionRefreshedError } from '@/lib/errors';

} catch (error) {
  if (error instanceof SessionRefreshedError) {
    toast.info('Session re-synced! Please click submit one more time.');
    return;
  }
  // existing error handling unchanged
  toast.error('Something went wrong.');
}
```

---

## Infinite Loop Prevention

The retry logic in both wrappers is structured so the retry path does NOT go through the error handler again:

```
try { return await makeRequest(); }
catch (error) {
  const result = await handleAuthError(error);
  if (!result.was401) throw error;          // Not a 401, rethrow as-is
  if (!result.refreshed) throw error;       // Dead session, overlay handles it
  if (!isSafeToRetry) throw new SessionRefreshedError();
  return await makeRequest();               // Exactly one retry, no recursion
}
```

If the retried request also returns 401 (broken permission policy), it throws normally -- no second refresh attempt.

---

## Implementation Sequence

1. Add `SessionRefreshedError` to `src/lib/errors.ts`
2. Create `src/lib/authRefreshLock.ts`
3. Update `src/lib/authErrorHandler.ts` (use lock, return result object, dispatch event instead of redirect)
4. Create `src/lib/edgeFunction.ts` (both wrappers with `isIdempotent` flag)
5. Create `src/components/auth/SessionExpiredOverlay.tsx`
6. Mount overlay in `App.tsx`
7. Refactor Pattern A callers (17 files -- import swap + `isIdempotent` flag where appropriate + `SessionRefreshedError` catch)
8. Refactor Pattern B callers (16 files -- replace fetch boilerplate + `SessionRefreshedError` catch)
9. Simplify `useSessionSync.ts` (use `invokeEdgeFunction`, remove direct `handleAuthError` import)

## No database changes, no new edge functions, no new dependencies.

