// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — NON-PII FIXTURES (Sprint 04A)
//
// All PII is fabricated (example.com domains, 555-01xx phone numbers reserved
// for fiction, placeholder street numbers). Do NOT paste real customer data.
// ═══════════════════════════════════════════════════════════════════════════

import { CANONICAL_CONTRACT_VERSION } from "./constants.ts";
import type {
  CanonicalExtractionV1,
  ExtractedFact,
  FactEvidence,
  PaymentMilestone,
  ProductConfiguration,
  QuoteLineItem,
} from "./types.ts";

// ── helpers ────────────────────────────────────────────────────────────────

function found<T>(value: T, confidence = 0.9, ev: FactEvidence[] = []): ExtractedFact<T> {
  return { status: "found", value, confidence, evidence: ev };
}
function notFound<T>(confidence = 0.9): ExtractedFact<T> {
  return { status: "not_found", value: null, confidence, evidence: [] };
}
function uncertain<T>(value: T | null = null, confidence = 0.4): ExtractedFact<T> {
  return { status: "uncertain", value, confidence, evidence: [] };
}
const evAt = (page: number, text: string, hint: string): FactEvidence => ({
  page, text, location_hint: hint,
});

const emptyScope = {
  installation: notFound<string>(),
  removal: notFound<string>(),
  disposal: notFound<string>(),
  permits: notFound<string>(),
  engineering: notFound<string>(),
  inspection: notFound<string>(),
  remeasure: notFound<string>(),
  waterproofing: notFound<string>(),
  sealant: notFound<string>(),
  anchoring: notFound<string>(),
  stucco_repair: notFound<string>(),
  drywall_repair: notFound<string>(),
  paint_repair: notFound<string>(),
  cleanup: notFound<string>(),
  change_orders: notFound<string>(),
};

const emptyWarranties = {
  labor_warranty: notFound<string>(),
  product_warranty: notFound<string>(),
  glass_warranty: notFound<string>(),
};

const emptyTerms = {
  service_process: notFound<string>(),
  cancellation_terms: notFound<string>(),
  change_order_terms: notFound<string>(),
  exclusions: notFound<string>(),
  estimated_timeline: notFound<string>(),
};

