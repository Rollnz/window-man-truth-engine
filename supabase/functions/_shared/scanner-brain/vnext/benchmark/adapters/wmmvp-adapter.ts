// Sprint 07A — WM MVP reference adapter (runtime not available).
import type { BenchmarkSystemAdapter, AdapterRunResult } from "./adapter-contract.ts";
import { WMMVP_CAPABILITIES } from "./capability-matrix.ts";

export function createWMMVPAdapter(): BenchmarkSystemAdapter {
  return {
    systemId: "wmmvp",
    adapterVersion: WMMVP_CAPABILITIES.adapter_version,
    capabilities: () => WMMVP_CAPABILITIES,
    run(): Promise<AdapterRunResult> {
      return Promise.resolve({
        raw: { note: "REFERENCE_RUNTIME_NOT_AVAILABLE — donor runtime access pending" },
        normalized: { facts: [], line_items: [], product_configurations: [] },
        latency_ms: 0,
        status: "infra_failure",
        failure_code: "TRANSPORT_FAILURE",
        system_version: "wmmvp-reference",
      });
    },
  };
}
