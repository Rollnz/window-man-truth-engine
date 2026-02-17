# Window Man AI Concierge
## Component-Ready UI Spec + GTM Event Map + 1-Sprint Experiment Plan

This document translates the "Window Man AI Concierge" concept into an implementation-ready spec for design + engineering + analytics.

---

## 1) Product objective

Build a premium, trustworthy slide-over panel that:
- Answers high-intent window questions quickly.
- Preserves direct paths for ready buyers (call + estimate).
- Converts AI engagement into booked estimate requests without dark patterns.

Primary conversion objective:
- Increase `panel_open -> lead_submit` and `qa_start -> qa_to_booking` rates.

Guardrails:
- Do not reduce `call_click` among high-intent users.
- Keep mobile interaction within 1 screen where possible.

---

## 2) Component information architecture

Visible panel sections (top to bottom):
1. Header (brand + close + personalization state chip)
2. Value proposition block (headline + subhead)
3. CTA stack (3 visible CTAs max)
4. AI quick-start area (suggested question chips)
5. Trust + compliance strip
6. Optional location capture row (only if ZIP unknown)

### 2.1 Component tree

- `ConciergePanel`
  - `PanelHeader`
    - `BrandBadge`
    - `LocationStatusChip`
    - `CloseButton`
  - `HeroBlock`
    - `Headline`
    - `Subhead`
  - `CTAGroup`
    - `CTA_AIConcierge` (primary)
    - `CTA_Estimate`
    - `CTA_Call`
  - `AIQuickStart`
    - `QuestionChip[]` (1-2 max on mobile)
    - `TextInput` (optional, if opened)
    - `AIAnswerCard` (collapsible)
    - `BookingHandoffCard`
  - `TrustStrip`
    - `RatingSnippet`
    - `ExpertReviewedBadge`
    - `ComplianceNote`
  - `LocationPrompt` (conditional)
    - `ZipInput`
    - `ContinueButton`

---

## 3) Layout spec (desktop + mobile)

### 3.1 Container and panel
- Panel width:
  - Desktop/tablet: `420px` fixed width.
  - Mobile: `min(100vw, 420px)`; full-height overlay.
- Panel height: `100dvh`.
- Internal layout: vertical flex column.
- Safe-area support: include `env(safe-area-inset-bottom)` padding for iOS.

### 3.2 Spacing scale (tokens)
Use an 8-pt system:
- `space-1 = 4px`
- `space-2 = 8px`
- `space-3 = 12px`
- `space-4 = 16px`
- `space-5 = 20px`
- `space-6 = 24px`

Recommended section spacing:
- Panel horizontal padding: `space-4` (16px)
- Vertical rhythm between major sections: `space-4` to `space-5`
- CTA button stack gap: `space-3`
- Chip gap: `space-2`

### 3.3 Touch targets
- All tap targets min `44x44px`.
- CTA buttons height `48px` min.
- Input fields height `48px`.

### 3.4 Scroll behavior
- Default: non-scrolling first viewport for most users.
- Only AI answer area becomes scrollable when expanded.
- Keep primary CTAs above fold unless keyboard is open.

---

## 4) Visual tokens

### 4.1 Color tokens
- `--wm-bg-panel: #0E1623` (deep navy)
- `--wm-bg-card: #142033`
- `--wm-text-primary: #F5F8FC`
- `--wm-text-secondary: #B7C2D3`
- `--wm-accent-primary: #4DA3FF`
- `--wm-accent-primary-hover: #3A8DE5`
- `--wm-accent-success: #33C27F`
- `--wm-border-subtle: #26364D`
- `--wm-warning-subtle: #F4B860`

Accessibility:
- Body text contrast target >= WCAG AA (4.5:1).
- Button text contrast target >= 4.5:1.

### 4.2 Typography tokens
- `--font-display: Inter, system-ui, sans-serif`
- `--font-body: Inter, system-ui, sans-serif`

Sizes:
- Headline: `24px / 30px`, weight 700
- Subhead: `14px / 20px`, weight 400
- CTA label: `15px / 20px`, weight 600
- Meta/trust: `12px / 16px`, weight 500