// ── Fixture A — Well-structured quote ─────────────────────────────────────
export const fixtureA_wellStructuredQuote: CanonicalExtractionV1 = {
  contract_version: CANONICAL_CONTRACT_VERSION,
  classification: {
    document_type: "quote",
    classification_confidence: 0.98,
    readability: "excellent",
    page_count: 3,
    classification_reason: "Standard quote layout with itemized pricing and terms.",
  },
  entities: {
    homeowner: {
      name: found("Alex Sample", 0.95, [evAt(1, "Prepared for Alex Sample", "header")]),
      email: found("alex@example.com", 0.9),
      phone: found({ raw_value: "(555) 010-1234", context_hint: "cell" }, 0.9),
      mailing_address: found({
        street_address: "100 Placeholder Ln",
        city: "Testville",
        state: "FL",
        zip: "33101",
        raw_display_address: "100 Placeholder Ln, Testville, FL 33101",
      }, 0.9),
    },
    property: {
      address: found({
        street_address: "100 Placeholder Ln",
        city: "Testville",
        state: "FL",
        zip: "33101",
        raw_display_address: "100 Placeholder Ln, Testville, FL 33101",
      }, 0.9),
    },
    contractor: {
      company_name: found("Acme Windows Co", 0.99, [evAt(1, "Acme Windows Co", "logo header")]),
      license_number: found("CGC1500000", 0.95),
      address: found({
        street_address: "500 Business Pkwy",
        city: "Testville",
        state: "FL",
        zip: "33101",
        raw_display_address: "500 Business Pkwy, Testville, FL 33101",
      }),
      phone: found({ raw_value: "555-010-9999", context_hint: "office" }),
      email: found("sales@acmewindows.example"),
      website: found("https://acmewindows.example"),
    },
    salesperson: {
      name: found("Sam Rep", 0.85),
      phone: found({ raw_value: "555-010-4444", context_hint: null }),
      email: found("sam@acmewindows.example"),
    },
  },
  quote: {
    metadata: {
      quote_number: found("Q-2026-0001"),
      quote_date: found("2026-07-22"),
      expiration_date: found("2026-08-22"),
    },
    pricing: {
      currency: found("USD"),
      subtotal: found({ value: 12000, currency: "USD", formatted: "$12,000.00" }),
      discounts: found({ value: 500, currency: "USD", formatted: "$500.00" }),
      taxes: found({ value: 805, currency: "USD", formatted: "$805.00" }),
      total_price: found({ value: 12305, currency: "USD", formatted: "$12,305.00" }, 0.98, [
        evAt(2, "Total: $12,305.00", "totals table"),
      ]),
    },
    payment: {
      deposit_amount: found({ value: 3000, currency: "USD", formatted: "$3,000.00" }),
      deposit_percentage: found(25),
      financing_offered: found(true),
      financing_provider: found("Example Financing LLC"),
      financing_terms: found("0% APR for 12 months"),
      payment_schedule: found<PaymentMilestone[]>([
        {
          label: "Deposit",
          trigger_or_milestone: "at signing",
          amount: { value: 3000, currency: "USD", formatted: "$3,000.00" },
          percentage: 25,
          due_date_or_timing: "at signing",
          confidence: 0.9,
          evidence: [evAt(3, "Deposit due at signing", "payment schedule")],
        },
        {
          label: "Progress",
          trigger_or_milestone: "at install start",
          amount: { value: 6000, currency: "USD", formatted: "$6,000.00" },
          percentage: 50,
          due_date_or_timing: "at install start",
          confidence: 0.8,
          evidence: [],
        },
        {
          label: "Final",
          trigger_or_milestone: "final inspection",
          amount: { value: 3305, currency: "USD", formatted: "$3,305.00" },
          percentage: 25,
          due_date_or_timing: "final inspection",
          confidence: 0.8,
          evidence: [],
        },
      ]),
    },
    line_items: [
      {
        line_item_id: "1",
        description: "SGD (Sliding Glass Door)",
        quantity: 1,
        opening_location: "living room",
        product_type: "sliding_glass_door",
        width: { value: 72, unit: "in" },
        height: { value: 80, unit: "in" },
        manufacturer: "PGT",
        brand: "WinGuard",
        series: "5400",
        model: "SGD-5410",
        unit_price: { value: 4500, currency: "USD", formatted: "$4,500.00" },
        extended_price: { value: 4500, currency: "USD", formatted: "$4,500.00" },
        product_configuration_id: "pc1",
        confidence: 0.9,
        evidence: [evAt(2, "1 SGD 72x80 WinGuard 5400", "line items")],
      },
      {
        line_item_id: "2",
        description: "Single hung window",
        quantity: 4,
        opening_location: "bedrooms",
        product_type: "single_hung",
        width: { value: 36, unit: "in" },
        height: { value: 60, unit: "in" },
        manufacturer: "PGT",
        brand: "WinGuard",
        series: "5400",
        model: "SH-5410",
        unit_price: { value: 1500, currency: "USD", formatted: "$1,500.00" },
        extended_price: { value: 6000, currency: "USD", formatted: "$6,000.00" },
        product_configuration_id: "pc1",
        confidence: 0.9,
        evidence: [],
      },
    ],
    line_items_aggregate_only: false,
    opening_count: found(5),
    product_configurations: [
      {
        product_configuration_id: "pc1",
        manufacturer: "PGT",
        brand: "WinGuard",
        series: "5400",
        model: null,
        noa_identifier: "NOA 20-0101.01",
        florida_approval_identifier: null,
        dp_rating: "DP50",
        impact_designation: "Large Missile Impact",
        glass_package: "Laminated IGU",
        low_e: true,
        argon: true,
        tint: null,
        glass_makeup: "1/8 SB70 + .090 PVB + 1/8 clear",
        frame_material: "aluminum",
        applies_to_line_item_ids: ["1", "2"],
        confidence: 0.9,
        evidence: [evAt(2, "WinGuard 5400 impact spec", "product specs")],
      },
    ],
    scope: {
      installation: found("Full installation included"),
      removal: found("Existing windows removed and hauled off"),
      disposal: found("All debris hauled off"),
      permits: found("Permits pulled by contractor"),
      engineering: notFound(),
      inspection: found("Final inspection scheduled"),
      remeasure: found("Field remeasure prior to order"),
      waterproofing: notFound(),
      sealant: found("Silicone sealant at perimeter"),
      anchoring: found("Tapcons per manufacturer instructions"),
      stucco_repair: uncertain<string>(null, 0.3),
      drywall_repair: notFound(),
      paint_repair: notFound(),
      cleanup: found("Daily jobsite cleanup"),
      change_orders: found("Written change orders required"),
    },
    warranties: {
      labor_warranty: found("2-year installation labor warranty"),
      product_warranty: found("Lifetime limited product warranty"),
      glass_warranty: found("10-year glass breakage"),
    },
    terms: {
      service_process: found("Scheduling within 8-10 weeks"),
      cancellation_terms: found("3-day right of rescission"),
      change_order_terms: found("Change orders in writing"),
      exclusions: found("Excludes structural repairs"),
      estimated_timeline: found("8-10 weeks from deposit"),
    },
  },
  extraction_meta: { extraction_confidence: 0.92, warnings: [] },
};

