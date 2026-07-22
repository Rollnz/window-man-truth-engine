# WindowMan Scanner Contract

| Field | Value |
|---|---|
| Document ID | `WM-SCANNER-CONTRACT-001` |
| Version | `1.0.0` |
| Status | `APPROVED TARGET CONTRACT — NOT AN IMPLEMENTATION DESCRIPTION` |
| Canonical Path | `/docs/lovable/SCANNER_CONTRACT.md` |
| Parent Manifest | [`MASTER_MANIFEST.MD`](./MASTER_MANIFEST.MD) v1.1.0 |
| Applies To | The WindowMan Quote-First scanner pipeline (upload → derived analysis → user context → Truth Report) |

## 0. Purpose and Reading Rules

This document defines the **target contract** for the WindowMan scanner. It is NOT a description of whatever the legacy scanner currently produces. Normative keywords **MUST**, **MUST NOT**, **SHOULD**, and **MAY** carry RFC 2119 meaning.

This document contains no implementation code. It defines conceptual outputs, epistemic rules, and behavioral requirements sufficient for a future implementation sprint to audit existing scanner code against a stable target.

The scanner contract is composed of **five layers**. Each layer has a distinct responsibility. A downstream layer MUST NOT silently substitute for a missing upstream layer.

---

## LAYER 1 — DOCUMENT CLASSIFICATION

The scanner's first responsibility is to determine what kind of document it has received before attempting substantive extraction.

### 1.1 Required Conceptual Outputs

- `document_type`
- `is_supported_document`
- `is_valid_quote_or_estimate`
- `classification_confidence`
- `page_count`
- `readability` / `extraction_quality`

### 1.2 Minimum Distinguished Types

The scanner MUST at minimum distinguish:

- contractor quote / estimate
- contract / proposal
- invoice / receipt
- unrelated document
- unreadable / unsupported document

### 1.3 States

- **Valid state** — the document is confidently classified as a quote/estimate/contract/proposal and downstream layers MAY proceed.
- **Uncertain state** — classification confidence is low; downstream extraction MAY proceed but derived analysis MUST NOT be presented as authoritative and the UI MUST invite user correction.
- **Invalid state** — the document is confidently classified as unrelated or unreadable; the scanner MUST NOT fabricate a quote analysis.

### 1.4 Recovery Expectation

For invalid or unreadable documents the pipeline MUST return an explicit non-success signal that the acquisition experience can surface as a user-facing recovery affordance (re-upload, better photo, alternate file). The scanner MUST NOT hallucinate a quote analysis to avoid an empty state.

---

## LAYER 2 — ENTITY EXTRACTION

Layer 2 extracts identity and contact candidates. It MUST preserve four distinct entity groups.

### 2.1 Homeowner / Customer

Candidate fields:

- `name`
- `email`
- `phone`
- `mailing_address`

### 2.2 Property / Project Location

Candidate fields:

- `service_address`
- `city`
- `state`
- `zip`

### 2.3 Contractor

Candidate fields:

- `company_name`
- `license_number`
- `address`
- `phone`
- `email`
- `website`

### 2.4 Salesperson / Representative

Candidate fields:

- `name`
- `phone`
- `email`

### 2.5 Candidate Envelope

Every extracted identity/contact candidate MUST conceptually support:

- `value`
- `confidence`
- `source_page`
- `source_text_or_reference`
- `entity_type`

### 2.6 Critical Attribution Rule

The system **MUST NOT** assume the first phone, email, name, or address on the document belongs to the homeowner. Contractor, salesperson, financing provider, manufacturer, co-owner, and homeowner information MUST remain distinguishable throughout the pipeline and MUST NOT be collapsed into a single "contact" bag.

### 2.7 Confidence Behavior

- **HIGH** — MAY be confidently prefilled for user verification.
- **MEDIUM** — MAY be prefilled but MUST invite correction in the reveal UI.
- **LOW** — MUST NOT be represented as verified identity; MAY be surfaced as a suggestion the user can accept.

---

## LAYER 3 — QUOTE FACTS

Layer 3 extracts the canonical factual envelope of the quote. Every field returned MUST distinguish "not stated" from any concrete value.

### 3.1 Document / Commercial Facts

- `quote_number`
- `quote_date`
- `expiration_date`
- `total_price`
- `subtotal`
- `discounts`
- `taxes`
- `deposit`
- `financing`
- `payment_schedule`

### 3.2 Project / Opening Facts

