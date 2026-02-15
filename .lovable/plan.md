
# Refactor /ai-scanner to Gated Authority Flow

## What This Does

Uploading a file on /ai-scanner will no longer start the AI scan. Instead, a lead capture modal opens immediately. Analysis only runs after we have a lead. Results stay locked if the user walks away. The tracking auth bug is also fixed.

---

## Part A: Hard Gating -- New Hook

### New File: `src/hooks/useGatedAIScanner.ts`

Clone the existing `useGatedScanner` (src/hooks/audit/useGatedScanner.ts) with these adaptations:

**Phase enum adds 'locked':**
```text
type ScannerPhase = 'idle' | 'uploaded' | 'locked' | 'analyzing' | 'revealed'
```

**Key differences from audit's useGatedScanner:**
- Returns `QuoteAnalysisResult` type (not `AuditAnalysisResult`)
- Adds `'locked'` phase for "modal closed without lead" state
- `closeModal()` sets `phase = 'locked'` (audit version stays on 'uploaded')
- `reopenModal()` sets `phase = 'uploaded'` and `isModalOpen = true` (resolves the contradiction -- phase explicitly transitions back)
- `handleFileSelect(file)`: stores file in memory, creates `URL.createObjectURL(file)`, generates `scanAttemptId = crypto.randomUUID()`, sets `phase = 'uploaded'`, sets `isModalOpen = true`. Does NOT call `compressImage`, `heavyAIRequest`, or any edge function.
- `captureLead(data)`: submits lead via `useLeadFormSubmit`, stores leadId, closes modal, sets `phase = 'analyzing'`, then compresses file and calls `quote-scanner` exactly once. On success sets `phase = 'revealed'`.
- `reset()`: revokes object URL, clears all state back to idle.
- Exposes `imageBase64` and `mimeType` (set during `captureLead` after compression) so downstream components (email draft, phone script, Q&A) can use them.
- `sourceTool` uses `'ai-scanner'` (not `'audit-scanner'`).

**sessionStorage resilience (Part F):**
On `captureLead` success (before analysis), persist to sessionStorage:
```json
{ "phase": "analyzing", "leadId": "uuid", "scanAttemptId": "uuid" }
```
On `closeModal`, persist: `{ "phase": "locked", "leadId": null, "scanAttemptId": "uuid" }`

