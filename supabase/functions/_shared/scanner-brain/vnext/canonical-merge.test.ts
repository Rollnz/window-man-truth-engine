// ═══════════════════════════════════════════════════════════════════════════
// Sprint 06A — Dedicated four-pass canonical merge tests.
// Complements existing merge tests in schema-projections.test.ts (two-pass).
// ═══════════════════════════════════════════════════════════════════════════

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { CANONICAL_CONTRACT_VERSION } from "./constants.ts";
import {
  assertPartitionCoverage,
  mergeFourPass,
  PARTITION_OWNERSHIP,
  type FourPassAOutput,
  type FourPassBOutput,
  type FourPassCOutput,
  type FourPassDOutput,
} from "./canonical-merge.ts";
import {
  fixtureA_wellStructuredQuote,
  fixtureB_sparseEstimate,
} from "./fixtures.ts";

// ── partition adapters ────────────────────────────────────────────────────

function toPassA(f = fixtureA_wellStructuredQuote): FourPassAOutput {
  return {
    contract_version: CANONICAL_CONTRACT_VERSION,
    classification: f.classification,
    entities: f.entities,
    extraction_meta: f.extraction_meta,
  };
}
function toPassB(f = fixtureA_wellStructuredQuote): FourPassBOutput {
  return {
    contract_version: CANONICAL_CONTRACT_VERSION,
    quote: {
      metadata: f.quote.metadata,
      pricing: f.quote.pricing,
      payment: f.quote.payment,
      opening_count: f.quote.opening_count,
      line_items_aggregate_only: f.quote.line_items_aggregate_only,
    },
  };
}
function toPassC(f = fixtureA_wellStructuredQuote): FourPassCOutput {
  return {
    contract_version: CANONICAL_CONTRACT_VERSION,
    quote: {
      scope: f.quote.scope,
      warranties: f.quote.warranties,
      terms: f.quote.terms,
    },
  };
}
function toPassD(f = fixtureA_wellStructuredQuote): FourPassDOutput {
  return {
    contract_version: CANONICAL_CONTRACT_VERSION,
    quote: {
      line_items: f.quote.line_items,
      product_configurations: f.quote.product_configurations,
    },
  };
}

// ── coverage ──────────────────────────────────────────────────────────────

Deno.test("four-pass coverage: every canonical field is owned by exactly one partition", () => {
  const c = assertPartitionCoverage();
  assertEquals(c.unowned, []);
  assertEquals(c.unknown, []);
  assert(c.ok);
});

Deno.test("four-pass coverage: line_items + product_configurations share owner (Pass D)", () => {
  assertEquals(PARTITION_OWNERSHIP["quote.line_items"], "passD");
  assertEquals(PARTITION_OWNERSHIP["quote.product_configurations"], "passD");
});

// ── happy path ───────────────────────────────────────────────────────────

Deno.test("four-pass A: all four partitions merge into canonical + validate", () => {
  const r = mergeFourPass({ passA: toPassA(), passB: toPassB(), passC: toPassC(), passD: toPassD() });
  assert(r.ok, `merge failed: ${!r.ok ? r.error : ""}`);
  if (r.ok) {
    assert(r.validation.valid, JSON.stringify(r.validation.issues));
    assertEquals(r.value.contract_version, CANONICAL_CONTRACT_VERSION);
    assertEquals(r.value.quote.line_items.length, fixtureA_wellStructuredQuote.quote.line_items.length);
  }
});

Deno.test("four-pass A: sparse-estimate fixture also merges + validates", () => {
  const f = fixtureB_sparseEstimate;
  const r = mergeFourPass({ passA: toPassA(f), passB: toPassB(f), passC: toPassC(f), passD: toPassD(f) });
  assert(r.ok, `merge failed: ${!r.ok ? r.error : ""}`);
});

// ── missing-partition failures ────────────────────────────────────────────

Deno.test("four-pass B: each missing partition fails closed with named error", () => {
  const full = { passA: toPassA(), passB: toPassB(), passC: toPassC(), passD: toPassD() };
  for (const missing of ["passA", "passB", "passC", "passD"] as const) {
    const inputs = { ...full, [missing]: null } as unknown as Parameters<typeof mergeFourPass>[0];
    const r = mergeFourPass(inputs);
    assert(!r.ok);
    if (!r.ok) {
      const letter = missing.replace("pass", "");
      assert(r.error.includes(`pass ${letter}`), `error for missing ${missing} = ${r.error}`);
    }
  }
});

// ── contract_version mismatch ─────────────────────────────────────────────

