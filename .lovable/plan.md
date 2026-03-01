
# /signup2 -- Phone-First OTP-Gated Audit ("Command Center Noir")

## Summary

Build a new `/signup2` page: a phone-first, single-page flow where email is optional and SMS OTP is the only gate to the AI audit. The visual identity is "Command Center Noir" -- dark void surfaces (`#0F1419`), surgical cyan (`#00D9FF`) accents, asymmetric forensic layout, and a "Vault Gate Unseal" reveal (no confetti).

## State Machine

```text
FORM --> UPLOADING --> THEATER --> OTP_GATE --> REVEAL
```

- **FORM**: Name, email (optional), phone (required), file upload
- **UPLOADING**: Save lead + upload file + start polling
- **THEATER**: 3.5s minimum cinematic scan with live metadata
- **OTP_GATE**: Blocking phone OTP verification (Supabase Auth `signInWithOtp`)
- **REVEAL**: Vault unseal FX + grade + pillar scores + actions

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/qualify-flow-b/index.ts` | Fix line 80 | Cast `error` to `Error` to fix build |
| `src/lib/motion-tokens.ts` | Create | Easing, duration, stagger constants |
| `src/pages/Signup2.tsx` | Create | Main page shell + state machine + "Command Center Noir" layout |
| `src/components/signup2/Signup2Form.tsx` | Create | Landing form with Zod validation, phone mask, file upload |
| `src/components/signup2/ExtractionTheater.tsx` | Create | 3.5s cinematic scan: scanlines, metadata cards with "digital scramble", PII hash |
| `src/components/signup2/OtpGate.tsx` | Create | Blocking OTP modal with 6-digit input, resend cooldown, error shake |
| `src/components/signup2/AuditReveal.tsx` | Create | Vault unseal FX + grade monolith + pillar cascade + actions |
| `src/components/signup2/SystemStatusPanel.tsx` | Create | Right-column telemetry display with step indicator lights |
| `src/components/quote-scanner/QuoteUploadZone.tsx` | Modify | Add `isCompact?: boolean` prop (default false); when true, remove `aspect-square`, reduce padding/icons |
| `src/App.tsx` | Modify | Add lazy `/signup2` route |

## Implementation Details

### 1. Build Fix (qualify-flow-b)
Line 80: `error.message` --> `(error instanceof Error ? error.message : "Unknown error")`

### 2. Motion Tokens (`src/lib/motion-tokens.ts`)
```typescript
export const EASE_EXPO_OUT = [0.22, 1, 0.36, 1] as const;
export const DURATION = { fast: 0.22, med: 0.35, slow: 0.55 } as const;
```
No framer-motion dependency -- all animations use CSS keyframes, transitions, and Tailwind `animate-*` utilities. The tokens are consumed as inline style values.

### 3. Page Shell (`Signup2.tsx`)
- Background: `#0F1419` with subtle CSS noise overlay (3-4% opacity pseudo-element) and slow-drifting hex grid pattern
- 12-col grid: left 7 cols (workflow panel), right 5 cols (SystemStatusPanel)
- Mobile: stacks vertically with sticky status bar
- State machine enum with localStorage persistence (same `ssGet`/`ssSet` pattern as existing `/signup`)
- Reuses `callEdgeJson`, `useSessionData`, `useToast` from existing codebase
- Stores `pending_scan_uuid` in localStorage for refresh resume

### 4. Signup2Form
- Fields: first_name, last_name, email (optional label), phone (required), QuoteUploadZone (isCompact=true initially)
- Reuses `profileSchema` from `signup-validation.ts` but makes email optional (new schema variant)
- Phone mask via existing `formatPhoneDisplay`/`stripPhone`
- Glass panel styling: `rgba(27,36,48,0.72)` + `backdrop-blur-xl` + cyan border
- On submit: `callEdgeJson("save-lead", ...)` then upload via `upload-quote` FormData fetch

### 5. ExtractionTheater (3.5s minimum)
- Timed sequence via `useEffect` + `setTimeout`:
  - 0-0.6s: "Ingesting document..."
  - 0.6-1.4s: "Identifying form type..."
  - 1.4-2.4s: "Extracting key values..."
  - 2.4-3.5s: "Hashing PII for security..."
