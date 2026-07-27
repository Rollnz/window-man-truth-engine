// Sprint 07B.2 — Brain 3 SAFE BENCHMARK RUNNER.
//
// LAW: this module must evaluate the ACTUAL Brain 3 system.
// It imports Brain 3 intelligence READ-ONLY (rubric / schema / scoring /
// forensic) and reproduces the exact request the shipping `quote-scanner`
// edge function builds. It does NOT rewrite prompts, schema, or scoring.
//
// The ONLY thing this wrapper changes is the *boundary*: every side effect
// (DB, cache, tracking, communications, storage) is replaced by an injected
// fail-closed dependency. Nothing here may reach production.

import {
  EXTRACTION_RUBRIC,
  USER_PROMPT_TEMPLATE,
} from "../../../rubric.ts";
import {
  ExtractionSignalsJsonSchema,
  type ExtractionSignals,
} from "../../../schema.ts";
import { scoreFromSignals, type ScoredResult } from "../../../scoring.ts";
import {
  extractIdentity,
  generateForensicSummary,
} from "../../../forensic.ts";
import {
  ANALYSIS_SCHEMA_VERSION as BRAIN3_ANALYSIS_SCHEMA_VERSION,
  BRAIN_VERSION as BRAIN3_BRAIN_VERSION,
} from "../../../index.ts";

export const BRAIN3_SAFE_RUNNER_VERSION = "brain3-safe-runner-v1.0.0";

/** Machine-readable violation code emitted when Brain 3 tries to mutate state. */
export const BRAIN3_SIDE_EFFECT_ATTEMPT = "BRAIN3_SIDE_EFFECT_ATTEMPT" as const;

export class Brain3SideEffectAttemptError extends Error {
  readonly code = BRAIN3_SIDE_EFFECT_ATTEMPT;
  readonly operation: string;
  readonly surface: string;
  constructor(surface: string, operation: string) {
    super(
      `${BRAIN3_SIDE_EFFECT_ATTEMPT}: Brain 3 benchmark runner refused ${surface}.${operation}`,
    );
    this.name = "Brain3SideEffectAttemptError";
    this.surface = surface;
    this.operation = operation;
  }
}

/** Every prohibited surface, recorded rather than silently ignored. */
export interface SideEffectViolation {
  surface: string;
  operation: string;
}

export interface DisabledDependencies {
  persistence: Record<string, (...args: unknown[]) => never>;
  cache: Record<string, (...args: unknown[]) => never>;
  tracking: Record<string, (...args: unknown[]) => never>;
  communications: Record<string, (...args: unknown[]) => never>;
  storage: Record<string, (...args: unknown[]) => never>;
  violations: SideEffectViolation[];
}

const SURFACE_OPS: Record<string, string[]> = {
  persistence: [
    "insert",
    "update",
    "upsert",
    "delete",
    "insertQuoteAnalysis",
    "updateQuoteFile",
    "createLead",
    "createScanSession",
    "enqueuePendingCall",
  ],
  cache: ["read", "write", "invalidate", "upsertVersionedCache"],
  tracking: ["logAttributionEvent", "emitWmEvent", "emitGtm", "emitCapi"],
  communications: ["sendSms", "placeCall", "sendEmail", "twilioVerify"],
  storage: ["upload", "remove", "createSignedUploadUrl"],
};

/**
 * Builds fail-closed no-op dependencies. Every prohibited operation throws a
 * machine-readable error AND records the violation.
 */
export function createDisabledDependencies(): DisabledDependencies {
  const violations: SideEffectViolation[] = [];
  const build = (surface: string) => {
    const out: Record<string, (...args: unknown[]) => never> = {};
    for (const op of SURFACE_OPS[surface]) {
      out[op] = () => {
        violations.push({ surface, operation: op });
        throw new Brain3SideEffectAttemptError(surface, op);
      };
    }
    return out;
  };
  return {
    persistence: build("persistence"),
    cache: build("cache"),
    tracking: build("tracking"),
    communications: build("communications"),
    storage: build("storage"),
    violations,
  };
}

