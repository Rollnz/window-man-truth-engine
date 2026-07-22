// Sprint 07B — Frozen Sprint 07C execution configuration.
import {
  BENCHMARK_SCHEMA_VERSION,
  METRIC_VERSION,
  NORMALIZER_VERSION,
  SCORER_VERSION,
} from "../benchmark-types.ts";
import { THRESHOLDS_VERSION } from "../benchmark-thresholds.ts";
import {
  VNEXT_ADAPTER_VERSION,
  VNEXT_PINNED_MODEL,
  VNEXT_PINNED_PROVIDER,
} from "../adapters/vnext-adapter-readiness.ts";
import { BRAIN3_ADAPTER_VERSION } from "../adapters/brain3-adapter-readiness.ts";
import { WMMVP_ADAPTER_VERSION } from "../adapters/wmmvp-adapter-readiness.ts";

export const CAPABILITY_MATRIX_VERSION = "cap-matrix-v1.0.0";
export const EXECUTION_CONFIG_VERSION = "exec-config-v1.0.0";

export interface SystemExecutionPolicy {
  system_id: string;
  adapter_version: string;
  provider: string;
  model: string;
  runtime_eligible: boolean;
  eligible_for_runtime_leaderboard: boolean;
  notes?: string;
}

export interface BenchmarkExecutionConfig {
  execution_config_version: string;
  corpus_version: string;
  capability_matrix_version: string;
  benchmark_schema_version: string;
  normalizer_version: string;
  scorer_version: string;
  metric_version: string;
  threshold_config_version: string;
  systems: SystemExecutionPolicy[];
  repetition_plan: {
    default_runs_per_document: number;
    repeatability_subset_document_ids: string[];
    repeatability_runs: number;
  };
  concurrency_policy: {
    max_parallel_documents: number;
    max_parallel_systems_per_document: number;
  };
  provider_call_budget_policy:
    | "STRUCTURAL_ONLY_NO_LIVE"
    | "APPROVED_LIVE_EXECUTION";
}

export function buildExecutionConfig(
  corpus_version: string,
): BenchmarkExecutionConfig {
  return {
    execution_config_version: EXECUTION_CONFIG_VERSION,
    corpus_version,
    capability_matrix_version: CAPABILITY_MATRIX_VERSION,
    benchmark_schema_version: BENCHMARK_SCHEMA_VERSION,
    normalizer_version: NORMALIZER_VERSION,
    scorer_version: SCORER_VERSION,
    metric_version: METRIC_VERSION,
    threshold_config_version: THRESHOLDS_VERSION,
    systems: [
      {
        system_id: "vnext",
        adapter_version: VNEXT_ADAPTER_VERSION,
        provider: VNEXT_PINNED_PROVIDER,
        model: VNEXT_PINNED_MODEL,
        runtime_eligible: true,
        eligible_for_runtime_leaderboard: true,
      },
      {
        system_id: "brain3",
        adapter_version: BRAIN3_ADAPTER_VERSION,
        provider: "lovable-ai-gateway",
        model: "as-built (documented in Brain 3 configuration)",
        runtime_eligible: true,
        eligible_for_runtime_leaderboard: true,
        notes: "Requires benchmark-only wrapper to suppress DB/tracking side effects.",
      },
      {
        system_id: "wmmvp",
        adapter_version: WMMVP_ADAPTER_VERSION,
        provider: "n/a",
        model: "n/a",
        runtime_eligible: false,
        eligible_for_runtime_leaderboard: false,
        notes: "REFERENCE_RUNTIME_NOT_AVAILABLE — architectural reference only.",
      },
    ],
    repetition_plan: {
      default_runs_per_document: 1,
      repeatability_subset_document_ids: [],
      repeatability_runs: 3,
    },
    concurrency_policy: {
      max_parallel_documents: 2,
      max_parallel_systems_per_document: 1,
    },
    provider_call_budget_policy: "STRUCTURAL_ONLY_NO_LIVE",
  };
}

// Deterministic "benchmark identity hash" surface: any change to a version field
// listed here yields a different identity string. Cheap composition (no crypto)
// because it's used purely for test-level drift detection.
export function benchmarkIdentityString(c: BenchmarkExecutionConfig): string {
  return [
    c.execution_config_version,
    c.corpus_version,
    c.capability_matrix_version,
    c.benchmark_schema_version,
    c.normalizer_version,
    c.scorer_version,
    c.metric_version,
    c.threshold_config_version,
    ...c.systems.map((s) => `${s.system_id}:${s.adapter_version}:${s.model}`),
  ].join("|");
}
