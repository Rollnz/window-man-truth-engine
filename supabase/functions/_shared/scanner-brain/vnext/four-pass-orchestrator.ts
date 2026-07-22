// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — FOUR-PASS ORCHESTRATOR CORE (Sprint 06B)
//
// Pure, reusable orchestration engine. NO HTTP framework. NO DB.
// Deployed to Deno + browser-safe (no Node-only APIs).
//
// Wall-clock: Passes A/B/C/D run CONCURRENTLY via Promise.allSettled.
// Fail-closed: any missing / malformed partition → typed failure. No partial
// CanonicalExtractionV1 ever escapes as "success".
//
// The provider transport is DEPENDENCY-INJECTED (`ProviderCaller`) so that:
//   - the experimental edge function passes a real Lovable AI Gateway caller
//   - tests pass deterministic mocks
//   - live smokes can pass a bounded live caller
//
// This module is EXPERIMENTAL. It is not wired to /scan, quote-scanner,
// wm-analyze-quote, orchestrate-quote-analysis, or any customer flow.
// ═══════════════════════════════════════════════════════════════════════════

import {
  mergeFourPass,
  type FourPassAOutput,
  type FourPassBOutput,
  type FourPassCOutput,
  type FourPassDOutput,
} from "./canonical-merge.ts";
import {
  CANONICAL_CONTRACT_VERSION,
  VNEXT_ANALYSIS_SCHEMA_VERSION,
  VNEXT_BRAIN_VERSION,
} from "./constants.ts";
import {
  FOUR_PASS_PROMPTS,
  VNEXT_PROMPT_VERSION,
  type PassPromptContract,
} from "./extraction-prompts.ts";
import { buildProjection } from "./schema-projections.ts";
import type { CanonicalExtractionV1 } from "./types.ts";
import {
  validateCanonicalExtractionV1,
  type ValidationResult,
} from "./validation.ts";

// ── Constants ─────────────────────────────────────────────────────────────

export const ORCHESTRATOR_VERSION = "four-pass-orchestrator-v1" as const;

export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
export type SupportedMimeType = typeof SUPPORTED_MIME_TYPES[number];

// Aligned with existing scanner ceiling; documented rationale: an inbound
// base64 payload larger than ~20 MB (decoded) exceeds provider limits and
// almost always indicates a caller bug or abuse. Base64 inflates ~1.37×,
// so 28 MB base64 ≈ 20 MB decoded.
export const MAX_BASE64_BYTES = 28 * 1024 * 1024;

// Per-pass provider timeout. 60 s covers the observed p95 of a single pass
// against production PDFs (10-25 s) with generous slack for cold routes.
export const PER_PASS_TIMEOUT_MS = 60_000;

// Whole orchestration ceiling. Passes run in parallel so this is very close
// to the per-pass ceiling plus overhead, not 4×.
export const TOTAL_ORCHESTRATION_TIMEOUT_MS = 90_000;

export const DEFAULT_MODEL = "google/gemini-3-flash-preview";

// ── Failure taxonomy ──────────────────────────────────────────────────────

