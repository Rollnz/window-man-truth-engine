// Sprint 07A — Brain 3 adapter (read-only inspection; no headless invocation yet).
import type { BenchmarkSystemAdapter, AdapterRunResult } from "./adapter-contract.ts";
import { BRAIN3_CAPABILITIES } from "./capability-matrix.ts";

export function createBrain3Adapter(): BenchmarkSystemAdapter {
  return {
    systemId: "brain3",
    adapterVersion: BRAIN3_CAPABILITIES.adapter_version,
    capabilities: () => BRAIN3_CAPABILITIES,
    run(): Promise<AdapterRunResult> {
      return Promise.resolve({
        raw: { note: "RUNNER_NOT_YET_SAFE — Brain 3 headless invocation deferred to Sprint 07B" },
        normalized: { facts: [], line_items: [], product_configurations: [] },
        latency_ms: 0,
        status: "infra_failure",
        failure_code: "TRANSPORT_FAILURE",
        system_version: "brain3-current",
      });
    },
  };
}
