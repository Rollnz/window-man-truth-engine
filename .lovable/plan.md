

# Redesign QuoteUploadGateModal to Match Reference Screenshot

## What Changes

A frontend-only visual update to `QuoteUploadGateModal.tsx`. No new files, no new props, no backend changes. The modal switches from a dark slate theme to a clean white/light theme matching the reference image.

## File: `src/components/audit/QuoteUploadGateModal.tsx`

### 1. Modal Container -- Dark to Light

- `DialogContent` changes from `bg-slate-900 text-white` to `bg-white text-slate-900` or the color e5e5e5
- Border changes to `border-slate-200`
- Remove the gradient header bar entirely (no more orange gradient strip with FileCheck icon)

### 2. New Header Layout

Replace the current gradient header with a simple top section:
- Lock icon (inline, small, `text-slate-700`) + bold heading **"Unlock Your Full Analysis"** on the same line
- Subtitle paragraph below: "Your quote has been analyzed. Enter your details to see the complete breakdown, warnings, and recommendations."

### 3. Trust Banner

Add a green trust banner below the subtitle (matching the reference):
- Rounded pill with green background (`bg-green-50 border border-green-200`)
- Green checkmark circle icon + bold "Your data is secure." + "And Saved in Your Vault."

### 4. Form Fields -- Restyle for Light Theme

All labels change from `text-white` to `text-slate-800`. Inputs stay `bg-white text-slate-900 border-slate-300` (already correct). Icon colors change from `text-slate-400` to `text-slate-500`.

- **First Name / Last Name**: Keep existing 2-column grid (already matches requirement). Labels show `First Name *` and `Last Name *` with User icon on First Name only.
- **Email**: Label shows `Email *` with Mail icon.
- **Phone**: Label changes from `Phone Number *` to `Phone *` with Phone icon. Remove "(optional)" -- phone stays required (already is).

### 5. SMS Consent Checkbox

Add a new checkbox row between Phone and the CTA button:
- Use a circle checkbox or standard checkbox
- Text: "I agree to receive SMS updates about my quote analysis. Message & data rates may apply. Reply STOP to unsubscribe."
- This is visual/UX only -- not a blocking validation field (informational consent)

### 6. CTA Button -- Restyle

- Change from orange gradient (`from-orange-500 to-amber-500`) to solid blue (`bg-primary hover:bg-primary/90`)
- Keep Lock icon + text "Unlock My Score Now" (replacing "Unlock My AI Report")
- Keep `text-white font-bold`

### 7. Footer Text

Replace current "No spam. No pressure..." with:
- "By submitting, you agree to our Terms of Service and Privacy Policy. We'll send your analysis to this email."
- Style: `text-xs text-slate-500 text-center`

### 8. Remove Old Trust Copy

Remove the line "We'll analyze your quote and send results to your email. Your info is never shared or sold." (replaced by the trust banner and footer).

## Summary of Visual Changes

| Element | Before | After |
|---------|--------|-------|
| Background | `bg-slate-900` dark | `bg-white` light #e5e5e5 |
| Header | Orange gradient strip + FileCheck | Lock icon + "Unlock Your Full Analysis" |
| Trust | Bottom micro-copy | Green banner "Your data is secure" |
| Labels | `text-white` | `text-slate-800` |
| Phone label | "Phone Number *" | "Phone *" |
| SMS consent | None | Checkbox with SMS opt-in text |
| CTA color | Orange gradient | `bg-primary` (blue) |
| CTA text | "Unlock My AI Report" | "Unlock My Score Now" |
| Footer | "No spam..." | Terms/Privacy disclaimer |

## What Does NOT Change

- Props interface (same `QuoteUploadGateModalProps`)
- Form validation logic (all 4 fields required via `commonSchemas`)
- Phone formatting (`formatPhoneNumber`)
- GTM tracking events (`quote_upload_gate_open`, `_close`, `_submit`)
- Focus management (autofocus, return focus)
- Form reset on close
- Locked-open UX (`onPointerDownOutside` prevented)
- Double-submit protection (existing `isLoading` guard)
- Payload shape (`ExplainScoreFormData` with firstName, lastName, email, phone)

## Answers to Safety Questions

- **Payload shape match API contract?** Yes -- unchanged `ExplainScoreFormData`
- **Button clickable when validation fails?** Yes, but `validateAll()` blocks submission -- unchanged
- **Double-click/rapid submit?** Handled by existing `isLoading` disable -- unchanged
- **What does user see on fail?** Inline field errors via `errors.*` -- unchanged
- **Tests that break?** None -- no structural/prop changes, only class names and copy
- **All imports added?** Need to add `CheckCircle2` from lucide-react (for trust banner) and `Checkbox` from shadcn if using it for SMS consent

