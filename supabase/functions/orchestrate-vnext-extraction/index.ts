// ═══════════════════════════════════════════════════════════════════════════
// EXPERIMENTAL EDGE FUNCTION — orchestrate-vnext-extraction (Sprint 06B)
//
// Thin HTTP wrapper around the reusable four-pass orchestrator core.
// NOT DEPLOYED. NOT WIRED to /scan, quote-scanner, wm-analyze-quote, or
// orchestrate-quote-analysis. Auth/exposure policy MUST be explicitly
// decided before any future deployment — see README.
//
// This function:
//   • parses one experimental request envelope
//   • delegates to `runFourPassOrchestration` with the Lovable-gateway caller
//   • maps typed results to sanitized HTTP responses
//   • contains ZERO prompt/business logic (all logic lives in the core)
// ═══════════════════════════════════════════════════════════════════════════

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

import {
  createLovableGatewayProviderCaller,
  FAILURE_CODES,
  runFourPassOrchestration,
  SUPPORTED_MIME_TYPES,
  type OrchestratorInput,
} from "../_shared/scanner-brain/vnext/four-pass-orchestrator.ts";

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function bad(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), {
    status,
    headers: jsonHeaders,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad(405, "METHOD_NOT_ALLOWED", "POST only");

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return bad(500, "INTERNAL_ERROR", "LOVABLE_API_KEY not configured");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad(400, FAILURE_CODES.INVALID_INPUT, "request body is not JSON");
  }
  if (!body || typeof body !== "object") {
    return bad(400, FAILURE_CODES.INVALID_INPUT, "request body must be an object");
  }
  const b = body as Record<string, unknown>;
  const input: OrchestratorInput = {
    fileBase64: typeof b.fileBase64 === "string" ? b.fileBase64 : "",
    mimeType: typeof b.mimeType === "string" ? b.mimeType : "",
    requestId: typeof b.requestId === "string" ? b.requestId : null,
    model: typeof b.model === "string" ? b.model : undefined,
  };

  const providerCall = createLovableGatewayProviderCaller(apiKey);

  try {
    const result = await runFourPassOrchestration(input, { providerCall });
    if (result.ok) {
      return new Response(
        JSON.stringify({ ok: true, canonical: result.canonical, diagnostics: result.diagnostics }),
        { status: 200, headers: jsonHeaders },
      );
    }
    // Map failure taxonomy to HTTP status. Input problems → 400, everything
    // else → 502 so callers can distinguish caller-fixable failures from
    // upstream/extraction failures. Diagnostics are always returned.
    const httpStatus = result.error.code === FAILURE_CODES.INVALID_INPUT ? 400 : 502;
    return new Response(
      JSON.stringify({ ok: false, error: result.error, diagnostics: result.diagnostics }),
      { status: httpStatus, headers: jsonHeaders },
    );
  } catch (err) {
    const message = (err as Error)?.message ?? "unknown error";
    return new Response(
      JSON.stringify({
        ok: false,
        error: { code: FAILURE_CODES.INTERNAL_ERROR, message },
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
});

// Documented for future deployment reviewers:
//   Supported inputs: { fileBase64, mimeType, requestId?, model? }
//   Supported MIME:   ${SUPPORTED_MIME_TYPES.join(", ")}
void SUPPORTED_MIME_TYPES;
