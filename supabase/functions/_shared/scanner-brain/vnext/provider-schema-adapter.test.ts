// Tests for provider-schema-adapter (Sprint 05C).
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { CanonicalExtractionV1JsonSchema } from "./schema.ts";
import {
  compactCanonicalForProvider,
  expandReferences,
  roundTripEquivalent,
} from "./provider-schema-adapter.ts";

Deno.test("adapter: compaction produces valid metrics + non-trivial reduction", () => {
  const { schema, metrics } = compactCanonicalForProvider();
  assert(metrics.compactBytes > 0);
  assert(metrics.compactBytes < metrics.expandedBytes, "compact must be smaller");
  assert(metrics.definitionCount >= 1, "expected at least one dedupe candidate");
  assert(metrics.referenceCount >= metrics.definitionCount * 2, "each def must be referenced >=2 times");
  assert("$defs" in schema);
});

Deno.test("adapter: round-trip expansion equals canonical (semantic equivalence)", () => {
  const { schema } = compactCanonicalForProvider();
  const r = roundTripEquivalent(schema);
  if (!r.equivalent) {
    throw new Error(`round-trip failed at ${r.diffPath} (canonical=${r.canonicalBytes} expanded=${r.expandedBytes})`);
  }
  assert(r.equivalent);
});

Deno.test("adapter: expandReferences on a schema without $defs is a no-op deep clone", () => {
  const c = { type: "object", properties: { a: { type: "string" } }, required: ["a"], additionalProperties: false };
  const expanded = expandReferences(c as unknown as Record<string, unknown>);
  assertEquals(JSON.stringify(expanded), JSON.stringify(c));
});

Deno.test("adapter: dangling $ref fails closed", () => {
  const bad = { type: "object", properties: { a: { $ref: "#/$defs/Missing" } }, required: ["a"], additionalProperties: false };
  let threw = false;
  try { expandReferences(bad as unknown as Record<string, unknown>); } catch { threw = true; }
  assert(threw, "expected expansion to throw on dangling $ref");
});

Deno.test("adapter: canonical schema is not mutated by compaction", () => {
  const before = JSON.stringify(CanonicalExtractionV1JsonSchema);
  compactCanonicalForProvider();
  const after = JSON.stringify(CanonicalExtractionV1JsonSchema);
  assertEquals(before, after);
});
