
# Make the Slide-Over Panel Route-Aware (v3 Implementation)

## Current State

The slide-over panel is **not page-aware**. Whether a user opens it from `/beat-your-quote`, `/ai-scanner`, or the homepage, they see the exact same headline, chips, CTA labels, and default AI mode. The only customization today comes from:

- A/B variant (sticky via localStorage, variants A-E)
- Geo personalization (county-aware suggestions)
- Forensic Ally override (special skin when triggered by SilentAllyInterceptor)

## What This Changes

When the panel opens, it will now match its first impression to the page the user is on:

- `/beat-your-quote` -- headline: "Find the Hidden Markup", savings mode, chips like "Is my quote competitive?"
- `/ai-scanner` -- headline: "Investigate Your Quote", proof mode, chips like "What red flags should I look for?"
- `/fair-price-quiz` -- headline: "What Should You Really Pay?", diagnostic mode
- Homepage and other pages -- existing defaults preserved

## Files to Create (2)

### 1. `src/lib/routeContext.ts`

Pure function with no React dependencies. Exports:

- `RouteContext` type (key, defaultMode, headline, subheadline, ctaPrimaryLabel, ctaSecondaryLabel, chips, modeBadgeLabel)
- `getRouteContext(pathname)` function using `startsWith()` matching for future-safe nested paths

**Route mapping:**

| Route | key | defaultMode | Headline | Badge | Required Chip |
|---|---|---|---|---|---|
| /beat-your-quote | beat_quote | savings | "Find the Hidden Markup" | Savings Mode | "Is my quote competitive?" |
| /ai-scanner | ai_scanner | proof | "Investigate Your Quote" | Proof Mode | "What red flags should I look for?" |
| /fair-price-quiz | fair_price_quiz | diagnostic | "What Should You Really Pay?" | Diagnostic Mode | "What's a fair price range?" |
| /sample-report | sample_report | proof | "See What We Uncover" | Proof Mode | "What does a real analysis show?" |
| /consultation | consultation | concierge | "Book Your Free Consult" | Consult Mode | "What happens during a consult?" |
| /cost-calculator | cost_calculator | savings | "Understand the Real Costs" | Savings Mode | "Am I overpaying?" |
| /risk-diagnostic | risk_diagnostic | diagnostic | "Know Your Risk Level" | Diagnostic Mode | "How vulnerable are my windows?" |
| /vulnerability-test | vulnerability_test | diagnostic | "Check Your Exposure" | Diagnostic Mode | "What's my biggest risk?" |
| / | home | concierge | "Window Man Is Standing By" | (none) | "Where do I start?" |
| * (default) | default | concierge | "Get Your Free Estimate" | (none) | general chips |

Each route provides 3-4 chips in Window Man's investigative tone. Chip ordering: route-specific first, then geo chip if available and not duplicated, then general filler if under 5. Hard cap at 5.

### 2. `src/hooks/useRouteContext.ts`

Thin React hook: calls `useLocation()` from react-router-dom, returns `getRouteContext(pathname)`. Re-renders on navigation.

## Files to Modify (8)

### 3. `src/lib/panelVariants.ts`

Add `'forensic_ally'` to the AiQaMode union type so the panel can accept it as a valid mode from the SilentAllyInterceptor:

```
export type AiQaMode = 'proof' | 'diagnostic' | 'savings' | 'storm' | 'concierge' | 'forensic_ally';
```

### 4. `supabase/functions/slide-over-chat/index.ts`

- Add `'forensic_ally'` to the edge function's AiQaMode type (line 51)
- Add a `forensic_ally` entry to `modePrompts` with a stricter pro-consumer forensic system prompt
- This ensures the mode is forwarded unchanged and the edge function can use it

### 5. `src/components/floating-cta/EstimateSlidePanel.tsx`

The main orchestration changes:

- Import `useRouteContext` hook
- Compute `isForensicAllyOpen` from `triggerSource === 'exit_intent_ally'` (skin-only, decoupled from mode)
- Implement strict mode resolution: `triggerMode` (explicit) > `routeContext.defaultMode` (URL) > `'concierge'` (fallback)
- Use `routeContext.headline` / `routeContext.subheadline` for SheetTitle/SheetDescription on the choice step (unless Forensic Ally skin is active)
- Pass `routeContext` down to `ChoiceStepDispatcher`
- Compute `open_source`: `'silent_ally'` | `'explicit_event'` | `'floating_button'`
- Add `wm_panel_opened` dataLayer push (additive -- existing events preserved unchanged)
- Extend existing `floating_cta_opened` and `slide_over_opened` with `route_context_key` field
- Add `routeContextFrozenRef` (useRef): clear on mount, freeze on first entry to `ai-qa` step, prevents chips/headline churn mid-conversation

