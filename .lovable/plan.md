
# Wire Deterministic Scanner to /audit Page

## Objective
Replace the redirect-to-ai-scanner behavior with in-page analysis and results display.

---

## Changes Required

### 1. Update `Audit.tsx`
**Current:** Redirects to `/ai-scanner` on file upload
**New:** Uses `useDeterministicScanner` hook to analyze in-place

```text
- Remove: navigate('/ai-scanner', { state: { file } })
- Add: const scanner = useDeterministicScanner()
- Change: handleFileSelect calls scanner.analyzeFile(file)
- Pass: scanner state to UploadZoneXRay
```

### 2. Update `UploadZoneXRay.tsx`
**Current:** Right panel shows static blurred preview
**New:** Right panel renders actual scanner components based on phase

**Props to add:**
- `scannerPhase: DeterministicPhase`
- `scannerResult: AuditAnalysisResult | null`
- `onShowGate: () => void`
- `onCaptureLead: (data) => Promise<void>`
- `isLoading: boolean`

**Conditional rendering:**
| Phase | Component |
|-------|-----------|
| `idle` | Blurred preview (existing) |
| `analyzing` | `<AnalyzingState />` |
| `partial` | `<PartialResultsPanel />` |
| `gated` | `<ExplainScoreGate />` |
| `unlocked` | `<FullResultsPanel />` |

---

## Technical Implementation

### Audit.tsx Changes
```text
1. Import useDeterministicScanner from '@/hooks/audit'
2. Import scanner-modal components (AnalyzingState, etc.)
3. Remove useNavigate (no longer needed for file handling)
4. Initialize scanner hook at component level
5. Pass scanner state + handlers to UploadZoneXRay
```

### UploadZoneXRay.tsx Changes
```text
1. Update interface to accept scanner state props
2. Replace static blurred preview with phase-based rendering
3. Keep upload dropzone on LEFT side (unchanged)
4. Render appropriate component on RIGHT side based on phase
```

---

## File Modifications

| File | Action |
|------|--------|
| `src/pages/Audit.tsx` | Wire `useDeterministicScanner`, pass state to children |
| `src/components/audit/UploadZoneXRay.tsx` | Accept scanner props, render phase-based components |

---

## Flow After Implementation

```text
User lands on /audit
       ↓
Sees upload zone (LEFT) + blurred preview (RIGHT)
       ↓
Uploads quote file
       ↓
LEFT: Shows file info
RIGHT: Shows AnalyzingState (static checklist)
       ↓
Analysis completes
       ↓
RIGHT: Shows PartialResultsPanel
       (Score visible, explanations blurred)
       ↓
User clicks "Continue to Full Report"
       ↓
RIGHT: Shows ExplainScoreGate
       (Lead capture form)
       ↓
User submits form
       ↓
RIGHT: Shows FullResultsPanel
       (All explanations unlocked)
```

---

## No Changes Required

- `useDeterministicScanner.ts` - Already complete
- `AnalyzingState.tsx` - Already complete
- `PartialResultsPanel.tsx` - Already complete
- `ExplainScoreGate.tsx` - Already complete
- `FullResultsPanel.tsx` - Already complete
- Analytics tracking - Already wired in hook

---

## Success Criteria

1. User stays on `/audit` page throughout entire flow
2. Results appear in "After: Your AI Gradecard" section
3. Phase transitions are smooth and immediate
4. Lead capture gate works correctly
5. Analytics events fire at correct moments
