// Sprint 07A — Deterministic canned adapter outputs.
import type { BenchmarkSystemAdapter, AdapterRunResult } from "../adapters/adapter-contract.ts";
import type { NormalizedSystemOutput, GroundTruthDocument, SystemCapabilityDeclaration } from "../benchmark-types.ts";
import { VNEXT_CAPABILITIES, BRAIN3_CAPABILITIES } from "../adapters/capability-matrix.ts";

export interface MockAdapterOptions {
  system_id: string;
  capabilities: SystemCapabilityDeclaration;
  produce: (doc: GroundTruthDocument) => NormalizedSystemOutput;
  latency_ms?: number;
  system_version?: string;
  brain_version?: string;
  analysis_schema_version?: string;
  prompt_version?: string;
}

export function createMockAdapter(opts: MockAdapterOptions): BenchmarkSystemAdapter {
  return {
    systemId: opts.system_id,
    adapterVersion: opts.capabilities.adapter_version,
    capabilities: () => opts.capabilities,
    run(doc): Promise<AdapterRunResult> {
      return Promise.resolve({
        raw: { mock: true, document_id: doc.document_id },
        normalized: opts.produce(doc),
        latency_ms: opts.latency_ms ?? 50,
        tokens: { prompt: 10, completion: 20, total: 30 },
        status: "ok",
        system_version: opts.system_version ?? "mock-v1",
        brain_version: opts.brain_version,
        analysis_schema_version: opts.analysis_schema_version,
        prompt_version: opts.prompt_version,
      });
    },
  };
}

// Perfect vNext mock — extracts every fact correctly with evidence.
export function perfectVNextMock(): BenchmarkSystemAdapter {
  return createMockAdapter({
    system_id: "vnext",
    capabilities: VNEXT_CAPABILITIES,
    system_version: "vnext-1.0.0",
    brain_version: "brain-vnext-1",
    analysis_schema_version: "4.0.0-dev",
    prompt_version: "p-v1",
    produce(doc) {
      const facts = doc.facts
        .filter((f) => f.expected_status !== "not_applicable")
        .map((f) => ({
          semantic_field: f.semantic_field,
          status: f.expected_status,
          value: f.expected_status === "not_found" ? null : f.value,
          entity_role: f.entity_role,
          evidence: f.evidence[0]
            ? { page: f.evidence[0].page, source_text: f.evidence[0].source_text }
            : undefined,
          confidence: 0.95,
        }));
      return { facts, line_items: [], product_configurations: [] };
    },
  });
}

// Brain 3 mock — misses salesperson (unsupported), hallucinates financing.
export function brain3Mock(): BenchmarkSystemAdapter {
  return createMockAdapter({
    system_id: "brain3",
    capabilities: BRAIN3_CAPABILITIES,
    system_version: "brain3-mock",
    produce() {
      return {
        facts: [
          { semantic_field: "pricing.financing", status: "found", value: { value: 250, currency: "USD" } },
        ],
        line_items: [],
        product_configurations: [],
      };
    },
  });
}
