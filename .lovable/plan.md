

# Fix Edge Function Build Errors + Google OAuth Verification

## Google OAuth Status: VERIFIED

The Google sign-up flow was tested end-to-end:
1. Navigated to `/auth?mode=signup`
2. The "Sign up with Google" button was visible and properly styled
3. Clicking it completed the OAuth flow successfully
4. User was redirected to the Protection Dashboard (Vault) as expected
5. "Sign Out" button visible in the header confirming authenticated state

No changes needed for Google OAuth -- it is fully working.

---

## Build Error Fix

There are 12 type errors across edge functions, all with the same root cause:

**Problem:** The `hasAdminRole` function in each file declares its parameter type as `ReturnType<typeof createClient>`, but when `createClient(url, key)` is called with arguments, TypeScript infers a more specific generic type (`SupabaseClient<any, "public", "public", ...>`) that doesn't match the base `ReturnType<typeof createClient>` signature (which resolves to `SupabaseClient<unknown, ...never...>`).

**Fix:** Change the parameter type annotation from `ReturnType<typeof createClient>` to `any` in all 12 files. This is safe because the function only calls `.from("user_roles").select().eq().eq().maybeSingle()` -- standard Supabase query chain that works on any client instance.

### Files to update (single-line change each):

1. `supabase/functions/admin-call-activity/index.ts` (line 24)
2. `supabase/functions/admin-executive-profit/index.ts` (line 15)
3. `supabase/functions/admin-lead-detail/index.ts` (line 11)
4. `supabase/functions/admin-quotes/index.ts` (line 9)
5. `supabase/functions/admin-revenue/index.ts` (line 10)
6. `supabase/functions/admin-smoke-test/index.ts` (line 5)
7. `supabase/functions/admin-update-call-agent/index.ts`
8. `supabase/functions/admin-webhook-receipts/index.ts` (line 30)
9. `supabase/functions/crm-disposition/index.ts` (line 10)
10. `supabase/functions/crm-leads/index.ts` (line 10)
11. `supabase/functions/enqueue-manual-call/index.ts` (line 15)
12. `supabase/functions/mark-qualified-conversion/index.ts` (line 25)

In each file, the change is identical -- replacing:

```typescript
async function hasAdminRole(supabaseAdmin: ReturnType<typeof createClient>, userId: string)
```

with:

```typescript
// deno-lint-ignore no-explicit-any
async function hasAdminRole(supabaseAdmin: any, userId: string)
```

### No new files, no new dependencies, no database changes.

