

# Unblock Custom Email Setup: Scaffold and Deploy Managed Templates

## Problem
Your email domain `notify.itswindowman.com` is **fully verified** (DNS is fine), but the setup is stuck on "Generating email previews" because the managed email templates were never created. The existing `auth-email-hook/index.ts` uses a manual Resend integration that isn't compatible with the managed Lovable email flow.

## Solution

### Step 1: Scaffold managed email templates
Use `scaffold_auth_email_templates` to generate all 6 template files in `supabase/functions/_shared/email-templates/`:
- `signup.tsx` (email verification)
- `recovery.tsx` (password reset)
- `invite.tsx`
- `magic-link.tsx`
- `email-change.tsx`
- `reauthentication.tsx`

This also replaces `auth-email-hook/index.ts` with the managed version that uses `@lovable.dev/webhooks-js` and `@lovable.dev/email-js`.

### Step 2: Apply brand styling to all templates
Read `src/index.css` to extract your CSS custom properties (primary teal `#0F766E`, dark backgrounds, etc.) and apply them:
- Button background: primary teal color
- Button text: white
- Heading color: foreground color
- Body text: muted-foreground
- Email body background: white (required for email client compatibility)
- Logo: check `public/` and `src/assets/` for existing logo files
- Copy tone: match the app's direct, authority-driven voice ("Window Truth Engine" branding)

### Step 3: Deploy the updated edge function
Call `deploy_edge_functions` with `function_names: ["auth-email-hook"]` to push the new managed version live.

### Step 4: Confirm activation
The managed email system will detect the deployed function and complete setup automatically. Custom auth emails will start sending from `noreply@notify.itswindowman.com`.

## What this replaces
The old `auth-email-hook/index.ts` that manually imported Resend and used `SEND_EMAIL_HOOK_SECRET` will be replaced. The managed flow handles credentials automatically -- no `RESEND_API_KEY` or webhook secret needed.

