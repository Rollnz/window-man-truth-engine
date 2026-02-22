

# Fix AuthRecoveryTester and useSessionSync

## Two Files, Three Fixes

### 1. `src/components/debug/AuthRecoveryTester.tsx`

**Fix A: Switch all 3 tests to use `sync-session`** (which validates JWT via `supabase.auth.getUser()` and returns a proper 401 for corrupted tokens).

- **Test 1 (Idempotent):** Replace `fetchEdgeFunction('get-ticker-stats')` with `invokeEdgeFunction('sync-session', { body: { syncReason: 'auth_test', sessionData: {} }, isIdempotent: true })`. On success after silent retry, it returns `{ success: true, merged: false }` with no side effects.

- **Test 2 (Non-Idempotent):** Replace `invokeEdgeFunction('get-ticker-stats', { isIdempotent: false })` with `invokeEdgeFunction('sync-session', { body: { syncReason: 'auth_test', sessionData: {} }, isIdempotent: false })`. **Critical fix:** `invokeEdgeFunction` returns `{ error: SessionRefreshedError }` — it does NOT throw. The current code has a try/catch looking for a thrown error that will never come. Fix the check to inspect the returned `error` field:
  ```
  const { data, error } = await invokeEdgeFunction(...);
  if (error instanceof SessionRefreshedError) {
    // Show friendly toast
  }
  ```

- **Test 3 (Dead Session):** Replace `fetchEdgeFunction('get-ticker-stats')` with `invokeEdgeFunction('sync-session', { body: { syncReason: 'auth_test', sessionData: {} }, isIdempotent: true })`. With both tokens destroyed, the wrapper will fail to refresh and dispatch `auth:session-expired`, triggering the overlay.

**Fix B: Remove `fetchEdgeFunction` import** since all tests now use `invokeEdgeFunction`.

### 2. `src/hooks/useSessionSync.ts`

**Fix C: Add `isIdempotent: true`** to the existing `invokeEdgeFunction` call (line 50). The sync call is safe to auto-retry because the edge function merges data idempotently. This prevents background crashes when the tester corrupts the token — the wrapper will silently refresh and retry instead of returning a `SessionRefreshedError`.

Change line 50-55 from:
```
const { data, error } = await invokeEdgeFunction('sync-session', {
  body: { sessionData, syncReason: 'auth_login' },
});
```
To:
```
const { data, error } = await invokeEdgeFunction('sync-session', {
  body: { sessionData, syncReason: 'auth_login' },
  isIdempotent: true,
});
```

## No changes to `src/lib/edgeFunction.ts`

The core wrapper logic is correct. The `isIdempotent` flag works as designed — the bugs were in the test endpoint choice and the tester's error-checking pattern.

## Implementation Order

1. Update `useSessionSync.ts` (one-line flag addition)
2. Rewrite all 3 test functions in `AuthRecoveryTester.tsx`