### 4.3 Radius + shadow + borders
- Panel edge radius (desktop): `16px 0 0 16px`
- Card radius: `12px`
- Button radius: `12px`
- Border: `1px solid var(--wm-border-subtle)`
- Shadow: `0 10px 40px rgba(0,0,0,.35)`

### 4.4 Motion tokens
- Slide-in duration: `180ms`, easing `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Button hover/focus transition: `120ms`
- Reduce-motion support: disable non-essential animation when `prefers-reduced-motion`.

---

## 5) Responsive behavior

### Breakpoints
- `sm`: `< 640px` mobile
- `md`: `640px - 1023px` tablet
- `lg`: `>= 1024px` desktop

### Rules
- Mobile (`sm`):
  - Show 1 suggested AI question chip by default (with "More" expander).
  - Keep all 3 CTAs visible without scrolling.
  - Sticky CTA group if keyboard opens.
- Tablet/desktop (`md+`):
  - Show 2 suggested chips.
  - Trust strip fully visible under fold line.

---

## 6) Content spec (production copy)

- Headline: `Get Straight Answers on Impact Windows`
- Subhead: `AI + expert-backed guidance. Then book when you're ready.`

CTA labels:
1. Primary (AI): `Ask Window Man AI`
2. Secondary (Estimate): `Book a Free Estimate`
3. Tertiary (Call): `Talk to a Human Expert`

Suggested chip examples:
- `Do I need impact windows in my county?`
- `What affects installation timeline most?`

Trust strip copy:
- `Expert-reviewed guidance`
- `No-pressure estimate`
- `Final recommendations require on-site verification`

---

## 7) State-aware personalization logic

### 7.1 Known location state
If ZIP/county exists in session/profile/form state:
- Show chip: `Analyzing {County} County requirements...`
- Show trust badge: `County-aware permit guidance`
- Include county in AI system prompt context.

### 7.2 Unknown location state
If location unknown:
- Show prompt row: `Where are you located?`
- Collect ZIP only (single field).
- Non-blocking: user may still call or request estimate immediately.

### 7.3 Error handling
- Invalid ZIP: inline message `Enter a valid 5-digit ZIP.`
- API timeout for county lookup: fallback copy `Location unavailable. Continuing with general guidance.`

---

## 8) Interaction flow (AI edge case to booking)

1. User opens panel (`panel_open`).
2. User taps `Ask Window Man AI` (`cta_click`).
3. User submits question (`qa_start` + `ai_question_submitted`).
4. AI answers with confidence and bounded claim language.
5. If intent signal detected (price, quote, timeline, install): show booking handoff card.
6. User taps handoff CTA (`qa_to_booking`) -> estimate form opens prefilled with:
   - prior question
   - known ZIP/county
   - urgency/timeline if inferred.
7. Form submit fires `lead_submit`.

Fallback:
- If AI confidence is low, show `Talk to a Human Expert` inline and track human fallback click as `cta_click` with `cta_type=call_fallback`.

---

## 9) GTM event map (implementation-ready)

Use `dataLayer.push()` with consistent payload shape.

### 9.1 Global payload shape

Required keys for all panel events:
- `event`
- `component = "window_man_ai_concierge_panel"`
- `session_id`
- `page_type`
- `device_type`
- `location_known` (boolean)
- `zip_present` (boolean)
- `county_name` (nullable)
- `experiment_id` (nullable)
- `variant_id` (nullable)
- `timestamp_ms`

### 9.2 Event definitions

1. `panel_open`
- When panel becomes visible.
- Params: `open_source` (`chat_icon`, `sticky_prompt`, etc.)

2. `cta_click`
- For all three visible CTAs and fallback CTA.
- Params:
  - `cta_type` (`ai`, `estimate`, `call`, `call_fallback`)
  - `cta_position` (`1|2|3|inline`)
  - `cta_label`

3. `qa_start`
- First AI question submitted in session.
- Params: `question_source` (`chip`, `typed`)

4. `ai_question_submitted`
- Every question sent.
- Params: `question_length_bucket` (`1-40`, `41-120`, `120+`)

5. `ai_answer_rendered`
- AI response displayed.
- Params:
  - `confidence_bucket` (`high|medium|low`)
  - `contains_booking_prompt` (boolean)

6. `qa_to_booking`
- User clicks booking handoff from AI area.
- Params: `handoff_type` (`inline_card`, `footer_prompt`)

