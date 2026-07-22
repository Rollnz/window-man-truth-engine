// Sprint 07B — Corpus, adapter-readiness, dry-run, and freeze tests (offline).
import { assert, assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";

import {
  validateDocumentManifest,
  validateCorpusInventory,
  isAuthoritative,
} from "./manifest-validator.ts";
import type { CorpusInventory, GoldenDocumentManifest } from "./manifest-types.ts";
import { buildCorpusLock } from "./corpus-lock.ts";
import { buildCoverageReport, partitionSyntheticVsReal } from "./coverage-report.ts";
import { CORPUS_V1_PRE_INVENTORY, SYNTHETIC_CONTROL_MANIFESTS } from "./inventory.ts";

import {
  assertVNextModelPinned,
  VNextModelDriftError,
  VNEXT_PINNED_MODEL,
  getVNextAdapterReadiness,
} from "../adapters/vnext-adapter-readiness.ts";
import {
  guardBrain3Invocation,
  Brain3SideEffectGuardError,
  getBrain3AdapterReadiness,
} from "../adapters/brain3-adapter-readiness.ts";
import {
  assertWmMvpRuntimeClaim,
  WmMvpMasqueradeError,
  getWmMvpAdapterReadiness,
} from "../adapters/wmmvp-adapter-readiness.ts";

import {
  buildExecutionConfig,
  benchmarkIdentityString,
  EXECUTION_CONFIG_VERSION,
  CAPABILITY_MATRIX_VERSION,
} from "../execution/benchmark-execution-config.ts";
import { estimateCallBudget } from "../execution/call-budget.ts";
import { runOfflineBenchmarkDryRun, _getProviderCalls } from "../execution/dry-run.ts";

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

const BASE_DOC: GoldenDocumentManifest = SYNTHETIC_CONTROL_MANIFESTS[0];

// ─── 1. Manifest validation ──────────────────────────────────────────────
Deno.test("07B.01 manifest missing sha256/split/annotation/PII fails validation", () => {
  const bad = clone(BASE_DOC);
  (bad as unknown as Record<string, unknown>).sha256 = "xyz";
  (bad as unknown as Record<string, unknown>).dataset_split = undefined;
  (bad as unknown as Record<string, unknown>).annotation_version = "";
  (bad as unknown as Record<string, unknown>).pii_review_status = undefined;
  const issues = validateDocumentManifest(bad);
  const codes = new Set(issues.map((i) => i.code));
  assert(codes.has("SHA256_INVALID"));
  assert(codes.has("DATASET_SPLIT_MISSING"));
  assert(codes.has("ANNOTATION_VERSION_MISSING"));
  assert(codes.has("PII_STATUS_MISSING"));
});

// ─── 2. PII review gate ─────────────────────────────────────────────────
Deno.test("07B.02 deidentified_pending_review cannot be authoritative", () => {
  const d = clone(BASE_DOC);
  d.source_type = "deidentified_real";
  d.pii_review_status = "deidentified_pending_review";
  d.locked = true;
  const issues = validateDocumentManifest(d);
  assert(issues.some((i) => i.code === "AUTHORITATIVE_PII_UNVERIFIED"));
  assertEquals(isAuthoritative(d), false);
});

// ─── 3. Annotation lock gate ────────────────────────────────────────────
Deno.test("07B.03 unlocked truth is non-authoritative", () => {
  const d = clone(BASE_DOC);
  d.locked = false;
  assertEquals(isAuthoritative(d), false);
});

// ─── 4. Annotation version mutation ─────────────────────────────────────
Deno.test("07B.04 ground-truth mutation requires new annotation_version", async () => {
  const inv1: CorpusInventory = { corpus_version: "gq-t", documents: [clone(BASE_DOC)] };
  const inv2: CorpusInventory = clone(inv1);
  inv2.documents[0].sha256 = "1".repeat(64); // mimic ground-truth change
  const lock1 = await buildCorpusLock(inv1);
  const lock2 = await buildCorpusLock(inv2);
  // Identity hash must change when factual projection changes even under
  // identical annotation_version (drift protection).
  assert(lock1.corpus_identity_hash !== lock2.corpus_identity_hash);
  // And explicitly bumping annotation_version also changes identity.
  inv2.documents[0].annotation_version = "2.0.0";
  const lock3 = await buildCorpusLock(inv2);
  assert(lock3.corpus_identity_hash !== lock2.corpus_identity_hash);
});

// ─── 5. Corpus lock determinism ─────────────────────────────────────────
Deno.test("07B.05 corpus lock hash is deterministic for identical inputs", async () => {
  const a = await buildCorpusLock(CORPUS_V1_PRE_INVENTORY);
  const b = await buildCorpusLock(CORPUS_V1_PRE_INVENTORY);
  assertEquals(a.corpus_identity_hash, b.corpus_identity_hash);
});

// ─── 6. Split integrity ─────────────────────────────────────────────────
Deno.test("07B.06 no document may belong to both dev and holdout", () => {
  const dup1 = clone(BASE_DOC);
  const dup2 = clone(BASE_DOC);
  dup2.dataset_split = "holdout";
  const inv: CorpusInventory = { corpus_version: "gq-t", documents: [dup1, dup2] };
  const issues = validateCorpusInventory(inv);
  assert(issues.some((i) => i.code === "SPLIT_OVERLAP" || i.code === "DOCUMENT_ID_DUPLICATE"));
});

// ─── 7. Archetype coverage ──────────────────────────────────────────────
Deno.test("07B.07 coverage report identifies missing required archetypes", () => {
  const r = buildCoverageReport(CORPUS_V1_PRE_INVENTORY);
  assert(r.missing_required_archetypes.length > 0);
  assert(r.missing_required_archetypes.includes("MULTI_PRODUCT"));
  assertEquals(r.ready_for_authoritative_execution, false);
  assert(r.readiness_blockers.includes("NO_DEIDENTIFIED_REAL_DOCUMENTS"));
});

// ─── 8. Synthetic vs real separation ────────────────────────────────────
Deno.test("07B.08 aggregate report separates synthetic vs deidentified real", () => {
  const results = [
    { document_id: "GQ-001", score: 1 },
    { document_id: "GQ-002", score: 1 },
  ];
  const partitioned = partitionSyntheticVsReal(results, CORPUS_V1_PRE_INVENTORY);
  assertEquals(partitioned.synthetic.length, 2);
  assertEquals(partitioned.deidentified_real.length, 0);
});

// ─── 9. vNext model pinning ─────────────────────────────────────────────
Deno.test("07B.09 vNext adapter cannot silently drift model", () => {
  assertVNextModelPinned(VNEXT_PINNED_MODEL); // ok
  assertThrows(
    () => assertVNextModelPinned("openai/gpt-4o-mini"),
    VNextModelDriftError,
  );
  assertEquals(getVNextAdapterReadiness().status, "READY_FOR_CONTROLLED_EXECUTION");
});

// ─── 10. Brain 3 side-effect guard ──────────────────────────────────────
Deno.test("07B.10 Brain 3 adapter refuses side-effectful ops without wrapper token", () => {
  assertThrows(
    () => guardBrain3Invocation("insert_quote_analyses"),
    Brain3SideEffectGuardError,
  );
  // With token: allowed.
  guardBrain3Invocation("insert_quote_analyses", "benchmark-only-wrapper");
  assertEquals(getBrain3AdapterReadiness().status, "SAFE_WRAPPER_REQUIRED");
});

// ─── 11. WM MVP masquerade guard ────────────────────────────────────────
Deno.test("07B.11 WM MVP static/reference-only mode cannot masquerade as runtime-ready", () => {
  assertEquals(getWmMvpAdapterReadiness().status, "REFERENCE_RUNTIME_NOT_AVAILABLE");
  assertEquals(getWmMvpAdapterReadiness().eligible_for_runtime_accuracy_leaderboard, false);
  assertThrows(
    () => assertWmMvpRuntimeClaim("ACTUAL_DONOR_RUNTIME_READY"),
    WmMvpMasqueradeError,
  );
});

// ─── 12. Capability matrix freeze ───────────────────────────────────────
Deno.test("07B.12 scored execution config references one immutable capability matrix version", () => {
  const cfg = buildExecutionConfig("gq-v1-pre");
  assertEquals(cfg.capability_matrix_version, CAPABILITY_MATRIX_VERSION);
  assertEquals(cfg.execution_config_version, EXECUTION_CONFIG_VERSION);
});

// ─── 13. Benchmark identity drift ───────────────────────────────────────
Deno.test("07B.13 changing prompt/model/thresholds/corpus/scorer changes benchmark identity", () => {
  const a = buildExecutionConfig("gq-v1-pre");
  const b = buildExecutionConfig("gq-v1-pre");
  assertEquals(benchmarkIdentityString(a), benchmarkIdentityString(b));
  const c = buildExecutionConfig("gq-v2");
  assert(benchmarkIdentityString(a) !== benchmarkIdentityString(c));
  // Simulate an adapter/model swap.
  const d = buildExecutionConfig("gq-v1-pre");
  d.systems[0].model = "google/some-other-model";
  assert(benchmarkIdentityString(a) !== benchmarkIdentityString(d));
});

// ─── 14. Dry-run end-to-end ─────────────────────────────────────────────
Deno.test("07B.14 offline dry run produces a complete comparison report with 0 provider calls", () => {
  const result = runOfflineBenchmarkDryRun({
    inventory: CORPUS_V1_PRE_INVENTORY,
    systems: ["vnext", "brain3"],
    mockOutputs: [
      {
        system_id: "vnext", document_id: "GQ-001", latency_ms: 100,
        normalized: { facts: [], line_items: [], product_configurations: [] },
        facts_considered: 10, facts_correct: 10,
      },
      {
        system_id: "vnext", document_id: "GQ-002", latency_ms: 120,
        normalized: { facts: [], line_items: [], product_configurations: [] },
        facts_considered: 5, facts_correct: 5,
      },
      {
        system_id: "brain3", document_id: "GQ-001", latency_ms: 150,
        normalized: { facts: [], line_items: [], product_configurations: [] },
        facts_considered: 10, facts_correct: 8, hallucinations: 1,
      },
      {
        system_id: "brain3", document_id: "GQ-002", latency_ms: 160,
        normalized: { facts: [], line_items: [], product_configurations: [] },
        facts_considered: 5, facts_correct: 4, critical_hallucinations: 1,
      },
    ],
    shared_capability_scope: ["quote.total", "entity.contractor.name"],
    expanded_capability_scope: { vnext: ["entity.salesperson.name"], brain3: [] },
  });
  assertEquals(result.provider_calls, 0);
  assertEquals(result.report.systems.length, 2);
  assertEquals(result.report.scorecards.length, 4);
  // Critical hallucination gate must override aggregate.
  assertEquals(result.report.gate_status, "FAIL");
  assert(result.report.gate_reasons.includes("CRITICAL_HALLUCINATIONS_PRESENT"));
  // Locked synthetic controls => authoritative flag stays true; if any doc were
  // unlocked it would flip to false. Both synthetics are locked here.
  assertEquals(result.report.authoritative, true);
});

// ─── 15. Zero provider calls across suite ───────────────────────────────
Deno.test("07B.15 sprint 07B suite makes zero live provider calls", () => {
  assertEquals(_getProviderCalls(), 0);
  // Call budget is structural only.
  const cfg = buildExecutionConfig("gq-v1-pre");
  const est = estimateCallBudget(cfg, 15);
  assertEquals(est.policy, "STRUCTURAL_ONLY_NO_LIVE");
  const vnext = est.per_system.find((s) => s.system_id === "vnext")!;
  assertEquals(vnext.ai_calls_per_run, 4);
  const wmmvp = est.per_system.find((s) => s.system_id === "wmmvp")!;
  assertEquals(wmmvp.runtime_eligible, false);
  assertEquals(wmmvp.total_ai_calls, 0);
});
