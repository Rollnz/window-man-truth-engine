

# Authentication Audit: Current State Analysis

## Overview

The project has **two distinct auth systems** operating in parallel, serving different user journeys. Here is what I found, what's broken, and what needs attention.

---

## System 1: `/auth` Page (Traditional Email Auth)

**Components:** `LoginForm`, `SignupForm`, `SetPasswordForm`, `ForgotPasswordForm`, `ResetPasswordForm`
**Flow:** Email magic link → set password → email+password login thereafter

### Status: Structurally Sound, Minor Issues

**What works:**
- Login with email/password via `signInWithPassword`
- Signup sends magic link via `signInWithOtp`, redirects to `/auth?mode=set-password`
- Password reset flow: sends reset email, redirects to `/auth?mode=reset-password`
- Password strength validation (8 chars, uppercase, lowercase, number)
- Session-expired overlay with graceful recovery
- 401 refresh lock (singleton promise, no thundering herd)

**Issues found:**

1. **Hardcoded white text in ForgotPasswordForm** (lines 74-79): The "Check your email" confirmation uses `text-white` and `className="text-white"` instead of theme-aware classes (`text-foreground`, `text-muted-foreground`). This will be invisible on light themes.

2. **No "resend magic link" on SignupForm**: The email-sent state only offers "try again with a different email." There's no way to resend to the same email without re-entering it.

3. **`has_password` profile field dependency**: The auth flow relies on `profiles.has_password` to route users to set-password vs. vault. If the profile trigger fails or is delayed, the user could get stuck in a loop or be redirected incorrectly. No fallback or retry logic exists.

---

## System 2: `/signup` Page (Conversion Funnel Auth)

**Components:** `AuthModal`, `OtpGate`, custom `callEdgeJson` wrapper
**Flow:** Upload quote or start no-quote → save-lead → magic link (background) → SMS OTP → qualification/analysis

### Status: IN TESTING MODE — Multiple Bypasses Active

**Critical findings:**

1. **Phone verification is completely bypassed** (Signup.tsx lines 164-178): `triggerPhoneVerification` does nothing — it sets state to `VERIFYING_PHONE` and toasts "TESTING MODE: Phone step bypassed" without calling any Twilio function or `supabase.auth.updateUser({ phone })`.

2. **OTP verification is completely bypassed** (Signup.tsx lines 319-331): `handleVerifyOtp` accepts any token, clears state, and proceeds. It never calls `verify-otp` or `verify-lead-otp`. Toast says "TESTING MODE: Phone verification bypassed."

3. **Email verification is skipped** (Signup.tsx line 305): Comment says "Skip VERIFYING_EMAIL — go straight to phone verification." The magic link is fired in the background without awaiting it, and the user is never gated on email confirmation.

4. **Rate limiting removed from `send-otp`** (send-otp/index.ts line 35): Comment says "TESTING MODE: Rate limiting removed." In production, this means unlimited OTP sends per phone number per hour.

### Edge Functions — Phone Auth Stack

| Function | Purpose | Status |
|---|---|---|
| `send-otp` | Sends SMS via Twilio Verify | Works, but rate limiting disabled |
| `verify-otp` | Checks OTP code via Twilio Verify | Works, but never called from `/signup` |
| `initiate-lead-verification` | Lookup (VOIP block) + send OTP | Works, includes line_type_intelligence |
| `verify-lead-otp` | Verify OTP + insert lead to DB | Works, but only used by `ScannerLeadCaptureModal` |

**Duplication issue:** `send-otp` and `initiate-lead-verification` both send OTPs via Twilio Verify. The difference is `initiate-lead-verification` adds a Twilio Lookup step to block VOIP/landlines. Two functions doing overlapping work.

---

## Summary of What Needs Fixing

### Priority 1: Remove Testing Bypasses from `/signup`
The entire phone verification pipeline on the `/signup` page is non-functional. Three bypasses need to be reverted:
- Re-enable `triggerPhoneVerification` to actually call `initiate-lead-verification`
- Re-enable `handleVerifyOtp` to call `verify-otp` with the real code
- Decide whether email verification should gate the user or remain background-only

### Priority 2: Restore Rate Limiting on `send-otp`
The 5-per-phone-per-hour rate limit was removed. This is a cost/abuse vector in production.

### Priority 3: Fix ForgotPasswordForm Styling
Replace hardcoded `text-white` classes with theme-aware tokens.

### Priority 4: Consolidate OTP Edge Functions
`send-otp` and `initiate-lead-verification` overlap. Consider whether `send-otp` (no Lookup) is still needed or if all paths should use `initiate-lead-verification` (Lookup + send).

### Priority 5: `has_password` Resilience
Add a fallback if `profiles.has_password` query fails — currently defaults to `false`, which forces users into set-password flow even if they already have one.

---

## What's Working Well (No Action Needed)
- Auth refresh lock (singleton promise deduplication)
- Session-expired overlay (custom event, no hard redirect)
- AuthGuard redirect with return-to path
- `ScannerLeadCaptureModal` phone verification (uses `initiate-lead-verification` + `verify-lead-otp` correctly)
- Twilio Verify integration in edge functions
- Password strength validation and UX