- `opening_count`
- `line_items[]` with per-item:
  - `opening_location`
  - `dimensions`
  - `quantity`
  - `product_type`
  - `manufacturer`
  - `brand`
  - `series`
  - `model`

### 3.3 Product / Glass / Compliance Facts (where present)

- NOA / FL approval
- DP rating
- impact designation
- glass package
- Low-E
- Argon
- tint
- glass makeup

### 3.4 Scope Facts (where present)

- installation
- removal / disposal
- permits
- engineering
- wall / stucco / drywall / paint repair
- waterproofing / sealant
- anchoring
- change-order language
- remeasure language

### 3.5 Warranty / Contract Facts (where present)

- labor warranty
- product / material warranty
- service process
- callback process
- cancellation
- terms and conditions
- exclusions
- timeline

### 3.6 Core Extraction Rule

If information is not stated or cannot be reliably extracted, the scanner MUST return `null` / `unknown` / `not_found`. It MUST NOT guess. It MUST NOT convert absence into fact.

### 3.7 Fact Provenance (Auditability)

Important extracted quote facts SHOULD preserve provenance sufficient for later auditability. Where available, each fact SHOULD conceptually carry:

- `value`
- `confidence`
- `source_page`
- `source_text_or_reference`

Provenance is especially important for the following high-consequence facts, which downstream analysis, reporting, and any statutory framing may reference:

- `total_price`
- contractor identity (`company_name`, `license_number`)
- `opening_count`
- payment terms (`deposit`, `payment_schedule`, `financing`)
- product identity (`manufacturer`, `series`, `model`)
- compliance identifiers (NOA / FL approval / DP rating)
- warranty statements (labor and product)
- scope statements (installation, permits, repair)

This section clarifies the target requirement only. It does not force one implementation schema in this sprint.

---

## LAYER 4 — DERIVED ANALYSIS

Layer 4 interprets facts produced by Layer 3. Deterministic logic SHOULD be preferred wherever rules can be reliably expressed; AI reasoning MAY be used where deterministic expression is impractical, but its outputs MUST remain auditable.

### 4.1 Conceptual Outputs

- `positive_findings[]`
- `missing_information[]`
- `clarification_items[]`
- `risk_signals[]`
- `comparison_readiness[]`
- `price_context[]`
- `scope_gaps[]`
- `payment_signals[]`
- `product_specification_gaps[]`

### 4.2 Epistemic Distinction (Critical)

Every derived finding MUST distinguish:

- **FOUND** — the document explicitly supports the fact.
- **NOT FOUND** — the scanner could not find the information in the uploaded document.
- **INFERENCE / CONCERN** — the absence or combination of facts creates something worth clarifying.

The system MUST NOT automatically convert **NOT FOUND** into **BAD** or **NONCOMPLIANT**. A missing datum on a homeowner's uploaded document does not, by itself, constitute a contractor violation.

### 4.3 Evidence Preservation

Every meaningful derived finding SHOULD preserve enough source/evidence context (page, snippet, or referenced fact IDs) to explain to the user why the finding exists.

### 4.4 Price Analysis Principle

Simple `total_price ÷ opening_count` MUST NOT be defined as definitive fair-value truth. Price-per-opening MAY remain one signal among many. Future price analysis SHOULD accept context such as:

- product type
- size
- configuration
- door vs. window
- manufacturer / series
- glass package
- installation scope
- permit / engineering scope
- repair scope
- financing structure

No pricing logic is implemented in this sprint. Layer 4 documents the requirement only.

---

## LAYER 5 — USER CONTEXT

Layer 5 is **not OCR**. It is supplied or confirmed by the homeowner after Layers 1–4 have demonstrated scan value.

### 5.1 Canonical Transaction State

- `already_signed`
- `still_deciding`
- `passed`

### 5.2 Canonical Decision Reason

Captured through the dynamic second qualification question. The reason set is conditioned on the preceding transaction state.

The **canonical human-facing display labels** for these reasons are the property of [`MASTER_MANIFEST.MD`](./MASTER_MANIFEST.MD) and MUST NOT be redefined here. This section defines the **machine-readable reason codes** that data pipelines, analytics, database columns, and downstream logic MUST use as the stable canonical state. Display copy MUST NOT be stored as the canonical state.

#### 5.2.1 Reason Codes — `already_signed`

```text
price_made_sense
trusted_company_salesperson
product_brand_felt_right
financing_payments_worked
reviews_reputation_strong
ready_to_get_it_done
other
```

