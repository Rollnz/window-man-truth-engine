
# Multi-Path Audit Scanner Implementation Plan
## Blue & Orange Theme Conversion + State Machine Architecture

---

## Phase 1: Foundation Setup

### 1.1 TypeScript Types (`src/types/audit.ts`)

Create comprehensive type definitions for the entire system:

```text
AuditPath         = 'quote' | 'vault'
AuditStep         = 0-8 (numeric state machine)
TheaterPhase      = 'running' | 'paused' | 'complete'
LeadGateVariant   = 'unlock' | 'vault'
ProjectData       = { windowCount, propertyType, timeline, goals }
```

**Key Interfaces:**
- `AuditScannerState` - Full modal state
- `TheaterStep` - Individual animation checkmark
- `AnalysisTheaterConfig` - Duration, pause point, steps
- `LeadCaptureFormData` - First name, email, phone

---

### 1.2 Theme Update - Remove Cyan, Apply Blue/Orange

**Files to update:**
- `ScannerHeroWindow.tsx` - Hero gradient, scan line, CTA button
- `UploadZoneXRay.tsx` - Grid overlay, badges, callouts
- `AnimatedStatsBar.tsx` - Badge colors

**Color Mapping:**
| Old (Cyan) | New (Blue/Orange) |
|------------|-------------------|
| `cyan-400/500` | `primary` (Blue #3993DD) |
| `cyan-500/30` borders | `primary/30` |
| `emerald-400` accents | Keep for "safe" indicators |
| CTA buttons | `from-orange-500 to-amber-500` (Safety Orange) |
| Progress bars | `bg-orange-500` |
| Red flags | `bg-orange-500` or `destructive` |

---

## Phase 2: Core Hooks

### 2.1 `useAnalysisTheater` Hook (`src/hooks/audit/useAnalysisTheater.ts`)

**Purpose:** Timer-based progress animation with 90% pause gate

**Interface:**
```text
useAnalysisTheater({
  duration: number,        // 10-12s for Path A, 6-8s for Path B
  pauseAt: number,         // 90
  steps: TheaterStep[],    // Checkmark definitions
  onPause: () => void,     // Trigger lead gate
  onComplete: () => void   // Reveal results
})

Returns:
- percent: number (0-100)
- phase: 'running' | 'paused' | 'complete'
- activeStepIndex: number
- resume: () => void
```

**Implementation Details:**
- Uses `requestAnimationFrame` for smooth 60fps animation
- CSS `transition-timing-function: ease-out` for natural deceleration near 90%
- Hard pause at `pauseAt` value until `resume()` called

---

### 2.2 `useAuditScanner` Hook (`src/hooks/audit/useAuditScanner.ts`)

**Purpose:** Central state machine for entire modal flow

**State Shape:**
```text
{
  currentStep: number,           // 0-8
  path: 'quote' | 'vault' | null,
  file: File | null,
  fileMetadata: { name, size, type },
  analysisResult: QuoteAnalysisResult | null,
  leadData: { firstName, email, phone },
  projectData: { ... },
  isLeadCaptured: boolean,
  theaterPhase: 'idle' | 'running' | 'paused' | 'complete'
}
```

**Actions:**
- `selectPath(path)` - Fork at Step 0
- `uploadFile(file)` - Path A Step 1
- `startTheater()` - Begin animation
- `captureLeadGate(data)` - Submit lead form
- `resumeTheater()` - Continue past 90%
- `saveProjectDetails(data)` - Step 6
- `selectEscalation(type)` - Step 7
- `reset()` - Clear all state

---

## Phase 3: Component Architecture

### 3.1 File Structure

```text
src/components/audit/scanner-modal/
├── AuditScannerModal.tsx        # Main container (Dialog)
├── PathSelector.tsx             # Step 0: "Do you have a quote?"
├── UploadStep.tsx               # Path A Step 1: File upload
├── AnalysisTheater.tsx          # Shared: Animated progress
├── TeaserPanel.tsx              # Path A: Blurred preview
├── LeadCaptureGate.tsx          # Shared: Form gate
├── ResultsReveal.tsx            # Path A: Full results
├── VaultPreview.tsx             # Path B Step 1: Value preview
├── VaultConfirmation.tsx        # Path B: Unlock success
├── ProjectIntelligence.tsx      # Shared Step 6: Project details
├── HumanEscalation.tsx          # Step 7: CTA cards
├── FinalConfirmation.tsx        # Step 8: Success
├── theater/
│   ├── TheaterProgressBar.tsx   # Orange progress bar
│   └── TheaterCheckmark.tsx     # Individual step indicator
├── project/
│   ├── WindowCountSlider.tsx    # Slider with "typical" hint
│   ├── PropertyTypeCards.tsx    # Icon card selection
│   ├── TimelineRadio.tsx        # Radio options
│   └── GoalsCheckbox.tsx        # Multi-select
└── index.ts                     # Barrel export
```

---

### 3.2 Component Details

#### `AuditScannerModal`
- Radix Dialog with `onEscapeKeyDown={(e) => e.preventDefault()}`
- `onInteractOutside={(e) => e.preventDefault()}`
- Full-screen on mobile (`max-h-[100dvh]`)
- Dark theme locked (Navy Blue background)

#### `PathSelector` (Step 0)
Two equal-weight buttons:
- **"Yes, I have a quote"** → Orange gradient, Upload icon
- **"No, not yet"** → Blue outline, Vault icon
- Both buttons same size, horizontal on desktop, stacked on mobile

#### `AnalysisTheater`
- Orange progress bar (`bg-gradient-to-r from-orange-500 to-amber-500`)
- Sequential checkmarks with slide-in animation
- Pulsing "Working..." indicator at 90% pause
- Soft blue glow on container

#### `LeadCaptureGate`
Two variants via prop:
- `variant="unlock"`: "Unlock Your Results" (Path A)
- `variant="vault"`: "Claim Your Vault Access" (Path B)

Form fields: First Name, Email, Phone (2x2 grid)
- White inputs with black border
- Blue focus ring (`ring-primary/25`)
- Orange submit button

#### `ProjectIntelligence`
Multi-step sub-form:
1. Window count slider (1-30+, "typical" marker at 8-12)
2. Property type cards (House, Condo, Townhome, Business)
3. Timeline radio (In a hurry → Just researching)
4. Goals checkbox (Hurricane, Energy, Noise, Security, Value)

---

## Phase 4: Analytics Integration

| Event | When | GTM Function | Value |
|-------|------|--------------|-------|
| `scanner_modal_opened` | PathSelector mounts | `trackModalOpen` | - |
| `audit_path_selected` | User clicks Yes/No | `trackEvent` | `path` |
| `quote_file_uploaded` | File accepted | `trackEvent` | `fileType, fileSize` |
| `analysis_theater_started` | Animation begins | `trackEvent` | `path` |
| `analysis_theater_paused` | Hits 90% | `trackEvent` | `path, percent` |
| `lead_submission_success` | Form submitted | `trackLeadSubmissionSuccess` | `$100` |
| `analysis_theater_resumed` | Resume called | `trackEvent` | - |
| `quote_analysis_complete` | Results shown | `trackQuoteUploadSuccess` | `$50, score` |
| `vault_access_granted` | Vault unlocked | `trackEvent` | `$50` |
| `project_details_saved` | Step 6 complete | `trackEvent` | `windowCount, timeline` |
| `consultation_booked` | Schedule selected | `trackConsultationBooked` | `$75` |
| `audit_funnel_complete` | Step 8 reached | `trackToolCompletion` | `path` |

All events use deterministic `event_id` format per EMQ 9.5+ standards.

---

## Phase 5: Implementation Order

| # | Task | Files | Rationale |
|---|------|-------|-----------|
| 1 | Define types | `src/types/audit.ts` | Type-first development |
| 2 | Update theme colors | `ScannerHeroWindow.tsx`, `UploadZoneXRay.tsx` | Visual foundation |
| 3 | Build `useAnalysisTheater` | `src/hooks/audit/useAnalysisTheater.ts` | Core animation logic |
| 4 | Build theater UI components | `TheaterProgressBar.tsx`, `TheaterCheckmark.tsx` | Visual building blocks |
| 5 | Build `AnalysisTheater` | `AnalysisTheater.tsx` | Combines hook + UI |
| 6 | Build `PathSelector` | `PathSelector.tsx` | Entry point (Step 0) |
| 7 | Build `LeadCaptureGate` | `LeadCaptureGate.tsx` | Shared conversion gate |
| 8 | Build `UploadStep` | `UploadStep.tsx` | Path A Step 1 |
| 9 | Build `TeaserPanel` + `ResultsReveal` | Path A Steps 3-4 | Quote flow |
| 10 | Build `VaultPreview` + `VaultConfirmation` | Path B Steps 1, 4 | Vault flow |
| 11 | Build project sub-components | `WindowCountSlider.tsx`, etc. | Step 6 building blocks |
| 12 | Build `ProjectIntelligence` | `ProjectIntelligence.tsx` | Combines project UI |
| 13 | Build `HumanEscalation` | `HumanEscalation.tsx` | Step 7 CTAs |
| 14 | Build `FinalConfirmation` | `FinalConfirmation.tsx` | Step 8 success |
| 15 | Build `useAuditScanner` | `src/hooks/audit/useAuditScanner.ts` | State machine |
| 16 | Build `AuditScannerModal` | `AuditScannerModal.tsx` | Container orchestration |
| 17 | Wire to `/audit` page | `src/pages/Audit.tsx` | Integration |

---

## Technical Considerations

### Modal Dismissal Strategy
Per the "Locked-Open" UX pattern:
- ESC key disabled
- Outside clicks disabled
- Only explicit "X" button or "No thanks" link closes modal
- Confirmation prompt if lead not captured: "Your analysis is 90% complete. Leave anyway?"

### 90% Pause Implementation
```text
CSS: transition: width 10s cubic-bezier(0.4, 0, 0.2, 1);
JS: When percent >= 90 && !isLeadCaptured → pause animation
Visual: Progress bar pulses gently, "Finalizing..." text appears
```

### File Handling
- Store only `fileMetadata` in state (not full File blob)
- If modal closes before complete, file must be re-uploaded
- Reuse existing `compressImage` logic from `useQuoteScanner`

### Mobile Responsiveness
- Full-screen modal on mobile (`h-[100dvh]`)
- Vertical stacking for PathSelector buttons
- Touch-friendly slider for window count
- Large tap targets (min 44px)

---

## Visual Theme Summary

| Element | Color |
|---------|-------|
| Modal background | `slate-900` (Navy Blue) |
| Primary text | `white` |
| Secondary text | `slate-400` |
| CTA buttons | `from-orange-500 to-amber-500` gradient |
| Progress bar | `bg-orange-500` |
| Focus rings | `ring-primary/25` (Blue) |
| "Safe" indicators | `emerald-500` |
| "Warning" indicators | `orange-500` |
| "Danger" indicators | `destructive` (Red) |
| Card borders | `border-primary/30` (Blue) |
| Glassmorphism glow | `primary/20` (Soft Blue) |
