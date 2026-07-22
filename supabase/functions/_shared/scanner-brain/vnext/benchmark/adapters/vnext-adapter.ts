// Sprint 07A — vNext adapter (dependency-injected; no live calls in tests).
import type { BenchmarkSystemAdapter, AdapterRunContext, AdapterRunResult } from "./adapter-contract.ts";
import type { GroundTruthDocument, NormalizedSystemOutput } from "../benchmark-types.ts";
import { VNEXT_CAPABILITIES } from "./capability-matrix.ts";

export interface VNextAdapterDeps {
  // Pure injection point — never call live provider inside benchmark harness tests.
  runOnce: (
    doc: GroundTruthDocument,
    ctx: AdapterRunContext,
  ) => Promise<{
    raw: unknown;
    normalized: NormalizedSystemOutput;
    latency_ms: number;
    tokens?: { prompt: number; completion: number; total: number };
  }>;
  system_version: string;
  brain_version: string;
  analysis_schema_version: string;
  prompt_version: string;
}

export function createVNextAdapter(deps: VNextAdapterDeps): BenchmarkSystemAdapter {
  return {
    systemId: "vnext",
    adapterVersion: VNEXT_CAPABILITIES.adapter_version,
    capabilities: () => VNEXT_CAPABILITIES,
    async run(doc, ctx): Promise<AdapterRunResult> {
      try {
        const res = await deps.runOnce(doc, ctx);
        return {
          raw: res.raw,
          normalized: res.normalized,
          latency_ms: res.latency_ms,
          tokens: res.tokens,
          status: "ok",
          system_version: deps.system_version,
          brain_version: deps.brain_version,
          analysis_schema_version: deps.analysis_schema_version,
          prompt_version: deps.prompt_version,
        };
      } catch (e) {
        return {
          raw: { error: (e as Error).message },
          normalized: { facts: [], line_items: [], product_configurations: [] },
          latency_ms: 0,
          status: "infra_failure",
          failure_code: "TRANSPORT_FAILURE",
          system_version: deps.system_version,
          brain_version: deps.brain_version,
          analysis_schema_version: deps.analysis_schema_version,
          prompt_version: deps.prompt_version,
        };
      }
    },
  };
}