// ── Fixture B — Sparse estimate ────────────────────────────────────────────
export const fixtureB_sparseEstimate: CanonicalExtractionV1 = {
  contract_version: CANONICAL_CONTRACT_VERSION,
  classification: {
    document_type: "estimate",
    classification_confidence: 0.85,
    readability: "good",
    page_count: 1,
    classification_reason: "Single-page estimate with total but no itemization.",
  },
  entities: {
    homeowner: {
      name: notFound(), email: notFound(), phone: notFound(), mailing_address: notFound(),
    },
    property: { address: notFound() },
    contractor: {
      company_name: found("Beta Glass Co"),
      license_number: notFound(),
      address: notFound(),
      phone: found({ raw_value: "555-010-2222", context_hint: null }),
      email: notFound(),
      website: notFound(),
    },
    salesperson: { name: notFound(), phone: notFound(), email: notFound() },
  },
  quote: {
    metadata: {
      quote_number: notFound(), quote_date: notFound(), expiration_date: notFound(),
    },
    pricing: {
      currency: found("USD"),
      subtotal: notFound(),
      discounts: notFound(),
      taxes: notFound(),
      total_price: found({ value: 4500, currency: "USD", formatted: "$4,500" }),
    },
    payment: {
      deposit_amount: notFound(),
      deposit_percentage: notFound(),
      financing_offered: notFound(),
      financing_provider: notFound(),
      financing_terms: notFound(),
      payment_schedule: notFound(),
    },
    line_items: [],
    line_items_aggregate_only: true,
    opening_count: uncertain(5, 0.5),
    product_configurations: [],
    scope: emptyScope,
    warranties: emptyWarranties,
    terms: emptyTerms,
  },
  extraction_meta: {
    extraction_confidence: 0.6,
    warnings: ["Document contains no itemization; aggregated total only."],
  },
};

// ── Fixture C — Ambiguous entities (three separate phone contexts) ────────
export const fixtureC_ambiguousEntities: CanonicalExtractionV1 = {
  ...fixtureA_wellStructuredQuote,
  entities: {
    homeowner: {
      ...fixtureA_wellStructuredQuote.entities.homeowner,
      phone: found({ raw_value: "555-010-1111", context_hint: null }),
    },
    property: fixtureA_wellStructuredQuote.entities.property,
    contractor: {
      ...fixtureA_wellStructuredQuote.entities.contractor,
      phone: found({ raw_value: "555-010-2222", context_hint: "office" }),
    },
    salesperson: {
      ...fixtureA_wellStructuredQuote.entities.salesperson,
      phone: found({ raw_value: "555-010-3333", context_hint: "cell" }),
    },
  },
};

// ── Fixture D — Unrelated document ─────────────────────────────────────────
export const fixtureD_unrelated: CanonicalExtractionV1 = {
  contract_version: CANONICAL_CONTRACT_VERSION,
  classification: {
    document_type: "unrelated",
    classification_confidence: 0.97,
    readability: "excellent",
    page_count: 2,
    classification_reason: "Utility bill — not a window quote.",
  },
  entities: {
    homeowner: { name: notFound(), email: notFound(), phone: notFound(), mailing_address: notFound() },
    property: { address: notFound() },
    contractor: {
      company_name: notFound(), license_number: notFound(), address: notFound(),
      phone: notFound(), email: notFound(), website: notFound(),
    },
    salesperson: { name: notFound(), phone: notFound(), email: notFound() },
  },
  quote: {
    metadata: { quote_number: notFound(), quote_date: notFound(), expiration_date: notFound() },
    pricing: {
      currency: notFound(), subtotal: notFound(), discounts: notFound(),
      taxes: notFound(), total_price: notFound(),
    },
    payment: {
      deposit_amount: notFound(), deposit_percentage: notFound(),
      financing_offered: notFound(), financing_provider: notFound(),
      financing_terms: notFound(), payment_schedule: notFound(),
    },
    line_items: [],
    line_items_aggregate_only: true,
    opening_count: notFound(),
    product_configurations: [],
    scope: emptyScope,
    warranties: emptyWarranties,
    terms: emptyTerms,
  },
  extraction_meta: {
    extraction_confidence: 0.9,
    warnings: ["Document classified as unrelated; quote facts intentionally empty."],
  },
};

// ── Fixture E — Unreadable / poor extraction ──────────────────────────────
export const fixtureE_unreadable: CanonicalExtractionV1 = {
  ...fixtureD_unrelated,
  classification: {
    document_type: "unreadable",
    classification_confidence: 0.55,
    readability: "unreadable",
    page_count: null,
    classification_reason: "Photograph of a document is out of focus.",
  },
  extraction_meta: {
    extraction_confidence: 0.2,
    warnings: ["Image blur prevents reliable OCR."],
  },
};

