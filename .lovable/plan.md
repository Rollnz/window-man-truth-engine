

# Mobile-First: Micro-Commitments, Context Pre-fill, and Persona Expansion

## The Constraint

The slide-over sheet renders at `w-3/4` on mobile (roughly 280px on a 375px screen) with `p-6` padding, leaving about 232px of usable horizontal space. Every pixel of vertical space matters because the chat area, soft gate, and input bar all compete for the same ~500px of visible drawer height.

---

## File 1: `src/components/floating-cta/steps/AiQaStep.tsx`

### Change A: Soft Gate CTA (replaces routing, never stacks)

Add a `showSoftGate` boolean state. After post-stream parsing, if the latest message has a `verdict` OR `actions.length > 0`, set `showSoftGate = true`.

**The soft gate REPLACES the existing `showRouting` block** -- it does not stack on top. The render logic becomes:
- If `showSoftGate === true` AND `showRouting === true`: render ONLY the soft gate (it subsumes routing)
- If `showSoftGate === false` AND `showRouting === true`: render standard routing CTAs (existing behavior)

**Mobile layout (why it fits):**

The soft gate is a single compact row, not a card:

```
[Shield icon] Window Man flagged findings.    <- 1 line, text-xs
[====== Save My Analysis ======]              <- 1 button, w-full, py-2
[        I'll do it later       ]             <- text link, py-1
```

Total height: approximately 80px (vs the existing routing block which is ~90px with its heading + 2 buttons). It is shorter than what it replaces.

**Why it looks great:** No card container, no border, no padding bloat. The shield icon + single-line copy + single full-width button is the most compact possible CTA. On a 375px screen, the text wraps cleanly at `text-xs` and the button has generous tap target at `w-full py-2`.

**Social proof line:** Rendered as inline `text-[10px]` micro-copy directly below the button: "X homeowners in [County] saved their report today." This is raw text, NOT the UrgencyTicker component -- no animation, no pulsing dot, no layout cost.

**Keyboard dismissal:** When `showSoftGate` becomes true, call `inputRef.current?.blur()` to dismiss the mobile keyboard, ensuring the full soft gate is visible without the "letterbox" effect.

**Tracking:** Fire `ai_micro_commit_shown` (verdict, mode) via `useEffect` when `showSoftGate` transitions to true. Fire `ai_micro_commit_accepted` (source: 'soft_gate', mode) on "Save My Analysis" click.

### Change B: Action buttons -- full-width stacked on mobile

Change the action button container from `flex gap-2 flex-wrap` to `flex flex-col gap-1.5`. Each button becomes `w-full` with tight vertical padding (`py-1.5 text-xs`).

**Why it looks great:** On a 280px-wide drawer, "Is My Price Fair?" (17 characters) plus an arrow icon fits comfortably on a single line at `text-xs`. Stacking vertically gives each button a full-width tap target (minimum 44px height per button), which meets Apple HIG guidelines. The `gap-1.5` (6px) keeps them visually grouped without wasting space.

**Height budget:** 2 stacked buttons = approximately 100px. Combined with the verdict badge above (24px), total action block is about 124px -- less than 25% of a typical 500px visible drawer area. The AI's answer text remains visible above.

### Change C: Chat-to-Tool pre-fill via URL params

Update `handleActionClick` to build `URLSearchParams` from truthContext:

```typescript
const params = new URLSearchParams();
const wc = sessionData.windowCount || formData.windowCount;
const zip = sessionData.zipCode || formData.zip;
const lastVerdict = messages.findLast(m => m.verdict)?.verdict;

if (wc) params.set('count', String(wc));
if (zip) params.set('zip', zip);
if (lastVerdict) params.set('verdict', lastVerdict);
params.set('ref', 'wm_chat');

navigate(`${action.route}?${params.toString()}`);
```

Fire `ai_context_passed` with `target_route` and `param_count`.

**Attribution safety:** `ref` is an internal referral path. The attribution system uses `utm_source`, `gclid`, `fbclid` -- separate namespace, no collision.

### Change D: Tracking events (3 new)

All via `wmRetarget`, no OPT events:
- `ai_micro_commit_shown` -- verdict, mode
- `ai_micro_commit_accepted` -- source: 'soft_gate', mode  
- `ai_context_passed` -- target_route, param_count

---

## File 2: `src/pages/FairPriceQuiz.tsx`

