
# Dual-Path Lead Capture for /beat-your-quote (Matching /audit Architecture)

## Summary

Transform the `/beat-your-quote` page from a single-path upload flow into a dual-path system identical to `/audit`:

- **Path A (Has Quote):** Upload file → `QuoteUploadGateModal` → AI analysis → results render on page
- **Path B (No Quote):** `PreQuoteLeadModalV2` qualification funnel → lead captured

---

## What Changes

### 1. Replace the Upload System in the Hero

**Current:** `QuoteUploadDropzone` (two-step: select file, then click "Upload Quote") triggers `MissionInitiatedModal` after server upload completes.

**New:** Direct file select (like `/audit`) feeds into `useGatedScanner` hook. The dropzone interaction becomes: select file → pre-gate interstitial → `QuoteUploadGateModal` → AI analysis → results.

The `DossierHero` will gain:
- A "No quote yet?" link/button below the dropzone that opens `PreQuoteLeadModalV2`
- The file select will feed directly into `useGatedScanner.handleFileSelect()` instead of the old `QuoteUploadDropzone` upload-then-modal flow

### 2. Wire `useGatedScanner` into `BeatYourQuote.tsx`

Replace the current state management (`uploadedFileId`, `isLeadModalOpen`, `showSuccessScreen`, `MissionInitiatedModal`, `AnalysisSuccessScreen`) with:

```text
import { useGatedScanner } from '@/hooks/audit';
const scanner = useGatedScanner();
```

This gives the page the full state machine: idle -> pre-gate -> uploaded -> analyzing -> revealed.

### 3. Add Results Rendering Area

The page currently has no place to show AI analysis results. A new results section will be added (either reusing `UploadZoneXRay` from /audit or a simpler inline results panel) that:
- Shows the blurred file preview during the gate phase
- Renders the full `FullResultsPanel` when phase === 'revealed'
- Includes the `AuditExpertChat` Q&A component for post-reveal engagement

This section will be placed prominently below the hero (or replace the hero content post-upload, matching how /audit's `UploadZoneXRay` transforms).

### 4. Add "No Quote" Path via `PreQuoteLeadModalV2`

Add a `PreQuoteLeadModalV2` instance with a custom `ctaSource` (e.g., `'beat-your-quote-no-quote'`). The existing modal already has the exact 5-step flow you described:

| Step | What it asks | Options |
|------|-------------|---------|
| 1 - capture | First name, Last name, Email, Phone | Text fields |
| 2 - timeline | Timeframe | Within 30 days, 1-3 months, 3-6 months, Just researching |
| 3 - quote | Do you have a quote? | Yes, Getting quotes, Not yet |
| 4 - homeowner | Are you the homeowner? | Yes / No |
| 5 - windowCount | How many windows? | 1-5, 6-15, 16+, Whole house |

**Note:** The existing `PreQuoteLeadModalV2` step order is: capture -> timeline -> quote -> homeowner -> windowCount -> result. Your requested order (property type -> window count -> timeframe -> has quote) differs from what is currently built. The existing steps do NOT include "property type" (Single Family, Condo, etc.) -- that would require adding a new step to `PreQuoteLeadModalV2`. Two options:

**Option A (Recommended):** Use the existing `PreQuoteLeadModalV2` steps as-is (they already capture timeline, quote status, homeowner status, and window count). This avoids modifying a shared component used across multiple pages.

**Option B:** Add a new "property type" step and reorder the flow. This requires changes to the shared `PreQuoteLeadModalV2` component and its types, scoring logic, and the `update-lead-qualification` edge function.

### 5. Update `DossierHero` Component

```text
DossierHeroProps:
  + onFileSelect: (file: File) => void       // Direct file handler for useGatedScanner
  + onNoQuoteClick: () => void               // Opens PreQuoteLeadModalV2
  - onUploadSuccess (removed)                // No longer needed
```

Replace `QuoteUploadDropzone` with a simpler file input dropzone that calls `onFileSelect(file)` directly (no server upload step -- the upload happens inside `useGatedScanner.captureLead` after lead is captured).

Add a "Don't have a quote yet?" link below the dropzone.

### 6. Remove / Deprecate Old Components from This Page

| Component | Action |
|-----------|--------|
| `MissionInitiatedModal` | Remove import from BeatYourQuote.tsx (file stays in codebase) |
| `AnalysisSuccessScreen` | Remove import (replaced by inline results rendering) |
| `QuoteUploadDropzone` | Replace with direct file-select dropzone in DossierHero |
| `QuoteCheckerSection` | Keep or update -- its embedded dropzone should also feed into `useGatedScanner` |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/BeatYourQuote.tsx` | Wire `useGatedScanner`, add `QuoteUploadGateModal`, add `PreQuoteLeadModalV2`, add results rendering section, remove old modal/success screen imports |
| `src/components/beat-your-quote/DossierHero.tsx` | Replace `QuoteUploadDropzone` with direct file-select dropzone, add "No quote?" link, update props |
| `src/components/beat-your-quote/QuoteCheckerSection.tsx` | Update upload card to feed `onFileSelect` instead of `onUploadSuccess` |

## Technical Details

### State Machine (from `useGatedScanner`)

```text
idle ──[file selected]──> pre-gate ──[2.5s interstitial]──> uploaded
                                                              |
                                                    [QuoteUploadGateModal]
                                                              |
                                                    [lead captured]
                                                              |
                                                          analyzing
                                                              |
                                                    [AI response]
                                                              |
                                                          revealed
                                                     (results on page)
```

### New Imports in BeatYourQuote.tsx

- `useGatedScanner` from `@/hooks/audit`
- `QuoteUploadGateModal` from `@/components/audit`
- `PreQuoteLeadModalV2` from `@/components/LeadModalV2`
- `FullResultsPanel` and `AnalyzingState` from `@/components/audit/scanner-modal`

### Analytics Continuity

- `useGatedScanner` already handles all GTM events (quote_file_selected, pre_gate_interstitial_complete, quote_upload_gate_success, analysis_complete) and canonical scoring (QUOTE_UPLOADED)
- `PreQuoteLeadModalV2` handles its own lead capture analytics
- Both use `sourceTool` for attribution -- the scanner uses 'quote-scanner' by default; the no-quote path will use a custom `contextConfig` with `sourceTool: 'beat-your-quote'`

### What Does NOT Change

- `useGatedScanner` hook (reused as-is from /audit)
- `QuoteUploadGateModal` component (reused as-is)
- `PreQuoteLeadModalV2` component (reused as-is)
- `ConceptSection`, `ManipulationTactics`, `AnatomySection`, `MissionOutcomes`, `InterrogationFAQ`, `ToolsSection` (unchanged content sections)
- `ConsultationBookingModal` (unchanged)
- Backend edge functions (save-lead, quote-scanner -- all unchanged)
