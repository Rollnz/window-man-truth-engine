// Sprint 07B.2 — Brain 3 adapter readiness (safe wrapper RESOLVED).
// The benchmark-only safe runner isolates every known Brain 3 side effect
// behind injected fail-closed dependencies while invoking the actual
// Brain 3 extraction/scoring code path unchanged.

export const BRAIN3_ADAPTER_VERSION = "brain3-adapter-v1.0.0-safe-runner";

export type Brain3Status =
  | "READY_FOR_CONTROLLED_EXECUTION"
  | "SAFE_WRAPPER_REQUIRED"
  | "RUNNER_NOT_YET_SAFE"
  | "RUNTIME_NOT_AVAILABLE";

export interface Brain3AdapterReadiness {
  system_id: "brain3";
  adapter_version: string;
  status: Brain3Status;
  known_side_effects: string[];
  required_wrapper_guards: string[];
  implemented_wrapper_guards: string[];
  fairness_notes: string[];
  remaining_risks: string[];
}

export function getBrain3AdapterReadiness(): Brain3AdapterReadiness {
  return {
    system_id: "brain3",
    adapter_version: BRAIN3_ADAPTER_VERSION,
    status: "READY_FOR_CONTROLLED_EXECUTION",
    known_side_effects: [
      "INSERT/UPSERT into public.quote_analyses (versioned cache).",
      "Updates ai_pre_analysis on public.quote_files.",
      "Emits wm_events / analytics tracking calls.",
      "Uses live Lovable AI Gateway credentials.",
    ],
    required_wrapper_guards: [
      "Route Brain 3 through a benchmark-only client that no-ops writes.",
      "Disable tracking sinks (wm_events, GTM/CAPI) at the boundary.",
      "Force cache reads to MISS so benchmark runs measure actual extraction.",
      "Fail-closed if any known-side-effect path is reached.",
    ],
    implemented_wrapper_guards: [
      "brain3-safe-runner.ts imports Brain 3 intelligence READ-ONLY (rubric/schema/scoring/forensic) and contains no Supabase client, no fetch, and no cache access.",
      "All persistence/cache/tracking/communications/storage surfaces are injected fail-closed stubs that throw BRAIN3_SIDE_EFFECT_ATTEMPT and record the violation.",
      "Provider access is an injected function — the runner cannot originate a network call on its own.",
      "Cache is structurally absent, so every benchmark run is a real extraction (no cached-row measurement).",
      "Native Brain 3 output is preserved verbatim; normalization is a separate module.",
    ],
    fairness_notes: [
      "Brain 3 prompts, schema, and scoring are imported unmodified from the shipping modules.",
      "The request body mirrors supabase/functions/quote-scanner (mode=analyze) exactly.",
      "Capability declarations reflect only what legacy-signals-v1 actually emits.",
    ],
    remaining_risks: [
      "Model pinning: the shipping function reads AI_MODEL_VERSION at runtime; the benchmark must pin the model explicitly in the frozen execution config.",
      "Brain 3 emits no evidence spans, so evidence-support metrics are structurally UNSUPPORTED rather than failing.",
    ],
  };
}

export class Brain3SideEffectGuardError extends Error {
  constructor(op: string) {
    super(`Brain 3 benchmark adapter refused side-effectful operation: ${op}`);
  }
}

// Minimal invariant retained from Sprint 07B.
export function guardBrain3Invocation(op: string, wrapperToken?: string): void {
  const SIDE_EFFECT_OPS = new Set([
    "insert_quote_analyses",
    "update_quote_files",
    "emit_wm_events",
    "emit_gtm",
    "storage_upload",
  ]);
  if (SIDE_EFFECT_OPS.has(op) && wrapperToken !== "benchmark-only-wrapper") {
    throw new Brain3SideEffectGuardError(op);
  }
}
