# Forms, Lead Modals, and Exit-Intent Inventory (Verified)

This document is a code-verified inventory of every known form/modal that can capture **name, email, and/or phone** in the web app.

## 1) Shared Conversion Modal

### `LeadCaptureModal`
- File: [`src/components/conversion/LeadCaptureModal.tsx`](/src/components/conversion/LeadCaptureModal.tsx)
- Captures: Always email, plus first name + phone when `sourceTool === 'quote-scanner'`
- CTA copy is source-tool-aware for:
  - `quote-scanner`
  - `comparison-tool`
  - `risk-diagnostic`
  - `fast-win`
  - `evidence-locker`
  - `vulnerability-test`
  - `intel-library`
  - `claim-survival-kit`
  - default fallback used by tools like `expert-system` and `reality-check`

#### Page usage
| Page | Route | sourceTool |
|---|---|---|
| Quote Scanner | `/ai-scanner` | `quote-scanner` |
| Reality Check | `/reality-check` | `reality-check` |
| Risk Diagnostic | `/risk-diagnostic` | `risk-diagnostic` |
| Fast Win | `/fast-win` | `fast-win` |
| Evidence | `/evidence` | `evidence-locker` |
| Claim Survival | `/claim-survival` | `claim-survival-kit` |
| Vulnerability Test | `/vulnerability-test` | `vulnerability-test` |
| Expert | `/expert` | `expert-system` |

---

## 2) Consultation Booking Modal

### `ConsultationBookingModal`
- File: `src/components/conversion/ConsultationBookingModal.tsx`
- Captures: First name, last name, email, phone, preferred time, notes

#### Page usage
| Page | Route | sourceTool |
|---|---|---|
| Reality Check | `/reality-check` | `reality-check` |
| Risk Diagnostic | `/risk-diagnostic` | `risk-diagnostic` |
| Fast Win | `/fast-win` | `fast-win` |
| Evidence | `/evidence` | `evidence-locker` |
| Claim Survival | `/claim-survival` | `claim-survival-kit` |
| Beat Your Quote | `/beat-your-quote` | `beat-your-quote` |
| Intel | `/intel` | `intel-library` |
| Comparison | `/comparison` | `comparison-tool` |
| Terms | `/terms` | `consultation` |
| Privacy | `/privacy` | `consultation` |
| FAQ | `/faq` | `consultation` |
| Defense | `/defense` | `consultation` |
| About | `/about` | `consultation` |
| Expert | `/expert` | `expert-system` |

---

## 3) Exit Intent Modal (3-step gauntlet)

### `ExitIntentModal`
- File: `src/components/authority/ExitIntentModal.tsx`
- Captures (by step):
  - Step 1: name, email, phone, window count
  - Step 2: phone
  - Step 3: email
- Trigger logic: timed and behavior-based (desktop mouse leave / mobile scroll-up behavior)

#### Page usage
| Page | Route | sourceTool |
|---|---|---|
| Reality Check | `/reality-check` | `reality-check` |
| Risk Diagnostic | `/risk-diagnostic` | `risk-diagnostic` |
| Cost Calculator | `/cost-calculator` | `cost-calculator` |
| Fair Price Quiz | `/fair-price-quiz` | `fair-price-quiz` |
| Sales Tactics Guide | `/sales-tactics-guide` | `sales-tactics-guide` |
| Spec Checklist Guide | `/spec-checklist-guide` | `spec-checklist-guide` |
| Kitchen Table Guide | `/kitchen-table-guide` | `kitchen-table-guide` |
| Insurance Savings Guide | `/insurance-savings-guide` | `insurance-savings-guide` |
| Window Cost Truth | `/window-cost-truth` | `window-cost-truth` |
| Window Risk and Code | `/window-risk-and-code` | `window-risk-and-code` |
| Window Sales Truth | `/window-sales-truth` | `window-sales-truth` |
| Window Verification System | `/window-verification-system` | `window-verification-system` |

---

## 4) Sample Report Modals

### `SampleReportLeadModal`
- File: `src/components/sample-report/SampleReportLeadModal.tsx`
- Captures: name, email, phone
- Page usage: Sample Report (`/sample-report`)

