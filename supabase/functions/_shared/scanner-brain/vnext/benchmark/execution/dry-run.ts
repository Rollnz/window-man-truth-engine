// Sprint 07B — Offline end-to-end dry run of the benchmark pipeline.
// No live provider calls. Uses locked synthetic manifests + injected mock
// adapter outputs to walk: select -> normalize -> score -> aggregate -> gate ->
// machine-readable comparison report.
import type {
  BenchmarkComparisonReport,
  DocumentScorecard,
  NormalizedSystemOutput,
  RunManifest,
  SystemAggregateScorecard,
} from "../benchmark-types.ts";
import {
  BENCHMARK_SCHEMA_VERSION,
  METRIC_VERSION,
  NORMALIZER_VERSION,
  SCORER_VERSION,
} from "../benchmark-types.ts";
import { THRESHOLD_CONFIG_VERSION } from "../benchmark-thresholds.ts";
import type { CorpusInventory, GoldenDocumentManifest } from "../corpus/manifest-types.ts";
import { isAuthoritative } from "../corpus/manifest-validator.ts";

// Provider-call counter — dry run asserts this stays at 0.
let PROVIDER_CALLS = 0;
export function _resetProviderCalls() { PROVIDER_CALLS = 0; }
export function _getProviderCalls() { return PROVIDER_CALLS; }
export function _incProviderCalls() { PROVIDER_CALLS++; }

export interface MockAdapterOutput {
  system_id: string;
  document_id: string;
  normalized: NormalizedSystemOutput;
  latency_ms: number;
  critical_hallucinations?: number;
  hallucinations?: number;
  facts_considered?: number;
  facts_correct?: number;
  human_review_required?: number;
}

export interface DryRunInputs {
  inventory: CorpusInventory;
  systems: string[];
  mockOutputs: MockAdapterOutput[];
  shared_capability_scope: string[];
  expanded_capability_scope: Record<string, string[]>;
}

export interface DryRunResult {
  report: BenchmarkComparisonReport;
  authoritative_document_count: number;
  non_authoritative_document_count: number;
  provider_calls: number;
}

function buildManifest(
  doc: GoldenDocumentManifest,
  system_id: string,
  latency_ms: number,
): RunManifest {
  return {
    run_id: `dry-${doc.document_id}-${system_id}`,
    run_group_id: `dry-${doc.corpus_version}`,
    document_id: doc.document_id,
    document_sha256: doc.sha256,
    dataset_split: doc.dataset_split,
    annotation_version: doc.annotation_version,
    annotation_locked: doc.locked,
    system_id,
    adapter_version: `${system_id}-dry`,
    system_version: "dry",
    provider: "mock",
    model: "mock",
    benchmark_schema_version: BENCHMARK_SCHEMA_VERSION,
    normalizer_version: NORMALIZER_VERSION,
    scorer_version: SCORER_VERSION,
    metric_version: METRIC_VERSION,
    threshold_config_version: THRESHOLD_CONFIG_VERSION,
    timestamp: "1970-01-01T00:00:00.000Z",
    latency_ms,
    tokens: { prompt: 0, completion: 0, total: 0 },
    raw_output_reference: `mock://${doc.document_id}/${system_id}`,
    normalized_output_reference: `mock-normalized://${doc.document_id}/${system_id}`,
    status: "ok",
  };
}

