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

Captured through the dynamic second qualification question. The available reason set is dynamic on the preceding transaction state and is defined in the manifest's qualification specification.

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

Populate this table in a follow-up audit sprint against the active `Rollnz/window-man-truth-engine` scanner code. Current-state cells are marked `TO AUDIT` where inspection has not yet occurred in this sprint.

| Contract Area | Required Target | Current Active Implementation | Gap | Action |
|---|---|---|---|---|
| Document classification | Layer 1 outputs; distinguishes quote / contract / invoice / unrelated / unreadable; valid / uncertain / invalid states with explicit recovery | TO AUDIT | TO AUDIT | TO AUDIT |
| Homeowner extraction | Layer 2.1 candidates with confidence + source; never assumed from "first contact on page" | TO AUDIT | TO AUDIT | TO AUDIT |
| Property extraction | Layer 2.2 candidates distinct from mailing address | TO AUDIT | TO AUDIT | TO AUDIT |
| Contractor extraction | Layer 2.3 candidates never merged into homeowner bag | TO AUDIT | TO AUDIT | TO AUDIT |
| Salesperson extraction | Layer 2.4 candidates distinct from contractor company | TO AUDIT | TO AUDIT | TO AUDIT |
| Quote totals | Layer 3.1 commercial facts with explicit `null` for unstated | TO AUDIT | TO AUDIT | TO AUDIT |
| Opening / line-item detail | Layer 3.2 per-item envelope | TO AUDIT | TO AUDIT | TO AUDIT |
| Product / spec data | Layer 3.3 compliance and glass facts | TO AUDIT | TO AUDIT | TO AUDIT |
| Scope | Layer 3.4 scope facts | TO AUDIT | TO AUDIT | TO AUDIT |
| Payment | Layer 3.1 payment schedule + financing | TO AUDIT | TO AUDIT | TO AUDIT |
| Warranty | Layer 3.5 warranty facts | TO AUDIT | TO AUDIT | TO AUDIT |
| Deterministic analysis | Layer 4 outputs; deterministic-first, AI where impractical | TO AUDIT | TO AUDIT | TO AUDIT |
| Evidence / source tracking | Per-finding source reference preserved end-to-end | TO AUDIT | TO AUDIT | TO AUDIT |
| Confidence | HIGH / MEDIUM / LOW behavior enforced in reveal UI | TO AUDIT | TO AUDIT | TO AUDIT |
| User corrections | Layer 5.3 corrections stored without destroying originals | TO AUDIT | TO AUDIT | TO AUDIT |
| Transaction state | Layer 5.1 canonical values | TO AUDIT | TO AUDIT | TO AUDIT |
| Decision reason | Layer 5.2 dynamic question set | TO AUDIT | TO AUDIT | TO AUDIT |
| Report personalization | User context influences report tone and CTA, not only CRM | TO AUDIT | TO AUDIT | TO AUDIT |

---

*End of SCANNER_CONTRACT.md v1.0.0.*