// ── Fixture F — Mixed-product quote (Sprint 04A) ──────────────────────────
//
// Two distinct product configurations (PGT WinGuard single-hungs + a
// different manufacturer's sliding-glass-door), each associated with
// specific line items. Proves one spec is not applied globally.
export const fixtureF_mixedProductQuote: CanonicalExtractionV1 = {
  contract_version: CANONICAL_CONTRACT_VERSION,
  classification: {
    document_type: "quote",
    classification_confidence: 0.95,
    readability: "excellent",
    page_count: 4,
    classification_reason: "Multi-product quote with distinct series per opening group.",
  },
  entities: {
    homeowner: {
      name: found("Jamie Sample", 0.9),
      email: notFound(),
      phone: notFound(),
      mailing_address: notFound(),
    },
    property: { address: notFound() },
    contractor: {
      company_name: found("Multi Product Windows Inc"),
      license_number: found("CGC1600000"),
      address: notFound(),
      phone: notFound(),
      email: notFound(),
      website: notFound(),
    },
    salesperson: { name: notFound(), phone: notFound(), email: notFound() },
  },
  quote: {
    metadata: {
      quote_number: found("Q-MIX-001"),
      quote_date: found("2026-07-22"),
      expiration_date: notFound(),
    },
    pricing: {
      currency: found("USD"),
      subtotal: found({ value: 21000, currency: "USD", formatted: "$21,000" }),
      discounts: notFound(),
      taxes: notFound(),
      total_price: found({ value: 21000, currency: "USD", formatted: "$21,000" }),
    },
    payment: {
      deposit_amount: notFound(),
      deposit_percentage: notFound(),
      financing_offered: notFound(),
      financing_provider: notFound(),
      financing_terms: notFound(),
      payment_schedule: notFound(),
    },
    line_items: [
      {
        line_item_id: "li-sh-01",
        description: "Single hung — bedrooms",
        quantity: 4,
        opening_location: "bedrooms",
        product_type: "single_hung",
        width: { value: 36, unit: "in" },
        height: { value: 60, unit: "in" },
        manufacturer: "PGT",
        brand: "WinGuard",
        series: "5500",
        model: null,
        unit_price: { value: 1500, currency: "USD", formatted: "$1,500" },
        extended_price: { value: 6000, currency: "USD", formatted: "$6,000" },
        product_configuration_id: "pc-pgt-sh",
        confidence: 0.9,
        evidence: [evAt(2, "4x PGT 5500 SH", "line items")],
      },
      {
        line_item_id: "li-sgd-01",
        description: "Sliding glass door — patio",
        quantity: 1,
        opening_location: "patio",
        product_type: "sliding_glass_door",
        width: { value: 96, unit: "in" },
        height: { value: 80, unit: "in" },
        manufacturer: "CGI",
        brand: "Sentinel",
        series: "SGD-540",
        model: null,
        unit_price: { value: 15000, currency: "USD", formatted: "$15,000" },
        extended_price: { value: 15000, currency: "USD", formatted: "$15,000" },
        product_configuration_id: "pc-cgi-sgd",
        confidence: 0.9,
        evidence: [evAt(3, "1x CGI Sentinel SGD-540", "line items")],
      },
    ],
    line_items_aggregate_only: false,
    opening_count: found(5),
    product_configurations: [
      {
        product_configuration_id: "pc-pgt-sh",
        manufacturer: "PGT",
        brand: "WinGuard",
        series: "5500",
        model: null,
        noa_identifier: "NOA 20-0202.02",
        florida_approval_identifier: null,
        dp_rating: "DP50",
        impact_designation: "Large Missile Impact",
        glass_package: "Laminated IGU",
        low_e: true,
        argon: true,
        tint: null,
        glass_makeup: "1/8 + .090 PVB + 1/8",
        frame_material: "aluminum",
        applies_to_line_item_ids: ["li-sh-01"],
        confidence: 0.9,
        evidence: [evAt(2, "PGT WinGuard 5500 spec", "spec sheet")],
      },
      {
        product_configuration_id: "pc-cgi-sgd",
        manufacturer: "CGI",
        brand: "Sentinel",
        series: "SGD-540",
        model: null,
        noa_identifier: "NOA 21-0303.03",
        florida_approval_identifier: "FL-31000",
        dp_rating: "DP65",
        impact_designation: "Large Missile Impact",
        glass_package: "Laminated IGU + argon",
        low_e: true,
        argon: true,
        tint: "solar bronze",
        glass_makeup: "1/4 + .090 SGP + 1/4",
        frame_material: "aluminum",
        applies_to_line_item_ids: ["li-sgd-01"],
        confidence: 0.85,
        evidence: [evAt(3, "CGI Sentinel SGD-540 spec", "spec sheet")],
      },
    ],
    scope: emptyScope,
    warranties: emptyWarranties,
    terms: emptyTerms,
  },
  extraction_meta: {
    extraction_confidence: 0.85,
    warnings: ["Multiple product configurations detected; associations captured per line item."],
  },
};
