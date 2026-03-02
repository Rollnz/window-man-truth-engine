

# Testing Mode Override

Apply three changes to let you test the full flow without rate limits, email blocking, or real OTP verification.

## 1. Remove rate limiting from `send-otp` edge function

**File:** `supabase/functions/send-otp/index.ts`

Strip out all rate-limiting logic (the Supabase client creation, the `rate_limits` table query, the 429 check, and the insert). Keep the Twilio Verify call and error handling intact. The function will still send real SMS but won't block repeated requests.

## 2. Make email magic link non-blocking in `Signup.tsx`

**File:** `src/pages/Signup.tsx`

After calling `signInWithOtp({ email })`, instead of stopping at `VERIFYING_EMAIL` and waiting for the user to click the magic link, immediately transition to `VERIFYING_PHONE` and auto-trigger the phone verification step. The email is still sent in the background but doesn't gate progress.

Key change in `handleAuthSubmit` (~line 306-311): After the email OTP call, skip setting state to `VERIFYING_EMAIL` and instead call `triggerPhoneVerification(payload.phone)` directly.

## 3. Bypass OTP_GATE entirely in `Signup2.tsx`

**File:** `src/pages/Signup2.tsx`

- **`handleTheaterComplete`** (~line 219): Instead of transitioning to `OTP_GATE` and sending an OTP, immediately set `otpVerified = true` and transition to `REVEAL` (if analysis is ready) or stay in a waiting state that auto-transitions.
- **`handleVerifyOtp`** (~line 234): Make it always succeed without calling the backend -- set `otpVerified = true` immediately.
- **The `OTP_GATE` overlay** (~line 380): Will naturally not render since `otpVerified` is set to `true` before the phase even reaches `OTP_GATE`.

## 4. Bypass phone OTP in `Signup.tsx`

**File:** `src/pages/Signup.tsx`

- **`handleVerifyOtp`** (~line 322): Skip `supabase.auth.verifyOtp()` entirely. Accept any code as valid and proceed to `POLLING_ANALYSIS` or `QUALIFYING`.
- **`triggerPhoneVerification`** (~line 163): Skip `supabase.auth.updateUser({ phone })`. Just transition the state directly.

## Summary of files changed

| File | Change |
|------|--------|
| `supabase/functions/send-otp/index.ts` | Remove rate-limiting block |
| `src/pages/Signup.tsx` | Email non-blocking + OTP auto-accept |
| `src/pages/Signup2.tsx` | Skip OTP_GATE, auto-verify |

All changes are clearly marked as testing overrides so they can be reverted later.
