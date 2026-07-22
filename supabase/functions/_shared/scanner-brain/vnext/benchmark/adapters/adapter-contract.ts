// Sprint 07A — Adapter contract.
import type {
  GroundTruthDocument,
  NormalizedSystemOutput,
  SystemCapabilityDeclaration,
  RunStatus,
} from "../benchmark-types.ts";
import type { ErrorCode } from "../error-taxonomy.ts";

export interface AdapterRunContext {
  run_group_id: string;
  provider: string;
  model: string;
}

export interface AdapterRunResult {
  raw: unknown;
  normalized: NormalizedSystemOutput;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
  status: RunStatus;
  failure_code?: ErrorCode;
  system_version: string;
  brain_version?: string;
  analysis_schema_version?: string;
  prompt_version?: string;
}

export interface BenchmarkSystemAdapter {
  systemId: string;
  adapterVersion: string;
  capabilities(): SystemCapabilityDeclaration;
  run(doc: GroundTruthDocument, ctx: AdapterRunContext): Promise<AdapterRunResult>;
}
