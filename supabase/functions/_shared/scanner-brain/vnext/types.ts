// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — CANONICAL TYPED EXTRACTION CONTRACT (Sprint 04A)
//
// Layers covered by this contract:
//   Layer 1 — Document Classification
//   Layer 2 — Entity Extraction   (Homeowner / Property / Contractor / Salesperson)
//   Layer 3 — Quote Facts          (Metadata / Pricing / Payment / Line Items /
//                                    Product Configurations / Scope / Warranties / Terms)
//
// Layers 4 (Derived Analysis) and 5 (User Context / UI) are OUT OF SCOPE.
//
// GUIDING PRINCIPLE — EXTRACTION FIDELITY vs BUSINESS VALIDITY
//   Layer 3 records what the document literally says. It does NOT judge
//   whether values are plausible, legal, fair, or good. Anomalies (e.g. a
//   120% deposit, a negative total, mixed currencies) are preserved
//   verbatim; deterministic Layer 4 later flags them.
//
// AI-AUTHORED vs DETERMINISTIC
//   The AI authors only observable facts + evidence. It MUST NOT be asked
//   to normalize phone numbers, reconstruct addresses, decide analysis
//   eligibility, or reconcile currency conflicts. Those belong to
//   deterministic post-processing.
//
// Zero external dependencies. Safe for Deno + Node.js.
// ═══════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────
// Global Fact Envelope
// ───────────────────────────────────────────────────────────────────────────

export interface FactEvidence {
  page: number | null;
  text: string | null;
  location_hint: string | null;
}

export type FactStatus = "found" | "not_found" | "uncertain";

/**
 * Envelope for every important top-level extracted fact.
 * Note: repeated structured records (line items, payment milestones, product
 * configurations) use a compact record-level {confidence, evidence} rather
 * than wrapping every inner field in this envelope. See README.
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

/**
 * AI-authored classification only.
 *
 * REMOVED (relative to Sprint 04): `is_supported_for_quote_analysis`.
 * Analysis eligibility is a deterministic downstream decision derived from
 * `document_type` + `readability`; the AI MUST NOT decide runtime routing.
 */
