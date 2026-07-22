// Sprint 07A — Deterministic benchmark harness tests.
// 27 tests, no live provider calls.
import { assert, assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";

import {
  validateGroundTruthDocument, isLocked,
} from "./ground-truth.ts";
import { projectToCanonicalExpectation } from "./canonical-expectation.ts";
import {
  moneyEquivalent, dateEquivalent, nameEquivalent, addressEquivalent,
  identifierEquivalent, dimensionEquivalent, manufacturerEquivalent,
} from "./normalization.ts";
import {
  matchLineItems, classifyEvidence, checkAnomalyPreservation,
  checkCrossReferenceCoherence, computeFieldStability,
  LINE_ITEM_AMBIGUITY_MARGIN,
} from "./metrics.ts";
import { scoreDocument, aggregateSystemScorecards, fieldToCapability } from "./scorer.ts";
import { runBenchmark, serializeReport, deserializeReport } from "./benchmark-runner.ts";
import { createRunManifest } from "./run-manifest.ts";
import { DEFAULT_THRESHOLDS, THRESHOLD_CONFIG_VERSION } from "./benchmark-thresholds.ts";
import { VNEXT_CAPABILITIES, BRAIN3_CAPABILITIES, partitionCapabilityScope } from "./adapters/capability-matrix.ts";
import { perfectVNextMock, brain3Mock } from "./fixtures/mock-system-outputs.ts";
import { DEV_DOC_1, DEV_DOC_2, HOLDOUT_DOC_1 } from "./fixtures/synthetic-ground-truth.ts";
import type { GroundTruthDocument, NormalizedSystemOutput } from "./benchmark-types.ts";

const deps = {
  now: (() => {
    let t = 1_800_000_000_000;
    return () => new Date(t += 1);
  })(),
  uuid: (() => {
    let n = 0;
    return () => `uuid-${++n}`;
  })(),
  hash: (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).padStart(12, "0");
  },
};

// ---------------- Tests ----------------

Deno.test("T01 ground-truth schema validates a locked doc; rejects invalid", () => {
  const issues = validateGroundTruthDocument(DEV_DOC_1);
  assertEquals(issues, []);
  const bad = { ...DEV_DOC_1, document_sha256: "nothex" };
  assert(validateGroundTruthDocument(bad).length > 0);
});

Deno.test("T02 status semantics (found/not_found/uncertain/not_applicable) are distinct", () => {
  const statuses = DEV_DOC_1.facts.map((f) => f.expected_status);
  assert(statuses.includes("found"));
  assert(statuses.includes("not_found"));
  assert(statuses.includes("not_applicable"));
});

