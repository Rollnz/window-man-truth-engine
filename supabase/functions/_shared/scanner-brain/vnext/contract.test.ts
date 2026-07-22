// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — CONTRACT TESTS (Deno)
//
// Isolated tests for the canonical extraction contract. No AI, no DB, no
// network. Run with:  deno test supabase/functions/_shared/scanner-brain/vnext/
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
} from "./fixtures.ts";

// ── Fixture happy-paths ────────────────────────────────────────────────────

Deno.test("Fixture A — well-structured quote validates", () => {
  const r = validateCanonicalExtractionV1(fixtureA_wellStructuredQuote);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
});

Deno.test("Fixture B — sparse estimate validates with many not_found", () => {
  const r = validateCanonicalExtractionV1(fixtureB_sparseEstimate);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
  // Aggregate rule respected
  assertEquals(fixtureB_sparseEstimate.quote.line_items_aggregate_only, true);
  assertEquals(fixtureB_sparseEstimate.quote.line_items.length, 0);
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
  assertEquals(fixtureD_unrelated.classification.is_supported_for_quote_analysis, false);
  assertEquals(fixtureD_unrelated.quote.line_items.length, 0);
  assertEquals(fixtureD_unrelated.quote.pricing.total_price.status, "not_found");
});

Deno.test("Fixture E — unreadable classification allowed", () => {
  const r = validateCanonicalExtractionV1(fixtureE_unreadable);
  assertEquals(r.valid, true, JSON.stringify(r.issues));
  assertEquals(fixtureE_unreadable.classification.readability, "unreadable");
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
  assert(
    r.issues.some((i) =>
      i.path === "$.entities.homeowner.name.confidence"
    ),
  );
});

Deno.test("rejects found fact with null value", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  // homeowner.name.status='found' but value=null
  (bad.entities.homeowner.name as { value: unknown }).value = null;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  const msg = r.issues.map((i) => i.message).join(" | ");
  assertStringIncludes(msg, "status=found requires a non-null value");
});

Deno.test("rejects not_found fact with non-null value", () => {
  const bad = structuredClone(fixtureB_sparseEstimate);
  // homeowner.name.status='not_found' but value forced non-null
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
  bad.quote.line_items_aggregate_only = true; // but line_items has 2 entries
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
  const msg = r.issues.map((i) => i.message).join(" | ");
  assertStringIncludes(msg, "no fabricated items");
});

Deno.test("rejects negative deposit_percentage inside envelope", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  (bad.quote.payment.deposit_percentage as { value: unknown }).value = -5;
  const r = validateCanonicalExtractionV1(bad);
  assertEquals(r.valid, false);
});

Deno.test("rejects payment_schedule 'found' with non-array value", () => {
  const bad = structuredClone(fixtureA_wellStructuredQuote);
  (bad.quote.payment.payment_schedule as { value: unknown }).value = "one payment" as unknown;
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
  const root = CanonicalExtractionV1JsonSchema as unknown as {
    additionalProperties: boolean;
  };
  assertEquals(root.additionalProperties, false);
});
