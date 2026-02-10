

# Unify All 11 CTAs to Open the PreQuoteLeadModal with Intent Tracking

## Summary

Every actionable CTA on the /sample-report page (Items 2-12) will be rewired to open the same "Get Ready to Outsmart the Sales Pitch" PreQuoteLeadModal. Each button passes a unique `intent` string so post-submission routing can be handled per-intent in a future prompt.

## CTA Inventory and Changes

| # | Button | Location | Current Behavior | New Behavior | Intent String |
|---|--------|----------|-----------------|-------------|---------------|
| 2 | "Talk to Window Man" (text link) | Sticky Header | Direct `tel:` link | Opens PreQuoteLeadModal | `header_talk` |
| 3 | "Upload My Estimate" (blue btn) | Sticky Header | Opens SampleReportLeadModal | Opens PreQuoteLeadModal | `header_upload` |
| 4 | "Don't Have a Quote Yet? Get Ready" | Hero | Opens PreQuoteLeadModal | No change (already correct) | `hero_no_quote` |
| 5 | "Upload My Quote" (outline btn) | Hero | Opens SampleReportLeadModal | Opens PreQuoteLeadModal | `hero_upload` |
| 6 | "Get My Free Audit" | Leverage Option A | Opens SampleReportLeadModal | Opens PreQuoteLeadModal | `option_a_audit` |
| 7 | "No quote yet? Get set up now" | Leverage Option A | Opens PreQuoteLeadModal | No change (already correct) | `option_a_setup` |
| 8 | "Request Better Quote Options" | Leverage Option B | Opens SampleReportLeadModal (Click 2) | Opens PreQuoteLeadModal (Click 2) | `option_b_request` |
| 9 | "Upload My Quote for Free Audit" | Closer/Bottom | Opens SampleReportLeadModal | Opens PreQuoteLeadModal | `bottom_upload` |
| 10 | "Getting Quotes Soon? Get Ready" | Closer/Bottom | Opens PreQuoteLeadModal | No change (already correct) | `bottom_get_ready` |
| 11 | "Talk to Window Man" (text link) | Closer/Bottom | Direct `tel:` link | Opens PreQuoteLeadModal | `bottom_talk` |
| 12 | "Talk to Window Man" (bottom link) | FAQ | Links to /consultation | Opens PreQuoteLeadModal | `faq_talk` |

## Files Changed

### 1. `src/components/sample-report/PreQuoteLeadModal.tsx`
- Add `ctaSource` (already exists as a prop) -- no interface change needed. The `ctaSource` prop already stores the intent string and passes it to `save-lead`. No modifications required here.

### 2. `src/components/sample-report/SampleReportHeader.tsx`
- Add `onOpenPreQuoteModal` prop to the interface.
- **"Upload My Estimate" button**: Change `onClick` from calling `onOpenLeadModal` to calling `onOpenPreQuoteModal('header_upload')`.
- **"Talk to Window Man" link**: Remove the `tel:` href. Change to a `<button>` that calls `onOpenPreQuoteModal('header_talk')`.

### 3. `src/components/sample-report/HeroSection.tsx`
- **"Upload My Quote" button** (`handleUploadClick`): Change from calling `onOpenLeadModal('hero_upload')` to calling `onOpenPreQuoteModal('hero_upload')`.
- **"Don't Have a Quote Yet?"**: Already calls `onOpenPreQuoteModal('hero_no_quote')` -- no change.

### 4. `src/components/sample-report/LeverageOptionsSection.tsx`
- **"Get My Free Audit"** (`handleOptionAClick`): Change from `onOpenLeadModal('leverage_path_a')` to `onOpenPreQuoteModal('option_a_audit')`.
- **"Request Better Quote Options"** (`handleOptionBClick`): Change from `onOpenLeadModal('leverage_path_b', true)` to `onOpenPreQuoteModal('option_b_request')`.
- **"No quote yet? Get set up now"**: Already calls `onOpenPreQuoteModal` -- update intent string to `'option_a_setup'`.
- The 2-click Smart Consent flow is fully preserved (Click 1 checks box, Click 2 opens modal).

### 5. `src/components/sample-report/CloserSection.tsx`
- **"Upload My Quote for Free Audit"** (`handleUploadClick`): Change from `onOpenLeadModal('closer_upload')` to `onOpenPreQuoteModal('bottom_upload')`.
- **"Getting Quotes Soon? Get Ready"** (`handleNoQuoteClick`): Already calls `onOpenPreQuoteModal` -- update intent string to `'bottom_get_ready'`.
- **"Talk to Window Man" link**: Remove the `tel:` `<a>` wrapper and `asChild`. Change to a `<Button>` that calls `onOpenPreQuoteModal('bottom_talk')`.

### 6. `src/components/sample-report/FAQSection.tsx`
- Add `onOpenPreQuoteModal` prop to the component interface.
- **"Talk to Window Man" link** (line 73): Replace the `<Link to={ROUTES.CONSULTATION}>` with a `<button>` that calls `onOpenPreQuoteModal('faq_talk')`.

### 7. `src/pages/SampleReport.tsx` (Parent Wiring)
- Pass `onOpenPreQuoteModal` to `SampleReportHeader` (currently only receives `onOpenLeadModal`).
- Pass `onOpenPreQuoteModal` to `FAQSection` (currently receives no props).
- The `onOpenLeadModal` prop can be removed from components that no longer use it (Header, Hero, LeverageOptions, Closer) -- or left as-is for now since removing it is optional cleanup.

## What Is NOT Changing
- The PreQuoteLeadModal itself (form fields, validation, success state, tracking) -- zero changes.
- The SampleReportLeadModal stays in the codebase (not deleted) but is no longer triggered by any button.
- The 2-click Smart Consent activation flow on Option B is fully preserved.
- Phone number (561) 468-5571 in the Navbar (Item 1) is NOT touched -- it lives in the global Navbar, not the sample-report page components.

## Post-Submission Routing (Deferred)
All CTAs will currently share the same post-submission behavior (success screen with "Go to Quote Scanner" button). In the next prompt, per-intent routing logic will be added so each intent string triggers a different post-submission action.

