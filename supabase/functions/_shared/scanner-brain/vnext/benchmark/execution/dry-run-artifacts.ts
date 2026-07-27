// Sprint 07B.2 — Offline dry-run artifact serialization.
// Every artifact produced here is explicitly NON_AUTHORITATIVE_DRY_RUN and must
// never be confused with a scored Sprint 07C benchmark result.
import type { BenchmarkComparisonReport } from "../benchmark-types.ts";

export const DRY_RUN_LABEL = "NON_AUTHORITATIVE_DRY_RUN" as const;

export interface DryRunArtifactEnvelope<T> {
  artifact: string;
  label: typeof DRY_RUN_LABEL;
  authoritative: false;
  provider_calls: number;
  generated_at: string;
  corpus_version: string;
  data: T;
}

function envelope<T>(
  artifact: string,
  data: T,
  corpus_version: string,
  generated_at: string,
  provider_calls: number,
): DryRunArtifactEnvelope<T> {
  return {
    artifact,
    label: DRY_RUN_LABEL,
    authoritative: false,
    provider_calls,
    generated_at,
    corpus_version,
    data,
  };
}

export interface DryRunArtifacts {
  "BENCHMARK_RESULTS.json": DryRunArtifactEnvelope<BenchmarkComparisonReport>;
  "DOCUMENT_SCORECARDS.json": DryRunArtifactEnvelope<BenchmarkComparisonReport["scorecards"]>;
  "SYSTEM_SCORECARDS.json": DryRunArtifactEnvelope<BenchmarkComparisonReport["aggregates"]>;
  "BENCHMARK_COMPARISON.json": DryRunArtifactEnvelope<{
    systems: string[];
    documents: string[];
    gate_status: string;
    gate_reasons: string[];
    shared_capability_scope: string[];
    expanded_capability_scope: Record<string, string[]>;
  }>;
  "HUMAN_REVIEW_QUEUE.json": DryRunArtifactEnvelope<BenchmarkComparisonReport["human_review_queue"]>;
}

export function buildDryRunArtifacts(
  report: BenchmarkComparisonReport,
  opts: { corpus_version: string; provider_calls: number; generated_at?: string },
): DryRunArtifacts {
  const at = opts.generated_at ?? "1970-01-01T00:00:00.000Z";
  const e = <T>(name: string, data: T) =>
    envelope(name, data, opts.corpus_version, at, opts.provider_calls);
  return {
    "BENCHMARK_RESULTS.json": e("BENCHMARK_RESULTS", report),
    "DOCUMENT_SCORECARDS.json": e("DOCUMENT_SCORECARDS", report.scorecards),
    "SYSTEM_SCORECARDS.json": e("SYSTEM_SCORECARDS", report.aggregates),
    "BENCHMARK_COMPARISON.json": e("BENCHMARK_COMPARISON", {
      systems: report.systems,
      documents: report.documents,
      gate_status: report.gate_status,
      gate_reasons: report.gate_reasons,
      shared_capability_scope: report.shared_capability_scope,
      expanded_capability_scope: report.expanded_capability_scope,
    }),
    "HUMAN_REVIEW_QUEUE.json": e("HUMAN_REVIEW_QUEUE", report.human_review_queue),
  };
}

export function serializeDryRunArtifacts(a: DryRunArtifacts): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(a)) {
    out[name] = JSON.stringify(value, null, 2) + "\n";
  }
  return out;
}
