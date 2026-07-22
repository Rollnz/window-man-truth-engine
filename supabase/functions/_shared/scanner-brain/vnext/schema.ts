// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — STRICT JSON SCHEMA (Sprint 04A)
//
// STRICTNESS RULES
//   - `additionalProperties: false` everywhere.
//   - All object properties are enumerated in `required`.
//   - Nullability is deliberate (`type: [..., "null"]`).
//   - Enums are exhaustive.
//   - Confidence values are numbers constrained to [0, 1].
//   - Numeric facts intentionally do NOT enforce business ranges (e.g. no
//     0..100 cap on deposit_percentage) so that Layer 3 preserves anomalies
//     for Layer 4 to evaluate.
// ═══════════════════════════════════════════════════════════════════════════

import { CANONICAL_CONTRACT_VERSION } from "./constants.ts";

const factEvidence = {
  type: "object",
  additionalProperties: false,
  required: ["page", "text", "location_hint"],
  properties: {
    page: { type: ["integer", "null"], minimum: 1 },
    text: { type: ["string", "null"], maxLength: 240 },
    location_hint: { type: ["string", "null"], maxLength: 120 },
  },
} as const;

const factStatusEnum = {
  type: "string",
  enum: ["found", "not_found", "uncertain"],
} as const;

const confidence = { type: "number", minimum: 0, maximum: 1 } as const;

function factOf<T extends object>(valueSchema: T | { type: string | string[] }) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["status", "value", "confidence", "evidence"],
    properties: {
      status: factStatusEnum,
      value: valueSchema,
      confidence,
      evidence: { type: "array", items: factEvidence },
    },
  } as const;
}

// ── Value schemas ─────────────────────────────────────────────────────────

const nullableString = { type: ["string", "null"] } as const;
const nullableNumber = { type: ["number", "null"] } as const;
const nullableInt = { type: ["integer", "null"] } as const;
const nullableBool = { type: ["boolean", "null"] } as const;

const moneyAmount = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["value", "currency", "formatted"],
  properties: {
    value: { type: "number" },
    currency: { type: ["string", "null"], maxLength: 8 },
    formatted: { type: ["string", "null"], maxLength: 40 },
  },
} as const;

const phoneCandidate = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["raw_value", "context_hint"],
  properties: {
    raw_value: { type: "string", maxLength: 64 },
    context_hint: { type: ["string", "null"], maxLength: 64 },
  },
} as const;

const addressCandidate = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["street_address", "city", "state", "zip", "raw_display_address"],
  properties: {
    street_address: nullableString,
    city: nullableString,
    state: nullableString,
    zip: nullableString,
    raw_display_address: nullableString,
  },
} as const;

const dimensionValue = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["value", "unit"],
  properties: {
    value: nullableNumber,
    unit: nullableString,
  },
} as const;

const paymentMilestone = {
  type: "object",
  additionalProperties: false,
  required: [
    "label",
    "trigger_or_milestone",
    "amount",
    "percentage",
    "due_date_or_timing",
    "confidence",
    "evidence",
  ],
  properties: {
    label: nullableString,
    trigger_or_milestone: nullableString,
    amount: moneyAmount,
    // Anomalies preserved: no 0..100 bound. Must be finite when non-null.
    percentage: nullableNumber,
    due_date_or_timing: nullableString,
    confidence,
    evidence: { type: "array", items: factEvidence },
  },
} as const;

const quoteLineItem = {
  type: "object",
  additionalProperties: false,
  required: [
    "line_item_id",
    "description",
    "quantity",
    "opening_location",
    "product_type",
    "width",
    "height",
    "manufacturer",
    "brand",
    "series",
    "model",
    "unit_price",
    "extended_price",
    "product_configuration_id",
    "confidence",
    "evidence",
  ],
  properties: {
    line_item_id: { type: ["string", "null"], minLength: 1, maxLength: 64 },
    description: nullableString,
    quantity: nullableInt,
    opening_location: nullableString,
    product_type: nullableString,
    width: dimensionValue,
    height: dimensionValue,
    manufacturer: nullableString,
    brand: nullableString,
    series: nullableString,
    model: nullableString,
    unit_price: moneyAmount,
    extended_price: moneyAmount,
    product_configuration_id: nullableString,
    confidence,
    evidence: { type: "array", items: factEvidence },
  },
} as const;

