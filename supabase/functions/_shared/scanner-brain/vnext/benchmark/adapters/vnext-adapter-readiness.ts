// Sprint 07B — vNext adapter readiness declaration.
// No live provider calls; asserts pinning + capture invariants only.
import { BENCHMARK_SCHEMA_VERSION } from "../benchmark-types.ts";

export const VNEXT_ADAPTER_VERSION = "vnext-adapter-v1.0.0";
export const VNEXT_PINNED_PROVIDER = "lovable-ai-gateway";
export const VNEXT_PINNED_MODEL = "google/gemini-3-flash-preview";

export interface VNextAdapterReadiness {
  system_id: "vnext";
  adapter_version: string;
  benchmark_schema_version: string;
  pinned_provider: string;
  pinned_model: string;
  captures_raw_output: boolean;
  captures_prompt_versions: boolean;
  captures_brain_version: boolean;
  captures_analysis_schema_version: boolean;
  writes_production_data: boolean;
  status:
    | "READY_FOR_CONTROLLED_EXECUTION"
    | "VNEXT_ADAPTER_BLOCKED";
  notes: string[];
}

export function getVNextAdapterReadiness(): VNextAdapterReadiness {
  return {
    system_id: "vnext",
    adapter_version: VNEXT_ADAPTER_VERSION,
    benchmark_schema_version: BENCHMARK_SCHEMA_VERSION,
    pinned_provider: VNEXT_PINNED_PROVIDER,
    pinned_model: VNEXT_PINNED_MODEL,
    captures_raw_output: true,
    captures_prompt_versions: true,
    captures_brain_version: true,
    captures_analysis_schema_version: true,
    writes_production_data: false,
    status: "READY_FOR_CONTROLLED_EXECUTION",
    notes: [
      "Wraps runFourPassOrchestration via dependency injection.",
      "Model is pinned at benchmark context construction; adapter throws if a caller passes a different model at run time.",
      "Raw pass outputs and canonical merge result are preserved verbatim in the run manifest.",
      "No writes to quote_analyses, scan_sessions, tracking, or Storage.",
    ],
  };
}

export class VNextModelDriftError extends Error {
  constructor(expected: string, actual: string) {
    super(`vNext benchmark model drift: expected=${expected} actual=${actual}`);
  }
}

// Assertion helper used by tests to guard against silent drift.
export function assertVNextModelPinned(modelInContext: string): void {
  if (modelInContext !== VNEXT_PINNED_MODEL) {
    throw new VNextModelDriftError(VNEXT_PINNED_MODEL, modelInContext);
  }
}
