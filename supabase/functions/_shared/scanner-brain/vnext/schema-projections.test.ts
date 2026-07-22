// ═══════════════════════════════════════════════════════════════════════════
// Tests for schema-projections + canonical-merge (Sprint 05B).
// Deno-native, zero-dependency.
// ═══════════════════════════════════════════════════════════════════════════

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { CanonicalExtractionV1JsonSchema } from "./schema.ts";
import {
  buildProjection,
  cloneCanonicalSchema,
  projectSchema,
  PARTITION_SPECS,
} from "./schema-projections.ts";
import {
  assertPartitionCoverage,
  mergeTwoPass,
  PARTITION_OWNERSHIP,
  type TwoPassAOutput,
  type TwoPassBOutput,
} from "./canonical-merge.ts";
import { fixtureA_wellStructuredQuote } from "./fixtures.ts";
import { CANONICAL_CONTRACT_VERSION } from "./constants.ts";

// ── projections ────────────────────────────────────────────────────────────

Deno.test("projections: cloneCanonicalSchema does not share references with canonical", () => {
  const clone = cloneCanonicalSchema();
  (clone.properties as Record<string, unknown>).__mut = true;
  assert(
    !("__mut" in (CanonicalExtractionV1JsonSchema as unknown as { properties: Record<string, unknown> }).properties),
    "canonical schema was mutated — clone is not deep-independent",
  );
});

Deno.test("projections: root selection retains only chosen keys + contract_version", () => {
  const p = projectSchema({ keepTopLevel: ["classification"] });
  assertEquals(p.topLevelKept.sort(), ["classification", "contract_version"]);
  const required = (p.schema.required as string[]).slice().sort();
  assertEquals(required, ["classification", "contract_version"]);
});

Deno.test("projections: quote sub-selection filters quote.properties + quote.required", () => {
  const p = projectSchema({
    keepTopLevel: ["quote"],
    keepQuoteKeys: ["metadata", "pricing"],
  });
  const quote = (p.schema.properties as Record<string, { properties: Record<string, unknown>; required: string[] }>).quote;
  assertEquals(Object.keys(quote.properties).sort(), ["metadata", "pricing"]);
  assertEquals(quote.required.slice().sort(), ["metadata", "pricing"]);
});

Deno.test("projections: warns when line_items and product_configurations are separated", () => {
  const p = projectSchema({
    keepTopLevel: ["quote"],
    keepQuoteKeys: ["line_items"],
  });
  assert(p.warnings.some((w) => w.includes("line_items and product_configurations")));
});

Deno.test("projections: named partition specs build cleanly", () => {
  for (const name of Object.keys(PARTITION_SPECS) as (keyof typeof PARTITION_SPECS)[]) {
    const p = buildProjection(name);
    assert(p.bytes > 0, `${name} bytes > 0`);
    assert(p.approxDepth > 0, `${name} depth > 0`);
    // referential-coherence warnings must not fire on named specs
    const bad = p.warnings.filter((w) => w.includes("line_items and product_configurations"));
    assertEquals(bad.length, 0, `${name} unexpectedly split line_items/product_configurations`);
  }
});

Deno.test("projections: partition sizes are strictly smaller than canonical", () => {
  const canonicalBytes = new TextEncoder().encode(JSON.stringify(CanonicalExtractionV1JsonSchema)).length;
  for (const name of Object.keys(PARTITION_SPECS) as (keyof typeof PARTITION_SPECS)[]) {
    const p = buildProjection(name);
    assert(p.bytes < canonicalBytes, `${name} (${p.bytes}) must be < canonical (${canonicalBytes})`);
  }
});

// ── ownership coverage ────────────────────────────────────────────────────

Deno.test("ownership: every canonical field is owned by exactly one partition (schema-evolution guard)", () => {
  const c = assertPartitionCoverage();
  assertEquals(c.unowned, [], `unowned canonical fields: ${c.unowned.join(", ")}`);
  assertEquals(c.unknown, [], `ownership map references unknown fields: ${c.unknown.join(", ")}`);
  assert(c.ok);
});