#### 5.2.2 Reason Codes — `still_deciding`

```text
price
comparing_other_quotes
unclear_whats_included
products_specifications
payment_terms_financing
trust_concern
timing
other
```

#### 5.2.3 Reason Codes — `passed`

```text
price_too_high
wanted_more_quotes
quote_confusing_vague
trust_concern
products_specifications
payment_terms_financing
chose_another_company
timing
other
```

#### 5.2.4 Contract Rules

- Machine-readable enum values in 5.2.1–5.2.3 are the canonical state and belong to this document.
- Locked human-facing display labels/copy belong to `MASTER_MANIFEST.MD`.
- Downstream analytics, database rows, edge functions, report logic, and CRM state MUST use the stable reason **codes** rather than storing display copy as canonical state.
- If a manifest-defined display label has no code above, the code MUST be added here in a follow-up amendment before that label ships to production data pipelines.
- The `other` code MUST always remain available in each transaction state to accommodate free-text or unmapped user input.

### 5.3 Additional Conceptual Fields

- `identity_corrections`
- `confirmed_contact_data`
- `phone_verification_status`
- `contact_preferences`

### 5.4 Behavioral Requirement

User context MUST influence Truth Report presentation (tone, primary CTA, recommended next action). It MUST NOT exist only as CRM metadata invisible to the report the user sees.

---

## CANONICAL DATA FLOW

```text
DOCUMENT
    ↓
LAYER 1
CLASSIFICATION
    ↓
LAYER 2
ENTITY EXTRACTION
    ↓
LAYER 3
QUOTE FACTS
    ↓
LAYER 4
DERIVED ANALYSIS
    ↓
PARTIAL REVEAL
    ↓
USER CONFIRMS / CORRECTS IDENTITY
    ↓
LAYER 5
USER CONTEXT
    ↓
PERSONALIZED TRUTH REPORT
    ↓
CONTEXTUAL INBOUND CALL
```

---

## EVIDENCE & CONFIDENCE RULES

The scanner contract establishes:

1. AI extraction is **not** equivalent to verified truth.
2. OCR/AI candidate data MUST preserve uncertainty (confidence, source reference).
3. User-confirmed data takes precedence for active user-facing identity.
4. Original extracted evidence SHOULD NOT be silently destroyed when the user corrects a field; corrections and originals MUST both remain queryable for audit and for downstream reconciliation.
5. Derived findings MUST distinguish document fact from interpretation.
6. Unsupported legal or contractor accusations are prohibited.
7. The final Truth Report MUST be explainable from extracted evidence and deterministic/approved reasoning.

---

## APPENDIX A — ACTIVE IMPLEMENTATION AUDIT TEMPLATE

Populated from the Sprint 02 audit (see [`SCANNER_IMPLEMENTATION_AUDIT.md`](./SCANNER_IMPLEMENTATION_AUDIT.md) for evidence, file/function references, and disposition rationale). Cells here are concise summaries only; the audit document is the source of evidence.