// ── Provider boundary ────────────────────────────────────────────────────────

export interface Brain3ProviderRequest {
  model: string;
  messages: unknown[];
  response_format: unknown;
}

/** Injected provider caller. Tests supply a mock; no fetch lives in this file. */
export type Brain3ProviderCall = (
  req: Brain3ProviderRequest,
) => Promise<{ content: string; tokens?: { prompt: number; completion: number; total: number } }>;

export interface Brain3DocumentInput {
  document_id: string;
  mime_type: string;
  /** Base64 payload of the de-identified benchmark asset. */
  base64: string;
  opening_count?: number | null;
  area_name?: string | null;
  notes?: string | null;
}

/** Native Brain 3 output, preserved verbatim — never normalized in place. */
export interface Brain3NativeOutput {
  signals: ExtractionSignals;
  scored: ScoredResult;
  forensic: ReturnType<typeof generateForensicSummary>;
  identity: ReturnType<typeof extractIdentity>;
  raw_content: string;
}

export interface Brain3SafeRunResult {
  native: Brain3NativeOutput;
  provenance: {
    runner_version: string;
    brain_version: string;
    analysis_schema_version: string;
    provider: string;
    model: string;
    prompt_version: string;
  };
  provider_calls: number;
  side_effect_violations: SideEffectViolation[];
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
}

export interface Brain3SafeRunnerDeps {
  providerCall: Brain3ProviderCall;
  provider?: string;
  model?: string;
  dependencies?: DisabledDependencies;
  now?: () => number;
}

/**
 * Reproduces the shipping Brain 3 analyze path with ZERO side effects.
 * Mirrors supabase/functions/quote-scanner/index.ts (mode="analyze"):
 *   system = EXTRACTION_RUBRIC
 *   user   = USER_PROMPT_TEMPLATE(...) + image_url
 *   response_format = json_schema(quote_signals, strict, ExtractionSignalsJsonSchema)
 *   then scoreFromSignals -> generateForensicSummary -> extractIdentity
 */
export async function runBrain3Safely(
  doc: Brain3DocumentInput,
  deps: Brain3SafeRunnerDeps,
): Promise<Brain3SafeRunResult> {
  const disabled = deps.dependencies ?? createDisabledDependencies();
  const now = deps.now ?? (() => Date.now());
  const model = deps.model ?? "google/gemini-3-flash-preview";
  const provider = deps.provider ?? "lovable-ai-gateway";

  const userPrompt = USER_PROMPT_TEMPLATE(
    doc.opening_count ?? null,
    doc.area_name ?? null,
    doc.notes ?? null,
  );

  const request: Brain3ProviderRequest = {
    model,
    messages: [
      { role: "system", content: EXTRACTION_RUBRIC },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: { url: `data:${doc.mime_type};base64,${doc.base64}` },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "quote_signals",
        strict: true,
        schema: ExtractionSignalsJsonSchema,
      },
    },
  };

  const started = now();
  const { content, tokens } = await deps.providerCall(request);
  const latency_ms = Math.max(0, now() - started);

  let signals: ExtractionSignals;
  try {
    signals = JSON.parse(content) as ExtractionSignals;
  } catch {
    throw new Error("BRAIN3_PARSE_FAILURE: Brain 3 returned non-JSON content");
  }

  // Unmodified Brain 3 intelligence.
  const scored = scoreFromSignals(signals, doc.opening_count ?? null);
  const forensic = generateForensicSummary(signals, scored);
  const identity = extractIdentity(signals);

  return {
    native: { signals, scored, forensic, identity, raw_content: content },
    provenance: {
      runner_version: BRAIN3_SAFE_RUNNER_VERSION,
      brain_version: BRAIN3_BRAIN_VERSION,
      analysis_schema_version: BRAIN3_ANALYSIS_SCHEMA_VERSION,
      provider,
      model,
      prompt_version: `extraction-rubric@${BRAIN3_BRAIN_VERSION}`,
    },
    provider_calls: 1,
    side_effect_violations: disabled.violations,
    latency_ms,
    tokens,
  };
}
