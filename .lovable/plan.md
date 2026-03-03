

# Milestone 1: Universal Thank You Page

## Goal
Create a single canonical post-submit page at `/thank-you` that all lead capture forms can redirect to. Fires one non-OPT tracking event. Displays dynamic content based on `?source=` query param.

## Files to Create

### 1. `src/pages/ThankYou.tsx` (~120 lines)

**What it does:**
- Reads `?source=` and `?leadId=` from URL search params
- Reads `firstName` from `useSessionData()` for personalization ("Thank you, Mike!")
- If `leadId` param exists, syncs it to Golden Thread via `useLeadIdentity().setLeadId()`
- Renders a clean confirmation card with:
  - Success icon (CheckCircle2 from lucide)
  - Dynamic headline based on source (e.g., "Your Quote Analysis is Ready" vs "We'll Be in Touch")
  - Expectation-setting copy ("A specialist will reach out within 24 hours")
  - Primary CTA: Link to `/ai-scanner` ("Scan Your Quote Now")
  - Secondary CTA: Link to `/consultation` ("Book a Free Consultation")
  - AI voice assistant phone number (+15614685571) as tertiary CTA
- Uses existing Tailwind tokens, no new design system

**Tracking (on mount, once):**
```ts
trackEvent('thankyou_page_view', {
  source: sourceParam,        // e.g. 'quote-scanner', 'consultation', 'estimate'
  lead_id: leadId || undefined,
  conversion_complete: true,
});
```
- This is a NON-OPT event via `trackEvent()` from `src/lib/gtm.ts`
- No value/currency attached
- No new event names invented

**Source-to-content mapping (simple switch):**

| `?source=` | Headline | Primary CTA |
|---|---|---|
| `quote-scanner` | "Your Quote Analysis is Ready" | "View Your Results" -> `/ai-scanner` |
| `consultation` | "Consultation Request Received" | "Scan a Quote While You Wait" -> `/ai-scanner` |
| `estimate` | "Your Estimate Request is Submitted" | "Scan Your Quote" -> `/ai-scanner` |
| `beat-your-quote` | "We're Finding You a Better Deal" | "Track Your Results" -> `/vault` |
| (default) | "Thank You!" | "Explore Our Tools" -> `/tools` |

## Files to Modify

### 2. `src/config/navigation.ts`
- Add `THANK_YOU: '/thank-you'` to the `ROUTES` object
- Add `/thank-you` to `FUNNEL_ROUTES` array (hides sticky footer/floating CTAs on this page)

### 3. `src/App.tsx`
- Add lazy import: `const ThankYou = lazy(() => import("./pages/ThankYou"));`
- Add route inside the `<Route element={<PublicLayout />}>` block: `<Route path="/thank-you" element={<ThankYou />} />`

## What This Does NOT Do (Scope Control)
- Does NOT change any existing form's `onSuccess` behavior yet -- forms keep their inline success states for now
- Does NOT add Stripe or payment logic
- Does NOT create new tracking events beyond `thankyou_page_view`
- Does NOT restyle existing components

## Events Fired
| Event Name | Fired Via | Payload |
|---|---|---|
| `thankyou_page_view` | `trackEvent()` from `src/lib/gtm.ts` | `{ source, lead_id, conversion_complete: true }` |

No OPT events. No value/currency.

## Definition of Done
- [ ] `/thank-you` renders with brand-consistent styling
- [ ] `?source=quote-scanner` shows scanner-specific headline and CTA
- [ ] `?leadId=<uuid>` syncs to Golden Thread on mount
- [ ] `thankyou_page_view` fires exactly once in dataLayer on page load
- [ ] Route is wired in `App.tsx` inside `PublicLayout`
- [ ] `ROUTES.THANK_YOU` exists in navigation config
- [ ] Page is in `FUNNEL_ROUTES` (no floating CTA clutter)
- [ ] Mobile responsive, matches existing page styling
- [ ] `prefers-reduced-motion` respected (no gratuitous animations)

## Technical Notes
- The `useLeadFormSubmit` hook already has a `redirectTo` option -- once this page exists, future milestones can wire forms to redirect here by passing `redirectTo: '/thank-you?source=xxx&leadId=yyy'`
- The page uses `replace: true` pattern when navigated to (handled by the redirecting form, not the page itself) to prevent back-button re-submissions
- No database reads needed -- all data comes from URL params + sessionData