### Change A: Read URL params and pre-fill window count

Import `useSearchParams`. On mount, read `count`, `zip`, `ref` params.

If `count` is a valid positive integer, pre-set `answers[2]` (the window count question, index 2) with that number value. This is the `type: 'number'` question "How many windows are you replacing?"

If `ref === 'wm_chat'`, auto-advance phase from `'hero'` to `'quiz'` and set `currentStep` to the NEXT unanswered question (if count is pre-filled, skip to step 3). This skips the hero landing page so the user feels continuity from the chat.

**Pre-filled fields are fully editable:** The quiz uses `useState` for answers -- the pre-filled value is just an initial state. The number input renders normally with the value visible and editable. No "locked" UI treatment.

### Change B: Continuity banner (mobile-safe)

When `ref === 'wm_chat'` is present, render a small pill at the top of the quiz container:

```
[Shield icon] Continuing your Window Man analysis
```

Styled as `inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium`. This is 28px tall and sits inside the existing `container px-4` padding.

**Why it looks great:** On mobile, this pill is a subtle orientation cue -- the user knows they didn't land on a random page. It takes only 28px of vertical space and matches the badge aesthetic already used in `QuizHero` (the "Fair Price Diagnostic" badge).

---

## File 3: `src/pages/QuoteScanner.tsx`

### Change A: Read URL params, sync zip to session

Import `useSearchParams`. On mount, read `zip`, `ref` params.

If `ref === 'wm_chat'` and `zip` is present, call `updateField('zipCode', zip)` to sync session data.

No visual changes. The scanner is upload-based -- no form fields to pre-fill. But the zip is now available in session for the edge function analysis.

---

## File 4: `src/pages/BeatYourQuote.tsx`

### Change A: Read URL params, sync context to session

Import `useSearchParams` and `useSessionData` (already imported). On mount, read `count`, `zip`, `ref` params.

If `ref === 'wm_chat'`, sync available fields via the existing session hook.

No visual changes. Context flows silently into the session for downstream use.

---

## File 5: `supabase/functions/slide-over-chat/index.ts`

### Change A: Guardian Pivot paragraph

Add one new paragraph to the `actionsInstructions` section of `buildSystemPrompt()`, after the existing "ROUTING FALLBACKS" block:

```
THE GUARDIAN PIVOT:
When you detect red flags or the user seems uncertain, occasionally offer to "lock" or "save" their analysis.
Example: "I've flagged some concerns here. I recommend we lock this analysis in your vault now -- it makes it harder for a salesperson to wiggle out later."
Use "vault" and "lock data" terminology to frame data collection as protection, not marketing.
Max once per conversation. Only when verdict would be "inspect" or "breach."
Do NOT use this if the user seems casual or is just asking general questions.
```

No other prompt changes.

---

## Mobile UX Verification Checklist

| Concern | Solution | Height Budget |
|---|---|---|
| Soft gate pushes content off-screen | Replaces routing CTA (never stacks), shorter than what it replaces | ~80px (vs ~90px existing) |
| Action buttons don't fit side-by-side | Full-width stacked with `flex-col gap-1.5` | ~100px for 2 buttons |
| Keyboard blocks soft gate | `inputRef.current?.blur()` on soft gate trigger | 0px (keyboard dismissed) |
| Pre-fill feels "locked" | Standard `useState` initial value, fully editable input | No change |
| Page jump feels disorienting | Continuity pill: "Continuing your Window Man analysis" | 28px |
| Social proof clutters the card | Raw `text-[10px]` micro-copy, not the animated ticker component | ~14px |
| Total soft gate + verdict + actions | Never shown simultaneously (soft gate only appears when routing would) | Max ~124px |

---

## Files Modified

1. `src/components/floating-cta/steps/AiQaStep.tsx` -- Soft gate, stacked buttons, URL param builder, 3 tracking events, keyboard blur
2. `src/pages/FairPriceQuiz.tsx` -- URL param pre-fill (answers[2]), auto-advance to quiz phase, continuity pill
3. `src/pages/QuoteScanner.tsx` -- URL param zip sync (no visual changes)
4. `src/pages/BeatYourQuote.tsx` -- URL param context sync (no visual changes)
5. `supabase/functions/slide-over-chat/index.ts` -- Guardian Pivot paragraph in prompt

No new files. No database changes. No new dependencies.