Deno.test("T03 source-neutral truth module does not import canonical vNext types", async () => {
  const [gt, bt] = await Promise.all([
    Deno.readTextFile(new URL("./ground-truth.ts", import.meta.url)),
    Deno.readTextFile(new URL("./benchmark-types.ts", import.meta.url)),
  ]);
  assert(!/from ["']\.\.\/types\.ts["']/.test(gt));
  assert(!/from ["']\.\.\/schema\.ts["']/.test(gt));
  assert(!/from ["']\.\.\/types\.ts["']/.test(bt));
  assert(!/from ["']\.\.\/schema\.ts["']/.test(bt));
});

Deno.test("T04 canonical expectation projection is deterministic + sorted", () => {
  const a = projectToCanonicalExpectation(DEV_DOC_1);
  const b = projectToCanonicalExpectation(DEV_DOC_1);
  assertEquals(a, b);
  const sorted = [...a.fields].sort((x, y) => x.semantic_field.localeCompare(y.semantic_field));
  assertEquals(a.fields, sorted);
});

Deno.test("T05 entity misattribution is classified ENTITY_MISATTRIBUTION", () => {
  const out: NormalizedSystemOutput = {
    facts: [{
      semantic_field: "entity.homeowner.name",
      status: "found",
      value: "Alex Testhome",
      entity_role: "salesperson", // wrong role
    }],
    line_items: [], product_configurations: [],
  };
  const sc = scoreDocument({
    system_id: "vnext", system_capabilities: VNEXT_CAPABILITIES,
    document: DEV_DOC_1, output: out, latency_ms: 10,
  });
  assert(sc.errors.some((e) => e.code === "ENTITY_MISATTRIBUTION"));
});

Deno.test("T06 correct NOT_FOUND, false NOT_FOUND, hallucination classified correctly", () => {
  // hallucination: assert value where GT says not_found
  const out1: NormalizedSystemOutput = {
    facts: [{ semantic_field: "pricing.financing", status: "found", value: 500 }],
    line_items: [], product_configurations: [],
  };
  const s1 = scoreDocument({
    system_id: "vnext", system_capabilities: VNEXT_CAPABILITIES,
    document: DEV_DOC_1, output: out1, latency_ms: 1,
  });
  assert(s1.errors.some((e) => e.code === "HALLUCINATION"));

  // correct not_found: assert not_found where GT says not_found
  const out2: NormalizedSystemOutput = {
    facts: [{ semantic_field: "pricing.financing", status: "not_found", value: null }],
    line_items: [], product_configurations: [],
  };
  const s2 = scoreDocument({
    system_id: "vnext", system_capabilities: VNEXT_CAPABILITIES,
    document: DEV_DOC_1, output: out2, latency_ms: 1,
  });
  assert(!s2.errors.some((e) => e.code === "HALLUCINATION"));

  // false NOT_FOUND: assert not_found where GT says found
  const out3: NormalizedSystemOutput = {
    facts: [{ semantic_field: "pricing.total", status: "not_found", value: null }],
    line_items: [], product_configurations: [],
  };
  const s3 = scoreDocument({
    system_id: "vnext", system_capabilities: VNEXT_CAPABILITIES,
    document: DEV_DOC_1, output: out3, latency_ms: 1,
  });
  assert(s3.errors.some((e) => e.code === "FALSE_NOT_FOUND"));
});

Deno.test("T07 correct fact without evidence → EVIDENCE_MISSING, NOT hallucination", () => {
  const out: NormalizedSystemOutput = {
    facts: [{ semantic_field: "pricing.total", status: "found", value: 12500 }],
    line_items: [], product_configurations: [],
  };
  const sc = scoreDocument({
    system_id: "vnext", system_capabilities: VNEXT_CAPABILITIES,
    document: DEV_DOC_1, output: out, latency_ms: 1,
  });
  assert(sc.errors.some((e) => e.code === "EVIDENCE_MISSING"));
  assert(!sc.errors.some((e) => e.code === "HALLUCINATION" && e.semantic_field === "pricing.total"));
});

Deno.test("T08 UNSUPPORTED_BY_SYSTEM excluded from recall denominator", () => {
  // Brain 3 does not support salesperson.
  const doc: GroundTruthDocument = HOLDOUT_DOC_1;
  const out: NormalizedSystemOutput = { facts: [], line_items: [], product_configurations: [] };
  const sc = scoreDocument({
    system_id: "brain3", system_capabilities: BRAIN3_CAPABILITIES,
    document: doc, output: out, latency_ms: 1,
  });
  assertEquals(sc.counts.facts_considered, 0);
  assertEquals(sc.counts.unsupported_by_system, 1);
});

Deno.test("T09 NOT_APPLICABLE excluded from denominator", () => {
  const sc = scoreDocument({
    system_id: "vnext", system_capabilities: VNEXT_CAPABILITIES,
    document: DEV_DOC_1,
    output: { facts: [], line_items: [], product_configurations: [] },
    latency_ms: 1,
  });
  // 6 GT facts, 1 is not_applicable → denominator ≤ 5
  assert(sc.counts.facts_considered <= 5);
  assert(!sc.errors.some((e) => e.semantic_field === "pricing.tax" && e.code !== "UNSUPPORTED_BY_SYSTEM"));
});

Deno.test("T10 shared vs expanded capability reporting is separated", () => {
  const scope = partitionCapabilityScope(
    ["classification.x", "entity.salesperson.name", "pricing.total"],
    fieldToCapability,
    [VNEXT_CAPABILITIES, BRAIN3_CAPABILITIES],
  );
  assert(scope.shared.includes("pricing.total"));
  assert(scope.expanded["vnext"].includes("entity.salesperson.name"));
  assert(!scope.shared.includes("entity.salesperson.name"));
});

Deno.test("T11 money & date equivalence; ambiguous date → HUMAN_REVIEW_REQUIRED", () => {
  assertEquals(moneyEquivalent("$12,500.00", 12500).kind, "equal");
  assertEquals(moneyEquivalent(100, 101).kind, "not_equal");
  assertEquals(dateEquivalent("2026-02-03", "02/03/2026").kind, "human_review_required");
  assertEquals(dateEquivalent("2026-01-15", "01/25/2026").kind, "not_equal");
  assertEquals(nameEquivalent("Alex Testhome", "alex  testhome ").kind, "equal");
  assertEquals(addressEquivalent("123 Main St 33101", "999 Other Rd 90210").kind, "not_equal");
  assertEquals(identifierEquivalent("NOA-12-3456", "noa123456").kind, "equal");
  assertEquals(dimensionEquivalent("36in", 36.3).kind, "equal");
  assertEquals(manufacturerEquivalent("PGT Industries", "pgt").kind, "equal");
});

Deno.test("T12 line-item ambiguous pair → LINE_ITEM_MATCH_AMBIGUOUS, no forced pair", () => {
  const gt = [{
    gt_line_id: "L1", product_type: "window", quantity: 1, unit_price: 500, description: "double hung",
  }];
  // Two candidates with equal weak signals only, no hard signals (loc/dims/id).
  const cands = [
    { product_type: "window", quantity: 1, unit_price: 500, description: "double hung" },
    { product_type: "window", quantity: 1, unit_price: 500, description: "double hung" },
  ];
  const { pairings, unmatched_gt } = matchLineItems(gt, cands);
  assertEquals(pairings[0].ambiguous, true);
  assertEquals(pairings[0].candidate_index, null);
  // Ambiguous is NOT counted as unmatched miss.
  assertEquals(unmatched_gt.length, 0);
  assert(LINE_ITEM_AMBIGUITY_MARGIN > 0);
});

Deno.test("T13 product-configuration assoc scored separate from field accuracy; dangling refs classified", () => {
  const out: NormalizedSystemOutput = {
    facts: [], line_items: [{ line_item_id: "LI1", product_configuration_id: "PC_NONE" }],
    product_configurations: [{ product_configuration_id: "PC1", applies_to_line_item_ids: ["LI_MISSING"] }],
  };
  const cross = checkCrossReferenceCoherence(out);
  assertEquals(cross.dangling >= 2, true);
});

Deno.test("T14 evidence classifications", () => {
  assertEquals(classifyEvidence("Total: $12,500", 2, "Total: $12,500", 2, true), "EXACT_OR_NORMALIZED_MATCH");
  assertEquals(classifyEvidence("Total: $12,500.00 due", 2, "Total: $12,500", 2, true), "TEXT_CONTAINMENT_SUPPORTED");
  assertEquals(classifyEvidence(undefined, 2, undefined, 2, true), "PAGE_MATCH_SUPPORTED");
  assertEquals(classifyEvidence("x", 2, undefined, undefined, true), "MISSING");
  assertEquals(classifyEvidence("Total: $12,500", 2, "different text entirely", 3, true), "PAGE_REFERENCE_WRONG");
  assertEquals(classifyEvidence("Total: $12,500", 2, "different text entirely", 2, true), "UNSUPPORTED");
});

Deno.test("T15 anomaly preservation: 120% preserved = ok; normalized to 100 = ANOMALY_NOT_PRESERVED", () => {
  const preservedOut: NormalizedSystemOutput = {
    facts: [{ semantic_field: "pricing.deposit_percent", status: "found", value: 120 }],
    line_items: [], product_configurations: [],
  };
  const s1 = checkAnomalyPreservation(DEV_DOC_1, preservedOut);
  assertEquals(s1.preserved, 1);

  const normalizedOut: NormalizedSystemOutput = {
    facts: [{ semantic_field: "pricing.deposit_percent", status: "found", value: 100 }],
    line_items: [], product_configurations: [],
  };
  const s2 = checkAnomalyPreservation(DEV_DOC_1, normalizedOut);
  assertEquals(s2.preserved, 0);
  const sc = scoreDocument({
    system_id: "vnext", system_capabilities: VNEXT_CAPABILITIES,
    document: DEV_DOC_1, output: normalizedOut, latency_ms: 1,
  });
  assert(sc.errors.some((e) => e.code === "ANOMALY_NOT_PRESERVED"));
});

Deno.test("T16 cross-reference coherence: valid/dangling/incorrect/missing counted separately", () => {
  const out: NormalizedSystemOutput = {
    facts: [],
    line_items: [
      { line_item_id: "LI1", product_configuration_id: "PC1" },
      { line_item_id: "LI2", product_configuration_id: "PC_NOPE" },
    ],
    product_configurations: [
      { product_configuration_id: "PC1", applies_to_line_item_ids: ["LI1", "LI_EXTRA"] },
    ],
  };
  const stats = checkCrossReferenceCoherence(out, [
    { product_configuration_id: "PC1", line_item_ids: ["LI1"] },
    { product_configuration_id: "PC_MISSING_ENTIRELY", line_item_ids: ["LI2"] },
  ]);
  assert(stats.valid >= 1);
  assert(stats.dangling >= 2);
  assert(stats.incorrect >= 1); // LI_EXTRA
  assert(stats.missing >= 1);   // PC_MISSING_ENTIRELY
});

Deno.test("T17 FIELD_STABILITY_RATE across run group", () => {
  const samples = [
    { run_group_id: "g1", document_id: "d1", system_id: "vnext", facts: [{ semantic_field: "pricing.total", value: 100 }] },
    { run_group_id: "g1", document_id: "d1", system_id: "vnext", facts: [{ semantic_field: "pricing.total", value: 100 }] },
    { run_group_id: "g1", document_id: "d1", system_id: "vnext", facts: [{ semantic_field: "pricing.total", value: 200 }] },
  ];
  const r = computeFieldStability(samples);
  assertEquals(r[0].field, "pricing.total");
  assertEquals(r[0].runs, 3);
  assertEquals(r[0].stability_rate, 2 / 3);
});

Deno.test("T18 runs against unlocked ground truth are flagged non-authoritative", async () => {
  const { report } = await runBenchmark({
    documents: [DEV_DOC_2], // unlocked
    systems: [perfectVNextMock()],
    thresholds: DEFAULT_THRESHOLDS,
    provider: "lovable", model: "mock",
    deps,
  });
  assertEquals(report.authoritative, false);
});

Deno.test("T19 threshold config is versioned + frozen", () => {
  assertEquals(DEFAULT_THRESHOLDS.version, THRESHOLD_CONFIG_VERSION);
  assertThrows(() => {
    // deno-lint-ignore no-explicit-any
    (DEFAULT_THRESHOLDS as any).canonical_validity_min = 0.1;
  });
});

Deno.test("T20 critical hallucination gate overrides aggregate score", () => {
  // Construct a scorecard with high aggregate accuracy but critical hallucination.
  const sc = {
    system_id: "vnext", document_id: "d", annotation_locked: true, errors: [],
    counts: {
      facts_considered: 100, facts_correct: 100,
      hallucinations: 1, critical_hallucinations: 1,
      evidence_missing: 0, evidence_unsupported: 0, line_items_ambiguous: 0,
      human_review_required: 0, unsupported_by_system: 0,
      anomalies_expected: 0, anomalies_preserved: 0,
      cross_ref_valid: 0, cross_ref_dangling: 0, cross_ref_incorrect: 0, cross_ref_missing: 0,
      infra_failures: 0,
    },
    evidence_buckets: {
      EXACT_OR_NORMALIZED_MATCH: 100, TEXT_CONTAINMENT_SUPPORTED: 0, PAGE_MATCH_SUPPORTED: 0,
      MISSING: 0, UNSUPPORTED: 0, PAGE_REFERENCE_WRONG: 0, HUMAN_REVIEW_REQUIRED: 0,
    },
    latency_ms: 10,
  };
  const agg = aggregateSystemScorecards("vnext", [sc], DEFAULT_THRESHOLDS);
  assertEquals(agg.aggregate_accuracy, 1);
  assert(agg.gate_failures.some((r) => r.startsWith("critical_hallucinations=")));
});

Deno.test("T21 immutable provenance: different prompt_version yields distinct run_ids", () => {
  const base = {
    run_group_id: "g", document_id: "d", document_sha256: "0".repeat(64),
    dataset_split: "development" as const, annotation_version: "a-v1", annotation_locked: true,
    system_id: "vnext", adapter_version: "v1", system_version: "s1",
    provider: "lovable", model: "m", latency_ms: 5,
    raw_output_reference: "r", normalized_output_reference: "n", status: "ok" as const,
  };
  const m1 = createRunManifest({ ...base, prompt_version: "p-v1" }, deps);
  const m2 = createRunManifest({ ...base, prompt_version: "p-v2" }, deps);
  assert(m1.run_id !== m2.run_id);
  assertThrows(() => {
    // deno-lint-ignore no-explicit-any
    (m1 as any).run_id = "mutated";
  });
});

Deno.test("T22 dataset splits are preserved end-to-end", async () => {
  const { manifests } = await runBenchmark({
    documents: [DEV_DOC_1, HOLDOUT_DOC_1],
    systems: [perfectVNextMock()],
    thresholds: DEFAULT_THRESHOLDS,
    provider: "lovable", model: "mock",
    deps,
  });
  const splits = new Set(manifests.map((m) => m.dataset_split));
  assert(splits.has("development"));
  assert(splits.has("holdout"));
});

Deno.test("T23 machine-readable report serialization round-trip", async () => {
  const { report } = await runBenchmark({
    documents: [DEV_DOC_1],
    systems: [perfectVNextMock()],
    thresholds: DEFAULT_THRESHOLDS,
    provider: "lovable", model: "mock",
    deps,
  });
  const round = deserializeReport(serializeReport(report));
  assertEquals(round.systems, report.systems);
  assertEquals(round.threshold_config_version, THRESHOLD_CONFIG_VERSION);
});

Deno.test("T24 normalizer/scorer/metric/threshold versions present on every report", async () => {
  const { report } = await runBenchmark({
    documents: [DEV_DOC_1],
    systems: [perfectVNextMock()],
    thresholds: DEFAULT_THRESHOLDS,
    provider: "lovable", model: "mock",
    deps,
  });
  assert(report.benchmark_schema_version);
  assert(report.normalizer_version);
  assert(report.scorer_version);
  assert(report.metric_version);
  assert(report.threshold_config_version);
});

Deno.test("T25 severity weighting: critical hallucinations counted separately", () => {
  const out: NormalizedSystemOutput = {
    facts: [{ semantic_field: "pricing.financing", status: "found", value: 999 }],
    line_items: [], product_configurations: [],
  };
  const sc = scoreDocument({
    system_id: "vnext", system_capabilities: VNEXT_CAPABILITIES,
    document: DEV_DOC_1, output: out, latency_ms: 1,
  });
  assertEquals(sc.counts.critical_hallucinations, 1);
});

Deno.test("T26 headless runner: mock adapters end-to-end, zero live side effects", async () => {
  const { report, manifests } = await runBenchmark({
    documents: [DEV_DOC_1, HOLDOUT_DOC_1],
    systems: [perfectVNextMock(), brain3Mock()],
    thresholds: DEFAULT_THRESHOLDS,
    provider: "lovable", model: "mock",
    deps,
  });
  assertEquals(report.systems.length, 2);
  assertEquals(manifests.length, 4); // 2 docs × 2 systems
  assert(isLocked(DEV_DOC_1));
});

Deno.test("T27 infra failure excluded from factual accuracy denominators", () => {
  const sc = scoreDocument({
    system_id: "vnext", system_capabilities: VNEXT_CAPABILITIES,
    document: DEV_DOC_1,
    output: { facts: [], line_items: [], product_configurations: [] },
    latency_ms: 5,
    infra_failure: "TRANSPORT_FAILURE",
  });
  assertEquals(sc.counts.facts_considered, 0);
  assertEquals(sc.counts.infra_failures, 1);
});
