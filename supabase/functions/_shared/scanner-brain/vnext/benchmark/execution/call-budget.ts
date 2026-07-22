// Sprint 07B — Structural provider-call budget estimator (no dollars, no live calls).
import type { BenchmarkExecutionConfig } from "./benchmark-execution-config.ts";

export interface SystemCallProfile {
  system_id: string;
  ai_calls_per_document_run: number;
  runtime_eligible: boolean;
}

export const SYSTEM_CALL_PROFILES: Record<string, SystemCallProfile> = {
  vnext: { system_id: "vnext", ai_calls_per_document_run: 4, runtime_eligible: true },
  brain3: { system_id: "brain3", ai_calls_per_document_run: 1, runtime_eligible: true },
  wmmvp: { system_id: "wmmvp", ai_calls_per_document_run: 0, runtime_eligible: false },
};

export interface CallBudgetEstimate {
  corpus_version: string;
  document_count: number;
  per_system: Array<{
    system_id: string;
    documents: number;
    runs_per_document: number;
    ai_calls_per_run: number;
    total_ai_calls: number;
    runtime_eligible: boolean;
  }>;
  total_ai_calls: number;
  policy: string;
}

export function estimateCallBudget(
  config: BenchmarkExecutionConfig,
  document_count: number,
): CallBudgetEstimate {
  const runsDefault = config.repetition_plan.default_runs_per_document;
  const repeatabilityDocs = config.repetition_plan.repeatability_subset_document_ids.length;
  const repeatabilityExtra =
    repeatabilityDocs *
    Math.max(0, config.repetition_plan.repeatability_runs - runsDefault);

  const per_system = config.systems.map((s) => {
    const profile = SYSTEM_CALL_PROFILES[s.system_id];
    const ai_calls_per_run = profile?.ai_calls_per_document_run ?? 0;
    const runtime_eligible = s.runtime_eligible && ai_calls_per_run > 0;
    const runs_per_document = runtime_eligible ? runsDefault : 0;
    const baseTotal = document_count * runs_per_document * ai_calls_per_run;
    const extraTotal = runtime_eligible
      ? repeatabilityExtra * ai_calls_per_run
      : 0;
    return {
      system_id: s.system_id,
      documents: document_count,
      runs_per_document,
      ai_calls_per_run,
      total_ai_calls: baseTotal + extraTotal,
      runtime_eligible,
    };
  });

  return {
    corpus_version: config.corpus_version,
    document_count,
    per_system,
    total_ai_calls: per_system.reduce((n, s) => n + s.total_ai_calls, 0),
    policy: config.provider_call_budget_policy,
  };
}