const productConfiguration = {
  type: "object",
  additionalProperties: false,
  required: [
    "product_configuration_id",
    "manufacturer",
    "brand",
    "series",
    "model",
    "noa_identifier",
    "florida_approval_identifier",
    "dp_rating",
    "impact_designation",
    "glass_package",
    "low_e",
    "argon",
    "tint",
    "glass_makeup",
    "frame_material",
    "applies_to_line_item_ids",
    "confidence",
    "evidence",
  ],
  properties: {
    product_configuration_id: { type: "string", maxLength: 64 },
    manufacturer: nullableString,
    brand: nullableString,
    series: nullableString,
    model: nullableString,
    noa_identifier: nullableString,
    florida_approval_identifier: nullableString,
    dp_rating: nullableString,
    impact_designation: nullableString,
    glass_package: nullableString,
    low_e: nullableBool,
    argon: nullableBool,
    tint: nullableString,
    glass_makeup: nullableString,
    frame_material: nullableString,
    applies_to_line_item_ids: {
      type: "array",
      items: { type: "string", maxLength: 64 },
    },
    confidence,
    evidence: { type: "array", items: factEvidence },
  },
} as const;

// ── Layer 1 ────────────────────────────────────────────────────────────────

const documentClassification = {
  type: "object",
  additionalProperties: false,
  required: [
    "document_type",
    "classification_confidence",
    "readability",
    "page_count",
    "classification_reason",
  ],
  properties: {
    document_type: {
      type: "string",
      enum: [
        "quote",
        "estimate",
        "contract",
        "proposal",
        "invoice_receipt",
        "unrelated",
        "unreadable",
        "unsupported",
      ],
    },
    classification_confidence: confidence,
    readability: {
      type: "string",
      enum: ["excellent", "good", "partial", "poor", "unreadable"],
    },
    page_count: { type: ["integer", "null"], minimum: 1 },
    classification_reason: { type: "string", maxLength: 500 },
  },
} as const;

// ── Layer 2 — Entities ─────────────────────────────────────────────────────

const homeowner = {
  type: "object",
  additionalProperties: false,
  required: ["name", "email", "phone", "mailing_address"],
  properties: {
    name: factOf(nullableString),
    email: factOf(nullableString),
    phone: factOf(phoneCandidate),
    mailing_address: factOf(addressCandidate),
  },
} as const;

const property = {
  type: "object",
  additionalProperties: false,
  required: ["address"],
  properties: { address: factOf(addressCandidate) },
} as const;

const contractor = {
  type: "object",
  additionalProperties: false,
  required: ["company_name", "license_number", "address", "phone", "email", "website"],
  properties: {
    company_name: factOf(nullableString),
    license_number: factOf(nullableString),
    address: factOf(addressCandidate),
    phone: factOf(phoneCandidate),
    email: factOf(nullableString),
    website: factOf(nullableString),
  },
} as const;

const salesperson = {
  type: "object",
  additionalProperties: false,
  required: ["name", "phone", "email"],
  properties: {
    name: factOf(nullableString),
    phone: factOf(phoneCandidate),
    email: factOf(nullableString),
  },
} as const;

const entities = {
  type: "object",
  additionalProperties: false,
  required: ["homeowner", "property", "contractor", "salesperson"],
  properties: { homeowner, property, contractor, salesperson },
} as const;

// ── Layer 3 — Quote Facts ──────────────────────────────────────────────────

const quoteMetadata = {
  type: "object",
  additionalProperties: false,
  required: ["quote_number", "quote_date", "expiration_date"],
  properties: {
    quote_number: factOf(nullableString),
    quote_date: factOf(nullableString),
    expiration_date: factOf(nullableString),
  },
} as const;

const pricingFacts = {
  type: "object",
  additionalProperties: false,
  required: ["currency", "subtotal", "discounts", "taxes", "total_price"],
  properties: {
    currency: factOf(nullableString),
    subtotal: factOf(moneyAmount),
    discounts: factOf(moneyAmount),
    taxes: factOf(moneyAmount),
    total_price: factOf(moneyAmount),
  },
} as const;

