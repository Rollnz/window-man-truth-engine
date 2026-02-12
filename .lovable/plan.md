

# Fix Plan: CSRF Removal + Build Errors

## Priority 1: Remove False CSRF Gate from save-lead (Critical -- leads are being lost)

**Problem:** 11 of 12 `save-lead` callers do NOT send CSRF tokens, causing 403 rejections. The CSRF pattern itself is security theater (client-generated tokens checked against themselves).

**Fix:**
- **`supabase/functions/save-lead/index.ts`** (lines 536-547): Delete the entire CSRF validation block. CORS preflight + custom headers already protect this JSON API endpoint.
- **`src/hooks/useLeadFormSubmit.ts`**: Remove `getCsrfToken()` call, remove `csrfToken` from the payload body, and remove the `X-CSRF-Token` header from the request.
- **`src/lib/security.ts`**: Keep `getCsrfToken()` function for now (no breaking changes elsewhere), but it becomes unused by save-lead.
- **`supabase/functions/save-lead/index.ts`** line 91: Change `csrfToken` in the Zod schema from validated UUID to just `.optional().nullable()` so old payloads that accidentally include it don't fail validation.
- **CORS header** (line 447): Remove `x-csrf-token` from `Access-Control-Allow-Headers` since it's no longer needed.

**Impact:** All 12 lead capture flows will work again. No security is lost -- CORS + Content-Type enforcement is the actual protection layer.

## Priority 2: Fix HoneypotField TypeScript Error

**File:** `src/components/forms/HoneypotField.tsx`

**Fix:** Remove `tabIndex: -1` from the `style` object (line 32). The `div` element already doesn't need a `tabIndex` prop since it has `aria-hidden="true"` and is positioned off-screen.

## Priority 3: Fix quote-scanner Deno Build Error

**File:** `supabase/functions/quote-scanner/deps.ts`

**Fix:** Change `npm:zod@3.22.4` imports to use `https://deno.land/x/zod@v3.22.4/mod.ts` (same pattern used successfully in `save-lead/index.ts`). This resolves the Deno module resolution failure.

---

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/save-lead/index.ts` | Remove CSRF check block (lines 536-547), relax csrfToken schema, clean CORS header |
| `src/hooks/useLeadFormSubmit.ts` | Remove csrfToken generation, body field, and header |
| `src/components/forms/HoneypotField.tsx` | Remove `tabIndex: -1` from style object |
| `supabase/functions/quote-scanner/deps.ts` | Switch from `npm:` to `https://deno.land/x/` for zod import |

