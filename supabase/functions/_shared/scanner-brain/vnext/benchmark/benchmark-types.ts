// Sprint 07A — Machine-readable benchmark contracts.
// This module deliberately does NOT import canonical vNext types.
import type { ErrorCode, Severity } from "./error-taxonomy.ts";

export const BENCHMARK_SCHEMA_VERSION = "b-v1.0.0";
export const NORMALIZER_VERSION = "n-v1.0.0";
export const SCORER_VERSION = "s-v1.0.0";
export const METRIC_VERSION = "m-v1.0.0";

export type DatasetSplit = "development" | "holdout";

export type ExpectedStatus = "found" | "not_found" | "uncertain" | "not_applicable";
export type Certainty = "definite" | "ambiguous" | "not_present" | "not_applicable";
export type EntityRole = "homeowner" | "property" | "contractor" | "salesperson" | "other";

export interface GroundTruthEvidence {
  page?: number;
  source_text?: string;
  location_hint?: string;
  annotator_note?: string;
}

export interface GroundTruthFact {
  fact_id: string;
  semantic_field: string;          // e.g. "quote.total", "entity.homeowner.name"
  expected_status: ExpectedStatus;
  value: unknown;                  // canonical human value (Layer A, source-neutral)
  entity_role?: EntityRole;
  evidence: GroundTruthEvidence[];
  certainty: Certainty;
  severity: Severity;
  anomaly?: boolean;               // e.g. 120% deposit
  notes?: string;
}

export type ReviewStatus = "unreviewed" | "in_review" | "agreed" | "disagreed";
export type AdjudicationStatus = "not_required" | "pending" | "adjudicated";

export interface GroundTruthAnnotationMeta {
  annotated_by: string;            // internal reviewer id (no PII required)
  reviewed_by?: string;
  annotation_version: string;
  review_status: ReviewStatus;
  adjudication_status: AdjudicationStatus;
  adjudication_notes?: string;
  locked: boolean;
}

export interface GroundTruthDocument {
  document_id: string;
  document_sha256: string;
  dataset_split: DatasetSplit;
  archetype?: string;
  meta: GroundTruthAnnotationMeta;
  facts: GroundTruthFact[];
}

export type CapabilityState =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "UNSUPPORTED"
  | "RUNTIME_NOT_AVAILABLE";

export interface SystemCapability {
  capability: string;              // e.g. "entity.salesperson.role_separation"
  state: CapabilityState;
  note?: string;
}

export interface SystemCapabilityDeclaration {
  system_id: string;
  adapter_version: string;
  capabilities: SystemCapability[];
}

// A single scanner's normalized fact assertion.
export interface AssertedFact {
  semantic_field: string;
  status: ExpectedStatus | "unsupported_by_system";
  value: unknown;
  entity_role?: EntityRole;
  evidence?: {
    page?: number;
    source_text?: string;
  };
  confidence?: number;             // 0..1
}

export interface AssertedLineItem {
  line_item_id?: string;
  stable_line_id?: string;
  opening_location?: string;
  product_type?: string;
  quantity?: number;
  unit_price?: number;
  width_in?: number;
  height_in?: number;
  manufacturer?: string;
  series?: string;
  description?: string;
  product_configuration_id?: string;
}

export interface AssertedProductConfiguration {
  product_configuration_id: string;
  applies_to_line_item_ids?: string[];
  fields?: Record<string, unknown>;
}

export interface NormalizedSystemOutput {
  facts: AssertedFact[];
  line_items: AssertedLineItem[];
  product_configurations: AssertedProductConfiguration[];
}

export type RunStatus = "ok" | "infra_failure";

export interface RunManifest {
  run_id: string;
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

  benchmark_schema_version: string;
  normalizer_version: string;
  scorer_version: string;
  metric_version: string;
  threshold_config_version: string;

  timestamp: string;               // ISO
  latency_ms: number;
  tokens: { prompt: number; completion: number; total: number };

  raw_output_reference: string;
  normalized_output_reference: string;

  status: RunStatus;
  failure_code?: ErrorCode;
}

export interface BenchmarkRunResult {
  manifest: RunManifest;
  raw_output: unknown;
  normalized_output: NormalizedSystemOutput;
}

export interface ErrorInstance {
  code: ErrorCode;
  severity: Severity;
  semantic_field?: string;
  fact_id?: string;
  detail?: string;
}

export interface EvidenceBucket {
  EXACT_OR_NORMALIZED_MATCH: number;
  TEXT_CONTAINMENT_SUPPORTED: number;
  PAGE_MATCH_SUPPORTED: number;
  MISSING: number;
  UNSUPPORTED: number;
  PAGE_REFERENCE_WRONG: number;
  HUMAN_REVIEW_REQUIRED: number;
}

export interface DocumentScorecard {
  system_id: string;
  document_id: string;
  annotation_locked: boolean;
  errors: ErrorInstance[];
  counts: {
    facts_considered: number;      // denominator (post-capability, post-NA exclusion)
    facts_correct: number;
    hallucinations: number;
    critical_hallucinations: number;
    evidence_missing: number;
    evidence_unsupported: number;
    line_items_ambiguous: number;
    human_review_required: number;
    unsupported_by_system: number;
    anomalies_expected: number;
    anomalies_preserved: number;
    cross_ref_valid: number;
    cross_ref_dangling: number;
    cross_ref_incorrect: number;
    cross_ref_missing: number;
    infra_failures: number;
  };
  evidence_buckets: EvidenceBucket;
  latency_ms: number;
}

export interface SystemAggregateScorecard {
  system_id: string;
  documents: number;
  aggregate_accuracy: number;      // facts_correct / facts_considered
  critical_hallucinations: number;
  hallucination_rate: number;
  evidence_support_rate: number;
  anomaly_preservation_rate: number;
  cross_reference_coherence_rate: number;
  human_review_required: number;
  latency_ms_p50: number;
  latency_ms_p95: number;
  gate_failures: string[];
}

export interface FieldStabilitySample {
  run_group_id: string;
  document_id: string;
  system_id: string;
  facts: Array<{ semantic_field: string; value: unknown }>;
}

export interface BenchmarkComparisonReport {
  comparison_id: string;
  generated_at: string;
  authoritative: boolean;          // false if any doc has annotation_locked=false
  benchmark_schema_version: string;
  normalizer_version: string;
  scorer_version: string;
  metric_version: string;
  threshold_config_version: string;
  systems: string[];
  documents: string[];
  scorecards: DocumentScorecard[];
  aggregates: SystemAggregateScorecard[];
  shared_capability_scope: string[];
  expanded_capability_scope: Record<string, string[]>; // system_id -> extra capabilities
  gate_status: "PASS" | "FAIL";
  gate_reasons: string[];
  human_review_queue: Array<{
    system_id: string;
    document_id: string;
    fact_id?: string;
    reason: string;
  }>;
}
