

## Fix Twilio SMS Integration -- Root Cause + Code Improvement

### Root Cause: Dashboard Field Mapping Error

The `VA3...` value (a **Twilio Verify Service SID**) is currently in the **Messaging Service SID** field. This is incorrect. Supabase's GoTrue uses the **Twilio Verify Service SID** field to call the Twilio Verify API. When it finds a Verify SID in the Messaging field, Twilio's Messaging API rejects it with "unable to get service provider."

**Fix (manual -- you must do this):**

1. Open Phone provider settings in the backend configuration
2. **Clear** the "Messaging Service SID" field (leave it empty)
3. **Paste** the `VA3...` value into the **"Twilio Verify Service SID"** field
4. Save

### Code Change: Enhanced Error Reporting in TwilioDiagnostic

**File**: `src/components/dev/TwilioDiagnostic.tsx`

Update the `handleSendSms` error handler to display the raw error status code and message alongside the friendly message. This prevents "silent" failures in the future.

Changes:
- Show `error.status` (401/403/404/422/500) in the toast for every failure
- Add the raw `error.message` as a secondary line so the exact backend response is always visible
- Add a catch for the specific "unable to get" / "service provider" error pointing to the Verify SID field misconfiguration specifically

### Why the Code Was Not the Problem

- `signInWithOtp({ phone: testPhone })` -- correct, no extra options overriding
- `verifyOtp({ phone, token, type: 'sms' })` -- correct type
- Environment gating -- working correctly
- No token truncation (32 chars confirmed)

### Verification Steps

After making the dashboard field swap:
1. Click "Dev Health Suite" pill
2. Click "Send Test SMS"
3. You should receive an SMS and see the OTP input
4. Enter the 6-digit code to complete the full loop

### Technical Details

The single code change adds raw error details to the toast output:

```text
Before: "Unable to reach SMS provider. Check Twilio SID, Token & Messaging Service SID."
After:  "[422] Unable to reach SMS provider. Check Twilio Verify Service SID field (not Messaging SID). Raw: <exact error message>"
```

The error handler block at line 96-108 will be updated to include `error.status` prefix on every toast, and the "service provider" / "unable to get" branch will specifically mention the Verify SID vs Messaging SID distinction.

