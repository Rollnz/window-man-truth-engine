

# Unify "No Quote" CTAs to PreQuoteLeadModalV2

## What Changes

Replace the legacy `SampleReportGateModal` trigger on the NoQuoteEscapeHatch "View Sample Report" card with `PreQuoteLeadModalV2`. The blue "No Quote Yet?" button in UploadZoneXRay already does the right thing -- no change needed there.

---

## File 1: `src/components/audit/NoQuoteEscapeHatch.tsx`

**Current behavior:** The first card ("View Sample Report") calls `onViewSampleClick()` which bubbles up to `Audit.tsx` and opens `SampleReportGateModal`.

**New behavior:**
- Add local state: `const [showLeadModal, setShowLeadModal] = useState(false)`
- Make the entire first card clickable (wrap in a clickable container or add `onClick` to the Card)
- The "Send me the Sample" button and the card itself both call `setShowLeadModal(true)`
- Render `PreQuoteLeadModalV2` at the bottom of the component with `ctaSource="audit-no-quote-sample"` so attribution is tracked distinctly from the gradecard button
- Remove the `onViewSampleClick` prop dependency for the first card (keep it as a fallback or remove entirely)

**CTA improvement:** Make the entire first card act as a single clickable surface with `cursor-pointer` and a subtle hover lift, so users don't have to find the small button. The button label stays "Send Me the Sample" but the card itself is also clickable.

---

## File 2: `src/pages/Audit.tsx`

**Cleanup:** The `SampleReportGateModal` and its state (`sampleGateOpen`, `sampleGateTriggerRef`, `openSampleGate`) can be removed since the NoQuoteEscapeHatch now self-manages its own modal. The `onViewSampleClick` prop passed to `NoQuoteEscapeHatch` becomes unnecessary.

However, `ScannerHeroWindow` also uses `onViewSampleClick` for the hero "No quote yet?" link. That should also switch to opening `PreQuoteLeadModalV2`. Two options:

- **Option A (simpler):** Keep `openSampleGate` in Audit.tsx but have it open a `PreQuoteLeadModalV2` instead of `SampleReportGateModal`. This covers the hero CTA.
- **Option B (cleaner):** Have `ScannerHeroWindow` manage its own modal internally, same pattern as NoQuoteEscapeHatch.

**Recommended: Option A** -- keep a single `PreQuoteLeadModalV2` in Audit.tsx for the hero CTA, and let NoQuoteEscapeHatch manage its own instance. This avoids prop-drilling while keeping the hero wiring simple.

Changes:
- Replace `SampleReportGateModal` import and render with `PreQuoteLeadModalV2`
- Replace `sampleGateOpen` / `setSampleGateOpen` state with the same pattern but targeting the new modal
- Remove `sampleGateTriggerRef` (PreQuoteLeadModalV2 handles its own focus)
- Remove `SampleReportGateModal` import
- Keep `onViewSampleClick` on hero but wire it to the new modal

---

## File 3: `src/components/audit/ScannerHeroWindow.tsx`

No changes needed -- it already calls `onViewSampleClick` which will now open `PreQuoteLeadModalV2` from Audit.tsx.

---

## Files NOT Changed

- `src/components/audit/SampleReportGateModal.tsx` -- kept in codebase (other pages may use it), just no longer rendered on `/audit`
- `src/components/audit/UploadZoneXRay.tsx` -- already correct, "No Quote Yet?" button opens `PreQuoteLeadModalV2` with `ctaSource="audit-gradecard-no-quote"`
- `PreQuoteLeadModalV2` component itself -- no changes needed

---

## CTA Improvements (bonus)

For the NoQuoteEscapeHatch first card:
- Make the entire card a clickable surface (`cursor-pointer`, `hover:scale-[1.02]` lift)
- Change button label from config value ("Send Me the Sample") to something more action-oriented: "See What We Flag" or keep "Send Me the Sample" if that's tested well
- Add a subtle pulse or glow on the card border to draw attention since it's the primary escape hatch for users without quotes

---

## Summary of Files

| File | Change |
|------|--------|
| `src/components/audit/NoQuoteEscapeHatch.tsx` | Add local `PreQuoteLeadModalV2` with `ctaSource="audit-no-quote-sample"`, make first card fully clickable |
| `src/pages/Audit.tsx` | Replace `SampleReportGateModal` with `PreQuoteLeadModalV2` for hero CTA, remove legacy modal state |