On mount, check sessionStorage:
- If `phase === 'locked'` and no leadId: show locked overlay (no lead re-entry needed since there's no leadId yet -- just show upload zone)
- If `phase === 'analyzing'` and leadId exists: show "We lost your upload due to browser refresh. Please re-upload to regenerate your report." (no lead form re-entry)
- Otherwise: clean idle

---

## Part A2: Refactor `src/pages/QuoteScanner.tsx`

**Remove:**
- `useQuoteScanner()` as the primary flow driver (lines 47-62)
- `handleFileSelect` that calls `analyzeQuote(file)` directly (lines 85-101)
- `showLeadCapture` / `hasUnlockedResults` state (lines 66-67)
- `LeadCaptureModal` usage (lines 305-311)

**Add:**
- Import and use `useGatedAIScanner()` as the only driver for upload-to-reveal
- Keep a secondary `useQuoteScanner()` instance ONLY for email draft, phone script, and Q&A modes (these need `analysisResult` which will be fed from the gated hook's result)
- Wire `QuoteUploadZone.onFileSelect` to gated hook's `handleFileSelect`
- Use `QuoteUploadGateModal` (already exists at src/components/audit/QuoteUploadGateModal.tsx) as the lead modal
- Modal renders when `phase === 'uploaded' && isModalOpen`

**Rendering guards (absolute):**
- Results: `{phase === 'revealed' && analysisResult && (<AuthorityReportLayout />)}`
- Locked overlay: `{phase === 'locked' && (<LockedOverlay with "Unlock Your Report" and "Upload a Different Quote" buttons />)}`
- Analyzing: `{phase === 'analyzing' && (<AnalysisTheaterScreen />)}`

**Locked overlay UI:**
- Blurred preview of uploaded file
- Lock icon
- "Unlock Your Report" button calls `reopenModal()`
- "Upload a Different Quote" button calls `reset()`

---

## Part B: Fix log-event 401

### File: `src/lib/highValueSignals.ts` (lines 179-198)

Replace the auth header block with deterministic logic:

```typescript
const logSecret = import.meta.env.VITE_WM_LOG_SECRET as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (logSecret) {
  headers['X-WM-LOG-SECRET'] = logSecret;
} else if (anonKey) {
  headers['apikey'] = anonKey;
  headers['Authorization'] = `Bearer ${anonKey}`;
} else {
  console.error('[highValueSignals] CRITICAL: No auth key available. Signal dropped:', eventName);
  return;
}
```

**Changes:**
- `console.warn` on line 196 becomes `console.error`
- Canonical env var is `VITE_SUPABASE_PUBLISHABLE_KEY` (confirmed present in `.env`)
- No server-side changes needed (`verify_jwt = false` confirmed)

---

## Part C: Authority Report Layout

After `phase === 'revealed'`, render in this exact order:

1. **Report Header**: "Your Quote Intelligence Report" + overall score badge + forensic headline
2. **Executive Summary**: `analysisResult.summary` or `analysisResult.forensic` summary
3. **Findings**: Existing `QuoteAnalysisResults` component (warnings, missing items, category scores)
4. **Primary CTA: "Talk to a Window Expert"**: New `TalkToExpertCTA` component
5. **Secondary CTA: "Ask the AI Expert"**: Existing `QuoteQA` component (only renders when `phase === 'revealed'`)

### New File: `src/components/quote-scanner/TalkToExpertCTA.tsx`
- Phone number: +15614685571 (matches funnel navbar)
- Click-to-call `<a href="tel:+15614685571">`
- Trust copy: "Free consultation. No obligation."
- GTM tracking on click: `trackEvent('cta_click', { location: 'post_scan_primary', placement: 'authority_report', leadId })`

---

## Part D: Analysis Theater

### New File: `src/components/quote-scanner/AnalysisTheaterScreen.tsx`

During `phase === 'analyzing'`, render:
- Blurred preview thumbnail of uploaded file
- Stepper with 3 stages: "Extracting Text" -> "Scoring Categories" -> "Building Report"
- Stages advance on timers (cosmetic -- real analysis is one backend call)
- Copy: "Please keep this tab open"
- No plain spinner-only experience

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/hooks/useGatedAIScanner.ts` | NEW -- Gated scanner hook adapted from audit's useGatedScanner |
| `src/pages/QuoteScanner.tsx` | MAJOR -- Swap to gated hook, add locked overlay, authority layout, analysis theater |
| `src/lib/highValueSignals.ts` | MINOR -- Fix auth header: console.warn to console.error (line 196) |
| `src/components/quote-scanner/TalkToExpertCTA.tsx` | NEW -- Phone CTA block |
| `src/components/quote-scanner/AnalysisTheaterScreen.tsx` | NEW -- Stepper UI for analyzing phase |

---

## Acceptance Tests (All Must Pass)

1. Upload file -> modal opens immediately, 0 quote-scanner network calls
2. Close modal -> locked overlay with blurred preview, "Unlock" and "Upload Different" buttons, 0 quote-scanner calls
3. Click "Unlock" -> modal reopens (phase transitions from 'locked' to 'uploaded')
4. Submit lead -> analysis theater plays -> exactly 1 quote-scanner call -> authority report renders
5. Results never render unless `phase === 'revealed'`
6. Phone CTA tracks `cta_click` with leadId
7. QuoteQA works only after reveal
8. log-event returns 200 (not 401) and includes apikey header
9. Refresh: if persisted locked/analyzing exists -> show recovery UI (no lead re-entry); else -> clean idle
10. "Upload a Different Quote" -> resets to idle, no ghost state
