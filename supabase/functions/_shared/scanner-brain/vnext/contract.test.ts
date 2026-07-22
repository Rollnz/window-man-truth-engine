// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — CONTRACT TESTS (Sprint 04A hardening)
// Run: deno test supabase/functions/_shared/scanner-brain/vnext/
// ═══════════════════════════════════════════════════════════════════════════

import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  CANONICAL_CONTRACT_VERSION,
  CanonicalExtractionV1JsonSchema,
  validateCanonicalExtractionV1,
} from "./index.ts";

import {
  fixtureA_wellStructuredQuote,
  fixtureB_sparseEstimate,
  fixtureC_ambiguousEntities,
  fixtureD_unrelated,
  fixtureE_unreadable,
  fixtureF_mixedProductQuote,
} from "./fixtures.ts";

// ── Fixture happy-paths ────────────────────────────────────────────────────

Deno.test("Fixture A — well-structured quote validates", () => {
  const r = validateCanonicalExtractionV1(fixtureA_wellStructuredQuote);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
});

Deno.test("Fixture B — sparse estimate validates with many not_found", () => {
  const r = validateCanonicalExtractionV1(fixtureB_sparseEstimate);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
  assertEquals(fixtureB_sparseEstimate.quote.line_items_aggregate_only, true);
  assertEquals(fixtureB_sparseEstimate.quote.line_items.length, 0);
});

Deno.test("Fixture B — aggregate-only does NOT require opening_count found", () => {
  // opening_count is uncertain in fixture B — must still validate.
  assertEquals(fixtureB_sparseEstimate.quote.opening_count.status, "uncertain");
  const r = validateCanonicalExtractionV1(fixtureB_sparseEstimate);
  assertEquals(r.valid, true);
});

Deno.test("Fixture C — three phone entities remain structurally separate", () => {
  const r = validateCanonicalExtractionV1(fixtureC_ambiguousEntities);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
  const ho = fixtureC_ambiguousEntities.entities.homeowner.phone.value;
  const co = fixtureC_ambiguousEntities.entities.contractor.phone.value;
  const sp = fixtureC_ambiguousEntities.entities.salesperson.phone.value;
  assert(ho && co && sp);
  assert(ho.raw_value !== co.raw_value);
  assert(co.raw_value !== sp.raw_value);
  assert(ho.raw_value !== sp.raw_value);
});

Deno.test("Fixture D — unrelated doc validates and has no fabricated facts", () => {
  const r = validateCanonicalExtractionV1(fixtureD_unrelated);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
  assertEquals(fixtureD_unrelated.classification.document_type, "unrelated");
  assertEquals(fixtureD_unrelated.quote.line_items.length, 0);
  assertEquals(fixtureD_unrelated.quote.pricing.total_price.status, "not_found");
});

Deno.test("Fixture E — unreadable classification allowed", () => {
  const r = validateCanonicalExtractionV1(fixtureE_unreadable);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
  assertEquals(fixtureE_unreadable.classification.readability, "unreadable");
});

Deno.test("Fixture F — mixed-product quote validates + preserves configurations", () => {
  const r = validateCanonicalExtractionV1(fixtureF_mixedProductQuote);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
  const pcs = fixtureF_mixedProductQuote.quote.product_configurations;
  assertEquals(pcs.length, 2);
  const shConfig = pcs.find((c) => c.product_configuration_id === "pc-pgt-sh");
  const sgdConfig = pcs.find((c) => c.product_configuration_id === "pc-cgi-sgd");
  assert(shConfig && sgdConfig);
  assert(shConfig.manufacturer !== sgdConfig.manufacturer);
  assert(shConfig.series !== sgdConfig.series);
  // Distinct NOAs prove one spec is not applied globally.
  assert(shConfig.noa_identifier !== sgdConfig.noa_identifier);
});

// ── Invariant violations ───────────────────────────────────────────────────

Deno.test("rejects contract_version mismatch", () => {
  const bad = { ...fixtureA_wellStructuredQuote, contract_version: "wrong" };
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  assert(r.issues.some((i) => i.path === "$.contract_version"));
});

Deno.test("rejects confidence > 1", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  bad.entities.homeowner.name.confidence = 1.5;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  assert(r.issues.some((i) => i.path === "$.entities.homeowner.name.confidence"));
});

Deno.test("rejects found fact with null value", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  (bad.entities.homeowner.name as { value: unknown }).value = null;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  const msg = r.issues.map((i) => i.message).join(" | ");
  assertStringIncludes(msg, "status=found requires a non-null value");
});

Deno.test("rejects not_found fact with non-null value", () => {
  const bad = structuredClone(fixtureB_sparseEstimate);
  (bad.entities.homeowner.name as { value: unknown }).value = "should not be here";
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  const msg = r.issues.map((i) => i.message).join(" | ");
  assertStringIncludes(msg, "status=not_found requires value=null");
});

Deno.test("rejects invalid document_type", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  (bad.classification as { document_type: string }).document_type = "brochure";
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  assert(r.issues.some((i) => i.path === "$.classification.document_type"));
});

Deno.test("rejects aggregate-only=true with populated line_items", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  bad.quote.line_items_aggregate_only = true;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  const msg = r.issues.map((i) => i.message).join(" | ");
  assertStringIncludes(msg, "no fabricated items");
});

// ── Anomaly preservation (Decision 3) ─────────────────────────────────────

Deno.test("PRESERVES anomalous deposit_percentage=120 (Layer 4 flags, not Layer 3)", () => {
  const good = structuredClone(fixtureA_wellStructuredQuote);
  (good.quote.payment.deposit_percentage as { value: unknown }).value = 120;
  const r = validateCanonicalExtractionV1(good);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
});

