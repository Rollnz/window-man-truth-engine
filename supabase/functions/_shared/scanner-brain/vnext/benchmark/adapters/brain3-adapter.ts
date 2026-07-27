// Sprint 07B.2 — Brain 3 benchmark adapter (dependency-injected, side-effect free).
// The adapter composes: safe runner (actual Brain 3 intelligence) -> separate
// normalization. Raw native output is preserved verbatim on the result.
import type {
  AdapterRunContext,
  AdapterRunResult,
  BenchmarkSystemAdapter,
} from "./adapter-contract.ts";
import type { GroundTruthDocument } from "../benchmark-types.ts";
import { BRAIN3_CAPABILITIES } from "./capability-matrix.ts";
import { normalizeBrain3Output } from "./brain3-normalization.ts";
import {
  Brain3SideEffectAttemptError,
  createDisabledDependencies,
  runBrain3Safely,
  type Brain3DocumentInput,
  type Brain3ProviderCall,
  type DisabledDependencies,
} from "./brain3-safe-runner.ts";

export interface Brain3AssetResolver {
  (doc: GroundTruthDocument): Promise<{ base64: string; mime_type: string }>;
}

export interface Brain3BenchmarkAdapterDeps {
  providerCall: Brain3ProviderCall;
  assetResolver: Brain3AssetResolver;
  dependencies?: DisabledDependencies;
  provider?: string;
  model?: string;
  now?: () => number;
  openingCountHint?: (doc: GroundTruthDocument) => number | null;
}

export function createBrain3BenchmarkAdapter(
  deps: Brain3BenchmarkAdapterDeps,
): BenchmarkSystemAdapter {
  const disabled = deps.dependencies ?? createDisabledDependencies();
  return {
    systemId: "brain3",
    adapterVersion: BRAIN3_CAPABILITIES.adapter_version,
    capabilities: () => BRAIN3_CAPABILITIES,
    async run(
      doc: GroundTruthDocument,
      ctx: AdapterRunContext,
    ): Promise<AdapterRunResult> {
      try {
        const asset = await deps.assetResolver(doc);
        const input: Brain3DocumentInput = {
          document_id: doc.document_id,
          mime_type: asset.mime_type,
          base64: asset.base64,
          opening_count: deps.openingCountHint?.(doc) ?? null,
        };
        const res = await runBrain3Safely(input, {
          providerCall: deps.providerCall,
          dependencies: disabled,
          provider: deps.provider ?? ctx.provider,
          model: deps.model ?? ctx.model,
          now: deps.now,
        });
        return {
          raw: res.native, // preserved verbatim, never normalized in place
          normalized: normalizeBrain3Output(res.native),
          latency_ms: res.latency_ms,
          tokens: res.tokens,
          status: "ok",
          system_version: `brain3@${res.provenance.brain_version}`,
          brain_version: res.provenance.brain_version,
          analysis_schema_version: res.provenance.analysis_schema_version,
          prompt_version: res.provenance.prompt_version,
        };
      } catch (err) {
        const isSideEffect = err instanceof Brain3SideEffectAttemptError;
        return {
          raw: {
            error: err instanceof Error ? err.message : String(err),
            side_effect_violations: disabled.violations,
          },
          normalized: { facts: [], line_items: [], product_configurations: [] },
          latency_ms: 0,
          status: "infra_failure",
          failure_code: isSideEffect ? "TRANSPORT_FAILURE" : "PARSE_FAILURE",
          system_version: "brain3-safe-runner",
        };
      }
    },
  };
}

/**
 * @deprecated Sprint 07A placeholder retained for back-compat. Returns an
 * infra failure because no safe dependencies were injected. Use
 * createBrain3BenchmarkAdapter().
 */
export function createBrain3Adapter(): BenchmarkSystemAdapter {
  return {
    systemId: "brain3",
    adapterVersion: BRAIN3_CAPABILITIES.adapter_version,
    capabilities: () => BRAIN3_CAPABILITIES,
    run(): Promise<AdapterRunResult> {
      return Promise.resolve({
        raw: {
          note:
            "No injected dependencies — use createBrain3BenchmarkAdapter({ providerCall, assetResolver }).",
        },
        normalized: { facts: [], line_items: [], product_configurations: [] },
        latency_ms: 0,
        status: "infra_failure",
        failure_code: "TRANSPORT_FAILURE",
        system_version: "brain3-current",
      });
    },
  };
}