### `PreQuoteLeadModal`
- File: `src/components/sample-report/PreQuoteLeadModal.tsx`
- Captures: first name, last name, email, phone
- Page usage: Sample Report (`/sample-report`), Quote Scanner (`/ai-scanner`)

---

## 5) Audit Page Gates

### `QuoteUploadGateModal`
- File: `src/components/audit/QuoteUploadGateModal.tsx`
- Captures: first name, last name, email, phone (+ SMS consent)
- Page usage: Audit (`/audit`), shown after upload

### `SampleReportGateModal`
- File: `src/components/audit/SampleReportGateModal.tsx`
- Captures: first name, last name, email, phone
- Page usage: Audit (`/audit`), via “View Sample Report” gate

---

## 6) Guide-Specific CTA Modals

### `SpecChecklistGuideModal`
- File: `src/components/conversion/SpecChecklistGuideModal.tsx`
- Page usage: Spec Checklist Guide (`/spec-checklist-guide`)

### `SalesTacticsGuideModal`
- File: `src/components/conversion/SalesTacticsGuideModal.tsx`
- Page usage: Sales Tactics Guide (`/sales-tactics-guide`)

### `KitchenTableGuideModal`
- File: `src/components/conversion/KitchenTableGuideModal.tsx`
- Page usage: Kitchen Table Guide (`/kitchen-table-guide`)

All three are multi-step consultation funnels and capture first name, last name, email, and phone.

---

## 7) Tool-Specific Modals

### `LeadModal` (Quote Builder)
- File: `src/components/quote-builder/LeadModal.tsx`
- Page usage: Calculate Estimate (`/free-estimate` / CalculateEstimate page)
- Captures: first name, last name, email, phone

### `MissionInitiatedModal`
- File: `src/components/beat-your-quote/MissionInitiatedModal.tsx`
- Page usage: Beat Your Quote (`/beat-your-quote`)
- Captures: first name, last name, email, phone

### `BlurGate`
- File: `src/components/fair-price-quiz/BlurGate.tsx`
- Page usage: Fair Price Quiz (`/fair-price-quiz`)
- Captures: first name + email only

---

## 8) Global Floating CTA Form

### `EstimateSlidePanel`
- File: `src/components/floating-cta/EstimateSlidePanel.tsx`
- Mounted globally via `FloatingEstimateButton` in the public layout
- Captures: project details + name, email, phone + address
- sourceTool used in backend path: `floating-estimate-form`

---

## 9) Standalone Consultation Form

### `ConsultationForm`
- File: `src/components/consultation/ConsultationForm.tsx`
- Page usage: Consultation (`/consultation`)
- Captures: full intake fields (project, timeline, contact, address, etc.)
- sourceTool: `consultation`

---

## 10) Phone-Only Modal

### `PhoneCaptureModal`
- File: `src/components/sample-report/PhoneCaptureModal.tsx`
- Captures: phone only
- Current status: no active imports found (appears unused)

---

## Orphaned / currently unused components

- `src/components/quote-scanner/ScannerLeadCaptureModal.tsx`
- `src/components/intel/IntelLeadModal.tsx`
- `src/components/conversion/EbookLeadModal.tsx`
- `src/components/sample-report/SampleReportAccessGate.tsx`
- `src/components/sample-report/PhoneCaptureModal.tsx`

No active imports were found in app pages/components for these components.

---

## Highest-impact cleanup plan (recommended)

1. **Create a single form registry config**
   - Add one typed config mapping `sourceTool -> route, modal title, CTA copy, required fields, expected conversion event`.
   - Use registry in both UI and analytics validation script.

2. **Add route-level form smoke tests (Playwright)**
   - For each route with a form/modal, test open state, required field behavior, and submit payload includes expected `sourceTool` and route context.

3. **Add CTA parity checks**
   - Add a small test utility that asserts trigger button text aligns with modal CTA intent for the same user journey.

4. **Retire orphaned components safely**
   - Remove unused modals in one PR after confirming no dynamic imports or feature flags use them.

5. **Close conversion gaps intentionally**
   - Decide whether `BlurGate` should capture phone (high-intent flow).
   - Keep/adjust `LeadCaptureModal` default fallback CTA behavior for tools without explicit copy.

6. **Track “converted” state consistently**
   - Confirm `hasConverted` wiring is reliable on every page that uses `ExitIntentModal` so converted users are suppressed from repeat prompts.