Deno.test("PRESERVES anomalous payment milestone percentage=150", () => {
  const good = structuredClone(fixtureA_wellStructuredQuote);
  const sched = good.quote.payment.payment_schedule.value;
  assert(sched);
  sched[0].percentage = 150;
  const r = validateCanonicalExtractionV1(good);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
});

Deno.test("still rejects non-finite deposit_percentage", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  (bad.quote.payment.deposit_percentage as { value: unknown }).value = "twenty" as unknown;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

// ── Currency conflicts NOT reconciled in Layer 3 (Decision 4) ─────────────

Deno.test("PRESERVES mixed-currency line item vs pricing currency", () => {
  const good = structuredClone(fixtureA_wellStructuredQuote);
  // pricing currency = USD; force one line-item price into EUR
  const li = good.quote.line_items[0];
  li.unit_price = { value: 4500, currency: "EUR", formatted: "€4,500.00" };
  const r = validateCanonicalExtractionV1(good);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
});

// ── Validator ↔ Schema parity (structural rejections) ─────────────────────

Deno.test("rejects unknown root property", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote) as unknown as Record<string, unknown>;
  bad.rogue_field = 1;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  assert(r.issues.some((i) => i.path === "$.rogue_field"));
});

Deno.test("rejects unknown nested property inside classification", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  (bad.classification as unknown as Record<string, unknown>).extra = "no";
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  assert(r.issues.some((i) => i.path === "$.classification.extra"));
});

Deno.test("rejects missing required scope key", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  delete (bad.quote.scope as unknown as Record<string, unknown>).installation;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  assert(r.issues.some((i) => i.path === "$.quote.scope.installation"));
});

Deno.test("rejects malformed phone candidate (missing raw_value)", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  (bad.entities.homeowner.phone.value as unknown) = { context_hint: null };
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects malformed address candidate (unknown key)", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  const addr = bad.entities.homeowner.mailing_address.value as unknown as Record<string, unknown>;
  addr.country = "US"; // not in schema
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects malformed evidence entry (missing page)", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  (bad.entities.homeowner.name.evidence[0] as unknown as Record<string, unknown>) = {
    text: "x",
    location_hint: "y",
  };
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects malformed MoneyAmount (non-numeric value)", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  (bad.quote.pricing.total_price.value as { value: unknown }).value = "twelve";
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects malformed line-item width dimension", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  (bad.quote.line_items[0] as unknown as Record<string, unknown>).width = { value: "wide", unit: "in" };
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects malformed payment milestone (missing confidence)", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  const sched = bad.quote.payment.payment_schedule.value;
  assert(sched);
  delete (sched[0] as unknown as Record<string, unknown>).confidence;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects missing required entity field (homeowner.email)", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  delete (bad.entities.homeowner as unknown as Record<string, unknown>).email;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects malformed product configuration (missing id)", () => {
  const bad = structuredClone(fixtureF_mixedProductQuote);
  delete (bad.quote.product_configurations[0] as unknown as Record<string, unknown>).product_configuration_id;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects line-item pointer to unknown product configuration id", () => {
  const bad = structuredClone(fixtureF_mixedProductQuote);
  bad.quote.line_items[0].product_configuration_id = "does-not-exist";
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  const msg = r.issues.map((i) => i.message).join(" | ");
  assertStringIncludes(msg, "references unknown product_configuration_id");
});

Deno.test("rejects product configuration referencing unknown line_item_id", () => {
  const bad = structuredClone(fixtureF_mixedProductQuote);
  bad.quote.product_configurations[0].applies_to_line_item_ids = ["ghost-li"];
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects duplicate product_configuration_id", () => {
  const bad = structuredClone(fixtureF_mixedProductQuote);
  bad.quote.product_configurations[1].product_configuration_id = "pc-pgt-sh";
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  const msg = r.issues.map((i) => i.message).join(" | ");
  assertStringIncludes(msg, "duplicate product_configuration_id");
});

// ── Repeated-record confidence (Sprint 04A) ───────────────────────────────

Deno.test("rejects line item missing confidence", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  delete (bad.quote.line_items[0] as unknown as Record<string, unknown>).confidence;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects line item confidence > 1", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  bad.quote.line_items[0].confidence = 1.4;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects product configuration confidence < 0", () => {
  const bad = structuredClone(fixtureF_mixedProductQuote);
  bad.quote.product_configurations[0].confidence = -0.1;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

// ── JSON Schema shape sanity ───────────────────────────────────────────────

Deno.test("JSON Schema pins contract_version const", () => {
  const versionProp =
    (CanonicalExtractionV1JsonSchema as unknown as {
      properties: { contract_version: { const: string } };
    }).properties.contract_version;
  assertEquals(versionProp.const, CANONICAL_CONTRACT_VERSION);
});

Deno.test("JSON Schema forbids additional properties at root", () => {
  const root = CanonicalExtractionV1JsonSchema as unknown as { additionalProperties: boolean };
  assertEquals(root.additionalProperties, false);
});

Deno.test("JSON Schema classification no longer contains is_supported_for_quote_analysis", () => {
  const cls = (CanonicalExtractionV1JsonSchema as unknown as {
    properties: { classification: { required: string[]; properties: Record<string, unknown> } };
  }).properties.classification;
  assert(!cls.required.includes("is_supported_for_quote_analysis"));
  assert(!("is_supported_for_quote_analysis" in cls.properties));
});

Deno.test("JSON Schema quote uses product_configurations (plural)", () => {
  const quote = (CanonicalExtractionV1JsonSchema as unknown as {
    properties: { quote: { required: string[]; properties: Record<string, unknown> } };
  }).properties.quote;
  assert(quote.required.includes("product_configurations"));
  assert(!quote.required.includes("products"));
});
