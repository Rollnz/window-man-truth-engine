import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

  // ── Auth check: service_role only ──
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (token !== supabaseServiceKey) {
    console.error("[analyze-consultation-quote] Unauthorized: invalid service_role token");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let leadId: string;
  let quoteFileId: string;
  let mimeType: string;

  try {
    const body = await req.json();
    leadId = body.leadId;
    quoteFileId = body.quoteFileId;
    mimeType = body.mimeType || "application/pdf";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!leadId || !quoteFileId) {
    return new Response(JSON.stringify({ error: "leadId and quoteFileId required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ── Idempotency check ──
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("ai_pre_analysis")
    .eq("id", leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    console.error("[analyze-consultation-quote] Lead not found:", leadId, leadErr);
    return new Response(JSON.stringify({ error: "Lead not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const currentStatus = lead.ai_pre_analysis?.status;
  if (currentStatus === "pending" || currentStatus === "completed") {
    console.log("[analyze-consultation-quote] Already processed:", leadId, currentStatus);
    return new Response(JSON.stringify({ message: "Already processed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Return 202 immediately, then process in background ──
  const responsePromise = new Response(JSON.stringify({ message: "Analysis started" }), {
    status: 202,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  // Use EdgeRuntime.waitUntil if available, otherwise just run inline
  const processingPromise = (async () => {
    try {
      // Set pending
      await supabase
        .from("leads")
        .update({
          ai_pre_analysis: {
            status: "pending",
            started_at: new Date().toISOString(),
          },
        })
        .eq("id", leadId);
      console.log("[analyze-consultation-quote] Set pending:", leadId);

      // Download file
      const { data: fileRecord, error: fileErr } = await supabase
        .from("quote_files")
        .select("file_path, file_name, mime_type")
        .eq("id", quoteFileId)
        .maybeSingle();

      if (fileErr || !fileRecord?.file_path) {
        throw new Error(`File record not found for quoteFileId=${quoteFileId}: ${fileErr?.message}`);
      }

      const actualMime = fileRecord.mime_type || mimeType;
      console.log("[analyze-consultation-quote] Downloading file:", fileRecord.file_path);

      const { data: fileBlob, error: dlErr } = await supabase.storage
        .from("quotes")
        .download(fileRecord.file_path);

      if (dlErr || !fileBlob) {
        throw new Error(`File download failed: ${dlErr?.message}`);
      }

      // Size guard: 10MB
      const buffer = await fileBlob.arrayBuffer();
      if (buffer.byteLength > 10 * 1024 * 1024) {
        throw new Error(`File too large: ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB (max 10MB)`);
      }
      console.log("[analyze-consultation-quote] File downloaded:", (buffer.byteLength / 1024).toFixed(0), "KB");

      // Convert to base64
      const uint8 = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64Data = btoa(binary);

      // Determine media type for Gemini
      let mediaType: string;
      if (actualMime.includes("pdf")) {
        mediaType = "application/pdf";
      } else if (actualMime.includes("png")) {
        mediaType = "image/png";
      } else {
        mediaType = "image/jpeg";
      }

      // ── AI call with tool calling ──
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);

      const aiPayload = {
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a Sales Intelligence Analyst for a window replacement company. You analyze competitor quotes to give our sales team an unfair advantage before strategy calls.

Your job is to extract key pricing data, identify the competitor's brand/material, assess their markup level, flag any red flags or missing items, and suggest a compelling sales angle our team can use.

Be concise, factual, and sales-oriented. If you cannot determine a value, use null or "Unknown". Never fabricate prices -- only extract what's clearly stated in the document.

If the document is NOT a window/door quote (e.g., it's a random image, receipt, or unrelated document), set all fields to their default/unknown values and note this in the sales_angle.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType};base64,${base64Data}`,
                },
              },
              {
                type: "text",
                text: "Analyze this competitor's window replacement quote. Extract the pricing, materials, and any red flags. Provide a sales angle our team can use.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_quote_analysis",
              description: "Submit the structured analysis of a competitor's window replacement quote.",
              parameters: {
                type: "object",
                properties: {
                  estimated_total_price: {
                    type: ["number", "null"],
                    description: "Total price from the quote in USD, or null if not clearly stated.",
                  },
                  window_brand_or_material: {
                    type: "string",
                    description: "The window brand, manufacturer, or material type mentioned (e.g., 'Pella vinyl', 'Andersen wood', 'Unknown').",
                  },
                  detected_markup_level: {
                    type: "string",
                    enum: ["High", "Average", "Low", "Unknown"],
                    description: "Assessment of whether the pricing seems High, Average, Low, or Unknown relative to market rates.",
                  },
                  red_flags: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of concerning items: missing warranties, vague scope, hidden fees, no permit mention, etc.",
                  },
                  sales_angle: {
                    type: "string",
                    description: "A 1-2 sentence suggestion for how our sales team should position against this quote during the strategy call.",
                  },
                },
                required: [
                  "estimated_total_price",
                  "window_brand_or_material",
                  "detected_markup_level",
                  "red_flags",
                  "sales_angle",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_quote_analysis" } },
      };

      console.log("[analyze-consultation-quote] Invoking AI for lead:", leadId);

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aiPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI gateway returned ${aiResponse.status}: ${errText}`);
      }

      const aiResult = await aiResponse.json();

      // Extract tool call result
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        throw new Error("AI did not return a tool call result");
      }

      let analysisResult: Record<string, unknown>;
      try {
        analysisResult = JSON.parse(toolCall.function.arguments);
      } catch {
        throw new Error(`Invalid JSON from AI tool call: ${toolCall.function.arguments}`);
      }

      // Validate required fields exist
      const result = {
        estimated_total_price: analysisResult.estimated_total_price ?? null,
        window_brand_or_material: String(analysisResult.window_brand_or_material || "Unknown"),
        detected_markup_level: ["High", "Average", "Low", "Unknown"].includes(
          String(analysisResult.detected_markup_level)
        )
          ? String(analysisResult.detected_markup_level)
          : "Unknown",
        red_flags: Array.isArray(analysisResult.red_flags)
          ? analysisResult.red_flags.map(String)
          : [],
        sales_angle: String(analysisResult.sales_angle || "No angle extracted"),
      };

      // Update DB with success
      await supabase
        .from("leads")
        .update({
          ai_pre_analysis: {
            status: "completed",
            result,
            completed_at: new Date().toISOString(),
            model: "google/gemini-2.5-flash",
          },
        })
        .eq("id", leadId);

      console.log("[analyze-consultation-quote] SUCCESS for lead:", leadId, JSON.stringify(result));
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";
      console.error("[analyze-consultation-quote] FAILED for lead:", leadId, reason);

      // Update DB with failure
      await supabase
        .from("leads")
        .update({
          ai_pre_analysis: {
            status: "failed",
            reason,
            completed_at: new Date().toISOString(),
          },
        })
        .eq("id", leadId);
    }
  })();

  // Try to use waitUntil for background processing, fall back to inline
  try {
    // @ts-ignore - EdgeRuntime may not be available
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processingPromise);
    } else {
      // Just let the promise run — Deno will keep the isolate alive for the response
      processingPromise.catch((e) =>
        console.error("[analyze-consultation-quote] Background processing error:", e)
      );
    }
  } catch {
    processingPromise.catch((e) =>
      console.error("[analyze-consultation-quote] Background processing error:", e)
    );
  }

  return responsePromise;
});
