

# Add "Ask the AI Expert" Chat to /audit Page (Post-Analysis)

## Overview

Add a multi-turn chat section to the `/audit` page that appears after the analysis is revealed. Positioned between the `UploadZoneXRay` (scanner grid) and the `HowItWorksXRay` section, it captures high-intent users who just received their report and have follow-up questions -- maximizing engagement and conversion before they scroll to lower-priority content.

## What the User Sees

After uploading a quote, completing the lead form, and receiving their gradecard:

1. A new full-width section fades in below the scanner grid: **"Got Questions About Your Report?"**
2. Four context-aware suggested question chips (derived from their actual analysis results -- e.g., "What should I do about the red flags?" only appears if warnings exist)
3. Clicking a chip or typing a question sends it to the AI, which responds with context from their specific quote
4. Full message history is preserved in the thread (multi-turn, scrollable)
5. The section is invisible in idle/uploaded/analyzing phases -- zero layout shift

## Technical Plan

### 1. Add Q&A to `useGatedScanner` hook

The hook currently has no Q&A capability. The edge function already supports `mode: 'question'` with `analysisContext` + `imageBase64` + `mimeType`. Add:

- `isAskingQuestion: boolean` state
- `qaAnswer: string | null` state (latest answer, for the chat component to watch)
- `imageBase64` + `mimeType` stored during analysis (currently discarded after the API call)
- `askQuestion(question: string)` callback that calls `heavyAIRequest.sendRequest('quote-scanner', { mode: 'question', ... })`

This mirrors the existing pattern in `useQuoteScanner.ts` (lines 340-380).

### 2. New Component: `src/components/audit/AuditExpertChat.tsx`

A self-contained chat section with:

- **Props**: `onAsk`, `isAsking`, `latestAnswer`, `analysisResult` (for suggested questions)
- **Internal state**: `messages: Array<{ role: 'user' | 'assistant'; content: string }>` -- accumulates conversation history
- **Suggested questions**: 4 context-aware chips based on the analysis result:
  - If `warnings.length > 0`: "What should I do about the red flags you found?"
  - If `pricePerOpening` exists: "Is my price per window fair for my area?"
  - If `missingItems.length > 0`: "What are the risks of these missing items?"
  - Always: "How should I negotiate with this contractor?"
- Chips disappear after first message (replaced by the growing thread)
- Reuses `ChatMessage` from `src/components/expert/ChatMessage.tsx` for message bubbles
- Reuses `ChatInput` pattern (Textarea + Send button) for the input bar
- Auto-scrolls to bottom on new messages
- Dark theme styling consistent with the /audit page (slate-900 bg, cyan/primary accents)

### 3. Update `src/pages/Audit.tsx`

- Import `AuditExpertChat` (lazy loaded)
- Place it between `UploadZoneXRay` and `HowItWorksXRay`
- Conditionally render only when `scanner.phase === 'revealed'` and `scanner.result` exists
- Pass `scanner.askQuestion`, `scanner.isAskingQuestion`, `scanner.qaAnswer`, `scanner.result`

## Layout (Post-Reveal)

```text
[UploadZoneXRay - Before/After scanner grid]
              |
  (only when phase === 'revealed')
              |
[====== Ask the AI Expert Section ======]
|  "Got Questions About Your Report?"   |
|  subtitle text                        |
|                                       |
|  [chip] [chip] [chip] [chip]         |
|                                       |
|  +--- Message Thread (scroll) ---+   |
|  | [You] Is the permit included?  |  |
|  | [Expert] Based on your quote...|  |
|  +-------------------------------+   |
|                                       |
|  [ Ask about your quote...  [Send] ] |
[=======================================]
              |
[HowItWorksXRay]
[BeatOrValidateSection]
...
```

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/audit/useGatedScanner.ts` | Add `askQuestion`, `isAskingQuestion`, `qaAnswer`, persist `imageBase64`/`mimeType` from analysis |
| `src/components/audit/AuditExpertChat.tsx` | **New** -- full chat section with message history, suggested questions, auto-scroll |
| `src/pages/Audit.tsx` | Add lazy-loaded `AuditExpertChat` between scanner grid and HowItWorksXRay (revealed phase only) |

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No analysis yet (idle/uploaded/analyzing) | Chat section not rendered |
| Analysis has no warnings/missing items | Suggested questions fall back to generic set |
| Error from AI | Toast shown (existing pattern), message not added to thread |
| Mobile | Full-width, chips stack to single column, thread scrolls naturally |
| Multiple questions | Full conversation history preserved in scrollable container |
| Page refresh after reveal | Analysis result is in sessionStorage but imageBase64 is lost -- Q&A still works using `analysisContext` alone (image is optional for follow-up questions) |