- CSS scanline animation (pseudo-element translateY loop, `pointer-events: none`)
- Metadata cards (contractor, openings, total) show "digital scramble" (randomized characters for 500ms via `setInterval`) then lock to real value when polling data arrives
- PII hash visual: `f3a9...b2c1` monospace string
- Uses `Promise.all([theaterMinTimer, dataPolling])` pattern -- transitions to OTP_GATE only after both 3000ms elapsed AND theater sequence complete
- Polling reuses the same `callOrchestrateQuoteAnalysis` function pattern from `QuoteAnalysisFlow.tsx`

### 6. OtpGate (Blocking)
- Frosted overlay with `backdrop-blur-[22px]` over theater
- Title: "Verify your phone to continue"
- 6-digit `InputOTP` component (existing shadcn)
- Micro-tick on digit entry: CSS `scale(1.03)` transition 80ms
- Error: CSS shake animation (existing `animate-shake`) + 160ms red border flash
- Resend button with 60s countdown
- Auth flow: `supabase.auth.signInWithOtp({ phone })` at OTP_GATE entry, then `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` on code submit
- Gate rule: audit only revealed when BOTH `otpVerified` AND `analysisReady`

### 7. AuditReveal ("Vault Gate Unseal")
- **No confetti** -- replaced with vault unseal FX:
  1. Background dims (opacity transition)
  2. Circular cyan seal ring appears behind grade (CSS radial gradient + scale animation)
  3. Thin horizontal seam line splits open (CSS clip-path or height animation)
  4. Cyan radial pulse expands (CSS keyframe scale 0.7 to 1.6, opacity 0.22 to 0)
  5. Pillar cards stagger in (70ms increment, y:14 to 0, opacity + blur transition)
- Microcopy: "ACCESS GRANTED - AUDIT UNSEALED" in 10px monospace
- Grade from `analysis_json.finalGrade` (no frontend math)
- Pillar scores from `analysis_json.pillarScores`
- Color rules: A/B = emerald glow, C = amber, D/F = red
- Actions: Download PDF, Email report (if email provided), Upload new, Request quotes

### 8. SystemStatusPanel (Right Column)
- Always-visible telemetry sidebar showing current flow state
- Step indicator lights (dots/lines) for FORM/UPLOAD/THEATER/OTP/REVEAL
- Small monospace "data as decoration" corners (timestamps, hash fragments)
- Subtle glass panel with cyan border accents

### 9. QuoteUploadZone Compact Mode
Add `isCompact?: boolean` prop to existing component interface. When true:
- Remove `aspect-square` class, use `min-h-[180px]` instead
- Reduce overlay card padding (`p-3` vs `p-5`)
- Reduce icon sizes and font scale
- No changes to default behavior when `isCompact=false`

### 10. Route Registration
```typescript
const Signup2 = lazy(() => import("./pages/Signup2"));
// In private routes section:
<Route path="/signup2" element={<Signup2 />} />
```

## What Is NOT Changed
- Existing `/signup` page and its components (AuthModal, QualificationFlow, QuoteAnalysisFlow)
- Edge functions (save-lead, upload-quote, orchestrate-quote-analysis, qualify-flow-b logic)
- Tracking event contracts and GTM patterns
- Database schema (no new tables needed -- uses existing `accounts`, `pending_scans`, `quote_analyses`)

## Tracking Events (Using Existing Helpers)
- `wm_lead` after save-lead success
- `wm_scanner_upload` after upload success
- `wm_phone_verified` on OTP success
- `wm_audit_revealed` when audit becomes visible

## Implementation Order
1. Fix qualify-flow-b build error
2. Create motion-tokens.ts
3. Add `isCompact` prop to QuoteUploadZone
4. Create SystemStatusPanel
5. Create Signup2Form
6. Create ExtractionTheater
7. Create OtpGate
8. Create AuditReveal
9. Create Signup2.tsx page shell (wires all components)
10. Add route to App.tsx
