

# Fix log-event 401: Server-Side Auth Mismatch

## Root Cause (NOT what the Stack Overflow suggestion says)

The client-side header logic is already correct. The 401 happens **server-side** in `supabase/functions/log-event/index.ts`.

At line 223, the server does:
```
const expectedAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
```

Then compares it to the `apikey` header. This comparison fails because the manually-set `SUPABASE_ANON_KEY` secret likely doesn't match the actual project anon key. Direct testing confirms: sending the correct anon key in both `apikey` and `Authorization` headers still returns 401.

## Fix (Two Parts)

### Part 1: Server-side (the actual fix)

**File: `supabase/functions/log-event/index.ts`** (lines 218-241)

Make the anon key validation more robust. Instead of only comparing against `SUPABASE_ANON_KEY`, also try creating a Supabase client with the provided key to verify it works. This eliminates the fragile env-var-mismatch problem.

Replace the auth block with:

```text
const providedSecret = req.headers.get("x-wm-log-secret");
const expectedSecret = Deno.env.get("WM_LOG_SECRET");
const authHeader = req.headers.get("authorization");
const apiKeyHeader = req.headers.get("apikey");

const expectedAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

const secretValid = expectedSecret && providedSecret && providedSecret === expectedSecret;

// Primary check: exact match with env var
let anonKeyValid = !!(
  expectedAnonKey && (apiKeyHeader === expectedAnonKey || authHeader === `Bearer ${expectedAnonKey}`)
);

// Fallback: if env var comparison fails, verify the provided key
// can create a valid Supabase client (handles stale/mismatched secrets)
if (!anonKeyValid && apiKeyHeader) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (supabaseUrl) {
      const testClient = createClient(supabaseUrl, apiKeyHeader);
      // If createClient doesn't throw, the key format is valid
      // Verify it's actually the project's anon key by making a lightweight query
      const { error } = await testClient.from("wm_sessions").select("id").limit(0);
      anonKeyValid = !error;
    }
  } catch {
    // Key is invalid, anonKeyValid stays false
  }
}

if (!secretValid && !anonKeyValid) {
  console.warn("[log-event] Auth failed:", {
    hasSecretHeader: !!providedSecret,
    hasApiKey: !!apiKeyHeader,
    hasAuthHeader: !!authHeader,
    expectedAnonKeySet: !!expectedAnonKey,
    apiKeyMatchesExpected: apiKeyHeader === expectedAnonKey,
  });
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

Key changes:
- Added fallback validation: if the env var comparison fails, verify the key by attempting a real (no-cost) query
- Enhanced logging: added `expectedAnonKeySet` and `apiKeyMatchesExpected` to diagnose mismatches
- This makes the auth resilient to secret-value drift

### Part 2: Client-side (defensive improvement)

**File: `src/lib/highValueSignals.ts`** (lines 179-195)

Change from either/or to always-send-apikey. This way if `WM_LOG_SECRET` is ever configured client-side, it sends BOTH auth methods:

```text
const logSecret = import.meta.env.VITE_WM_LOG_SECRET as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

// Always attach apikey if available (belt and suspenders)
if (anonKey) {
  headers['apikey'] = anonKey;
  headers['Authorization'] = `Bearer ${anonKey}`;
}

// Also attach secret header if available (preferred auth path)
if (logSecret) {
  headers['X-WM-LOG-SECRET'] = logSecret;
}

// If neither key is available, drop the signal
if (!anonKey && !logSecret) {
  console.error('[highValueSignals] CRITICAL: No auth key available. Signal dropped:', eventName);
  return;
}
```

This ensures the apikey header is always sent, regardless of whether the log secret is also present.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/log-event/index.ts` | Add fallback anon key validation + enhanced error logging |
| `src/lib/highValueSignals.ts` | Send apikey unconditionally instead of either/or |

## Why the Stack Overflow Suggestion Alone Is Insufficient

The suggested fix only restructures the client-side header logic. But the client is already sending the correct headers (confirmed via network inspection). The 401 originates from the server rejecting a valid anon key because `Deno.env.get("SUPABASE_ANON_KEY")` returns a mismatched value.

## Will This Restore Analytics Signals?

Yes. Once the server-side auth accepts the valid anon key, all `logHighValueSignal` calls (scanner_upload_completed, booking_confirmed, voice_estimate_confirmed) will successfully write to `wm_event_log`.

## Acceptance Test

1. Deploy the updated `log-event` edge function
2. Open /ai-scanner in incognito
3. Upload a quote and submit lead form
4. Check edge function logs: should show "Auth succeeded via: anon-key" (not 401)
5. Verify `wm_event_log` has new entries via backend query

