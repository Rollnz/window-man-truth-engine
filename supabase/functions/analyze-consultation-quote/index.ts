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

  // ── Atomic claim via RPC (race-condition safe) ──
  const { data: claimedId, error: claimErr } = await supabase
    .rpc('claim_quote_file_preanalysis', { p_quote_file_id: quoteFileId });

  if (claimErr) {
    console.error('[analyze-consultation-quote] Claim error:', claimErr);
    return new Response(JSON.stringify({ error: 'claim_failed' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!claimedId) {
    console.log('[analyze-consultation-quote] Already claimed/completed:', quoteFileId);
    return new Response(JSON.stringify({ skipped: true, message: "Already processed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Return 202 immediately, then process in background ──
  const responsePromise = new Response(JSON.stringify({ message: "Analysis started" }), {
    status: 202,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  const startedAtIso = new Date().toISOString();

  const processingPromise = (async () => {
    try {
      console.log("[analyze-consultation-quote] Claimed & pending for quoteFile:", quoteFileId, "lead:", leadId);

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
      const timeout = setTimeout(() => controller.abort(), 60_000);

      const aiPayload = {
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a forensic Sales Intelligence Analyst for a window & door replacement company.

Goal: Extract a complete, structured reconstruction of the competitor quote so a sales rep can understand the scope without viewing the document.

Rules:
- Only extract what is explicitly present. Never infer or fabricate.
- If a field is not explicitly stated, use null (for numbers) or "Unknown" (for strings).
- Prefer the quote's exact wording.
- If the document is not a window/door quote/proposal, return defaults/Unknown and state so clearly in the sales_angle.

Process you MUST follow:
1) Determine document type. If scanned/image-based, read tables row-by-row, left-to-right.
   If selectable text, extract from structured tables first, then free-text sections.
2) Scan ALL pages. Do not stop after page 1.
3) For each window/door line item, populate every field even if most are Unknown.
4) For key fields (total price, brand, install type, warranty), include evidence:
   page number (if visible) and a short exact text snippet from the document.

EXTRACT:

A) PROJECT OVERVIEW
- competitor_name
- quote_number / proposal_id (if present)
- quote_date
- customer_name (if present)
- job_site_city/state (if present)
- window_brand, series/line, and primary_material
- estimated_total_price
- discounts/rebates
- taxes, fees, financing terms (if present)

B) ITEMIZED PRODUCTS (EVERY window/door line item)
For each entry extract:
- location/room
- product_category: "Window" | "Door" | "Sliding Door" | "Other"
- style/operation (double hung, casement, picture, etc.)
- quantity
- measurements_raw (exact text)
- measurements_width_in, measurements_height_in (numbers if explicitly derivable, else null)
- glass_package (low-e, argon, triple pane, tempered, obscure, etc.)
- performance_ratings (U-factor, SHGC, DP rating, Energy Star zone, etc.)
- grille/grid details (pattern/type)
- color_interior, color_exterior, hardware_finish
- notes / options / upgrades (screens, foam, installation kit, etc.)
- line_price and unit_price (if present)
- evidence (page + snippet)

C) INSTALLATION & SCOPE
- installation_type (insert/pocket vs full-frame vs Unknown)
- exterior_capping / trim / rot repair (what's included)
- inclusions (disposal, permits, lead-safe, paint/stain, interior trim, caulking)
- exclusions (what's NOT included)
- warranty_terms (labor/material/glass/breakage) with evidence

D) STRATEGIC OUTPUT
- detected_markup_level (High/Average/Low/Unknown)
- red_flags (array)
- sales_angle (2–3 sentences, specific to what is missing/weak in THEIR quote)

Output MUST conform to the provided JSON tool schema.`,
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
                text: "Analyze this competitor's window replacement quote. Extract the full itemized breakdown of every window/door including measurements, styles, glass packages, and colors. Identify the competitor, pricing, installation method, warranty terms, red flags, and provide a sales angle our team can use.",
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
                  schema_version: {
                    type: "number",
                    description: "Always return 2.",
                  },
                  project_overview: {
                    type: "object",
                    properties: {
                      competitor_name: { type: "string", description: "The competitor company name that issued the quote (e.g., 'Renewal by Andersen', 'Window World', 'Unknown')." },
                      quote_number: { type: ["string", "null"], description: "Quote or proposal number/ID if present." },
                      quote_date: { type: ["string", "null"], description: "Date on the quote if present." },
                      customer_name: { type: ["string", "null"], description: "Customer name if present on the quote." },
                      job_site_location: { type: ["string", "null"], description: "Job site city/state if present." },
                      window_brand_or_material: { type: "string", description: "Window brand, series, and/or primary material (e.g., 'Pella Lifestyle vinyl', 'Andersen 400 Series wood', 'Unknown')." },
                      estimated_total_price: { type: ["number", "null"], description: "Total price from the quote in USD, or null if not clearly stated." },
                      discount_amount: { type: ["number", "null"], description: "Any discount/rebate amount in USD, or null if none." },
                      financing_terms: { type: ["string", "null"], description: "Financing terms if present (e.g., '12 months 0% APR')." },
                    },
                    required: ["competitor_name", "window_brand_or_material", "estimated_total_price"],
                  },
                  itemized_openings: {
                    type: "array",
                    description: "Every window/door line item from the quote.",
                    items: {
                      type: "object",
                      properties: {
                        location: { type: "string", description: "Room or location label (e.g., 'Kitchen', 'Master Bedroom', 'Unknown')." },
                        product_category: { type: "string", enum: ["Window", "Door", "Sliding Door", "Other"], description: "Type of product." },
                        style: { type: "string", description: "Window/door style (e.g., 'Double Hung', 'Casement', 'Picture', 'Sliding Door')." },
                        quantity: { type: "number", description: "Number of this item." },
                        measurements_raw: { type: "string", description: "Exact measurement text from document (e.g., '36\" x 60\"')." },
                        measurements_width_in: { type: ["number", "null"], description: "Width in inches if explicitly derivable, else null." },
                        measurements_height_in: { type: ["number", "null"], description: "Height in inches if explicitly derivable, else null." },
                        glass_package: { type: "string", description: "Glass details (e.g., 'Double pane Low-E Argon', 'Triple pane Krypton', 'Unknown')." },
                        performance_ratings: { type: ["string", "null"], description: "U-factor, SHGC, DP rating, Energy Star zone if present." },
                        color_interior: { type: "string", description: "Interior color/finish (e.g., 'White', 'Unknown')." },
                        color_exterior: { type: "string", description: "Exterior color/finish (e.g., 'Bronze', 'Unknown')." },
                        grilles: { type: "string", description: "Grille/grid style (e.g., 'Colonial SDL', 'Prairie GBG', 'None', 'Unknown')." },
                        unit_price: { type: ["number", "null"], description: "Per-unit price in USD if listed." },
                        line_price: { type: ["number", "null"], description: "Total line price in USD if listed." },
                        notes: { type: ["string", "null"], description: "Any additional notes, options, or upgrades for this item." },
                        evidence: { type: ["string", "null"], description: "Page number + short exact text snippet from document." },
                      },
                      required: ["location", "product_category", "style", "quantity", "measurements_raw", "glass_package", "color_interior", "color_exterior"],
                    },
                  },
                  installation_scope: {
                    type: "object",
                    properties: {
                      installation_type: { type: "string", description: "Installation method: 'Full-frame tear-out', 'Insert/Pocket replacement', 'Unknown'." },
                      exterior_capping: { type: "string", description: "Exterior capping/trim details included or 'Unknown'." },
                      inclusions: { type: "string", description: "What is included (disposal, permits, lead-safe, caulking, etc.) or 'Unknown'." },
                      exclusions: { type: "string", description: "What is NOT included or 'Unknown'." },
                    },
                    required: ["installation_type"],
                  },
                  warranty: {
                    type: "object",
                    properties: {
                      summary: { type: "string", description: "Brief summary of warranty terms or 'Unknown'." },
                      labor_years: { type: ["number", "null"], description: "Labor warranty in years if stated." },
                      parts_coverage: { type: "string", description: "Parts/material warranty description or 'Unknown'." },
                      glass_breakage: { type: "string", description: "Glass breakage coverage or 'Unknown'." },
                      evidence: { type: ["string", "null"], description: "Page number + snippet for warranty terms." },
                    },
                    required: ["summary"],
                  },
                  detected_markup_level: {
                    type: "string",
                    enum: ["High", "Average", "Low", "Unknown"],
                    description: "Assessment of pricing relative to market rates.",
                  },
                  red_flags: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of concerning items: missing warranties, vague scope, hidden fees, no permit mention, builder-grade materials, etc.",
                  },
                  sales_angle: {
                    type: "string",
                    description: "A 2-3 sentence strategic recommendation for how our sales team should position against this specific quote.",
                  },
                },
                required: [
                  "schema_version", "project_overview", "itemized_openings",
                  "installation_scope", "warranty", "detected_markup_level",
                  "red_flags", "sales_angle",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_quote_analysis" } },
      };

      console.log("[analyze-consultation-quote] Invoking AI for quoteFile:", quoteFileId);

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

      // Validate and normalize the full structured result
      const raw = analysisResult as Record<string, any>;

      const result = {
        schema_version: 2,

        project_overview: {
          competitor_name: String(raw.project_overview?.competitor_name || "Unknown"),
          quote_number: raw.project_overview?.quote_number ?? null,
          quote_date: raw.project_overview?.quote_date ?? null,
          customer_name: raw.project_overview?.customer_name ?? null,
          job_site_location: raw.project_overview?.job_site_location ?? null,
          window_brand_or_material: String(raw.project_overview?.window_brand_or_material || "Unknown"),
          estimated_total_price: typeof raw.project_overview?.estimated_total_price === "number"
            ? raw.project_overview.estimated_total_price : null,
          discount_amount: typeof raw.project_overview?.discount_amount === "number"
            ? raw.project_overview.discount_amount : null,
          financing_terms: raw.project_overview?.financing_terms ?? null,
        },

        itemized_openings: (Array.isArray(raw.itemized_openings) ? raw.itemized_openings : [])
          .map((item: Record<string, unknown>) => ({
            location: String(item.location || "Unknown"),
            product_category: ["Window", "Door", "Sliding Door", "Other"].includes(String(item.product_category))
              ? String(item.product_category) : "Other",
            style: String(item.style || "Unknown"),
            quantity: typeof item.quantity === "number" ? item.quantity : 1,
            measurements_raw: String(item.measurements_raw || "Unknown"),
            measurements_width_in: typeof item.measurements_width_in === "number" ? item.measurements_width_in : null,
            measurements_height_in: typeof item.measurements_height_in === "number" ? item.measurements_height_in : null,
            glass_package: String(item.glass_package || "Unknown"),
            performance_ratings: item.performance_ratings ? String(item.performance_ratings) : null,
            color_interior: String(item.color_interior || "Unknown"),
            color_exterior: String(item.color_exterior || "Unknown"),
            grilles: String(item.grilles || "Unknown"),
            unit_price: typeof item.unit_price === "number" ? item.unit_price : null,
            line_price: typeof item.line_price === "number" ? item.line_price : null,
            notes: item.notes ? String(item.notes) : null,
            evidence: item.evidence ? String(item.evidence) : null,
          })),

        installation_scope: {
          installation_type: String(raw.installation_scope?.installation_type || "Unknown"),
          exterior_capping: String(raw.installation_scope?.exterior_capping || "Unknown"),
          inclusions: String(raw.installation_scope?.inclusions || "Unknown"),
          exclusions: String(raw.installation_scope?.exclusions || "Unknown"),
        },

        warranty: {
          summary: String(raw.warranty?.summary || "Unknown"),
          labor_years: typeof raw.warranty?.labor_years === "number" ? raw.warranty.labor_years : null,
          parts_coverage: String(raw.warranty?.parts_coverage || "Unknown"),
          glass_breakage: String(raw.warranty?.glass_breakage || "Unknown"),
          evidence: raw.warranty?.evidence ? String(raw.warranty.evidence) : null,
        },

        detected_markup_level: ["High", "Average", "Low", "Unknown"].includes(String(raw.detected_markup_level))
          ? String(raw.detected_markup_level) : "Unknown",

        red_flags: Array.isArray(raw.red_flags) ? raw.red_flags.map(String) : [],

        sales_angle: String(raw.sales_angle || "No angle extracted"),
      };

      // Write completed to quote_files
      await supabase
        .from("quote_files")
        .update({
          ai_pre_analysis: {
            schema_version: 2,
            status: "completed",
            result,
            reason: null,
            started_at: startedAtIso,
            completed_at: new Date().toISOString(),
            model: "google/gemini-2.5-flash",
          },
        })
        .eq("id", quoteFileId);

      console.log("[analyze-consultation-quote] SUCCESS for quoteFile:", quoteFileId, JSON.stringify(result));
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";
      console.error("[analyze-consultation-quote] FAILED for quoteFile:", quoteFileId, reason);

      // Write failed to quote_files
      await supabase
        .from("quote_files")
        .update({
          ai_pre_analysis: {
            schema_version: 2,
            status: "failed",
            result: null,
            reason,
            started_at: startedAtIso,
            completed_at: new Date().toISOString(),
            model: "google/gemini-2.5-flash",
          },
        })
        .eq("id", quoteFileId);
    }
  })();

  // Try to use waitUntil for background processing, fall back to inline
  try {
    // @ts-ignore - EdgeRuntime may not be available
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processingPromise);
    } else {
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