| Contract Area | Required Target | Current Active Implementation | Gap | Action |
|---|---|---|---|---|
| Document classification | Layer 1 outputs; distinguishes quote / contract / invoice / unrelated / unreadable; valid / uncertain / invalid states with explicit recovery | Binary `isValidQuote` + free-text `validityReason` produced by `EXTRACTION_RUBRIC` PHASE 0 (`supabase/functions/_shared/scanner-brain/rubric.ts`). No document-type enum, no confidence, no readability. Invalid → 422 in `wm-analyze-quote`; `quote-scanner` returns zero-score record. | No `document_type`, no confidence, no readability, no "uncertain" state | REFACTOR |
| Homeowner extraction | Layer 2.1 candidates with confidence + source; never assumed from "first contact on page" | NOT FOUND. `ExtractionSignals` schema (`schema.ts`) has no homeowner/customer fields. | Entire homeowner extraction missing | REPLACE (add) |
| Property extraction | Layer 2.2 candidates distinct from mailing address | NOT FOUND. Only `areaName` hint passed in from client; no service address extraction. | Entire property extraction missing | REPLACE (add) |
| Contractor extraction | Layer 2.3 candidates never merged into homeowner bag | Partial: `contractorNameExtracted`, `licenseNumberValue` in `schema.ts`; surfaced via `extractIdentity()` in `forensic.ts`. No address/phone/email/website; no confidence; no source. | Missing most contractor fields, no confidence, no source | EXTEND |
| Salesperson extraction | Layer 2.4 candidates distinct from contractor company | NOT FOUND | Entire salesperson extraction missing | REPLACE (add) |
| Quote totals | Layer 3.1 commercial facts with explicit `null` for unstated | Only `totalPriceFound` + `totalPriceValue` in `schema.ts`. No `quote_number`, `quote_date`, `expiration_date`, `subtotal`, `discounts`, `taxes`. Deposit only as `depositPercentage`. Nulls preserved for numbers; booleans collapse "absent" and "false". | Most commercial facts missing; boolean fields conflate absent vs false | EXTEND |
| Opening / line-item detail | Layer 3.2 per-item envelope | Only `openingCountEstimate` scalar. No `line_items[]`, no per-item dimensions/quantity/product. | No line-item envelope | REPLACE (add) |
| Product / spec data | Layer 3.3 compliance and glass facts | Boolean flags only (`hasNOANumber`, `hasComplianceIdentifier`, `hasLaminatedMention`, `hasGlassBuildDetail`, `hasTemperedOnlyRisk`, `hasNonImpactLanguage`, `noaNumberValue`). No DP value, no glass makeup detail, no manufacturer/series/model. | Values not captured, only presence flags | REFACTOR |
| Scope | Layer 3.4 scope facts | Boolean flags only (`hasPermitMention`, `hasDemoInstallDetail`, `hasSpecificMaterials`, `hasWallRepairMention`, `hasFinishDetail`, `hasCleanupMention`, `hasBrandClarity`, `hasSubjectToChange`, `hasRepairsExcluded`, `hasStandardInstallation`). No textual scope statements captured. | Presence-only; no values or source | REFACTOR |
| Payment | Layer 3.1 payment schedule + financing | `depositPercentage`, `hasFinalPaymentTrap`, `hasSafePaymentTerms`, `hasPaymentBeforeCompletion`, `hasContractTraps`, `contractTrapsList`, `hasManagerDiscount`. No `payment_schedule[]`, no financing terms. | Schedule/financing details absent | EXTEND |
| Warranty | Layer 3.5 warranty facts | `hasWarrantyMention`, `hasLaborWarranty`, `warrantyDurationYears`, `hasLifetimeWarranty`, `hasTransferableWarranty`. Separate labor vs product warranty not distinguished; no exclusions/callback process. | Product/labor split missing; exclusions absent | EXTEND |
| Deterministic analysis | Layer 4 outputs; deterministic-first, AI where impractical | Deterministic pipeline exists in `scoring.ts` (`scoreFromSignals`) + `forensic.ts` (`generateForensicSummary`). Five-pillar weighted score, letter grade, 5 hard caps citing FL statutes, `questionsToAsk[]`, `statuteCitations[]`, `positiveFindings[]`. No FOUND / NOT FOUND / INFERENCE tri-state. | Absence-as-failure baked into scoring & hard caps; no epistemic tri-state | REFACTOR (deterministic engine reusable; interpretation rules must change) |
| Evidence / source tracking | Per-finding source reference preserved end-to-end | NOT FOUND. Warnings/missingItems/citations are pre-authored strings composed from booleans; no page or snippet references. | No source anywhere in pipeline | REPLACE (add) |
| Confidence | HIGH / MEDIUM / LOW behavior enforced in reveal UI | NOT FOUND. Schema exposes no per-field confidence; UI has no confidence-aware affordance. | Confidence model absent end-to-end | REPLACE (add) |
| User corrections | Layer 5.3 corrections stored without destroying originals | NOT FOUND. `useLeadFormSubmit` overwrites lead fields; no editable OCR-identity dossier surface in current flow. | No corrections layer, no dual-preservation | REPLACE (add) |
| Transaction state | Layer 5.1 canonical values | NOT FOUND as a canonical field. `qualify-flow-b` edge function exists but stores qualification points, not `already_signed` / `still_deciding` / `passed`. | Canonical enum not present | REPLACE (add) |
| Decision reason | Layer 5.2 dynamic question set | NOT FOUND with canonical reason codes. No mapping in code to 5.2.1–5.2.3 codes. | Reason codes not implemented | REPLACE (add) |
| Report personalization | User context influences report tone and CTA, not only CRM | NOT FOUND. Current report copy (`summary`, `headline`) is derived only from scored signals, not from transaction state or reason. | Personalization missing | REPLACE (add) |

---

*End of SCANNER_CONTRACT.md v1.0.0.*
