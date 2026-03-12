// ═══════════════════════════════════════════════════════════════════════════
// WM-ANALYZE-QUOTE: External Analysis API
// Stateless service-to-service endpoint for Manus
// Auth: Bearer token (WM_ANALYZE_QUOTE_SECRET)
// No internal tracking, no DB writes
//
// All scoring/forensic/rubric logic imported from /_shared/scanner-brain (SSOT)
// ═══════════════════════════════════════════════════════════════════════════

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ── Scanner Brain: Single Source of Truth ──
import { ExtractionSignalsJsonSchema, sanitizeForPrompt } from "../_shared/scanner-brain/schema.ts";
import type { ExtractionSignals } from "../_shared/scanner-brain/schema.ts";
import { EXTRACTION_RUBRIC, USER_PROMPT_TEMPLATE } from "../_shared/scanner-brain/rubric.ts";
import { scoreFromSignals } from "../_shared/scanner-brain/scoring.ts";
import { generateForensicSummary, extractIdentity } from "../_shared/scanner-brain/forensic.ts";
import { BRAIN_VERSION } from "../_shared/scanner-brain/index.ts";

// ═══════════════════════════════════════════════════════════════════════════
// CORS
// ═══════════════════════════════════════════════════════════════════════════

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMA (endpoint-specific validation)
// ═══════════════════════════════════════════════════════════════════════════

const RequestSchema = z.object({
  file_url: z.string().url().refine(u => u.startsWith("https://"), { message: "file_url must be HTTPS" }),
  mime_type: z.enum(["image/png", "image/jpeg", "image/webp", "application/pdf"]),
  opening_count: z.number().int().min(1).max(200).optional(),
  area_name: z.string().max(100).optional(),
  notes_from_calculator: z.string().max(2000).optional(),
  trace_id: z.string().uuid("trace_id must be a valid UUID"),
});

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HELPER
// ═══════════════════════════════════════════════════════════════════════════