Deno.test("ownership: line_items and product_configurations share the same owner", () => {
  assertEquals(
    PARTITION_OWNERSHIP["quote.line_items"],
    PARTITION_OWNERSHIP["quote.product_configurations"],
    "line_items and product_configurations must remain in the same transport pass",
  );
});

// ── merge ────────────────────────────────────────────────────────────────

function fixtureToTwoPassA(): TwoPassAOutput {
  const f = fixtureA_wellStructuredQuote;
  return {
    contract_version: CANONICAL_CONTRACT_VERSION,
    classification: f.classification,
    entities: f.entities,
    extraction_meta: f.extraction_meta,
    quote: {
      metadata: f.quote.metadata,
      pricing: f.quote.pricing,
      payment: f.quote.payment,
      opening_count: f.quote.opening_count,
      line_items_aggregate_only: f.quote.line_items_aggregate_only,
      scope: f.quote.scope,
      warranties: f.quote.warranties,
      terms: f.quote.terms,
    },
  };
}

function fixtureToTwoPassB(): TwoPassBOutput {
  const f = fixtureA_wellStructuredQuote;
  return {
    contract_version: CANONICAL_CONTRACT_VERSION,
    quote: {
      line_items: f.quote.line_items,
      product_configurations: f.quote.product_configurations,
    },
  };
}

Deno.test("merge Test A: two valid partitions merge into a canonical object that passes validation", () => {
  const r = mergeTwoPass(fixtureToTwoPassA(), fixtureToTwoPassB());
  assert(r.ok, `merge failed: ${!r.ok ? r.error : ""}`);
  if (r.ok) {
    assert(r.validation.valid, `validation issues: ${JSON.stringify(r.validation.issues)}`);
    assertEquals(r.value.contract_version, CANONICAL_CONTRACT_VERSION);
    assertEquals(r.value.quote.line_items.length, fixtureA_wellStructuredQuote.quote.line_items.length);
  }
});

Deno.test("merge Test B: missing required partition fails closed with explicit error", () => {
  const r1 = mergeTwoPass(null as unknown as TwoPassAOutput, fixtureToTwoPassB());
  assert(!r1.ok);
  assert(r1.error.includes("pass A"));

  const r2 = mergeTwoPass(fixtureToTwoPassA(), null as unknown as TwoPassBOutput);
  assert(!r2.ok);
  assert(r2.error.includes("pass B"));
});

Deno.test("merge Test C: malformed partition data fails closed", () => {
  const bad = { ...fixtureToTwoPassA(), classification: null as unknown as TwoPassAOutput["classification"] };
  const r = mergeTwoPass(bad, fixtureToTwoPassB());
  assert(!r.ok);
});

Deno.test("merge Test D: unknown product/line-item references remain rejected via canonical validator", () => {
  const passB = fixtureToTwoPassB();
  // Mutate: reference a product_configuration_id that does not exist.
  passB.quote.line_items = passB.quote.line_items.map((li) => ({
    ...li,
    product_configuration_id: "ghost-config-id",
  }));
  const r = mergeTwoPass(fixtureToTwoPassA(), passB);
  assert(!r.ok);
  if (!r.ok) {
    assert(
      r.validation?.issues.some((i) => i.message.includes("unknown product_configuration_id") || i.path.includes("line_items")),
      "expected validator to reject dangling product_configuration_id",
    );
  }
});

Deno.test("merge Test E: contract_version mismatch across partitions is rejected", () => {
  const passA = fixtureToTwoPassA();
  const passB = fixtureToTwoPassB();
  passB.contract_version = "wrong-version";
  const r = mergeTwoPass(passA, passB);
  assert(!r.ok);
  if (!r.ok) assert(r.error.includes("contract_version"));
});