export function runOfflineBenchmarkDryRun(inputs: DryRunInputs): DryRunResult {
  _resetProviderCalls();
  const { inventory, systems, mockOutputs } = inputs;
  const docsById = new Map<string, GoldenDocumentManifest>();
  for (const d of inventory.documents) docsById.set(d.document_id, d);

  const scorecards: DocumentScorecard[] = [];
  const aggregatesByS: Record<
    string,
    {
      documents: number;
      facts_considered: number;
      facts_correct: number;
      critical: number;
      hallucinations: number;
      hrq: number;
      latencies: number[];
    }
  > = {};
  for (const s of systems) {
    aggregatesByS[s] = {
      documents: 0,
      facts_considered: 0,
      facts_correct: 0,
      critical: 0,
      hallucinations: 0,
      hrq: 0,
      latencies: [],
    };
  }

  let authoritative = 0;
  let nonAuthoritative = 0;
  const human_review_queue: BenchmarkComparisonReport["human_review_queue"] = [];

  for (const mock of mockOutputs) {
    const doc = docsById.get(mock.document_id);
    if (!doc) continue;
    const auth = isAuthoritative(doc);
    if (auth) authoritative++; else nonAuthoritative++;
    const _m = buildManifest(doc, mock.system_id, mock.latency_ms);
    const facts_considered = mock.facts_considered ?? mock.normalized.facts.length;
    const facts_correct = mock.facts_correct ?? facts_considered;
    const critical = mock.critical_hallucinations ?? 0;
    const halluc = mock.hallucinations ?? 0;
    const hrq = mock.human_review_required ?? 0;

    scorecards.push({
      system_id: mock.system_id,
      document_id: mock.document_id,
      annotation_locked: doc.locked,
      errors: [],
      counts: {
        facts_considered,
        facts_correct,
        hallucinations: halluc,
        critical_hallucinations: critical,
        evidence_missing: 0,
        evidence_unsupported: 0,
        line_items_ambiguous: 0,
        human_review_required: hrq,
        unsupported_by_system: 0,
        anomalies_expected: 0,
        anomalies_preserved: 0,
        cross_ref_valid: 0,
        cross_ref_dangling: 0,
        cross_ref_incorrect: 0,
        cross_ref_missing: 0,
        infra_failures: 0,
      },
      evidence_buckets: {
        EXACT_OR_NORMALIZED_MATCH: facts_correct,
        TEXT_CONTAINMENT_SUPPORTED: 0,
        PAGE_MATCH_SUPPORTED: 0,
        MISSING: 0,
        UNSUPPORTED: 0,
        PAGE_REFERENCE_WRONG: 0,
        HUMAN_REVIEW_REQUIRED: hrq,
      },
      latency_ms: mock.latency_ms,
    });

    const agg = aggregatesByS[mock.system_id];
    if (agg) {
      agg.documents++;
      agg.facts_considered += facts_considered;
      agg.facts_correct += facts_correct;
      agg.critical += critical;
      agg.hallucinations += halluc;
      agg.hrq += hrq;
      agg.latencies.push(mock.latency_ms);
    }
    for (let i = 0; i < hrq; i++) {
      human_review_queue.push({
        system_id: mock.system_id,
        document_id: mock.document_id,
        reason: "mock: human review required",
      });
    }
  }

  const percentile = (xs: number[], p: number) => {
    if (xs.length === 0) return 0;
    const s = [...xs].sort((a, b) => a - b);
    const i = Math.min(s.length - 1, Math.floor((p / 100) * s.length));
    return s[i];
  };

  const aggregates: SystemAggregateScorecard[] = systems.map((s) => {
    const a = aggregatesByS[s];
    const acc = a.facts_considered > 0 ? a.facts_correct / a.facts_considered : 0;
    const hrRate =
      a.facts_considered > 0 ? a.hallucinations / a.facts_considered : 0;
    const gateFailures: string[] = [];
    if (a.critical > 0) gateFailures.push("CRITICAL_HALLUCINATIONS_PRESENT");
    return {
      system_id: s,
      documents: a.documents,
      aggregate_accuracy: acc,
      critical_hallucinations: a.critical,
      hallucination_rate: hrRate,
      evidence_support_rate: acc,
      anomaly_preservation_rate: 1,
      cross_reference_coherence_rate: 1,
      human_review_required: a.hrq,
      latency_ms_p50: percentile(a.latencies, 50),
      latency_ms_p95: percentile(a.latencies, 95),
      gate_failures: gateFailures,
    };
  });

  const anyCritical = aggregates.some((a) => a.critical_hallucinations > 0);
  const gate_status: "PASS" | "FAIL" = anyCritical ? "FAIL" : "PASS";
  const gate_reasons = anyCritical ? ["CRITICAL_HALLUCINATIONS_PRESENT"] : [];

  const report: BenchmarkComparisonReport = {
    comparison_id: `dry-${inventory.corpus_version}`,
    generated_at: "1970-01-01T00:00:00.000Z",
    authoritative: nonAuthoritative === 0,
    benchmark_schema_version: BENCHMARK_SCHEMA_VERSION,
    normalizer_version: NORMALIZER_VERSION,
    scorer_version: SCORER_VERSION,
    metric_version: METRIC_VERSION,
    threshold_config_version: THRESHOLD_CONFIG_VERSION,
    systems,
    documents: inventory.documents.map((d) => d.document_id),
    scorecards,
    aggregates,
    shared_capability_scope: inputs.shared_capability_scope,
    expanded_capability_scope: inputs.expanded_capability_scope,
    gate_status,
    gate_reasons,
    human_review_queue,
  };

  return {
    report,
    authoritative_document_count: authoritative,
    non_authoritative_document_count: nonAuthoritative,
    provider_calls: _getProviderCalls(),
  };
}
