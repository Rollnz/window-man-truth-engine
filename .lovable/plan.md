
# Improve Google OAuth Error Handling

## Overview
Update `GoogleSignInButton.tsx` to detect specific OAuth error types and show clear, actionable toast messages instead of raw error strings.

## Changes (1 file)

### `src/components/auth/GoogleSignInButton.tsx`

Add a helper function `getOAuthErrorMessage(error)` that pattern-matches against the error message string to return user-friendly copy:

| Error pattern | Toast title | Toast description |
|---|---|---|
| `redirect_uri_mismatch` | "Configuration issue" | "Google sign-in isn't available in this environment. Please try from the published app." |
| `access_denied` / `user_denied` | "Sign-in cancelled" | "You cancelled the Google sign-in. You can try again anytime." |
| `popup_closed` / `popup_blocked` | "Pop-up blocked" | "Your browser blocked the sign-in window. Please allow pop-ups and try again." |
| `network` / `fetch` | "Connection problem" | "Couldn't reach Google. Check your internet connection and try again." |
| `temporarily_unavailable` / `server_error` | "Google is unavailable" | "Google sign-in is temporarily down. Please try again in a few minutes." |
| Default fallback | "Sign-in failed" | "Something went wrong with Google sign-in. Please try again or use email instead." |

Apply this mapping in both the `if (error)` block (returned errors) and the `catch` block (thrown errors). The catch block will also check the error message for the same patterns.

No new files, no new dependencies. Purely a UX improvement to the existing component.
