

## Universal Thank You Page -- Hybrid Build

### What Gets Built

6 files total: 4 new, 2 modified. No new dependencies. No backend changes.

### Architecture Decisions

**Route placement**: Standalone route outside `PublicLayout` (same pattern as `/audit` on line 155 of App.tsx). This avoids `UnifiedFooter`, `MobileStickyFooter`, and `FloatingEstimateButton`. The page renders its own `Navbar` with `funnelMode={true}`.

**Content system**: Version 2's `BASE` spread pattern for the content config -- reduces duplication across 11 source keys while keeping strict TypeScript interfaces from Version 1.

**Visual style**: Matches homepage/sample-report aesthetic (blue + orange tokens, frosted glass cards, radial gradient orbs). NOT a dark control room. Uses existing CSS variables (`--surface-1`, `--surface-2`, `--primary`, `--accent-orange`) and existing components (`AnimateOnScroll`, `TestimonialCards`, `UrgencyTicker`, shadcn `Accordion`, `Button` variants).

**Tracking**: Single `page_view` event on mount with `conversion_complete: true`. No `lead_submission_success` on this page. `useRef` guard for StrictMode safety. CTA clicks tracked with `thankyou_cta_click`.

---

### File 1: `src/constants/contact.ts` (NEW)

Centralized phone constant. All call links across the page use `CONTACT.PHONE_E164` instead of raw strings.

```
PHONE_E164: '+15614685571'
PHONE_DISPLAY: '(561) 468-5571'
PHONE_ARIA: 'Call Window Man at 561-468-5571'
```

### File 2: `src/config/thankYouContent.ts` (NEW)

Strict TypeScript interfaces (Version 1's `ThankYouSource` union type + `ThankYouSourceConfig` interface). Uses Version 2's `BASE` spread pattern to reduce copy duplication. Adds `guaranteeHeadline` and `guaranteeBody` fields from Version 2 for the "Beat Your Quote" differentiator block.

11 source keys + `'generic'` fallback. `resolveThankYouSource()` resolver returns `'generic'` for unknown/missing sources (never a blank screen).

Key Version 2 improvement adopted: the guarantee copy is defensible ("If we can beat it on the same scope/specs, we show you. If we can't, we tell you.") rather than an absolute claim.

### File 3: `src/pages/ThankYou.tsx` (NEW)

**Hybrid section order** (takes the best from both versions):

1. **Navbar** -- `funnelMode={true}` (existing component, no modifications)

2. **Confirmation Hero** (Version 1 structure + Version 2 copy tone)
   - Radial gradient orbs (blue + orange, matching homepage)
   - Frosted glass card: `bg-card/80 backdrop-blur-lg border border-border/50 rounded-2xl shadow-2xl`
   - Pill badge: Check icon + "Confirmed"
   - Personalized greeting from query param `name`
   - Brand voice line (Version 2's sharper copy: "Good move. Most homeowners don't see the traps until it's too late.")
   - Dynamic headline + subhead from config
   - Trust chips: ['No sales pitch', 'No obligation', 'Available 24/7']
   - Safety microcopy: "We never sell your information. Ever."

3. **UrgencyTicker** (Version 1 addition -- uses existing `UrgencyTicker` component with `variant="minimal"`)

4. **Primary Call CTA Section** (Version 2's cleaner layout)
   - "Call now -- get your next step in minutes." heading
   - Large `variant="cta"` button linking to `tel:+15614685571`
   - Subtext + 3 "On the call" bullets with check icons
   - AI disclosure: "Window Man is our voice assistant -- available 24/7..."

5. **Upload + Guarantee Block** (Version 2 exclusive -- this is the money section)
   - "Beat Your Quote Path" pill badge
   - Upload CTA: `variant="cta"` button to `/ai-scanner`
   - Defensible guarantee copy: "If we can beat it on the same scope/specs, we show you the competing offer. If we can't legitimately beat it, we tell you -- and we don't send you to anyone."
   - Source-specific secondary web CTAs (delayed 1.5s for psychological pacing)
   - Bottom line closer: "Most companies sell you their quote. Window Man is built to challenge it."

6. **"What Happens Next" Timeline** (Version 1's 3-step horizontal strip)
   - Desktop: 3-column grid with gradient connector line
   - Mobile: vertical stack with numbered badges
   - Steps from content config per source
   - Icons: Clock, Shield, Check

7. **TestimonialCards** (Version 2 addition -- uses existing `TestimonialCards` component with `variant="dark"`)

8. **Final Close / CTA Repeat** (Version 2 exclusive)
   - "Ready to protect your deal?" heading
   - Dual buttons: Call + Upload Quote
   - Final AI disclosure + safety line

9. **Micro-FAQ** (Version 1's accordion, moved to bottom)
   - 3 items using existing shadcn Accordion
   - AI disclosure line below

10. **DEV Debug Widget** (both versions agree -- fixed bottom-right, `import.meta.env.DEV` only)

**Tracking implementation:**
- Query params: `source`, `leadId` (aliases: `lead_id`, `lead`), `name`, `eventId` (alias: `event_id`), `value`
- `useRef(false)` guard fires one `trackEvent('page_view', { conversion_complete: true, ... })` on mount
- `handleCtaClick` function fires `trackEvent('thankyou_cta_click', { cta, phone_number, link_type })` per click
- `useLeadIdentity().setLeadId(leadId)` on mount if non-empty
- SEO: `noindex, nofollow` via react-helmet-async

**Imports** (exact paths, no re-implementations):
- `trackEvent` from `@/lib/gtm`
- `useLeadIdentity` from `@/hooks/useLeadIdentity`
- `Navbar` from `@/components/home/Navbar`
- `AnimateOnScroll` from `@/components/ui/AnimateOnScroll`
- `TestimonialCards` from `@/components/TestimonialCards`
- `UrgencyTicker` from `@/components/social-proof`
- `Accordion` components from `@/components/ui/accordion`
- `Button` from `@/components/ui/button`
- `CONTACT` from `@/constants/contact`

### File 4: `src/App.tsx` (MODIFY)

- Add lazy import: `const ThankYou = lazy(() => import("./pages/ThankYou"));`
- Add standalone route next to `/audit` (line 155): `<Route path="/thank-you" element={<ThankYou />} />`

### File 5: `src/config/navigation.ts` (MODIFY)

- Add `THANK_YOU: '/thank-you'` to `ROUTES` object
- Add `'/thank-you'` to `FUNNEL_ROUTES` array

---

### What Each Version Contributes to the Hybrid

| Feature | Version 1 | Version 2 | Hybrid |
|---------|-----------|-----------|--------|
| Content config typing | Strict interfaces | BASE spread pattern | Both (strict types + spread) |
| Guarantee block | Not present | Defensible copy | Version 2 |
| UrgencyTicker | Included | Not present | Version 1 |
| TestimonialCards | Not present | Included | Version 2 |
| Final close CTA repeat | Not present | Included | Version 2 |
| Timeline section | HowItWorks pattern | Simpler badges | Version 1's richer layout |
| Social proof stats | Hardcoded stats section | TestimonialCards component | Version 2 (real component) |
| Delayed secondary CTAs | 1.5s delay | 1.5s delay | Both agree |
| FAQ accordion | 3 items | Not present | Version 1 |
| Debug widget | Both | Both | Both |

### What This Does NOT Change

- No modifications to `gtm.ts`, `save-lead`, or any edge function
- No modifications to any existing form or modal
- No new database tables or backend changes
- No new dependencies