7. `call_click`
- User taps call CTA.
- Params: `call_surface` (`cta_main`, `fallback_inline`)

8. `lead_submit`
- Estimate form successfully submitted.
- Params:
  - `lead_source` (`panel_estimate`, `qa_handoff`)
  - `fields_completed_count`

9. `location_capture`
- ZIP submitted in panel.
- Params:
  - `zip_valid` (boolean)
  - `lookup_status` (`success|fail|timeout`)

### 9.3 Example dataLayer payload

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'cta_click',
  component: 'window_man_ai_concierge_panel',
  session_id: 'abc123',
  page_type: 'service_detail',
  device_type: 'mobile',
  location_known: true,
  zip_present: true,
  county_name: 'Broward',
  experiment_id: 'wm_ai_concierge_v1',
  variant_id: 'B',
  cta_type: 'ai',
  cta_position: 1,
  cta_label: 'Ask Window Man AI',
  timestamp_ms: Date.now()
});
```

---

## 10) One-sprint experiment plan (10 business days)

## 10.1 Test design
- Experiment ID: `wm_ai_concierge_v1`
- Control (A): existing panel with Call + Estimate + existing third CTA (or none)
- Variant (B): AI Concierge panel spec in this document
- Allocation: 50/50 randomized at user/session level
- Eligibility: visitors on service and quote-intent pages

### 10.2 Hypotheses
Primary hypothesis:
- Variant B increases `panel_open -> lead_submit` by improving trust and guided decisioning.

Secondary hypothesis:
- Variant B increases `qa_start -> qa_to_booking` without reducing `call_click` by more than 5% relative.

### 10.3 Metrics
Primary metric:
- `lead_submit_rate_from_panel = lead_submit / panel_open`

Secondary metrics:
- `qa_to_booking_rate = qa_to_booking / qa_start`
- `call_click_rate = call_click / panel_open`

Quality guardrails:
- Form completion quality proxy: `fields_completed_count`
- Speed proxy: median seconds `panel_open -> lead_submit`

### 10.4 Sample ratio + quality checks
- Daily SRM check (expected 50/50 split).
- Event integrity checks:
  - `panel_open` >= all downstream events
  - `qa_to_booking` <= `qa_start`
  - `lead_submit` payload contains valid `lead_source`

### 10.5 Sprint task breakdown
Day 1-2:
- Finalize UI in design tokens and copy lock.
- Add component scaffolding.

Day 3-4:
- Implement panel UI + responsive behavior.
- Add personalization logic + ZIP validation.

Day 5:
- Implement AI edge flow handoff card.

Day 6:
- Instrument GTM events + QA event payloads in GTM preview.

Day 7:
- Accessibility + performance pass.

Day 8:
- Launch behind feature flag + 10% canary.

Day 9-10:
- Ramp to 50/50 and monitor metrics + guardrails.

### 10.6 Rollout and stop conditions
Rollback triggers:
- `call_click_rate` drops >10% relative for 2 consecutive days.
- Any critical analytics outage on `lead_submit` tracking.

Scale-up trigger:
- Positive trend in primary metric with stable guardrails after minimum sample window.

---

## 11) Engineering acceptance criteria

1. Three CTAs visible at once, no additional persistent CTAs.
2. Mobile view keeps key actions thumb-friendly and above fold.
3. Known location users see county-aware message.
4. Unknown location users can continue without mandatory ZIP.
5. All listed GTM events fire with required payload fields.
6. AI handoff preserves user context into estimate flow.
7. Accessibility meets keyboard + contrast + reduced-motion requirements.

---

## 12) QA checklist

- [ ] Panel opens from chat icon on all targeted templates.
- [ ] CTA ordering and labels match spec.
- [ ] ZIP validation handles valid/invalid/timeout scenarios.
- [ ] AI handoff appears for high-intent queries.
- [ ] `panel_open`, `cta_click`, `qa_start`, `qa_to_booking`, `lead_submit`, `call_click` verified in GTM preview.
- [ ] Experiment IDs and variant IDs present in payload.
- [ ] Mobile iOS safe-area and keyboard overlay behavior validated.
- [ ] Screen reader focus order: header -> CTAs -> AI input -> trust row.

