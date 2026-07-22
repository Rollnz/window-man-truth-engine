// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — CANONICAL TYPED EXTRACTION CONTRACT
//
// Layers covered by this contract:
//   Layer 1 — Document Classification
//   Layer 2 — Entity Extraction   (Homeowner / Property / Contractor / Salesperson)
//   Layer 3 — Quote Facts          (Metadata / Pricing / Payment / Line Items /
//                                    Products / Scope / Warranties / Terms)
//
// Layers 4 (Derived Analysis) and 5 (User Context / UI) are OUT OF SCOPE.
//
// GUIDING PRINCIPLE
//   AI extracts observable evidence.
//   Deterministic logic (in a later sprint) interprets that evidence.
//   The AI MUST NOT judge fairness, legality, quality, or grade.
//
// Zero external dependencies. Safe for Deno + Node.js.
// ═══════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────
// Global Fact Envelope
// ───────────────────────────────────────────────────────────────────────────

/**
 * Provenance of an extracted fact.
 *
 * `page` is 1-indexed when the source document is paginated.
 * `text` is a short verbatim snippet of the supporting text (max ~240 chars).
 * `location_hint` is a coarse positional hint (e.g. "top-right header",
 * "line item 3", "payment schedule table").
 */
export interface FactEvidence {
  page: number | null;
  text: string | null;
  location_hint: string | null;
}

/**
 * Fact status semantics — DO NOT collapse `not_found` into `false`.
 *
 *   "found"       — Information was located in the document.
 *                   `value` MUST be non-null.
 *                   `confidence` reflects extraction confidence.
 *   "not_found"   — Information was NOT located in the document.
 *                   `value` MUST be null.
 *                   Does NOT mean the fact is false, absent, illegal, or bad.
 *   "uncertain"   — A candidate may exist but cannot be confidently asserted.
 *                   `value` MAY be a candidate or null.
 *                   `confidence` MUST reflect the uncertainty.
 */
export type FactStatus = "found" | "not_found" | "uncertain";

/**
 * Envelope for every important extracted fact.
 *
 * `confidence` is a normalized real number in the closed interval [0.0, 1.0].
 * UI thresholds are intentionally NOT defined by this contract.
 */
export interface ExtractedFact<T> {
  status: FactStatus;
  value: T | null;
  confidence: number;
  evidence: FactEvidence[];
}

// ───────────────────────────────────────────────────────────────────────────
// Layer 1 — Document Classification
// ───────────────────────────────────────────────────────────────────────────

export type DocumentType =
  | "quote"
  | "estimate"
  | "contract"
  | "proposal"
  | "invoice_receipt"
  | "unrelated"
  | "unreadable"
  | "unsupported";

export type Readability =
  | "excellent"
  | "good"
  | "partial"
  | "poor"
  | "unreadable";