export const FAILURE_CODES = {
  INVALID_INPUT: "INVALID_INPUT",

  PASS_A_PROVIDER_FAILURE: "PASS_A_PROVIDER_FAILURE",
  PASS_B_PROVIDER_FAILURE: "PASS_B_PROVIDER_FAILURE",
  PASS_C_PROVIDER_FAILURE: "PASS_C_PROVIDER_FAILURE",
  PASS_D_PROVIDER_FAILURE: "PASS_D_PROVIDER_FAILURE",

  PASS_A_PARSE_FAILURE: "PASS_A_PARSE_FAILURE",
  PASS_B_PARSE_FAILURE: "PASS_B_PARSE_FAILURE",
  PASS_C_PARSE_FAILURE: "PASS_C_PARSE_FAILURE",
  PASS_D_PARSE_FAILURE: "PASS_D_PARSE_FAILURE",

  MERGE_FAILURE: "MERGE_FAILURE",
  CANONICAL_VALIDATION_FAILURE: "CANONICAL_VALIDATION_FAILURE",
  ORCHESTRATION_TIMEOUT: "ORCHESTRATION_TIMEOUT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type FailureCode = typeof FAILURE_CODES[keyof typeof FAILURE_CODES];

export type PassId = "A" | "B" | "C" | "D";

// ── Provider caller contract (dependency-injected) ────────────────────────

export interface ProviderCallInput {
  pass: PassId;
  prompt: PassPromptContract;
  model: string;
  jsonSchema: Record<string, unknown>;
  document: { base64: string; mimeType: SupportedMimeType };
  timeoutMs: number;
  signal: AbortSignal;
}

export interface ProviderCallOutput {
  content: string; // raw model text (JSON expected)
  httpStatus: number;
  finishReason?: string | null;
  tokensPrompt?: number | null;
  tokensCompletion?: number | null;
}

export type ProviderCaller = (input: ProviderCallInput) => Promise<ProviderCallOutput>;

// ── Diagnostics ───────────────────────────────────────────────────────────

export interface PassDiagnostic {
  pass: PassId;
  prompt_version: string;
  partition: string;
  requested_model: string;
  started_at: number;
  finished_at: number;
  latency_ms: number;
  http_status: number | null;
  finish_reason: string | null;
  tokens_prompt: number | null;
  tokens_completion: number | null;
  parse_status: "ok" | "failed" | "not_attempted";
  provider_error?: string | null;
  parse_error?: string | null;
}

export interface OrchestratorDiagnostics {
  orchestrator_version: string;
  brain_version: string;
  analysis_schema_version: string;
  prompt_contract_version: string;
  requested_model: string;
  request_id: string | null;
  wall_time_ms: number;
  passes: Record<PassId, PassDiagnostic>;
  merge: { success: boolean; validation_issue_count: number };
}

// ── Input / Result contracts ──────────────────────────────────────────────

export interface OrchestratorInput {
  fileBase64: string;
  mimeType: string;
  requestId?: string | null;
  model?: string;
}

export interface OrchestratorDeps {
  providerCall: ProviderCaller;
  now?: () => number; // injectable clock for tests
}

export type OrchestratorResult =
  | {
      ok: true;
      canonical: CanonicalExtractionV1;
      diagnostics: OrchestratorDiagnostics;
    }
  | {
      ok: false;
      error: { code: FailureCode; message: string; failed_pass?: PassId };
      diagnostics: OrchestratorDiagnostics;
    };

// ── Input validation ──────────────────────────────────────────────────────

function validateInput(input: OrchestratorInput):
  | { ok: true; base64: string; mime: SupportedMimeType }
  | { ok: false; message: string } {
  if (!input || typeof input !== "object") return { ok: false, message: "missing input" };
  const { fileBase64, mimeType } = input;
  if (typeof fileBase64 !== "string" || fileBase64.length === 0) {
    return { ok: false, message: "fileBase64 is required" };
  }
  if (typeof mimeType !== "string" || mimeType.length === 0) {
    return { ok: false, message: "mimeType is required" };
  }
  if (!(SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return {
      ok: false,
      message: `unsupported mimeType: ${mimeType} (supported: ${SUPPORTED_MIME_TYPES.join(", ")})`,
    };
  }
  if (fileBase64.length > MAX_BASE64_BYTES) {
    return { ok: false, message: `fileBase64 exceeds ${MAX_BASE64_BYTES} bytes` };
  }
  // Cheap malformed-base64 guard: base64 alphabet + padding only.
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(fileBase64)) {
    return { ok: false, message: "fileBase64 contains invalid base64 characters" };
  }
  return { ok: true, base64: fileBase64, mime: mimeType as SupportedMimeType };
}

// ── Helpers ───────────────────────────────────────────────────────────────

const PASS_IDS: readonly PassId[] = ["A", "B", "C", "D"];

const PROVIDER_FAILURE_CODE: Record<PassId, FailureCode> = {
  A: FAILURE_CODES.PASS_A_PROVIDER_FAILURE,
  B: FAILURE_CODES.PASS_B_PROVIDER_FAILURE,
  C: FAILURE_CODES.PASS_C_PROVIDER_FAILURE,
  D: FAILURE_CODES.PASS_D_PROVIDER_FAILURE,
};
const PARSE_FAILURE_CODE: Record<PassId, FailureCode> = {
  A: FAILURE_CODES.PASS_A_PARSE_FAILURE,
  B: FAILURE_CODES.PASS_B_PARSE_FAILURE,
  C: FAILURE_CODES.PASS_C_PARSE_FAILURE,
  D: FAILURE_CODES.PASS_D_PARSE_FAILURE,
};

function emptyPassDiagnostic(pass: PassId, model: string, prompt: PassPromptContract): PassDiagnostic {
  return {
    pass,
    prompt_version: prompt.version,
    partition: prompt.partition,
    requested_model: model,
    started_at: 0,
    finished_at: 0,
    latency_ms: 0,
    http_status: null,
    finish_reason: null,
    tokens_prompt: null,
    tokens_completion: null,
    parse_status: "not_attempted",
  };
}

function buildDiagnostics(
  passes: Record<PassId, PassDiagnostic>,
  wallMs: number,
  requestId: string | null,
  model: string,
  merge: { success: boolean; validation_issue_count: number },
): OrchestratorDiagnostics {
  return {
    orchestrator_version: ORCHESTRATOR_VERSION,
    brain_version: VNEXT_BRAIN_VERSION,
    analysis_schema_version: VNEXT_ANALYSIS_SCHEMA_VERSION,
    prompt_contract_version: VNEXT_PROMPT_VERSION,
    requested_model: model,
    request_id: requestId,
    wall_time_ms: wallMs,
    passes,
    merge,
  };
}

/** Cached per-pass provider JSON schemas (canonical projections). */
const SCHEMA_CACHE: Partial<Record<PassId, Record<string, unknown>>> = {};
function schemaForPass(pass: PassId): Record<string, unknown> {
  if (!SCHEMA_CACHE[pass]) {
    const prompt = FOUR_PASS_PROMPTS[pass];
    SCHEMA_CACHE[pass] = buildProjection(prompt.partition).schema as Record<string, unknown>;
  }
  return SCHEMA_CACHE[pass]!;
}

// ── Core orchestration ────────────────────────────────────────────────────

export async function runFourPassOrchestration(
  input: OrchestratorInput,
  deps: OrchestratorDeps,
): Promise<OrchestratorResult> {
  const now = deps.now ?? Date.now;
  const model = input.model ?? DEFAULT_MODEL;
  const requestId = input.requestId ?? null;

  const passes: Record<PassId, PassDiagnostic> = {
    A: emptyPassDiagnostic("A", model, FOUR_PASS_PROMPTS.A),
    B: emptyPassDiagnostic("B", model, FOUR_PASS_PROMPTS.B),
    C: emptyPassDiagnostic("C", model, FOUR_PASS_PROMPTS.C),
    D: emptyPassDiagnostic("D", model, FOUR_PASS_PROMPTS.D),
  };
  const t0 = now();

  const validated = validateInput(input);
  if (!validated.ok) {
    return {
      ok: false,
      error: { code: FAILURE_CODES.INVALID_INPUT, message: validated.message },
      diagnostics: buildDiagnostics(passes, now() - t0, requestId, model, {
        success: false,
        validation_issue_count: 0,
      }),
    };
  }
  const { base64, mime } = validated;

  // Whole-orchestration abort (bounded ceiling).
  const totalController = new AbortController();
  const totalTimer = setTimeout(() => totalController.abort(), TOTAL_ORCHESTRATION_TIMEOUT_MS);

  // Kick off all four passes IMMEDIATELY (concurrent by construction).
  const settled = await Promise.allSettled(
    PASS_IDS.map((pass) => runSinglePass(pass, base64, mime, model, deps.providerCall, totalController, now, passes)),
  );
  clearTimeout(totalTimer);

  // Assemble per-pass results / first failure.
  const partitions: Partial<Record<PassId, unknown>> = {};
  for (let i = 0; i < PASS_IDS.length; i++) {
    const pass = PASS_IDS[i];
    const s = settled[i];
    if (s.status === "rejected") {
      // runSinglePass always returns; a rejection is a programmer error.
      return {
        ok: false,
        error: {
          code: FAILURE_CODES.INTERNAL_ERROR,
          message: `pass ${pass} rejected unexpectedly: ${(s.reason as Error)?.message ?? "unknown"}`,
          failed_pass: pass,
        },
        diagnostics: buildDiagnostics(passes, now() - t0, requestId, model, {
          success: false,
          validation_issue_count: 0,
        }),
      };
    }
    const r = s.value;
    if (!r.ok) {
      return {
        ok: false,
        error: { code: r.code, message: r.message, failed_pass: pass },
        diagnostics: buildDiagnostics(passes, now() - t0, requestId, model, {
          success: false,
          validation_issue_count: 0,
        }),
      };
    }
    partitions[pass] = r.parsed;
  }

  // Merge.
  const merged = mergeFourPass({
    passA: partitions.A as FourPassAOutput,
    passB: partitions.B as FourPassBOutput,
    passC: partitions.C as FourPassCOutput,
    passD: partitions.D as FourPassDOutput,
  });

  if (!merged.ok) {
    const issueCount = merged.validation?.issues.length ?? 0;
    const code = merged.validation ? FAILURE_CODES.CANONICAL_VALIDATION_FAILURE : FAILURE_CODES.MERGE_FAILURE;
    return {
      ok: false,
      error: { code, message: merged.error },
      diagnostics: buildDiagnostics(passes, now() - t0, requestId, model, {
        success: false,
        validation_issue_count: issueCount,
      }),
    };
  }

  // Defensive re-validation (merged.validation already ran; keep as belt-and-suspenders).
  const validation: ValidationResult = validateCanonicalExtractionV1(merged.value);
  if (!validation.valid) {
    return {
      ok: false,
      error: {
        code: FAILURE_CODES.CANONICAL_VALIDATION_FAILURE,
        message: "canonical validation failed after merge",
      },
      diagnostics: buildDiagnostics(passes, now() - t0, requestId, model, {
        success: false,
        validation_issue_count: validation.issues.length,
      }),
    };
  }

  return {
    ok: true,
    canonical: merged.value,
    diagnostics: buildDiagnostics(passes, now() - t0, requestId, model, {
      success: true,
      validation_issue_count: 0,
    }),
  };
}

// ── Single-pass execution (provider → parse → shape check) ────────────────

type SinglePassOk = { ok: true; parsed: unknown };
type SinglePassErr = { ok: false; code: FailureCode; message: string };
type SinglePassResult = SinglePassOk | SinglePassErr;

async function runSinglePass(
  pass: PassId,
  base64: string,
  mime: SupportedMimeType,
  model: string,
  providerCall: ProviderCaller,
  totalController: AbortController,
  now: () => number,
  passes: Record<PassId, PassDiagnostic>,
): Promise<SinglePassResult> {
  const prompt = FOUR_PASS_PROMPTS[pass];
  const jsonSchema = schemaForPass(pass);
  const diag = passes[pass];
  diag.started_at = now();

  // Per-pass timeout — either the pass's own timer OR the orchestrator ceiling.
  const passController = new AbortController();
  const passTimer = setTimeout(() => passController.abort(), PER_PASS_TIMEOUT_MS);
  const onTotalAbort = () => passController.abort();
  totalController.signal.addEventListener("abort", onTotalAbort);

  let providerOut: ProviderCallOutput;
  try {
    providerOut = await providerCall({
      pass,
      prompt,
      model,
      jsonSchema,
      document: { base64, mimeType: mime },
      timeoutMs: PER_PASS_TIMEOUT_MS,
      signal: passController.signal,
    });
    diag.http_status = providerOut.httpStatus;
    diag.finish_reason = providerOut.finishReason ?? null;
    diag.tokens_prompt = providerOut.tokensPrompt ?? null;
    diag.tokens_completion = providerOut.tokensCompletion ?? null;
  } catch (err) {
    diag.finished_at = now();
    diag.latency_ms = diag.finished_at - diag.started_at;
    diag.provider_error = (err as Error)?.message ?? "unknown provider error";
    const code = totalController.signal.aborted
      ? FAILURE_CODES.ORCHESTRATION_TIMEOUT
      : PROVIDER_FAILURE_CODE[pass];
    return { ok: false, code, message: `pass ${pass} provider call failed: ${diag.provider_error}` };
  } finally {
    clearTimeout(passTimer);
    totalController.signal.removeEventListener("abort", onTotalAbort);
  }

  diag.finished_at = now();
  diag.latency_ms = diag.finished_at - diag.started_at;

  // Parse.
  let parsed: unknown;
  try {
    parsed = JSON.parse(providerOut.content);
    diag.parse_status = "ok";
  } catch (err) {
    diag.parse_status = "failed";
    diag.parse_error = (err as Error)?.message ?? "invalid JSON";
    return {
      ok: false,
      code: PARSE_FAILURE_CODE[pass],
      message: `pass ${pass} returned non-JSON content`,
    };
  }

  // Shape check: must be an object with the correct contract_version.
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    diag.parse_status = "failed";
    diag.parse_error = "not an object";
    return {
      ok: false,
      code: PARSE_FAILURE_CODE[pass],
      message: `pass ${pass} parsed output is not a JSON object`,
    };
  }
  const cv = (parsed as { contract_version?: unknown }).contract_version;
  if (cv !== CANONICAL_CONTRACT_VERSION) {
    diag.parse_status = "failed";
    diag.parse_error = `contract_version mismatch: ${String(cv)}`;
    return {
      ok: false,
      code: PARSE_FAILURE_CODE[pass],
      message: `pass ${pass} contract_version mismatch (got ${String(cv)})`,
    };
  }
  // Passes B/C/D must include a `quote` object; Pass A must not.
  if (pass === "A") {
    // no structural requirement beyond contract_version — mergeFourPass validates the rest
  } else {
    const quote = (parsed as { quote?: unknown }).quote;
    if (!quote || typeof quote !== "object" || Array.isArray(quote)) {
      diag.parse_status = "failed";
      diag.parse_error = "missing 'quote' object";
      return {
        ok: false,
        code: PARSE_FAILURE_CODE[pass],
        message: `pass ${pass} output missing 'quote' object`,
      };
    }
  }

  return { ok: true, parsed };
}

