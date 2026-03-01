## Add Environment-Gated Twilio Diagnostic Button

### What This Does

Adds a permanent "System Health: Twilio" diagnostic button that **only renders on preview/localhost** (never on production). It calls `supabase.auth.signInWithOtp({ phone })` and shows intelligent error-specific toast messages to help diagnose Twilio configuration issues.

### Environment Gating

- **Visible on**: `*.lovable.app`, `localhost`
- **Hidden on**: `itswindowman.com` or any custom domain
- The component returns `null` when on production -- zero DOM footprint

### User Experience

- Small, subtle floating button at the bottom-right of the page (above the floating CTA)
- Styled as a muted developer tool (gray/transparent, small text)
- On click: calls `supabase.auth.signInWithOtp({ phone: '+12038567938' })`
- Shows context-aware toast messages:
  - **Success**: Green toast "Handshake Verified! SMS Sent to +12038567938."
  - **Invalid credentials**: "Twilio Auth Failed: Check Account SID/Token in Supabase Dashboard."
  - **Unverified number**: "Twilio Trial Error: This number isn't verified in your Twilio Console yet."
  - **Provider disabled**: "Supabase Error: Go to Auth -> Providers -> Phone and toggle it ON."
  - **Other errors**: Shows raw error message

### Technical Details

**New file**: `src/components/dev/TwilioDiagnostic.tsx`

- Self-contained component with environment check
- Uses `supabase` client from `@/integrations/supabase/client`
- Uses `sonner` toast for feedback
- Renders a small fixed-position button (z-30, bottom-right, offset above FloatingEstimateButton)

**Modified file**: `src/components/layout/PublicLayout.tsx`

- Import and render `TwilioDiagnostic` component (no Suspense needed -- tiny component)
- Placed after `SilentAllyInterceptor`, before closing `</div>`

No database changes. No new dependencies.