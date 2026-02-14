

# Fix: wm_sessions 403 RLS Violation on Upsert

## Root Cause

The `wm_sessions` table RLS only allows **INSERT**. SELECT, UPDATE, and DELETE are all denied. PostgREST's `upsert` (INSERT ... ON CONFLICT) requires SELECT permission internally, so it returns 403 even though INSERT is allowed.

The previous change from `insert` to `upsert` made the 409 error *worse* (now 403).

## Fix Strategy

**Change the code to use plain `.insert()` and silently ignore duplicate key errors (Postgres error code 23505).** This is the most secure approach -- no RLS changes needed, the table stays insert-only from the client.

## Code Changes

**File:** `src/lib/windowTruthClient.ts`

Replace the entire `createOrRefreshSession` function (lines 64-131) with a simplified version:

```typescript
const createOrRefreshSession = async (): Promise<string> => {
  const existing = readSessionId();
  const attribution = getAttributionParams();

  const sessionId = existing || crypto.randomUUID();
  const anonymousId = getGoldenThreadId();

  // Always save locally first so downstream code works immediately
  saveSessionId(sessionId);

  try {
    const { error } = await supabase
      .from('wm_sessions')
      .insert({
        id: sessionId,
        anonymous_id: anonymousId,
        landing_page: window.location.pathname,
        user_agent: navigator.userAgent,
        referrer: attribution.referrer,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_term: attribution.utm_term,
        utm_content: attribution.utm_content,
      });

    if (error) {
      // 23505 = duplicate key (session already exists) -- this is fine
      if (error.code === '23505') {
        console.log("[wm] session already registered:", sessionId);
      } else {
        console.warn("[wm] session insert failed", error);
      }
    } else {
      console.log("[wm] session registered:", sessionId);
    }
  } catch (error) {
    console.warn("[wm] session bootstrap failed", error);
  }

  return sessionId;
};
```

### What changed and why

| Before | After | Reason |
|--------|-------|--------|
| SELECT to check if session exists (line 72-76) | Removed | Blocked by RLS (returns empty, wastes a request) |
| UPDATE timestamp if exists (line 80-83) | Removed | Blocked by RLS (always fails silently) |
| `.upsert()` with `onConflict` (line 97-110) | `.insert()` | upsert requires SELECT permission; plain insert only needs INSERT |
| 409/403 on duplicate | Caught as error code 23505 | Graceful no-op when session already exists |
| Multiple fallback UUID generation paths | Single path | Simplified: generate once, save locally first, then try DB |

### What stays the same

- Session ID is still persisted in localStorage + cookie
- Golden Thread ID used as anonymous_id
- Attribution params captured on first visit
- All errors are non-fatal (warn + continue)
- `logEvent()` function unchanged
- No RLS policy changes needed

## End-to-End Test Plan (after fix)

After implementing, navigate to `/ai-scanner` and verify:
1. `POST wm_sessions` returns 201 (new session) or catches 23505 silently (existing session)
2. No 403 or 409 errors in network logs
3. Submit a lead form and verify `save-lead` returns 200 with a `leadId`
4. Check that `dataLayer` receives `lead_submission_success` event with `event_id` matching the `leadId`

