

# Fix: Always-Visible "After" Card with Phase-Based Content

## Problem

The right column of the two-column grid is empty during `idle`, `uploaded`, `locked`, and `analyzing` phases. The Authority Report content only mounts when `phase === 'revealed'` (line 197). This causes layout collapse and removes the psychological "progression" feeling.

## Solution

Always render a stable right-column container with consistent dimensions. Swap **content inside** based on phase instead of conditionally mounting the container.

## Changes (Single File)

**`src/pages/QuoteScanner.tsx`** -- Replace lines 184-235 (the right column block)

### New Right Column Structure

```text
<div className="space-y-6">  {/* Always rendered */}

  {/* Error display (any phase) */}
  {error && <AIErrorFallback />}

  {/* Phase: idle -- empty placeholder shell */}
  {phase === 'idle' && <AfterPlaceholder />}

  {/* Phase: uploaded -- locked with "Unlock" CTA */}
  {phase === 'uploaded' && <AfterLocked onUnlock={reopenModal} />}

  {/* Phase: locked -- locked with "Unlock" + "Upload Different" */}
  {phase === 'locked' && <AfterLocked onUnlock={reopenModal} onReset={reset} />}

  {/* Phase: analyzing -- theater inside the card */}
  {phase === 'analyzing' && <AfterAnalyzing />}

  {/* Phase: revealed -- full authority report */}
  {phase === 'revealed' && analysisResult && <AuthorityReport />}
</div>
```

### Phase Content Details

**idle** -- Placeholder card:
- Same min-height as other states (min-h-[400px])
- Muted border, subtle background
- Lock icon centered
- Text: "Upload your quote to get started"
- Maintains grid balance from page load

**uploaded** -- Locked card (modal is open):
- Blurred gradient background
- Lock icon
- "Your report is being prepared..."
- Subtle pulsing animation

**locked** -- Locked card (modal dismissed):
- Same blurred style as uploaded
- Lock icon
- "Your report is ready to unlock"
- Primary button: "Unlock Your Report" (calls `reopenModal()`)
- Text link: "Upload a Different Quote" (calls `reset()`)

**analyzing** -- Theater card:
- Mount the existing `AnalysisTheaterScreen` component inside the right column (move it from left column)
- Keep the blurred preview in the left column
- Stepper runs in the After card position

**revealed** -- Authority Report (unchanged):
- Report Header + forensic headline
- Executive Summary
- QuoteAnalysisResults findings
- TalkToExpertCTA
- QuoteQA

### Left Column Adjustments

- **idle**: Upload zone (unchanged)
- **uploaded**: Upload zone (unchanged, modal is overlaid)
- **locked**: Move the locked overlay (blurred preview + lock) from lines 133-158 to remain in the LEFT column as the "Before" preview. Remove the duplicate "Unlock" CTA from the left since it now lives in the right column. Left column just shows the blurred file preview.
- **analyzing**: Left column shows blurred file preview (static). Theater stepper moves to right column.
- **revealed**: Left column shows the QuoteUploadZone with full image preview (unchanged)

### Stable Container Styling

The right column outer div gets a consistent wrapper:

```text
rounded-xl border border-border bg-card min-h-[400px] p-6
```

This ensures no layout shift between phases.

## Technical Details

- No new files created. All changes are inline in `QuoteScanner.tsx`.
- The `AnalysisTheaterScreen` component moves from left column (line 162) to inside the right column during analyzing phase.
- The locked overlay UI (lines 133-158) splits: blurred preview stays left, CTA buttons move right.
- All gating guards remain intact -- no results leak. The `phase === 'revealed' && analysisResult` guard is preserved exactly.

## Acceptance Tests

1. Page loads -- both columns visible, right column shows placeholder with lock icon
2. Upload file -- right column shows locked state ("being prepared"), modal opens
3. Close modal -- right column shows "Unlock Your Report" + "Upload Different" buttons
4. Submit lead -- right column shows analysis theater (stepper), left shows blurred preview
5. Results arrive -- right column transitions to authority report, no layout jump
6. No results content visible in any pre-revealed phase
