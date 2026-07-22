// Sprint 07B — Brain 3 adapter readiness (READ-ONLY inspection).
// Brain 3 today (supabase/functions/quote-scanner, _shared/scanner-brain) writes
// to `quote_analyses`, updates cache columns keyed on (image_hash, brain_version,
// analysis_schema_version) and emits tracking events. Any benchmark invocation
// must be routed through a benchmark-only wrapper that suppresses those writes.

export const BRAIN3_ADAPTER_VERSION = "brain3-adapter-v0.2.0-wrapper-required";

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
  fairness_notes: string[];
}

export function getBrain3AdapterReadiness(): Brain3AdapterReadiness {
  return {
    system_id: "brain3",
    adapter_version: BRAIN3_ADAPTER_VERSION,
    status: "SAFE_WRAPPER_REQUIRED",
    known_side_effects: [
      "INSERT/UPSERT into public.quote_analyses (versioned cache).",
      "Updates ai_pre_analysis on public.quote_files.",
      "Emits wm_events / analytics tracking calls.",
      "Uses live Lovable AI Gateway credentials.",
    ],
    required_wrapper_guards: [
      "Route Brain 3 through a benchmark-only in-memory Supabase client that no-ops writes.",
      "Disable tracking sinks (wm_events, GTM/CAPI) at the boundary.",
      "Force cache reads to MISS so benchmark runs measure actual extraction, not cached rows.",
      "Fail-closed if any known-side-effect path is reached without an approved wrapper token.",
    ],
    fairness_notes: [
      "Do not modify Brain 3 prompts, schema, or scoring to make it 'benchmark-friendly'.",
      "Adapter must invoke the actual current extraction code path.",
      "Any prompt/schema modification must be published as a separate adapter version, not a silent tweak.",
    ],
  };
}

export class Brain3SideEffectGuardError extends Error {
  constructor(op: string) {
    super(`Brain 3 benchmark adapter refused side-effectful operation: ${op}`);
  }
}

// Minimal invariant used by tests: a benchmark invocation must not be permitted
// to call a known side-effect path without an explicit wrapper token.
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