export interface DocumentClassification {
  document_type: DocumentType;
  classification_confidence: number;
  readability: Readability;
  page_count: number | null;
  classification_reason: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Layer 2 — Entities
// ───────────────────────────────────────────────────────────────────────────

/**
 * A phone-number candidate captured verbatim from the document.
 *
 * The AI MUST NOT attempt E.164 normalization; that is a deterministic
 * post-processing concern. An optional `context_hint` may capture context
 * explicitly present next to the number (e.g. "office", "cell", "US").
 */
export interface PhoneCandidate {
  raw_value: string;
  context_hint: string | null;
}

/**
 * A postal address candidate captured from the document.
 *
 * `raw_display_address` is preserved ONLY when the source document itself
 * prints a complete single-line address. It MUST NOT be reconstructed by
 * the AI from the components; reconstruction is deterministic.
 */
export interface AddressCandidate {
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  raw_display_address: string | null;
}

export interface HomeownerEntity {
  name: ExtractedFact<string>;
  email: ExtractedFact<string>;
  phone: ExtractedFact<PhoneCandidate>;
  mailing_address: ExtractedFact<AddressCandidate>;
}

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

export interface MoneyAmount {
  /** Numeric value in units of `currency`. May be negative or unusual —
   *  Layer 3 preserves what the document states. */
  value: number;
  currency: string | null;
  formatted: string | null;
}

// ── A. Document / Commercial Metadata ──────────────────────────────────────

export interface QuoteMetadata {
  quote_number: ExtractedFact<string>;
  quote_date: ExtractedFact<string>;
  expiration_date: ExtractedFact<string>;
}

export interface PricingFacts {
  currency: ExtractedFact<string>;
  subtotal: ExtractedFact<MoneyAmount>;
  discounts: ExtractedFact<MoneyAmount>;
  taxes: ExtractedFact<MoneyAmount>;
  total_price: ExtractedFact<MoneyAmount>;
}

// ── B. Payment / Financing ─────────────────────────────────────────────────

/**
 * A single milestone in a payment schedule (repeated-record shape).
 *
 * Percentage MAY exceed 100 if the document literally states so; Layer 4
 * evaluates plausibility. When numeric, it MUST be finite.
 */
export interface PaymentMilestone {
  label: string | null;
  trigger_or_milestone: string | null;
  amount: MoneyAmount | null;
  percentage: number | null;
  due_date_or_timing: string | null;
  confidence: number;
  evidence: FactEvidence[];
}

export interface PaymentFacts {
  deposit_amount: ExtractedFact<MoneyAmount>;
  /** May be any finite number; anomalies (e.g. 120) preserved for Layer 4. */
  deposit_percentage: ExtractedFact<number>;
  financing_offered: ExtractedFact<boolean>;
  financing_provider: ExtractedFact<string>;
  financing_terms: ExtractedFact<string>;
  payment_schedule: ExtractedFact<PaymentMilestone[]>;
}

// ── C. Openings / Line Items ───────────────────────────────────────────────

export interface DimensionValue {
  value: number | null;
  unit: string | null;
}

/**
 * One line item as it appears in the document (repeated-record shape).
 *
 * FALLBACK RULE — Line items MUST NOT be fabricated. If reliable per-item
 * extraction is impossible, leave `line_items` empty and set
 * `line_items_aggregate_only=true`. Aggregate-only does NOT imply
 * `opening_count` is known.
 *
 * `product_configuration_id` associates this item with one entry in
 * `product_configurations[]` when the association is unambiguous. If the
 * association is uncertain, leave it null and let the configuration point
 * back via `applies_to_line_item_ids`.
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
  product_configuration_id: string | null;
  confidence: number;
  evidence: FactEvidence[];
}

// ── D. Product / Performance Configurations ────────────────────────────────
//
// A quote may bundle multiple product configurations (e.g. PGT WinGuard 5500
// single-hungs + separate sliding-glass-doors). A single global product
// spec CANNOT faithfully represent this. `product_configurations` is a
// plural array; each entry is a repeated-record with its own confidence
// and evidence. Associations to line items are captured explicitly on
// either side; the AI MUST NOT fabricate an association.
// ───────────────────────────────────────────────────────────────────────────

export interface ProductConfiguration {
  product_configuration_id: string;

  manufacturer: string | null;
  brand: string | null;
  series: string | null;
  model: string | null;

  noa_identifier: string | null;
  florida_approval_identifier: string | null;
  dp_rating: string | null;
  impact_designation: string | null;

  glass_package: string | null;
  low_e: boolean | null;
  argon: boolean | null;
  tint: string | null;
  glass_makeup: string | null;
  frame_material: string | null;

  /** Line-item IDs this configuration explicitly applies to. May be empty. */
  applies_to_line_item_ids: string[];

  confidence: number;
  evidence: FactEvidence[];
}

// ── E. Scope Facts ─────────────────────────────────────────────────────────

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
  line_items: QuoteLineItem[];
  line_items_aggregate_only: boolean;
  opening_count: ExtractedFact<number>;
  /** Plural — a quote may contain multiple distinct product configurations. */
  product_configurations: ProductConfiguration[];
  scope: ScopeFacts;
  warranties: WarrantyFacts;
  terms: ContractTerms;
}

// ───────────────────────────────────────────────────────────────────────────
// Extraction Meta
// ───────────────────────────────────────────────────────────────────────────

export interface ExtractionMeta {
  extraction_confidence: number;
  warnings: string[];
}

// ───────────────────────────────────────────────────────────────────────────
// Root
// ───────────────────────────────────────────────────────────────────────────

export interface CanonicalExtractionV1 {
  contract_version: string;
  classification: DocumentClassification;
  entities: EntitySet;
  quote: QuoteFacts;
  extraction_meta: ExtractionMeta;
}

// Deprecated alias — retained as a type export for consumers that referenced
// ProductFacts. New code MUST use `ProductConfiguration[]`.
export type ProductFacts = never;
