# 2-Step Lead Capture Modal - IMPLEMENTED ✅

## Summary

The `/sample-report` page now uses a **2-step lead capture modal** instead of the previous page-gating approach.

---

## What Was Built

### New Component: `SampleReportLeadModal.tsx`

A 2-step modal with:

**Step 1 (Lead Capture):**
- First Name, Last Name, Email, Phone (all required)
- Partner consent checkbox (optional, pre-checkable via prop)
- Submit button: "Get My Free Audit"

**Step 2 (Call Offer):**
- Headline: "Great! We've received your info."
- Primary CTA: "Call WindowMan Now" → `tel:+15614685571`
- Secondary CTA: "Continue to My Free Audit" → `/ai-scanner?lead={leadId}#upload`

---

## Button Behavior Summary

| Component | Button | Action |
|-----------|--------|--------|
| `SampleReportHeader` | "Upload My Estimate" | Opens Modal (`ctaSource: 'sticky_header_upload'`) |
| `SampleReportHeader` | "Talk to Window Man" | Direct call `tel:+15614685571` |
| `HeroSection` | "Upload My Estimate for a Free Audit" | Opens Modal (`ctaSource: 'hero_upload'`) |
| `LeverageOptionsSection` | "Get My Free Audit" (Path A) | Opens Modal (`ctaSource: 'leverage_path_a'`) |
| `LeverageOptionsSection` | "Request Better Quote Options" (Path B) | Opens Modal (`ctaSource: 'leverage_path_b'`) + pre-checks consent |
| `CloserSection` | "Upload My Estimate (Free Audit)" | Opens Modal (`ctaSource: 'closer_upload'`) |
| `CloserSection` | "Talk to Window Man" | Direct call `tel:+15614685571` |

---

## Skip Logic

If user already has a `leadAnchor` in localStorage:
- Modal is skipped
- Direct navigation to `/ai-scanner?lead={leadId}#upload`
- Tracks `sample_report_cta_click` with `skipped_modal: true`

---

## GTM Events

### Step 1
- `sample_report_lead_modal_open`
- `sample_report_lead_captured`

### Step 2 (NEW)
- `sample_report_modal_step2_call` - User clicked call button
- `sample_report_modal_step2_continue` - User clicked continue to audit

---

## Files Modified

1. `src/components/sample-report/SampleReportLeadModal.tsx` - **NEW**
2. `src/pages/SampleReport.tsx` - Added modal state and handlers
3. `src/components/sample-report/SampleReportHeader.tsx` - Modal trigger + direct phone link
4. `src/components/sample-report/HeroSection.tsx` - Modal trigger
5. `src/components/sample-report/CloserSection.tsx` - Modal trigger + direct phone link
6. `src/components/sample-report/LeverageOptionsSection.tsx` - Modal trigger with pre-check
