// Sprint 07B — WM MVP adapter readiness.
// Repository state: the donor repo (Mongoloyd/wm-mvp @ forensic_report_v2) is
// NOT vendored inside this project. There is no locally-executable WM MVP
// extraction runtime. Therefore the only honest classification is
// REFERENCE_RUNTIME_NOT_AVAILABLE, and WM MVP MUST NOT appear on the runtime
// accuracy leaderboard.

export const WMMVP_ADAPTER_VERSION = "wmmvp-adapter-v0.1.0-runtime-unavailable";

export type WmMvpStatus =
  | "ACTUAL_DONOR_RUNTIME_READY"
  | "FAITHFUL_REFERENCE_ADAPTER_READY"
  | "PROMPT_SCHEMA_REFERENCE_ONLY"
  | "REFERENCE_RUNTIME_NOT_AVAILABLE";

export interface WmMvpAdapterReadiness {
  system_id: "wmmvp";
  adapter_version: string;
  status: WmMvpStatus;
  eligible_for_runtime_accuracy_leaderboard: boolean;
  eligible_for_architectural_reference: boolean;
  notes: string[];
}

export function getWmMvpAdapterReadiness(): WmMvpAdapterReadiness {
  return {
    system_id: "wmmvp",
    adapter_version: WMMVP_ADAPTER_VERSION,
    status: "REFERENCE_RUNTIME_NOT_AVAILABLE",
    eligible_for_runtime_accuracy_leaderboard: false,
    eligible_for_architectural_reference: true,
    notes: [
      "Donor code is not vendored in this repo; no executable WM MVP runtime is present.",
      "WM MVP may participate only as PROMPT_SCHEMA_REFERENCE_ONLY comparison, not as an accuracy contender.",
      "Any future FAITHFUL_REFERENCE_ADAPTER_READY promotion requires a documented and versioned adapter that preserves donor semantics without modernization.",
    ],
  };
}

export class WmMvpMasqueradeError extends Error {
  constructor(claimed: WmMvpStatus, actual: WmMvpStatus) {
    super(
      `WM MVP static/reference-only mode cannot masquerade as runtime-ready: claimed=${claimed} actual=${actual}`,
    );
  }
}

export function assertWmMvpRuntimeClaim(claimed: WmMvpStatus): void {
  const actual = getWmMvpAdapterReadiness().status;
  const runtimeReady =
    actual === "ACTUAL_DONOR_RUNTIME_READY" ||
    actual === "FAITHFUL_REFERENCE_ADAPTER_READY";
  const claimingRuntime =
    claimed === "ACTUAL_DONOR_RUNTIME_READY" ||
    claimed === "FAITHFUL_REFERENCE_ADAPTER_READY";
  if (claimingRuntime && !runtimeReady) {
    throw new WmMvpMasqueradeError(claimed, actual);
  }
}