Deno.test("four-pass C: contract_version mismatch anywhere is rejected", () => {
  for (const bad of ["passA", "passB", "passC", "passD"] as const) {
    const inputs: Parameters<typeof mergeFourPass>[0] = {
      passA: toPassA(), passB: toPassB(), passC: toPassC(), passD: toPassD(),
    };
    (inputs as unknown as Record<string, { contract_version: string }>)[bad].contract_version = "wrong";
    const r = mergeFourPass(inputs);
    assert(!r.ok);
    if (!r.ok) assert(r.error.includes("contract_version"));
  }
});

// ── malformed partitions ─────────────────────────────────────────────────

Deno.test("four-pass D: malformed passA (missing classification) fails validation", () => {
  const passA = { ...toPassA(), classification: null as unknown as FourPassAOutput["classification"] };
  const r = mergeFourPass({ passA, passB: toPassB(), passC: toPassC(), passD: toPassD() });
  assert(!r.ok);
});

Deno.test("four-pass D: passB missing 'quote' fails closed", () => {
  const passB = { contract_version: CANONICAL_CONTRACT_VERSION } as unknown as FourPassBOutput;
  const r = mergeFourPass({ passA: toPassA(), passB, passC: toPassC(), passD: toPassD() });
  assert(!r.ok);
});

// ── dangling refs ────────────────────────────────────────────────────────

Deno.test("four-pass E: dangling product_configuration_id from pass D is rejected", () => {
  const passD = toPassD();
  passD.quote.line_items = passD.quote.line_items.map((li) => ({ ...li, product_configuration_id: "ghost" }));
  const r = mergeFourPass({ passA: toPassA(), passB: toPassB(), passC: toPassC(), passD });
  assert(!r.ok);
  if (!r.ok) {
    assert(
      r.validation?.issues.some((i) => /unknown product_configuration_id/.test(i.message) || i.path.includes("line_items")),
      "expected validator to reject dangling product_configuration_id",
    );
  }
});

Deno.test("four-pass E: dangling applies_to_line_item_ids from pass D is rejected", () => {
  const passD = toPassD();
  passD.quote.product_configurations = passD.quote.product_configurations.map((pc) => ({
    ...pc,
    applies_to_line_item_ids: ["ghost-li"],
  }));
  const r = mergeFourPass({ passA: toPassA(), passB: toPassB(), passC: toPassC(), passD });
  assert(!r.ok);
});

// ── defensive owner isolation ────────────────────────────────────────────

Deno.test("four-pass F: extra fields injected outside a pass's ownership are ignored", () => {
  // Pass A tries to smuggle a scope value — merge must silently drop it and take Pass C's scope.
  const passA = toPassA() as unknown as Record<string, unknown>;
  (passA as { quote?: unknown }).quote = {
    scope: { installation: { status: "found", value: "SMUGGLED", confidence: 1, evidence: [] } },
  };
  const r = mergeFourPass({
    passA: passA as unknown as FourPassAOutput,
    passB: toPassB(),
    passC: toPassC(),
    passD: toPassD(),
  });
  assert(r.ok, `merge failed: ${!r.ok ? r.error : ""}`);
  if (r.ok) {
    // The authoritative scope comes from pass C, not the smuggled value.
    assertEquals(
      r.value.quote.scope.installation.value,
      fixtureA_wellStructuredQuote.quote.scope.installation.value,
    );
  }
});

// ── Sprint 05C regression: not_found ⇒ value:null (never []) ─────────────

Deno.test("four-pass G: payment_schedule not_found with value:[] fails validation", () => {
  const passB = toPassB();
  // Simulate the 05C failure mode: the model returned an empty array for a not_found envelope.
  passB.quote.payment = {
    ...passB.quote.payment,
    payment_schedule: {
      status: "not_found",
      value: [] as unknown as null,
      confidence: 0,
      evidence: [],
    },
  };
  const r = mergeFourPass({ passA: toPassA(), passB, passC: toPassC(), passD: toPassD() });
  assert(!r.ok);
  if (!r.ok) {
    assert(
      r.validation?.issues.some((i) => i.path.includes("payment_schedule") && i.message.includes("not_found")),
      "expected validator to reject not_found with non-null value",
    );
  }
});

Deno.test("four-pass G: correctly-shaped not_found payment_schedule passes", () => {
  const passB = toPassB();
  passB.quote.payment = {
    ...passB.quote.payment,
    payment_schedule: { status: "not_found", value: null, confidence: 0, evidence: [] },
  };
  const r = mergeFourPass({ passA: toPassA(), passB, passC: toPassC(), passD: toPassD() });
  assert(r.ok, `merge failed: ${!r.ok ? r.error : ""}`);
});