### 6. `src/components/floating-cta/steps/choice-variants/types.ts`

Add `routeContext: RouteContext` to `ChoiceVariantProps` interface.

### 7. `src/components/floating-cta/steps/choice-variants/index.tsx`

Accept `routeContext` in `ChoiceStepDispatcherProps`, pass through to variant component. Add `route_context_key` to existing `choice_step_viewed` tracking.

### 8. `src/components/floating-cta/steps/choice-variants/VariantE_AiConcierge.tsx`

Primary route-aware UI target:

- Replace hardcoded `suggestedQuestions` array with `routeContext.chips`
- Merge one geo chip (county permit question) if available and not duplicated; cap at 5
- Show `routeContext.modeBadgeLabel` as a subtle pill badge (only when non-empty)
- Use `routeContext.ctaPrimaryLabel` for the main CTA button text
- Pass `routeContext.defaultMode` to `onStartAiQa` instead of hardcoded `'concierge'`
- Fire `wm_panel_chip_clicked` dataLayer event on chip click

### 9. Variants A, B, C, D (minimal changes)

Accept `routeContext` via updated `ChoiceVariantProps`. Optionally use `routeContext.ctaPrimaryLabel` / `ctaSecondaryLabel` for CTA labels when the route provides contextual copy, falling back to their existing `PANEL_VARIANT_CONFIG` values. No chip changes (chips are Variant E only).

## Precedence Logic (Critical)

```text
Mode resolution:
  1. triggerMode (explicit override -- forensic_ally, savings, proof, etc.)
  2. routeContext.defaultMode (from current URL)
  3. 'concierge' (fallback)

Skin resolution (independent):
  isForensicAllyOpen = triggerSource === 'exit_intent_ally'
  Controls: cyan gradient skin, avatar header, auto-start in ai-qa, preset intro
  Does NOT touch mode
```

This means:
- SilentAlly primary CTA sends `mode='forensic_ally'` + `source='exit_intent_ally'` -- forensic skin ON, mode = forensic_ally
- SilentAlly downsell sends `mode='savings'` + `source='exit_intent_ally'` -- forensic skin ON, mode = savings
- User clicks floating button on `/beat-your-quote` -- no trigger, mode = savings (from route), no forensic skin
- Component dispatches `{mode:'proof'}` from `/beat-your-quote` -- mode = proof (override wins), no forensic skin

## Tracking (Additive Only)

**New events (added alongside existing, no removals):**

`wm_panel_opened`: route_path, route_context_key, resolved_mode, panel_variant, open_source, engagement_score, event_id, client_id, session_id, external_id

`wm_panel_chip_clicked` (Variant E only): route_context_key, chip_text, resolved_mode, panel_variant

**Extended existing events (no breaking changes):**
- `floating_cta_opened` gets `route_context_key`
- `slide_over_opened` gets `route_context_key` and `resolved_mode`
- `choice_step_viewed` gets `route_context_key`

No existing events are removed or renamed. GTM migration to `wm_panel_opened` as canonical event happens in a follow-up.

## Session Consistency

- While on choice step: `routeContext` updates live (if user navigates or geo resolves)
- On first entry to `ai-qa` (any path: chip click, CTA, Forensic Ally autostart): freeze `routeContext` into a ref
- Frozen context used for all downstream UI (chips, headline in chat)
- Cleared only on panel close

## What Does NOT Change

- A/B variant assignment and localStorage stickiness
- Geo personalization hook and county resolution
- Forensic Ally cyan skin rendering
- SilentAllyInterceptor code (zero modifications)
- Form steps, gating, lead capture, save-lead edge function contract
- Existing tracking event names and payloads (only additions)

## Test Plan

1. Open panel on `/beat-your-quote` -- headline "Find the Hidden Markup", chips include "Is my quote competitive?", badge "Savings Mode" (Variant E)
2. Open panel on `/ai-scanner` -- proof framing, chips include "What red flags should I look for?"
3. SilentAlly primary CTA on any page -- forensic skin activates, mode = forensic_ally
4. SilentAlly downsell -- forensic skin activates, mode = savings, initial message preserved
5. Dispatch `open-estimate-panel` with `{mode:'proof'}` from `/beat-your-quote` -- proof wins over route savings default
6. Check dataLayer: `wm_panel_opened` fires alongside existing events, no duplicates on same event name
7. Click chip in Variant E -- `wm_panel_chip_clicked` fires with correct route_context_key
