// Sprint 07A — Immutable versioned run manifest.
import type { RunManifest, DatasetSplit, RunStatus } from "./benchmark-types.ts";
import { ERROR_CODES, type ErrorCode } from "./error-taxonomy.ts";
import {
  BENCHMARK_SCHEMA_VERSION,
  NORMALIZER_VERSION,
  SCORER_VERSION,
  METRIC_VERSION,
} from "./benchmark-types.ts";
import { THRESHOLD_CONFIG_VERSION } from "./benchmark-thresholds.ts";

export interface RunManifestDeps {
  now: () => Date;
  uuid: () => string;
  hash: (input: string) => string;
}

export interface CreateRunManifestInput {
  run_group_id: string;
  document_id: string;
  document_sha256: string;
  dataset_split: DatasetSplit;
  annotation_version: string;
  annotation_locked: boolean;
  system_id: string;
  adapter_version: string;
  system_version: string;
  brain_version?: string;
  analysis_schema_version?: string;
  prompt_version?: string;
  provider: string;
  model: string;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
  raw_output_reference: string;
  normalized_output_reference: string;
  status: RunStatus;
  failure_code?: ErrorCode;
}

export function createRunManifest(
  input: CreateRunManifestInput,
  deps: RunManifestDeps,
): Readonly<RunManifest> {
  const timestamp = deps.now().toISOString();
  const identitySeed = [
    input.system_id,
    input.system_version,
    input.brain_version ?? "",
    input.analysis_schema_version ?? "",
    input.prompt_version ?? "",
    input.document_sha256,
    input.dataset_split,
    input.annotation_version,
    input.model,
    timestamp,
  ].join("|");
  const run_id = deps.uuid() + "-" + deps.hash(identitySeed).slice(0, 12);

  const manifest: RunManifest = {
    run_id,
    run_group_id: input.run_group_id,
    document_id: input.document_id,
    document_sha256: input.document_sha256,
    dataset_split: input.dataset_split,
    annotation_version: input.annotation_version,
    annotation_locked: input.annotation_locked,

    system_id: input.system_id,
    adapter_version: input.adapter_version,
    system_version: input.system_version,
    brain_version: input.brain_version,
    analysis_schema_version: input.analysis_schema_version,
    prompt_version: input.prompt_version,

    provider: input.provider,
    model: input.model,

    benchmark_schema_version: BENCHMARK_SCHEMA_VERSION,
    normalizer_version: NORMALIZER_VERSION,
    scorer_version: SCORER_VERSION,
    metric_version: METRIC_VERSION,
    threshold_config_version: THRESHOLD_CONFIG_VERSION,

    timestamp,
    latency_ms: input.latency_ms,
    tokens: input.tokens ?? { prompt: 0, completion: 0, total: 0 },

    raw_output_reference: input.raw_output_reference,
    normalized_output_reference: input.normalized_output_reference,

    status: input.status,
    failure_code: input.failure_code,
  };
  return Object.freeze(manifest);
}

export const INFRA_FAILURE_CODES = new Set<ErrorCode>([
  ERROR_CODES.TRANSPORT_FAILURE,
  ERROR_CODES.PARSE_FAILURE,
  ERROR_CODES.CANONICAL_VALIDATION_FAILURE,
]);
