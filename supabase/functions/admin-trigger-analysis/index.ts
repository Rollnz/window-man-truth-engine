import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAdminRequest, corsHeaders, errorResponse, successResponse } from "../_shared/adminAuth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse(405, "method_not_allowed", "POST required");
  }

  // ── Admin auth ──
  const validation = await validateAdminRequest(req);
  if (!validation.ok) return validation.response;

  const { supabaseAdmin } = validation;

  // ── Parse body ──
  let quoteFileId: string;
  let leadId: string;
  try {
    const body = await req.json();
    quoteFileId = body.quoteFileId;
    leadId = body.leadId;
  } catch {
    return errorResponse(400, "invalid_json", "Request body must be valid JSON");
  }

  if (!quoteFileId || !leadId) {
    return errorResponse(400, "missing_params", "quoteFileId and leadId are required");
  }

  // ── Verify quote file exists and is claimable (none or failed) ──
  const { data: claimedId, error: claimError } = await supabaseAdmin
    .rpc("claim_quote_file_preanalysis", { p_quote_file_id: quoteFileId });

  if (claimError) {
    console.error("[admin-trigger-analysis] claim RPC error:", claimError.message);
    return errorResponse(500, "claim_failed", "Failed to claim quote file for analysis");
  }

  if (!claimedId) {
    return errorResponse(409, "not_claimable", "Quote file is not in a claimable state (must be 'none' or 'failed')");
  }

  // ── Look up file metadata for mimeType ──
  const { data: fileRecord, error: fileError } = await supabaseAdmin
    .from("quote_files")
    .select("mime_type")
    .eq("id", quoteFileId)
    .single();

  if (fileError || !fileRecord) {
    console.error("[admin-trigger-analysis] file lookup error:", fileError?.message);
    return errorResponse(404, "file_not_found", "Quote file record not found");
  }

  // ── Fire-and-forget call to analyze-consultation-quote ──
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const analyzeUrl = `${supabaseUrl}/functions/v1/analyze-consultation-quote`;

  // Don't await — fire-and-forget so the admin gets an instant response
  fetch(analyzeUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      leadId,
      quoteFileId,
      mimeType: fileRecord.mime_type,
    }),
  }).catch((err) => {
    console.error("[admin-trigger-analysis] Fire-and-forget failed:", err);
  });

  console.log(`[admin-trigger-analysis] Triggered analysis for quoteFileId=${quoteFileId} leadId=${leadId} by ${validation.email}`);

  return successResponse({ 
    message: "Analysis triggered",
    quoteFileId,
    leadId,
  }, 202);
});