const paymentFacts = {
  type: "object",
  additionalProperties: false,
  required: [
    "deposit_amount",
    "deposit_percentage",
    "financing_offered",
    "financing_provider",
    "financing_terms",
    "payment_schedule",
  ],
  properties: {
    deposit_amount: factOf(moneyAmount),
    // Anomaly-preserving: numeric-only, no 0..100 cap.
    deposit_percentage: factOf(nullableNumber),
    financing_offered: factOf(nullableBool),
    financing_provider: factOf(nullableString),
    financing_terms: factOf(nullableString),
    payment_schedule: factOf({
      type: ["array", "null"],
      items: paymentMilestone,
    }),
  },
} as const;

const scopeFacts = {
  type: "object",
  additionalProperties: false,
  required: [
    "installation",
    "removal",
    "disposal",
    "permits",
    "engineering",
    "inspection",
    "remeasure",
    "waterproofing",
    "sealant",
    "anchoring",
    "stucco_repair",
    "drywall_repair",
    "paint_repair",
    "cleanup",
    "change_orders",
  ],
  properties: {
    installation: factOf(nullableString),
    removal: factOf(nullableString),
    disposal: factOf(nullableString),
    permits: factOf(nullableString),
    engineering: factOf(nullableString),
    inspection: factOf(nullableString),
    remeasure: factOf(nullableString),
    waterproofing: factOf(nullableString),
    sealant: factOf(nullableString),
    anchoring: factOf(nullableString),
    stucco_repair: factOf(nullableString),
    drywall_repair: factOf(nullableString),
    paint_repair: factOf(nullableString),
    cleanup: factOf(nullableString),
    change_orders: factOf(nullableString),
  },
} as const;

const warrantyFacts = {
  type: "object",
  additionalProperties: false,
  required: ["labor_warranty", "product_warranty", "glass_warranty"],
  properties: {
    labor_warranty: factOf(nullableString),
    product_warranty: factOf(nullableString),
    glass_warranty: factOf(nullableString),
  },
} as const;

const contractTerms = {
  type: "object",
  additionalProperties: false,
  required: [
    "service_process",
    "cancellation_terms",
    "change_order_terms",
    "exclusions",
    "estimated_timeline",
  ],
  properties: {
    service_process: factOf(nullableString),
    cancellation_terms: factOf(nullableString),
    change_order_terms: factOf(nullableString),
    exclusions: factOf(nullableString),
    estimated_timeline: factOf(nullableString),
  },
} as const;

const quoteFacts = {
  type: "object",
  additionalProperties: false,
  required: [
    "metadata",
    "pricing",
    "payment",
    "line_items",
    "line_items_aggregate_only",
    "opening_count",
    "product_configurations",
    "scope",
    "warranties",
    "terms",
  ],
  properties: {
    metadata: quoteMetadata,
    pricing: pricingFacts,
    payment: paymentFacts,
    line_items: { type: "array", items: quoteLineItem },
    line_items_aggregate_only: { type: "boolean" },
    opening_count: factOf(nullableInt),
    product_configurations: { type: "array", items: productConfiguration },
    scope: scopeFacts,
    warranties: warrantyFacts,
    terms: contractTerms,
  },
} as const;

const extractionMeta = {
  type: "object",
  additionalProperties: false,
  required: ["extraction_confidence", "warnings"],
  properties: {
    extraction_confidence: confidence,
    warnings: { type: "array", items: { type: "string", maxLength: 500 } },
  },
} as const;

// ───────────────────────────────────────────────────────────────────────────
// Root schema
// ───────────────────────────────────────────────────────────────────────────

export const CanonicalExtractionV1JsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CanonicalExtractionV1",
  description:
    "Scanner-brain vNext canonical extraction contract. Version: " +
    CANONICAL_CONTRACT_VERSION,
  type: "object",
  additionalProperties: false,
  required: [
    "contract_version",
    "classification",
    "entities",
    "quote",
    "extraction_meta",
  ],
  properties: {
    contract_version: {
      type: "string",
      const: CANONICAL_CONTRACT_VERSION,
    },
    classification: documentClassification,
    entities,
    quote: quoteFacts,
    extraction_meta: extractionMeta,
  },
} as const;
