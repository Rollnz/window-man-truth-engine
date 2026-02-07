// ═══════════════════════════════════════════════════════════════════════════
// QUOTE SCANNER EDGE FUNCTION
// Clean orchestrator pattern - imports logic from modular files
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "./deps.ts";
import { 
  corsHeaders, 
  getClientIp, 
  requireJson, 
  capBodySize, 
  checkRateLimit, 
  handleGuardError 
} from "./guards.ts";
import { 
  QuoteScannerRequestSchema, 
  ExtractionSignalsJsonSchema, 
  sanitizeForPrompt 
} from "./schema.ts";
import type { ExtractionSignals } from "./schema.ts";
import { EXTRACTION_RUBRIC, GRADING_RUBRIC, USER_PROMPT_TEMPLATE } from "./rubric.ts";
import { scoreFromSignals } from "./scoring.ts";
import { generateForensicSummary, extractIdentity } from "./forensic.ts";
import { logAttributionEvent } from "../_shared/attributionLogger.ts";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS FOR AI GATEWAY
// ═══════════════════════════════════════════════════════════════════════════

type ImageUrlPart = { type: "image_url"; image_url: { url: string } };
type TextPart = { type: "text"; text: string };
type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<TextPart | ImageUrlPart>;
};
type JsonSchemaResponseFormat = {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: unknown;
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Compute SHA-256 hash for deduplication
// ═══════════════════════════════════════════════════════════════════════════

async function computeImageHash(imageBase64: string): Promise<string> {
  const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
  const hashBuffer = await crypto.subtle.digest('SHA-256', imageBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIp(req);

  try {
    // GUARD: Require JSON content-type and parse body
    const rawBody = await requireJson(req);
    
    // GUARD: Cap body size (7MB for image)
    capBodySize(rawBody, 7_000_000);
    
    // GUARD: Rate limit (50 per hour per IP)
    const rateLimitCheck = await checkRateLimit(clientIP, "quote-scanner", 50, 3600000);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter 
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitCheck.retryAfter)
          }
        }
      );
    }

    // Validate with Zod
    const parseResult = QuoteScannerRequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.warn("[QuoteScanner] Validation failed:", parseResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input. Please check your request and try again.",
          code: "VALIDATION_ERROR",
          details: parseResult.error.issues.map(i => i.message).join("; ")
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      mode, 
      imageBase64, 
      mimeType, 
      openingCount, 
      areaName, 
      notesFromCalculator, 
      question, 
      analysisContext, 
      sessionId, 
      leadId, 
      clientId 
    } = parseResult.data;

    console.log(`[QuoteScanner] Request: mode=${mode}, IP=${clientIP}, sessionId=${sessionId || 'not provided'}`);

    // Verify AI configuration
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DEDUPLICATION CHECK (analyze mode only) - Before calling AI
    // ═══════════════════════════════════════════════════════════════════════════
    
    let imageHash: string | null = null;
    let startTime = Date.now();
    
    if (mode === "analyze" && imageBase64) {
      // Compute SHA-256 hash of image for deduplication
      imageHash = await computeImageHash(imageBase64);
      
      // Initialize Supabase client for DB operations
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Check for cached analysis (deduplication)
      const { data: cachedAnalysis } = await supabaseClient
        .from('quote_analyses')
        .select('analysis_json, created_at, id, lead_id')
        .eq('image_hash', imageHash)
        .maybeSingle();

      if (cachedAnalysis) {
        console.log(`[QuoteScanner] CACHE HIT - hash=${imageHash.substring(0, 12)}... id=${cachedAnalysis.id}`);
        
        // Update lead_id if we now have one and cached record doesn't
        if (leadId && !cachedAnalysis.lead_id) {
          await supabaseClient
            .from('quote_analyses')
            .update({ lead_id: leadId, updated_at: new Date().toISOString() })
            .eq('id', cachedAnalysis.id);
          console.log(`[QuoteScanner] Updated lead_id on cached analysis ${cachedAnalysis.id}`);
        }
        
        return new Response(JSON.stringify(cachedAnalysis.analysis_json), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log(`[QuoteScanner] CACHE MISS - hash=${imageHash.substring(0, 12)}... proceeding with AI analysis`);
    }

    // Build messages based on mode
    let messages: ChatMessage[] = [];
    let responseFormat: JsonSchemaResponseFormat | undefined = undefined;

    if (mode === "analyze") {
      const userPrompt = USER_PROMPT_TEMPLATE(
        openingCount ?? null,
        areaName ?? null,
        notesFromCalculator ?? null
      );

      messages = [
        { role: "system", content: EXTRACTION_RUBRIC },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ];

      responseFormat = {
        type: "json_schema",
        json_schema: {
          name: "quote_signals",
          strict: true,
          schema: ExtractionSignalsJsonSchema,
        },
      };
    } else if (mode === "email") {
      const sanitizedContext = JSON.stringify(analysisContext).slice(0, 5000);
      messages = [
        {
          role: "system",
          content: "You are a professional negotiation assistant. Draft a polite but firm email to a contractor based on quote analysis results.",
        },
        {
          role: "user",
          content: `Based on this quote analysis: ${sanitizedContext}\n\nDraft a professional email to the contractor addressing the main concerns and requesting clarifications or adjustments.`,
        },
      ];
    } else if (mode === "phoneScript") {
      const ctx = analysisContext || {};
      messages = [
        {
          role: "system",
          content: `You are a negotiation coach helping a homeowner prepare for a phone call with a contractor.

Your job is to create a structured phone script that empowers the homeowner to confidently address issues in their quote.

The script MUST include these three sections with clear headers:

1. OPENING PLEASANTRY
   - A confident, friendly opening line
   - Reference the quote total in a natural way
   - Express appreciation for their time
   - Set a collaborative tone

2. THE "ASK" (BULLETED LIST)
   - List specific demands based on the warnings and missing items from the analysis
   - Each bullet should be a clear, actionable request
   - Focus on getting commitments in writing
   - Be specific about what needs to be added or clarified

3. OBJECTION HANDLING
   - Provide "If they say X, you say Y" responses for common contractor pushbacks
   - Keep responses polite but firm
   - Emphasize the importance of documentation
   - Include at least 3-4 common objections and responses

Format the output with clear section headers and make it easy to read during a phone call.`,
        },
        {
          role: "user",
          content: `Based on this quote analysis:\n\nSummary: ${sanitizeForPrompt(String(ctx.summary || ""))}\nPrice per opening: ${sanitizeForPrompt(String(ctx.pricePerOpening || ""))}\nWarnings: ${JSON.stringify((ctx.warnings || []).slice(0, 10))}\nMissing items: ${JSON.stringify((ctx.missingItems || []).slice(0, 10))}\n\nScores:\n- Safety: ${ctx.safetyScore || 0}\n- Scope: ${ctx.scopeScore || 0}\n- Price: ${ctx.priceScore || 0}\n- Fine Print: ${ctx.finePrintScore || 0}\n- Warranty: ${ctx.warrantyScore || 0}\n\nCreate a phone script that helps the homeowner confidently negotiate these specific issues.`,
        },
      ];
    } else if (mode === "question") {
      const sanitizedQuestion = sanitizeForPrompt(question || "");
      const sanitizedContext = JSON.stringify(analysisContext || {}).slice(0, 3000);
      messages = [
        { role: "system", content: GRADING_RUBRIC },
        {
          role: "user",
          content: [
            { type: "text", text: `Context: ${sanitizedContext}\n\nQuestion: ${sanitizedQuestion}` },
            ...(imageBase64 ? [{ type: "image_url" as const, image_url: { url: `data:${mimeType};base64,${imageBase64}` } }] : []),
          ],
        },
      ];
    }

    // Build AI request body
    const body: {
      model: string;
      messages: ChatMessage[];
      response_format?: JsonSchemaResponseFormat;
    } = {
      model: Deno.env.get('AI_MODEL_VERSION') || "google/gemini-3-flash-preview",
      messages,
    };

    if (responseFormat) {
      body.response_format = responseFormat;
    }

    console.log("[QuoteScanner] Calling Lovable AI with mode:", mode);

    // Call AI gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "AI returned an empty response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ANALYZE MODE: Parse signals → Score → Generate forensic summary → Persist
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (mode === "analyze") {
      let extracted: ExtractionSignals;
      try {
        extracted = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI extraction JSON:", content.substring(0, 500));
        return new Response(
          JSON.stringify({ error: "AI returned an invalid response format. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Score from signals (includes hard caps and curving)
      const scored = scoreFromSignals(extracted, openingCount ?? null);
      
      // Generate forensic summary (Safeguard 2: receives hardCap from scored)
      const forensic = generateForensicSummary(extracted, scored);
      
      // Extract contractor identity for future verification
      const extractedIdentity = extractIdentity(extracted);

      console.log("[QuoteScanner] Analysis complete. Overall score:", scored.overallScore, 
        scored.hardCap.applied ? `(capped at ${scored.hardCap.ceiling})` : '');

      // Log to wm_events for attribution
      if (sessionId) {
        logAttributionEvent({
          sessionId,
          eventName: 'quote_scanned',
          eventCategory: 'tool_usage',
          pagePath: '/quote-scanner',
          pageTitle: 'Quote Scanner - Analysis',
          leadId,
          eventData: {
            overall_score: scored.overallScore,
            safety_score: scored.safetyScore,
            scope_score: scored.scopeScore,
            price_per_opening: scored.pricePerOpening,
            warnings_count: scored.warnings.length,
            missing_items_count: scored.missingItems.length,
            hard_cap_applied: scored.hardCap.applied,
            hard_cap_reason: scored.hardCap.reason,
          },
          anonymousIdFallback: leadId ? `lead-${leadId}` : `quote-scan-${Date.now()}`,
        });
      }

      // Build response payload
      const responsePayload = {
        overallScore: scored.overallScore,
        safetyScore: scored.safetyScore,
        scopeScore: scored.scopeScore,
        priceScore: scored.priceScore,
        finePrintScore: scored.finePrintScore,
        warrantyScore: scored.warrantyScore,
        pricePerOpening: scored.pricePerOpening,
        warnings: scored.warnings,
        missingItems: scored.missingItems,
        summary: scored.summary,
        forensic,
        extractedIdentity,
      };

      // ═══════════════════════════════════════════════════════════════════════════
      // PERSIST ANALYSIS TO DATABASE
      // ═══════════════════════════════════════════════════════════════════════════

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const processingTimeMs = Date.now() - startTime;
      
      const analysisRecord = {
        session_id: sessionId || `anon-${Date.now()}`,
        lead_id: leadId || null,
        quote_file_id: null, // Files not currently persisted to storage
        image_hash: imageHash!,
        overall_score: scored.overallScore,
        safety_score: scored.safetyScore,
        scope_score: scored.scopeScore,
        price_score: scored.priceScore,
        fine_print_score: scored.finePrintScore,
        warranty_score: scored.warrantyScore,
        price_per_opening: scored.pricePerOpening,
        warnings_count: scored.warnings.length,
        missing_items_count: scored.missingItems.length,
        analysis_json: responsePayload,
        ai_model_version: Deno.env.get('AI_MODEL_VERSION') || 'gemini-3-flash-preview',
        processing_time_ms: processingTimeMs,
      };

      const { data: insertedAnalysis, error: insertError } = await supabaseClient
        .from('quote_analyses')
        .insert(analysisRecord)
        .select('id')
        .single();

      if (insertError) {
        // Log but don't fail - analysis was successful
        console.error('[QuoteScanner] Failed to persist analysis (non-fatal):', insertError.message);
      } else {
        console.log(`[QuoteScanner] Analysis persisted: id=${insertedAnalysis.id}, hash=${imageHash?.substring(0, 12)}..., time=${processingTimeMs}ms`);
      }

      // Log to wm_event_log canonical ledger
      try {
        let resolvedClientId = clientId || null;
        let resolvedLeadId = leadId || null;
        let resolvedSessionId = sessionId || null;
        
        if (sessionId && (!resolvedClientId || !resolvedLeadId)) {
          const { data: sessionData } = await supabaseClient
            .from('wm_sessions')
            .select('id, anonymous_id, lead_id')
            .eq('id', sessionId)
            .limit(1)
            .maybeSingle();
          
          if (sessionData) {
            resolvedClientId = resolvedClientId || sessionData.anonymous_id;
            resolvedLeadId = resolvedLeadId || sessionData.lead_id;
            resolvedSessionId = resolvedSessionId || sessionData.id;
          }
        }

        const eventId = crypto.randomUUID();
        const eventPayload = {
          event_id: eventId,
          event_name: 'scanner_analysis_completed',
          event_type: 'signal',
          event_time: new Date().toISOString(),
          client_id: resolvedClientId,
          lead_id: resolvedLeadId,
          session_id: resolvedSessionId,
          source_tool: 'ai_scanner',
          source_system: 'quote-scanner',
          ingested_by: 'quote-scanner',
          page_path: '/ai-scanner',
          metadata: {
            analysis_version: '2.2',
            analysis_id: insertedAnalysis?.id || null,
            overall_score: scored.overallScore,
            safety_score: scored.safetyScore,
            scope_score: scored.scopeScore,
            price_score: scored.priceScore,
            fine_print_score: scored.finePrintScore,
            warranty_score: scored.warrantyScore,
            price_per_opening: scored.pricePerOpening,
            warnings_count: scored.warnings.length,
            missing_items_count: scored.missingItems.length,
            hard_cap_applied: scored.hardCap.applied,
            hard_cap_reason: scored.hardCap.reason,
            hard_cap_statute: scored.hardCap.statute,
            forensic_risk_level: forensic.riskLevel,
            detected_vendor: extractedIdentity.contractorName,
            processing_time_ms: processingTimeMs,
          },
        };

        const { error: ledgerError } = await supabaseClient
          .from('wm_event_log')
          .insert(eventPayload);

        if (ledgerError) {
          console.error('[quote-scanner] wm_event_log insert failed (non-fatal):', ledgerError.message);
        } else {
          console.log(`[quote-scanner] Logged scanner_analysis_completed to wm_event_log: ${eventId}`, {
            client_id: resolvedClientId,
            lead_id: resolvedLeadId,
            session_id: resolvedSessionId,
          });
        }
      } catch (ledgerErr) {
        console.error('[quote-scanner] wm_event_log logging exception (non-fatal):', ledgerErr);
      }

      return new Response(JSON.stringify(responsePayload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Non-analyze modes return AI content directly
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return handleGuardError(error);
  }
});
