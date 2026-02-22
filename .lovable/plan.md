
# Fix AuthRecoveryTester Button 2: Non-Idempotent POST Test

## Problem

The "Test Non-Idempotent POST" button calls `score-event` with a dummy payload. The edge function rejects it with a **400 Bad Request** ("Missing required fields") before the auth layer even checks the token. Since 400 is not 401, the auth recovery wrapper correctly passes it through as a normal error -- but the tester treats it as unexpected.

Additionally, the corrupted token also caused `sync-session` to return 401, which is a separate background call unrelated to the test button.

## Fix

One change in `src/components/debug/AuthRecoveryTester.tsx`:

**Replace the `score-event` call with `get-ticker-stats` using `isIdempotent: false`.**

`get-ticker-stats` is a simple read-only function that will:
1. Receive the corrupted token
2. Return a proper 401 Unauthorized
3. Trigger the auth recovery wrapper
4. Since `isIdempotent: false`, the wrapper will refresh the token but throw `SessionRefreshedError` instead of retrying
5. The catch block displays the friendly info toast

### Specific Change (lines 114-118)

Before:
```
log('Calling invokeEdgeFunction("score-event", POST, isIdempotent: false)...');
const { data, error } = await invokeEdgeFunction('score-event', {
  body: { eventType: 'auth_test', entityType: 'debug', entityId: 'test-123', points: 0 },
  isIdempotent: false,
});
```

After:
```
log('Calling invokeEdgeFunction("get-ticker-stats", isIdempotent: false)...');
const { data, error } = await invokeEdgeFunction('get-ticker-stats', {
  isIdempotent: false,
});
```

This removes the dummy body entirely and uses an endpoint we know returns a clean 401 when the token is bad, allowing the `SessionRefreshedError` flow to trigger correctly.

No other files need changes. The `sync-session` 401 error was a side effect of the token corruption and will resolve itself once the token is refreshed.
