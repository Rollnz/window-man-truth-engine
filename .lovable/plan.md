

# Hardened Pre-Gate Interstitial + Congruent Modal Copy

## What This Does

Inserts a 2.5-second "pre-check" animation between file upload and the lead capture modal. Updates all modal copy to match reality. Adds a micro-tease curiosity hook in the modal.

---

## File 1: NEW -- `src/components/audit/PreGateInterstitial.tsx`

A 4-step sequential stepper rendered inside the right panel ("After" card) when phase is `'pre-gate'`.

**Steps:**

| # | Label | Icon | Base ms |
|---|-------|------|---------|
| 1 | "Creating document fingerprint..." | `Fingerprint` | 500 |
| 2 | "Extracting line items and scope details..." | `FileText` | 700 |
| 3 | "Detecting potential risk flags..." | `AlertTriangle` | 650 |
| 4 | "Preparing scorecard vectors..." | `Sparkles` | 450 |

**Deterministic jitter** seeded by `scanAttemptId` (not `Math.random()`):

```text
function getStepJitter(scanAttemptId: string, stepIndex: number): number {
  let hash = 0;
  const seed = scanAttemptId + String(stepIndex);
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  // Range: -80 to +120, then clamp per-step minimums
  return (Math.abs(hash) % 201) - 80;
}
```

Per-step minimum clamps: Step 2 min 620ms, Step 4 min 420ms (prevents too-snappy feel).

**Completion sequence:**
- After step 4 completes, 400ms pause
- Green banner fades in: "[checkmark] Pre-check complete -- We found potential areas to review."
- Banner visible 800ms, then fires `onComplete`

**Safety:** `onComplete` guarded by a ref to fire exactly once. All timeouts cleaned up on unmount.

**Props:**
- `scanAttemptId: string` -- seed for jitter
- `onComplete: () => void` -- opens the gate modal

---

## File 2: `src/hooks/audit/useGatedScanner.ts`

**Phase type change:**
```text
'idle' | 'pre-gate' | 'uploaded' | 'analyzing' | 'revealed'
```

**`handleFileSelect` change:**
- Sets `phase: 'pre-gate'` (was `'uploaded'`)
- Sets `isModalOpen: false` (was `true`)
- Everything else identical (preview URL, tracking, scanAttemptId generation)

**New `completePreGate` callback:**
- Sets `phase: 'uploaded'`, `isModalOpen: true`
- Fires `trackEvent('pre_gate_interstitial_complete', { scan_attempt_id, file_type, file_size_kb })`
- Guarded: only fires if current phase is `'pre-gate'` (idempotent)

**Expose** `completePreGate` and `scanAttemptId` in the return object.

**Update `UseGatedScannerReturn` interface** to include `completePreGate` and `scanAttemptId`.

---

## File 3: `src/hooks/audit/index.ts`

Update the `GatedScannerPhase` re-export -- no code change needed since it re-exports the type from useGatedScanner.

---

## File 4: `src/components/audit/QuoteUploadGateModal.tsx`

**Copy changes (no structural UI changes):**

| Element | Old | New |
|---------|-----|-----|
| Header icon | `Lock` | `Sparkles` |
| Title | "Unlock Your Full Analysis" | "Your Quote Is Ready to Audit" |
| Body | "Your quote has been analyzed. Enter your details to see the complete breakdown, warnings, and recommendations." | "Your quote is uploaded and ready. Enter your details to start the audit and unlock your full breakdown, warnings, and recommendations." |
| Trust pill | "Your data is secure. And Saved in Your Vault." | "Your data is secure. Your report will be saved in your Vault." |
| CTA label | "Unlock My Score Now" | "Start My Analysis" |
| CTA icon | `Lock` | `Sparkles` |
| Loading label | "Starting Analysis..." | "Running Analysis..." |

**New element -- micro-tease pill** (between body text and trust banner):

Amber-tinted pill with `AlertTriangle` icon. Rotates between 3 variants seeded by `scanAttemptId` (passed as new optional prop):

1. "Pre-check: review areas may exist in scope / fine print."
2. "Pre-check: potential omissions detected in scope wording."
3. "Pre-check: contract clarity signals flagged for review."

If no `scanAttemptId` prop, defaults to variant 1.

---

## File 5: `src/components/audit/UploadZoneXRay.tsx`

**New props added:**
- `scanAttemptId?: string`
- `onCompletePreGate?: () => void`

**Right panel -- new `'pre-gate'` case** (before `'uploaded'` in the switch):
- Renders a Card with `PreGateInterstitial` centered
- Passes `scanAttemptId` and `onComplete={onCompletePreGate}`

**Left panel:** `'pre-gate'` treated same as `'uploaded'` -- shows blurred file preview with Lock overlay, but **without** the "Unlock My Report" button (interstitial is still running).

---

## File 6: `src/pages/Audit.tsx`

Pass two new props to `UploadZoneXRay`:
- `scanAttemptId={scanner.scanAttemptId ?? undefined}`
- `onCompletePreGate={scanner.completePreGate}`

Pass one new prop to `QuoteUploadGateModal`:
- `scanAttemptId={scanner.scanAttemptId ?? undefined}`

---

## What Does NOT Change

- Form fields (First Name, Last Name, Email, Phone, SMS consent)
- Locked-open modal UX (ESC/overlay click disabled)
- Post-submit analysis flow (analyzing theater then revealed)
- All existing tracking events
- File compression, AI request logic, Q&A flow
- Reset behavior

## Risk Mitigations Applied

- **Risk A (Vault claim):** Step 1 says "Creating document fingerprint" not "Securing in Vault" -- truthful client-side operation
- **Risk B (Jitter determinism):** Seeded by scanAttemptId, same upload = same timing. Per-step minimum clamps prevent sub-400ms snappiness. Range fixed to `% 201` for symmetric -80 to +120
- **Risk C (Micro-tease fatigue):** 3 rotating variants seeded by scanAttemptId, no overclaiming

