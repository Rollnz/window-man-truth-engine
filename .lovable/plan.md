

# Wire VaultCTABlock to Real Google OAuth

## Overview
Replace the mock `console.log` callback on the "GET PREPARED FOR QUOTES" button with a real Google OAuth call using `lovable.auth.signInWithOAuth`.

## Changes

### 1. `src/pages/QuoteScanner.tsx`
- Import `lovable` from `@/integrations/lovable`
- Replace the `onGoogleAuth` mock callback (line 437-439) with a function that calls `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- Add error handling using the same `getOAuthErrorMessage` pattern from `GoogleSignInButton` (or a shared utility), showing a toast on failure

### 2. `src/components/quote-scanner/vault-pivot/VaultCTABlock.tsx`
- Update the JSDoc comment on `onGoogleAuth` prop from "Mock callback for demo" to reflect it now triggers real OAuth

### 3. `src/components/quote-scanner/vault-pivot/NoQuotePivotSection.tsx`
- Update the JSDoc comment on `onGoogleAuth` prop similarly

## Technical Details

The `onGoogleAuth` callback in `QuoteScanner.tsx` (line 437) currently logs to console and does nothing. It will be replaced with:

```typescript
onGoogleAuth={async () => {
  try {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    const error = result?.error
      ? result.error instanceof Error ? result.error : new Error(String(result.error))
      : null;
    if (error) {
      toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
    }
  } catch (err) {
    console.error("Google OAuth error:", err);
    toast({ title: "Sign-in failed", description: "Something went wrong. Please try again.", variant: "destructive" });
  }
}}
```

After successful OAuth, the existing `onAuthStateChange` listener in `useAuth` will pick up the session, and the app's routing/redirect logic will handle navigation (e.g., to Vault).

No new files, no new dependencies, no database changes.