function errorResponse(status: number, code: string, message: string, details?: unknown) {
  return new Response(
    JSON.stringify({ error: { code, message, ...(details ? { details } : {}) } }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse(405, "METHOD_NOT_ALLOWED", "Only POST is accepted");

  const startTime = Date.now();

  // ─── AUTH GATE ───
  const authHeader = req.headers.get("Authorization") || "";
  const expectedSecret = Deno.env.get("WM_ANALYZE_QUOTE_SECRET");
  if (!expectedSecret) { console.error("[wm-analyze-quote] WM_ANALYZE_QUOTE_SECRET not configured"); return errorResponse(500, "CONFIG_ERROR", "Service not configured"); }
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== expectedSecret) return errorResponse(401, "AUTH_FAILED", "Invalid or missing authorization");

  // ─── PARSE & VALIDATE ───
  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body"); }
  const parseResult = RequestSchema.safeParse(rawBody);
  if (!parseResult.success) return errorResponse(400, "VALIDATION_ERROR", "Invalid request", parseResult.error.issues);

  const { file_url, mime_type, opening_count, area_name, notes_from_calculator, trace_id } = parseResult.data;
  console.log(`[wm-analyze-quote] trace_id=${trace_id} file_url=${file_url.substring(0, 80)}...`);

  // ─── FETCH FILE → BASE64 ───
  let imageBase64: string;
  try {
    const fileResp = await fetch(file_url);
    if (!fileResp.ok) { const t = await fileResp.text(); console.error(`[wm-analyze-quote] File fetch: ${fileResp.status} ${t.substring(0, 200)}`); return errorResponse(502, "FILE_FETCH_FAILED", `Could not download file (HTTP ${fileResp.status})`); }
    const buf = await fileResp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    imageBase64 = btoa(binary);
  } catch (err) {
    console.error("[wm-analyze-quote] File fetch error:", err);
    return errorResponse(502, "FILE_FETCH_FAILED", "Could not download file from provided URL");
  }

  // ─── CALL AI GATEWAY ───
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return errorResponse(500, "AI_UNAVAILABLE", "AI service not configured");

  const modelId = Deno.env.get("AI_MODEL_VERSION") || "google/gemini-3-flash-preview";
  const userPrompt = USER_PROMPT_TEMPLATE(opening_count ?? null, area_name ?? null, notes_from_calculator ?? null);

  let aiResponse: Response;
  try {
    aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: EXTRACTION_RUBRIC },
          { role: "user", content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: `data:${mime_type};base64,${imageBase64}` } },
          ] },
        ],
        response_format: { type: "json_schema", json_schema: { name: "quote_signals", strict: true, schema: ExtractionSignalsJsonSchema } },
      }),
    });
  } catch (err) {
    console.error("[wm-analyze-quote] AI gateway error:", err);
    return errorResponse(500, "AI_UNAVAILABLE", "AI gateway unreachable");
  }

  if (!aiResponse.ok) {
    const t = await aiResponse.text();
    console.error(`[wm-analyze-quote] AI error: ${aiResponse.status} ${t.substring(0, 300)}`);
    if (aiResponse.status === 429) return errorResponse(429, "RATE_LIMITED", "AI rate limit exceeded");
    if (aiResponse.status === 402) return errorResponse(429, "RATE_LIMITED", "AI usage limit reached");
    return errorResponse(500, "AI_UNAVAILABLE", "AI service error");
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content;
  if (!content) return errorResponse(500, "AI_UNAVAILABLE", "AI returned empty response");

  // ─── PARSE SIGNALS ───
  let extracted: ExtractionSignals;
  try { extracted = JSON.parse(content); } catch { return errorResponse(500, "AI_UNAVAILABLE", "AI returned invalid format"); }

  // ─── INVALID QUOTE ───
  if (!extracted.isValidQuote) return errorResponse(422, "INVALID_QUOTE", extracted.validityReason || "Document is not a window/door quote");

  // ─── DETERMINISTIC PIPELINE (from _shared/scanner-brain SSOT) ───
  const scored = scoreFromSignals(extracted, opening_count ?? null);
  const forensic = generateForensicSummary(extracted, scored);
  const identity = extractIdentity(extracted);
  const processingTimeMs = Date.now() - startTime;

  // ─── BUILD ENVELOPE ───
  const envelope = {
    meta: { trace_id, analysis_version: `wm_rubric_v${BRAIN_VERSION}`, model_used: modelId, processing_time_ms: processingTimeMs, timestamp: new Date().toISOString() },
    preview: {
      score: scored.overallScore, grade: scored.finalGrade,
      risk_level: forensic.riskLevel,
      headline: forensic.headline,
      warning_count: scored.warnings.length, missing_item_count: scored.missingItems.length,
    },
    full: {
      dashboard: {
        overall_score: scored.overallScore, final_grade: scored.finalGrade,
        safety_score: scored.safetyScore, scope_score: scored.scopeScore,
        price_score: scored.priceScore, fine_print_score: scored.finePrintScore,
        warranty_score: scored.warrantyScore, price_per_opening: scored.pricePerOpening,
        warnings: scored.warnings, missing_items: scored.missingItems, summary: scored.summary,
      },
      forensic: {
        headline: forensic.headline, risk_level: forensic.riskLevel,
        statute_citations: forensic.statuteCitations, questions_to_ask: forensic.questionsToAsk,
        positive_findings: forensic.positiveFindings,
        hard_cap_applied: forensic.hardCapApplied, hard_cap_reason: forensic.hardCapReason, hard_cap_statute: forensic.hardCapStatute,
      },
      extracted_identity: { contractor_name: identity.contractorName, license_number: identity.licenseNumber, noa_numbers: identity.noaNumbers },
    },
  };

  console.log(`[wm-analyze-quote] ✅ trace_id=${trace_id} score=${scored.overallScore} grade=${scored.finalGrade} time=${processingTimeMs}ms`);
  return new Response(JSON.stringify(envelope), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