// ═══════════════════════════════════════════════════════════════════════════
// Default provider caller — Lovable AI Gateway (chat completions).
// Used by the experimental edge function and live smoke.
// ═══════════════════════════════════════════════════════════════════════════

export function createLovableGatewayProviderCaller(apiKey: string): ProviderCaller {
  const endpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";

  return async function providerCall(input: ProviderCallInput): Promise<ProviderCallOutput> {
    const dataUrl = `data:${input.document.mimeType};base64,${input.document.base64}`;
    const body = {
      model: input.model,
      messages: [
        { role: "system", content: input.prompt.system },
        {
          role: "user",
          content: [
            { type: "text", text: input.prompt.userTemplate },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: `CanonicalExtractionV1_Pass${input.pass}`,
          strict: true,
          schema: input.jsonSchema,
        },
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: input.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`gateway ${res.status}: ${errText.slice(0, 500)}`);
    }
    const json = await res.json();
    const choice = json?.choices?.[0];
    const content = choice?.message?.content;
    if (typeof content !== "string") {
      throw new Error("gateway returned no string content");
    }
    return {
      content,
      httpStatus: res.status,
      finishReason: choice?.finish_reason ?? null,
      tokensPrompt: json?.usage?.prompt_tokens ?? null,
      tokensCompletion: json?.usage?.completion_tokens ?? null,
    };
  };
}
