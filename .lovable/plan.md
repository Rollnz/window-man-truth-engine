

# Fix All 31 Build Errors + Implement Dynamic Social Research Buttons

This plan has two parts: (A) fix all 31 pre-existing build errors across edge functions, and (B) implement the dynamic social research feature from the approved ticket.

## Part A: Fix 31 Build Errors

### Error Category 1: `TS2345` -- `hasAdminRole` type mismatch (13 errors)

The shared `hasAdminRole` in `adminAuth.ts` uses `SupabaseClient` imported from `esm.sh`, which produces a different generic signature than the `createClient` return type in each edge function.

**Fix:** Change the parameter type from `SupabaseClient` to `any` in `adminAuth.ts` line 97. This is standard practice for shared Deno helpers where the client generic params vary.

| File | Line | Fix |
|------|------|-----|
| `supabase/functions/_shared/adminAuth.ts` | 97 | Change `supabaseAdmin: SupabaseClient` to `supabaseAdmin: any` |

This resolves all 13 `TS2345` errors across: `admin-call-activity`, `admin-executive-profit`, `admin-lead-detail`, `admin-quotes`, `admin-revenue`, `admin-smoke-test`, `admin-update-call-agent`, `admin-webhook-receipts`, `crm-disposition`, `crm-leads`, `enqueue-manual-call`, `mark-qualified-conversion`.

### Error Category 2: `TS2304` -- undefined `email` variable (14 errors)

Three edge functions reference `email` without declaring it. In all cases, `user.email` is available from the auth check. The fix is to add `const email = user.email || 'unknown';` right after the user is validated.

| File | Fix |
|------|-----|
| `supabase/functions/admin-call-activity/index.ts` | Add `const email = user.email \|\| 'unknown';` after line 85 |
| `supabase/functions/admin-update-call-agent/index.ts` | Add `const email = user.email \|\| 'unknown';` after line 108 |
| `supabase/functions/enqueue-manual-call/index.ts` | Add `const email = user.email \|\| 'unknown';` after line 109 |

### Error Category 3: `TS2304` -- undefined `userEmail` (1 error)

`crm-disposition/index.ts` line 316 references `userEmail` but never declares it. The user object is available via `user` from line 101.

| File | Fix |
|------|-----|
| `supabase/functions/crm-disposition/index.ts` | Add `const userEmail = user.email \|\| 'unknown';` after line 108 (after the admin check) |

### Error Category 4: `TS2304` -- undefined `fileData` (2 errors)

In `save-lead/index.ts`, `fileData` is declared inside a `try` block (line 930) but referenced outside it (lines 970, 981). The AI pre-analysis block needs to move inside the try block, before the closing `catch`.

| File | Fix |
|------|-----|
| `supabase/functions/save-lead/index.ts` | Move the AI pre-analysis block (lines 967-987) inside the try block, before line 963 (`} catch (alertErr)`) |

### Error Category 5: `TS18046` -- `metrics.emqScore` is `unknown` (1 error)

In `check-tracking-health/index.ts`, `checkHealth()` returns `metrics: Record<string, unknown>`. Accessing `.emqScore` requires a cast.

| File | Fix |
|------|-----|
| `supabase/functions/check-tracking-health/index.ts` | Cast: `(metrics.emqScore as number) >= THRESHOLDS.EMQ_CRITICAL` at line 268 |

---

## Part B: Dynamic Social Research Buttons

### Step 1: Database Migration

```sql
ALTER TABLE public.wm_leads ADD COLUMN IF NOT EXISTS social_facebook_url text;
ALTER TABLE public.wm_leads ADD COLUMN IF NOT EXISTS social_instagram_url text;
```

No RLS changes needed (all access is via service-role edge function).

### Step 2: Backend -- Add `update_social_profile` action

In `supabase/functions/admin-lead-detail/index.ts`, add a new POST action block after the existing `update_social_url` block (which stays for backward compatibility):

- Accepts `{ action: "update_social_profile", platform: "facebook"|"instagram", url: string|null }`
- Adds a `normalizeAndValidateSocialUrl` helper that:
  - Validates platform is "facebook" or "instagram"
  - Allows `null` (for clearing)
  - Trims, prepends `https://` if missing protocol
  - Validates with `new URL()`
  - Enforces https only
  - Checks domain allowlist: `facebook.com`/`m.facebook.com` for FB, `instagram.com` for IG
  - Strips query params and hash for clean storage
- Maps platform to the correct column (`social_facebook_url` or `social_instagram_url`)
- Updates only that column + `updated_at`

### Step 3: Hook -- Update `useLeadDetail.ts`

- Add `social_facebook_url: string | null` and `social_instagram_url: string | null` to `LeadDetailData` interface
- Replace `updateSocialUrl` with `updateSocialProfile(platform: 'facebook'|'instagram', url: string|null)`
- Optimistic update targets the correct field based on platform
- Toast shows "Social profile saved" or "Social profile cleared"
- Update the return type interface and return object

### Step 4: Rewrite `SocialSearchButtons.tsx`

New props interface:
```
facebookUrl, instagramUrl, onSaveProfile(platform, url)
```

Button behavior:
- Facebook: saved URL -> open direct; else -> `facebook.com/search/top/?q=<name+city>`
- Instagram: saved URL -> open direct; else -> `google.com/search?q=site:instagram.com <name+city>`
- LinkedIn: always Google site-search (unchanged)

Visual indicators:
- `variant="default"` when verified URL exists, `variant="outline"` when search
- Tooltip: "View saved profile" vs "Search Facebook" / "Search Instagram (Google)"

Save/Clear section:
- Two rows (Facebook + Instagram), each with Input + Save + Clear buttons
- Frontend validation: trim, prepend https://, `new URL()`, domain allowlist check
- Invalid URL -> destructive toast, save blocked
- Clear button calls `onSaveProfile(platform, null)`

### Step 5: Update `LeadIdentityCard.tsx`

Pass new props to `SocialSearchButtons`:
```
facebookUrl={lead.social_facebook_url}
instagramUrl={lead.social_instagram_url}
onSaveProfile={updateSocialProfile}
```

Remove old `onSaveSocialUrl` prop.

---

## Files Changed

| File | Change Type |
|------|-------------|
| `supabase/functions/_shared/adminAuth.ts` | Fix: `hasAdminRole` param type to `any` |
| `supabase/functions/admin-call-activity/index.ts` | Fix: add `email` declaration |
| `supabase/functions/admin-update-call-agent/index.ts` | Fix: add `email` declaration |
| `supabase/functions/enqueue-manual-call/index.ts` | Fix: add `email` declaration |
| `supabase/functions/crm-disposition/index.ts` | Fix: add `userEmail` declaration |
| `supabase/functions/save-lead/index.ts` | Fix: move `fileData` usage into scope |
| `supabase/functions/check-tracking-health/index.ts` | Fix: cast `metrics.emqScore` |
| `supabase/functions/admin-lead-detail/index.ts` | Feature: add `update_social_profile` action |
| `src/hooks/useLeadDetail.ts` | Feature: update interface + replace save function |
| `src/components/lead-detail/SocialSearchButtons.tsx` | Feature: full rewrite with platform-aware logic |
| `src/components/lead-detail/LeadIdentityCard.tsx` | Feature: update props |
| Database migration | Add 2 columns to `wm_leads` |

