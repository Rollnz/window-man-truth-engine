

# Upgrade Slide-Over "Ask Window Man" Chat
## Hurricane Hero Persona + Guided Actions + Tracking + Guardrails

---

## Summary

Transform the slide-over chat from a generic Q&A widget into the **Window Man "Hurricane Hero"** persona-driven triage layer. The AI answers questions in character, suggests exactly 3 approved tools via hidden `<wm_actions>` tags rendered as buttons, tracks every interaction via `wmRetarget`, and never invents pricing.

---

## Phase 1: Edge Function -- Persona + Actions + Guardrails

**File: `supabase/functions/slide-over-chat/index.ts`**

### A. Rewrite `buildSystemPrompt()` with Hurricane Hero Persona

Replace the current generic persona with:
- **Identity:** "You are Window Man, the Hurricane Hero -- the homeowner's shield against window scams and hurricane damage."
- **Voice:** Direct, protective, no-nonsense. Occasional heroic metaphors ("Truth Armor," "fortify your knowledge," "your home deserves a shield, not a sales pitch") but never at the expense of clarity.
- **No fluff.** Give the truth straight, backed by `truthContext`.

### B. Add `<wm_actions>` output instructions

Instruct the AI to append a hidden `<wm_actions>` JSON block when recommending tools. **Strict Rule of Three** -- the AI's only approved "superpowers" are:

| Route | Label |
|---|---|
| `/ai-scanner` | Scan My Quote |
| `/beat-your-quote` | Beat Your Quote |
| `/fair-price-quiz` | Is My Price Fair? |

- Max 2 actions per response
- Frame tools as "Power-ups" or "Shields" in the conversational text
- Button labels stay professional (the persona voice is in the text, not the button)
- Optional `verdict` field: `"protected"`, `"inspect"`, or `"breach"`

### C. Pricing guardrails (prompt-enforced)

- NEVER invent specific dollar amounts or percent claims unless the user provided their quote data in-session
- If asked "is this fair?" without quote data, route to `/ai-scanner`
- No "today only" / urgency / sales pressure language
- Max 1-2 follow-up questions if critical info is missing

### D. Accept `truthContext` in request body

Add optional `truthContext` field alongside existing fields (backward compatible):
- mode, county, city, state, zip
- windowCount, windowAge, homeSize, zipCode
- completedTools (future: list of tools user already used)

### E. Increase `max_tokens` from 300 to 450

The persona voice + structured answer + `<wm_actions>` block needs more room.

### F. Keep `[ROUTE:form]` / `[ROUTE:call]` in the prompt as fallback

The old routing markers are preserved so existing behavior doesn't break.

---

## Phase 2: Frontend -- Parse Actions + Render Buttons + Verdict Badge

**File: `src/components/floating-cta/steps/AiQaStep.tsx`**

### A. Add `parseWmActions()` helper

- Extract JSON array from `<wm_actions>...</wm_actions>` in completed AI response
- Return `{ cleanText, actions, verdict }`
- Strip the tag block from displayed text
- If JSON is malformed, fail silently (return empty actions, no crash)

### B. Route allowlist (CORRECTED -- strict 3-tool limit)

```text
/ai-scanner     -> "Scan My Quote"
/beat-your-quote -> "Beat Your Quote"
/fair-price-quiz -> "Is My Price Fair?"
```

**No other routes allowed.** Any action with a route not in this list is silently dropped. Max 2 actions rendered per response.

### C. Render action buttons below latest assistant message

- Compact button row with the label from the AI (or fallback label from allowlist)
- On click: navigate to route via `react-router-dom` `useNavigate`
- Only show on the most recent assistant message

### D. Verdict badge (optional)

- Small badge above action buttons: shield icon (green = `protected`), magnifying glass (amber = `inspect`), alert (red = `breach`)
- Only renders when AI includes a `verdict` field
- Adds personality without cluttering chat

### E. Extend internal Message interface

Add optional `actions` and `verdict` fields so they persist when scrolling through chat history.

### F. Preserve existing routing behavior

- `[ROUTE:form]` / `[ROUTE:call]` parsing stays as fallback
- 3-message threshold routing CTAs stay
- 5-message limit with "connect with expert" CTA stays
- `<wm_actions>` is additive, not a replacement

---

## Phase 3: Tracking -- Switch from `trackEvent` to `wmRetarget`

**File: `src/components/floating-cta/steps/AiQaStep.tsx`**

Replace all `trackEvent()` calls with `wmRetarget()` from `@/lib/wmTracking`. These are RT events (retargeting audiences) with no value/currency, fully compliant with the Signal Firewall.

| Event | When | Key Fields |
|---|---|---|
| `ai_chat_opened` | Step mounts | `source_tool: 'slide-over-chat'`, `mode`, `panel_variant` |
| `ai_message_sent` | User sends a message | `source_tool: 'slide-over-chat'`, `mode`, `message_index` |
| `ai_answer_received` | Stream completes | `source_tool: 'slide-over-chat'`, `mode`, `message_index`, `has_actions`, `verdict` |
| `ai_action_clicked` | User clicks action button | `source_tool: 'slide-over-chat'`, `mode`, `action_route` |
| `ai_deep_engagement` | 3rd user message (once) | `source_tool: 'slide-over-chat'`, `mode`, `messages_exchanged` |

No OPT events fired from chat. No value/currency ever.

---

## Phase 4: Pass `truthContext` from Frontend

**File: `src/components/floating-cta/steps/AiQaStep.tsx`**

Build and send `truthContext` alongside existing `locationData` and `sessionContext` fields:

```text
truthContext: {
  mode,
  county, city, state, zip,
  windowCount, windowAge, homeSize, zipCode,
  completedTools: []
}
```

Sent in addition to (not replacing) existing fields for backward compatibility. The edge function uses whichever is available.

---

## Files Modified

1. **`supabase/functions/slide-over-chat/index.ts`** -- Rewritten `buildSystemPrompt()` with Hurricane Hero persona, `<wm_actions>` instructions, pricing guardrails, `truthContext` interface, `max_tokens` bump to 450
2. **`src/components/floating-cta/steps/AiQaStep.tsx`** -- `parseWmActions()` helper, 3-route allowlist, action button rendering, verdict badge, `wmRetarget` tracking (5 events), `truthContext` payload

No new files. No database changes. No new dependencies.

---

## What Does NOT Change

- Streaming SSE architecture (intact)
- Rate limiting logic (untouched)
- `[ROUTE:form]` / `[ROUTE:call]` fallback parsing (preserved)
- 5-message limit and "connect with expert" CTA (preserved)
- No OPT events from chat (Signal Firewall compliant)
- No new Edge Functions or database tables

---

## Acceptance Criteria

- The assistant speaks in the Window Man "Hurricane Hero" voice consistently
- `<wm_actions>` is never visible to the user (stripped from display)
- Action buttons render below the latest AI message and navigate ONLY to `/ai-scanner`, `/beat-your-quote`, or `/fair-price-quiz`
- Invalid/malformed actions or disallowed routes fail silently
- Verdict badge shows when AI includes a verdict field
- `wmRetarget` fires for all 5 tracking events
- The AI does not invent specific pricing; it routes to `/ai-scanner` when it lacks data
- Streaming UX remains smooth with no regressions