export interface DocumentClassification {
  /** Canonical document type — MUST NOT be collapsed to a boolean. */
  document_type: DocumentType;
  /** Confidence of the classification itself, in [0.0, 1.0]. */
  classification_confidence: number;
  /** Deterministic readability bucket. */
  readability: Readability;
  /** Total pages detected in the source document. `null` if unknown. */
  page_count: number | null;
  /**
   * Whether this document is currently supported for downstream quote analysis
   * by the vNext contract. Deterministic; not a subjective quality judgement.
   */
  is_supported_for_quote_analysis: boolean;
  /**
   * Short human-readable reason for the classification decision.
   * Never a legal/quality judgement.
   */
  classification_reason: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Layer 2 — Entities
// ───────────────────────────────────────────────────────────────────────────
//
// ENTITY SEPARATION LAW
//   Each entity is an independent candidate space.
//   The scanner MUST NEVER assume "first phone found" = homeowner phone,
//   "first email found" = homeowner email, or similar structural collapses.
//
// PHONE / EMAIL / ADDRESS SEMANTICS
//   These are *extracted* candidates from the document only.
//   They are NOT verified. They MUST NOT be treated as OTP-confirmed
//   or consent-granted communication targets.
// ───────────────────────────────────────────────────────────────────────────

/**
 * A phone-number candidate captured from the document.
 *
 * `raw_value` preserves the original textual representation.
 * `normalized_candidate` is an optional E.164-style normalization
 *   attempted by the extractor. It is NOT authoritative — no verification.
 *
 * Explicit non-fields (intentionally absent, reserved for later sprints):
 *   - confirmed_phone
 *   - phone_verification_status
 *   - communication_consent
 */
export interface PhoneCandidate {
  raw_value: string;
  normalized_candidate: string | null;
}

/**
 * A postal address candidate captured from the document.
 * All parts are optional — some documents only provide a partial address.
 */
export interface AddressCandidate {
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  /** Reconstructed single-line form when the extractor can produce one. */
  full_address: string | null;
}

export interface HomeownerEntity {
  name: ExtractedFact<string>;
  email: ExtractedFact<string>;
  phone: ExtractedFact<PhoneCandidate>;
  mailing_address: ExtractedFact<AddressCandidate>;
}

/**
 * Property / project location — the site the work will be performed at.
 * Frequently but not always equal to the homeowner's mailing address.
 */
export interface PropertyEntity {
  address: ExtractedFact<AddressCandidate>;
}

export interface ContractorEntity {
  company_name: ExtractedFact<string>;
  license_number: ExtractedFact<string>;
  address: ExtractedFact<AddressCandidate>;
  phone: ExtractedFact<PhoneCandidate>;
  email: ExtractedFact<string>;
  website: ExtractedFact<string>;
}

export interface SalespersonEntity {
  name: ExtractedFact<string>;
  phone: ExtractedFact<PhoneCandidate>;
  email: ExtractedFact<string>;
}

export interface EntitySet {
  homeowner: HomeownerEntity;
  property: PropertyEntity;
  contractor: ContractorEntity;
  salesperson: SalespersonEntity;
}

// ───────────────────────────────────────────────────────────────────────────
// Layer 3 — Quote Facts
// ───────────────────────────────────────────────────────────────────────────

/**
 * A deterministic monetary amount.
 * Canonical values MUST be numeric — never the *only* representation being
 * a formatted currency string. `formatted` is retained for provenance.
 */
export interface MoneyAmount {
  /** Numeric value in the smallest full unit of `currency` (e.g. dollars). */
  value: number;
  /** ISO-4217 code (e.g. "USD"). May be null if the doc omits currency. */
  currency: string | null;
  /** Original formatted representation as it appeared in the document. */
  formatted: string | null;
}

// ── A. Document / Commercial Metadata ──────────────────────────────────────

export interface QuoteMetadata {
  quote_number: ExtractedFact<string>;
  quote_date: ExtractedFact<string>;       // ISO-8601 (YYYY-MM-DD) when parseable
  expiration_date: ExtractedFact<string>;  // ISO-8601 (YYYY-MM-DD) when parseable
}

export interface PricingFacts {
  currency: ExtractedFact<string>;         // ISO-4217 (e.g. "USD")
  subtotal: ExtractedFact<MoneyAmount>;
  discounts: ExtractedFact<MoneyAmount>;
  taxes: ExtractedFact<MoneyAmount>;
  total_price: ExtractedFact<MoneyAmount>;
}

// ── B. Payment / Financing ─────────────────────────────────────────────────

/**
 * A single milestone in a payment schedule.
 *
 * PAYMENT SCHEDULE REQUIREMENT
 *   The schedule as a whole is an *array* — never reduced to a boolean.
 *   Fields inside a milestone may themselves be null if the document is silent.
 */
export interface PaymentMilestone {
  /** Short label as written in the doc, e.g. "Deposit", "At install start". */
  label: string | null;
  /** Milestone trigger, e.g. "signing", "delivery", "final inspection". */
  trigger_or_milestone: string | null;
  amount: MoneyAmount | null;
  /** Percentage of total, 0..100. Null if not stated. */
  percentage: number | null;
  /** Free-form timing string (e.g. "Net 30", "Due 2026-08-01"). */
  due_date_or_timing: string | null;
  evidence: FactEvidence[];
}

export interface PaymentFacts {
  deposit_amount: ExtractedFact<MoneyAmount>;
  /** 0..100, or null. */
  deposit_percentage: ExtractedFact<number>;
  /** Whether financing is offered per the document's own statements. */
  financing_offered: ExtractedFact<boolean>;
  financing_provider: ExtractedFact<string>;
  financing_terms: ExtractedFact<string>;
  /**
   * Ordered array of milestones as written.
   * Empty array is valid ONLY when explicitly no schedule is present.
   * Prefer status=`not_found` on the enclosing schedule when absent.
   */
  payment_schedule: ExtractedFact<PaymentMilestone[]>;
}

// ── C. Openings / Line Items ───────────────────────────────────────────────

export interface DimensionValue {
  /** Numeric value in `unit`. Null if only qualitatively described. */
  value: number | null;
  /** e.g. "in", "ft", "mm". Null if unstated. */
  unit: string | null;
}

/**
 * One line item as it appears in the document.
 *
 * FALLBACK RULE — Individual line items MUST NOT be fabricated. If reliable
 * per-item extraction is impossible, use `line_items_aggregate_only` on
 * QuoteFacts and leave `line_items` empty.
 */
export interface QuoteLineItem {
  line_item_id: string | null;
  description: string | null;
  quantity: number | null;
  opening_location: string | null;
  product_type: string | null;
  width: DimensionValue | null;
  height: DimensionValue | null;
  manufacturer: string | null;
  brand: string | null;
  series: string | null;
  model: string | null;
  unit_price: MoneyAmount | null;
  extended_price: MoneyAmount | null;
  evidence: FactEvidence[];
}

// ── D. Product / Performance Facts ─────────────────────────────────────────
//
// Facts represent EXPLICIT STATEMENTS in the document. The extractor MUST
// NOT infer performance claims that are not written.
// ───────────────────────────────────────────────────────────────────────────

export interface ProductFacts {
  noa_identifier: ExtractedFact<string>;
  florida_approval_identifier: ExtractedFact<string>;
  dp_rating: ExtractedFact<string>;
  impact_designation: ExtractedFact<string>;
  glass_package: ExtractedFact<string>;
  low_e: ExtractedFact<boolean>;
  argon: ExtractedFact<boolean>;
  tint: ExtractedFact<string>;
  glass_makeup: ExtractedFact<string>;
  frame_material: ExtractedFact<string>;
}

// ── E. Scope Facts ─────────────────────────────────────────────────────────
//
// Every scope fact preserves found / not_found / uncertain semantics.
// Absence MUST NOT be represented as `false`.
// ───────────────────────────────────────────────────────────────────────────

export interface ScopeFacts {
  installation: ExtractedFact<string>;
  removal: ExtractedFact<string>;
  disposal: ExtractedFact<string>;
  permits: ExtractedFact<string>;
  engineering: ExtractedFact<string>;
  inspection: ExtractedFact<string>;
  remeasure: ExtractedFact<string>;
  waterproofing: ExtractedFact<string>;
  sealant: ExtractedFact<string>;
  anchoring: ExtractedFact<string>;
  stucco_repair: ExtractedFact<string>;
  drywall_repair: ExtractedFact<string>;
  paint_repair: ExtractedFact<string>;
  cleanup: ExtractedFact<string>;
  change_orders: ExtractedFact<string>;
}

// ── F. Warranty / Contract Terms ───────────────────────────────────────────

export interface WarrantyFacts {
  labor_warranty: ExtractedFact<string>;
  product_warranty: ExtractedFact<string>;
  glass_warranty: ExtractedFact<string>;
}

export interface ContractTerms {
  service_process: ExtractedFact<string>;
  cancellation_terms: ExtractedFact<string>;
  change_order_terms: ExtractedFact<string>;
  exclusions: ExtractedFact<string>;
  estimated_timeline: ExtractedFact<string>;
}

// ───────────────────────────────────────────────────────────────────────────
// Quote Aggregate
// ───────────────────────────────────────────────────────────────────────────

export interface QuoteFacts {
  metadata: QuoteMetadata;
  pricing: PricingFacts;
  payment: PaymentFacts;
  /**
   * When per-item extraction is not reliably possible, this array MUST be
   * empty and `line_items_aggregate_only` MUST be true. Do not invent items.
   */
  line_items: QuoteLineItem[];
  line_items_aggregate_only: boolean;
  /**
   * Total opening count as stated by the document. Independent of
   * `line_items.length` — do not derive one from the other.
   */
  opening_count: ExtractedFact<number>;
  products: ProductFacts;
  scope: ScopeFacts;
  warranties: WarrantyFacts;
  terms: ContractTerms;
}

// ───────────────────────────────────────────────────────────────────────────
// Extraction Meta
// ───────────────────────────────────────────────────────────────────────────

export interface ExtractionMeta {
  /** Overall extractor self-assessed confidence, in [0.0, 1.0]. */
  extraction_confidence: number;
  /**
   * Extractor-emitted warnings ABOUT the extraction process itself
   * (e.g. "page 3 unreadable"). Never a legal or quality judgement.
   */
  warnings: string[];
}

// ───────────────────────────────────────────────────────────────────────────
// Root
// ───────────────────────────────────────────────────────────────────────────

export interface CanonicalExtractionV1 {
  /** Pinned to CANONICAL_CONTRACT_VERSION at emission time. */
  contract_version: string;
  classification: DocumentClassification;
  entities: EntitySet;
  quote: QuoteFacts;
  extraction_meta: ExtractionMeta;
}
