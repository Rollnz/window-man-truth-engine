// Sprint 07A — Headless benchmark runner. Side-effect-free coordinator.
// No live provider calls here; adapters are injected.

import type {
  BenchmarkComparisonReport,
  DocumentScorecard,
  GroundTruthDocument,
  RunManifest,
} from "./benchmark-types.ts";
import {
  BENCHMARK_SCHEMA_VERSION, NORMALIZER_VERSION,
  SCORER_VERSION, METRIC_VERSION,
} from "./benchmark-types.ts";
import type { BenchmarkSystemAdapter } from "./adapters/adapter-contract.ts";
import { createRunManifest, type RunManifestDeps } from "./run-manifest.ts";
import { aggregateSystemScorecards, scoreDocument, fieldToCapability } from "./scorer.ts";
import { partitionCapabilityScope } from "./adapters/capability-matrix.ts";
import { type ThresholdConfig } from "./benchmark-thresholds.ts";

export interface BenchmarkRunnerInput {
  documents: GroundTruthDocument[];
  systems: BenchmarkSystemAdapter[];
  thresholds: ThresholdConfig;
  provider: string;
  model: string;
  deps: RunManifestDeps;
  run_group_id?: string;
}

export interface BenchmarkExecutionResult {
  report: BenchmarkComparisonReport;
  manifests: RunManifest[];
}

export async function runBenchmark(
  input: BenchmarkRunnerInput,
): Promise<BenchmarkExecutionResult> {
  const run_group_id = input.run_group_id ?? input.deps.uuid();
  const scorecards: DocumentScorecard[] = [];
  const manifests: RunManifest[] = [];
  let authoritative = true;

  for (const doc of input.documents) {
    if (!doc.meta.locked) authoritative = false;
    for (const sys of input.systems) {
      const started = input.deps.now().getTime();
      const runResult = await sys.run(doc, {
        run_group_id,
        provider: input.provider,
        model: input.model,
      });
      const elapsed = runResult.latency_ms || (input.deps.now().getTime() - started);

      const manifest = createRunManifest({
        run_group_id,
        document_id: doc.document_id,
        document_sha256: doc.document_sha256,
        dataset_split: doc.dataset_split,
        annotation_version: doc.meta.annotation_version,
        annotation_locked: doc.meta.locked,
        system_id: sys.systemId,
        adapter_version: sys.adapterVersion,
        system_version: runResult.system_version,
        brain_version: runResult.brain_version,
        analysis_schema_version: runResult.analysis_schema_version,
        prompt_version: runResult.prompt_version,
        provider: input.provider,
        model: input.model,
        latency_ms: elapsed,
        tokens: runResult.tokens,
        raw_output_reference: `mem://${sys.systemId}/${doc.document_id}/raw`,
        normalized_output_reference: `mem://${sys.systemId}/${doc.document_id}/normalized`,
        status: runResult.status,
        failure_code: runResult.failure_code,
      }, input.deps);
      manifests.push(manifest);

      const scorecard = scoreDocument({
        system_id: sys.systemId,
        system_capabilities: sys.capabilities(),
        document: doc,
        output: runResult.normalized,
        latency_ms: elapsed,
        infra_failure: runResult.status === "infra_failure" ? runResult.failure_code : undefined,
      });
      scorecards.push(scorecard);
    }
  }

  const allFields = Array.from(
    new Set(input.documents.flatMap((d) => d.facts.map((f) => f.semantic_field))),
  ).sort();
  const scope = partitionCapabilityScope(
    allFields,
    fieldToCapability,
    input.systems.map((s) => s.capabilities()),
  );

  const aggregates = input.systems.map((s) =>
    aggregateSystemScorecards(s.systemId, scorecards, input.thresholds)
  );

  const gate_reasons = aggregates.flatMap((a) => a.gate_failures);
  const gate_status: "PASS" | "FAIL" = gate_reasons.length === 0 ? "PASS" : "FAIL";

  const human_review_queue: BenchmarkComparisonReport["human_review_queue"] = [];
  for (const sc of scorecards) {
    for (const e of sc.errors) {
      if (e.code === "HUMAN_REVIEW_REQUIRED" || e.code === "LINE_ITEM_MATCH_AMBIGUOUS") {
        human_review_queue.push({
          system_id: sc.system_id,
          document_id: sc.document_id,
          fact_id: e.fact_id,
          reason: e.detail ?? e.code,
        });
      }
    }
  }

  const report: BenchmarkComparisonReport = {
    comparison_id: input.deps.uuid(),
    generated_at: input.deps.now().toISOString(),
    authoritative,
    benchmark_schema_version: BENCHMARK_SCHEMA_VERSION,
    normalizer_version: NORMALIZER_VERSION,
    scorer_version: SCORER_VERSION,
    metric_version: METRIC_VERSION,
    threshold_config_version: input.thresholds.version,
    systems: input.systems.map((s) => s.systemId),
    documents: input.documents.map((d) => d.document_id),
    scorecards,
    aggregates,
    shared_capability_scope: scope.shared,
    expanded_capability_scope: scope.expanded,
    gate_status,
    gate_reasons,
    human_review_queue,
  };

  return { report, manifests };
}

export function serializeReport(r: BenchmarkComparisonReport): string {
  return JSON.stringify(r);
}
export function deserializeReport(s: string): BenchmarkComparisonReport {
  return JSON.parse(s) as BenchmarkComparisonReport;
}
