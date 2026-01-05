import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================
// CORS HEADERS (inline, matching project pattern)
// ============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// INLINE GUARD FUNCTIONS
// ============================================

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

async function requireJson(req: Request): Promise<unknown> {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw { status: 415, message: 'Content-Type must be application/json' };
  }
  try {
    return await req.json();
  } catch {
    throw { status: 400, message: 'Invalid JSON body' };
  }
}

function capBodySize(body: unknown, maxBytes: number): void {
  const size = JSON.stringify(body).length;
  if (size > maxBytes) {
    throw { status: 413, message: `Request body too large (${Math.round(size / 1024 / 1024)}MB exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit)` };
  }
}

// Rate limiting using project's existing rate_limits table pattern
async function checkRateLimit(identifier: string, endpoint: string, limit: number, windowMs: number): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const windowStart = new Date(Date.now() - windowMs);

  try {
    const { count } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('created_at', windowStart.toISOString());

    if (count && count >= limit) {
      console.log(`Rate limit exceeded for ${identifier}: ${count} requests in window`);
      return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) };
    }

    // Record this request
    await supabase.from('rate_limits').insert({
      identifier,
      endpoint,
    });

    // Cleanup old records periodically (1 in 100 requests)
    if (Math.random() < 0.01) {
      await supabase.rpc('cleanup_rate_limits');
    }

    return { allowed: true };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return { allowed: true }; // Fail-open for availability
  }
}

function handleGuardError(error: unknown): Response {
  if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
    const guardErr = error as { status: number; message: string };
    return new Response(
      JSON.stringify({ error: guardErr.message }),
      { status: guardErr.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  throw error;
}

// ============================================
// ZOD SCHEMA VALIDATION
// ============================================

const AnalysisContextSchema = z.object({
  overallScore: z.number().int().min(0).max(100).optional(),
  safetyScore: z.number().int().min(0).max(100).optional(),
  scopeScore: z.number().int().min(0).max(100).optional(),
  priceScore: z.number().int().min(0).max(100).optional(),
  finePrintScore: z.number().int().min(0).max(100).optional(),
  warrantyScore: z.number().int().min(0).max(100).optional(),
  pricePerOpening: z.string().max(50).optional(),
  warnings: z.array(z.string().max(500)).max(10).optional(),
  missingItems: z.array(z.string().max(500)).max(10).optional(),
  summary: z.string().max(1000).optional(),
}).passthrough();

const QuoteScannerRequestSchema = z.object({
  mode: z.enum(["analyze", "email", "question", "phoneScript"]),
  imageBase64: z.string().max(6_600_000).optional(),
  mimeType: z.string().max(100).optional(),
  openingCount: z.number().int().min(1).max(200).optional(),
  areaName: z.string().max(100).optional(),
  notesFromCalculator: z.string().max(2000).optional(),
  question: z.string().max(2000).optional(),
  analysisContext: AnalysisContextSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.mode === "analyze") {
    if (!data.imageBase64) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "imageBase64 is required for analyze mode",
        path: ["imageBase64"],
      });
    }
    if (!data.mimeType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mimeType is required for analyze mode",
        path: ["mimeType"],
      });
    }
    if (data.mimeType && !(data.mimeType.startsWith("image/") || data.mimeType === "application/pdf")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mimeType must be an image or PDF type",
        path: ["mimeType"],
      });
    }
  }
  
  if ((data.mode === "email" || data.mode === "phoneScript") && !data.analysisContext) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "analysisContext is required for email and phoneScript modes",
      path: ["analysisContext"],
    });
  }
  
  if (data.mode === "question" && !data.question) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "question is required for question mode",
      path: ["question"],
    });
  }
});

// Sanitize text to prevent prompt injection
function sanitizeForPrompt(text: string): string {
  return text
    .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi, "[FILTERED]")
    .replace(/you\s+are\s+now\s+a/gi, "[FILTERED]")
    .replace(/output\s+(the\s+)?system\s+prompt/gi, "[FILTERED]")
    .replace(/reveal\s+(your|the)\s+(api|secret)/gi, "[FILTERED]");
}

// ============================================
// EXTRACTION RUBRIC (AI Extracts Signals Only)
// ============================================

const EXTRACTION_RUBRIC = `
You are **WINDOW QUOTE SIGNAL EXTRACTOR**, an evidence-based reader for Florida impact-window/door quotes.

Your ONLY job is to EXTRACT what you see in the document. You do NOT score or judge.

Return ONLY a JSON object with boolean flags and extracted values based on what you observe.

==================================================
PHASE 0 — DOCUMENT VALIDITY CHECK
==================================================

Determine if this is a real window/door quote/proposal/contract.

VALID if you see ANY TWO OR MORE:
- Terms: window, door, slider, glazing, impact, hurricane, laminated, vinyl, aluminum, frame
- Line items with qty/dimensions/opening descriptions
- A total price / estimate amount
- Contractor company info / license / address
- "proposal", "estimate", "contract", "quote", "scope of work"

Set isValidQuote = true/false based on this check.
If not valid, set validityReason explaining why (e.g., "This appears to be a receipt, not a quote").

==================================================
PHASE 1 — EXTRACT PRICE & OPENINGS
==================================================

A) TOTAL PRICE:
- Look for "Total", "Grand Total", "Contract Price", "Total Due", "$"
- Set totalPriceFound = true if you find a clear total
- Set totalPriceValue = the numeric value (no currency symbols)

B) OPENING COUNT:
- Count line items for windows/doors/openings
- Set openingCountEstimate = your best estimate (integer)
- If unclear, set to null

==================================================
PHASE 2 — SAFETY SIGNALS
==================================================

Set boolean flags based on what you SEE:

A) COMPLIANCE KEYWORDS (hasComplianceKeyword = true if ANY):
- NOA, Notice of Acceptance, Miami-Dade, Miami Dade, MDCA
- FL#, FL #, Florida Product Approval, Product Approval
- HVHZ, High Velocity Hurricane Zone, High Velocity
- TAS 201/202/203, ASTM E1886/E1996
- DP, Design Pressure, +/-, ±

B) COMPLIANCE IDENTIFIERS (hasComplianceIdentifier = true if ANY):
- A number after NOA/FL (ex: "NOA 20-1234", "FL 16824")
- DP value or +/- value (ex: "DP50", "+55/-65")

C) LAMINATED GLASS (hasLaminatedMention = true if ANY):
- laminated, laminated glass, impact laminated, hurricane laminated
- PVB, interlayer, SGP, SentryGlas, ionoplast

D) GLASS BUILD DETAIL (hasGlassBuildDetail = true if ANY):
- thickness (5/16, 7/16, 9/16)
- "laminated insulated", "IGU", "insulated laminated", "argon", "Low-E"
- "heat strengthened" (only if paired with laminated/impact context)

E) NEGATIVE TRIGGERS:
- hasTemperedOnlyRisk = true if "tempered" appears AND NO "laminated/impact" language
- hasNonImpactLanguage = true if "non-impact", "not impact", "annealed", or "glass-only replacement"

==================================================
PHASE 3 — SCOPE SIGNALS
==================================================

A) PERMITS (hasPermitMention = true if ANY):
- permit, permitting, pulled by contractor
- engineering, engineer letter, drawings
- notice of commencement, NOC, inspections

B) DEMO/INSTALL (hasDemoInstallDetail = true if ANY):
- remove existing, demo, dispose old windows
- install new, set, anchor, fasten, bucking
- shimming, waterproofing, flashing

C) SPECIFIC MATERIALS (hasSpecificMaterials = true if ANY):
- sealant, caulk, silicone, polyurethane, Sika, Dow 795
- flashing tape, peel & stick, sill pan
- tapcons, ultracons, stainless fasteners

D) WALL REPAIR (hasWallRepairMention = true if ANY):
- stucco, drywall, plaster, patch, texture
- paint, repaint, ready for paint, match existing

E) FINISH DETAIL (hasFinishDetail = true if ANY):
- trim, casing, wrap, interior trim, exterior trim

F) CLEANUP (hasCleanupMention = true if ANY):
- debris, haul away, dumpster, trash, cleanup
- floor protection, drop cloth, ram board, dust barrier

G) BRAND CLARITY (hasBrandClarity = true if ANY):
- Brand names (PGT, CGI, ES, WinDoor, Andersen, Marvin, Euro-Wall, etc.)
- Window types: SH/DH/casement/awning/fixed/slider/French door

H) RED FLAGS:
- hasSubjectToChange = true if "subject to remeasure", "subject to change", or "price may change"
- hasRepairsExcluded = true if "stucco by owner", "drywall not included", or repairs explicitly excluded

==================================================
PHASE 4 — FINE PRINT SIGNALS
==================================================

A) DEPOSIT:
- depositPercentage = numeric value if you can determine it (e.g., 50 for 50%), else null
- If you see a deposit amount but not percentage, try to calculate from total

B) PAYMENT TRAPS:
- hasFinalPaymentTrap = true if final payment due BEFORE inspection/permit close/completion
- hasSafePaymentTerms = true if final payment due AFTER inspection/permit close/walkthrough

C) CONTRACT TRAPS:
- hasContractTraps = true if ANY: cancellation fee, restocking, "non-refundable", arbitration, venue, attorney fees
- contractTrapsList = array of specific traps found (strings)

==================================================
PHASE 5 — WARRANTY SIGNALS
==================================================

- hasWarrantyMention = true if ANY: warranty, guaranteed, workmanship, labor, installation, manufacturer warranty
- hasLaborWarranty = true if labor/workmanship explicitly mentioned
- warrantyDurationYears = numeric value if stated (e.g., 2 for "2-year warranty"), else null
- hasLifetimeWarranty = true if "lifetime" appears in warranty context
- hasTransferableWarranty = true if "transferable" mentioned

==================================================
PHASE 6 — PREMIUM INDICATORS
==================================================

- hasPremiumIndicators = true if ANY: Euro-Wall, Marvin, large sliders, custom colors, SGP, very high DP (>50), coastal stainless package

==================================================
OUTPUT
==================================================

Return ONLY the JSON object with all the boolean flags and extracted values. Do NOT include scores or judgments.
`;

// ============================================
// EXTRACTION SIGNALS JSON SCHEMA
// ============================================

const ExtractionSignalsJsonSchema = {
  type: "object",
  properties: {
    isValidQuote: { type: "boolean" },
    validityReason: { type: "string" },
    totalPriceFound: { type: "boolean" },
    totalPriceValue: { type: ["number", "null"] },
    openingCountEstimate: { type: ["integer", "null"] },
    hasComplianceKeyword: { type: "boolean" },
    hasComplianceIdentifier: { type: "boolean" },
    hasLaminatedMention: { type: "boolean" },
    hasGlassBuildDetail: { type: "boolean" },
    hasTemperedOnlyRisk: { type: "boolean" },
    hasNonImpactLanguage: { type: "boolean" },
    hasPermitMention: { type: "boolean" },
    hasDemoInstallDetail: { type: "boolean" },
    hasSpecificMaterials: { type: "boolean" },
    hasWallRepairMention: { type: "boolean" },
    hasFinishDetail: { type: "boolean" },
    hasCleanupMention: { type: "boolean" },
    hasBrandClarity: { type: "boolean" },
    hasSubjectToChange: { type: "boolean" },
    hasRepairsExcluded: { type: "boolean" },
    depositPercentage: { type: ["number", "null"] },
    hasFinalPaymentTrap: { type: "boolean" },
    hasSafePaymentTerms: { type: "boolean" },
    hasContractTraps: { type: "boolean" },
    contractTrapsList: { type: "array", items: { type: "string" } },
    hasWarrantyMention: { type: "boolean" },
    hasLaborWarranty: { type: "boolean" },
    warrantyDurationYears: { type: ["number", "null"] },
    hasLifetimeWarranty: { type: "boolean" },
    hasTransferableWarranty: { type: "boolean" },
    hasPremiumIndicators: { type: "boolean" },
  },
  required: [
    "isValidQuote",
    "validityReason",
    "totalPriceFound",
    "totalPriceValue",
    "openingCountEstimate",
    "hasComplianceKeyword",
    "hasComplianceIdentifier",
    "hasLaminatedMention",
    "hasGlassBuildDetail",
    "hasTemperedOnlyRisk",
    "hasNonImpactLanguage",
    "hasPermitMention",
    "hasDemoInstallDetail",
    "hasSpecificMaterials",
    "hasWallRepairMention",
    "hasFinishDetail",
    "hasCleanupMention",
    "hasBrandClarity",
    "hasSubjectToChange",
    "hasRepairsExcluded",
    "depositPercentage",
    "hasFinalPaymentTrap",
    "hasSafePaymentTerms",
    "hasContractTraps",
    "contractTrapsList",
    "hasWarrantyMention",
    "hasLaborWarranty",
    "warrantyDurationYears",
    "hasLifetimeWarranty",
    "hasTransferableWarranty",
    "hasPremiumIndicators",
  ],
  additionalProperties: false,
};

// ============================================
// TYPE DEFINITIONS
// ============================================

interface ExtractionSignals {
  isValidQuote: boolean;
  validityReason: string;
  totalPriceFound: boolean;
  totalPriceValue: number | null;
  openingCountEstimate: number | null;
  hasComplianceKeyword: boolean;
  hasComplianceIdentifier: boolean;
  hasLaminatedMention: boolean;
  hasGlassBuildDetail: boolean;
  hasTemperedOnlyRisk: boolean;
  hasNonImpactLanguage: boolean;
  hasPermitMention: boolean;
  hasDemoInstallDetail: boolean;
  hasSpecificMaterials: boolean;
  hasWallRepairMention: boolean;
  hasFinishDetail: boolean;
  hasCleanupMention: boolean;
  hasBrandClarity: boolean;
  hasSubjectToChange: boolean;
  hasRepairsExcluded: boolean;
  depositPercentage: number | null;
  hasFinalPaymentTrap: boolean;
  hasSafePaymentTerms: boolean;
  hasContractTraps: boolean;
  contractTrapsList: string[];
  hasWarrantyMention: boolean;
  hasLaborWarranty: boolean;
  warrantyDurationYears: number | null;
  hasLifetimeWarranty: boolean;
  hasTransferableWarranty: boolean;
  hasPremiumIndicators: boolean;
}

interface AnalysisData {
  overallScore: number;
  safetyScore: number;
  scopeScore: number;
  priceScore: number;
  finePrintScore: number;
  warrantyScore: number;
  pricePerOpening: string;
  warnings: string[];
  missingItems: string[];
  summary: string;
}

// ============================================
// DETERMINISTIC SCORING FUNCTION
// ============================================

function scoreFromSignals(signals: ExtractionSignals, openingCountHint: number | null): AnalysisData {
  const warnings: string[] = [];
  const missingItems: string[] = [];

  // PHASE 0: Document Validity Gate
  if (!signals.isValidQuote) {
    return {
      overallScore: 0,
      safetyScore: 0,
      scopeScore: 0,
      priceScore: 0,
      finePrintScore: 0,
      warrantyScore: 0,
      pricePerOpening: "N/A",
      warnings: ["Not a window/door quote. Upload a contractor proposal/estimate for windows/doors."],
      missingItems: [],
      summary: "No grading performed because this is not a window/door quote.",
    };
  }

  // PHASE 1: Compute Price Per Opening
  let pricePerOpening = "N/A";
  let pricePerOpeningValue: number | null = null;
  
  const effectiveOpeningCount = signals.openingCountEstimate ?? openingCountHint;
  
  if (signals.totalPriceFound && signals.totalPriceValue && effectiveOpeningCount && effectiveOpeningCount > 0) {
    const rawPPO = signals.totalPriceValue / effectiveOpeningCount;
    pricePerOpeningValue = Math.round(rawPPO / 50) * 50;
    pricePerOpening = `$${pricePerOpeningValue.toLocaleString()}`;
  }

  // PHASE 2: Safety Score (0-100) [Weight 30%]
  let safetyScore = 0;

  if (signals.hasComplianceKeyword) {
    safetyScore += 25;
  }
  if (signals.hasComplianceIdentifier) {
    safetyScore += 25;
  }
  if (signals.hasLaminatedMention) {
    safetyScore += 25;
  }
  if (signals.hasGlassBuildDetail) {
    safetyScore += 10;
  }

  if (signals.hasTemperedOnlyRisk) {
    safetyScore = Math.min(safetyScore, 30);
    warnings.push("Tempered alone isn't impact glass—verify laminated impact rating.");
  }

  if (signals.hasNonImpactLanguage) {
    safetyScore = Math.min(safetyScore, 25);
    warnings.push("Non-impact or glass-only language found—high hurricane compliance risk.");
  }

  if (!signals.hasComplianceKeyword && !signals.hasComplianceIdentifier && !signals.hasLaminatedMention) {
    safetyScore = Math.min(safetyScore, 40);
    missingItems.push("No proof of impact compliance (NOA/FL#, DP, HVHZ, or laminated impact glass).");
  }

  safetyScore = Math.max(0, Math.min(100, safetyScore));

  // PHASE 3: Scope Score (0-100) [Weight 25%]
  let scopeScore = 0;

  if (signals.hasPermitMention) {
    scopeScore += 20;
  }
  if (signals.hasDemoInstallDetail) {
    scopeScore += 15;
  }
  if (signals.hasSpecificMaterials) {
    scopeScore += 10;
  }
  if (signals.hasWallRepairMention) {
    scopeScore += 15;
  }
  if (signals.hasFinishDetail) {
    scopeScore += 10;
  }
  if (signals.hasCleanupMention) {
    scopeScore += 15;
  }
  if (signals.hasBrandClarity) {
    scopeScore += 15;
  }

  if (signals.hasSubjectToChange) {
    scopeScore = Math.max(scopeScore - 30, 0);
    warnings.push("RED FLAG: 'Subject to remeasure/change' allows price hikes after signing.");
  }

  if (signals.hasRepairsExcluded || !signals.hasWallRepairMention) {
    missingItems.push("Wall repair scope unclear (stucco/drywall/paint after install).");
  }

  scopeScore = Math.max(0, Math.min(100, scopeScore));

  // PHASE 4: Fine Print Score (0-100) [Weight 15%]
  let finePrintScore = 60;

  if (signals.depositPercentage !== null) {
    if (signals.depositPercentage > 40) {
      finePrintScore = 0;
      warnings.push("High risk: deposit exceeds 40%.");
    } else if (signals.depositPercentage >= 10) {
      finePrintScore = Math.min(finePrintScore + 20, 80);
    } else {
      finePrintScore = Math.min(finePrintScore + 40, 100);
    }
  } else {
    missingItems.push("Payment schedule/deposit terms not clearly stated.");
  }

  if (signals.hasFinalPaymentTrap) {
    finePrintScore = Math.min(finePrintScore, 25);
    warnings.push("Risky: final payment due before inspection/permit close.");
  } else if (signals.hasSafePaymentTerms) {
    finePrintScore = Math.min(finePrintScore + 10, 100);
  }

  if (signals.hasContractTraps && signals.contractTrapsList.length > 0) {
    const deduction = Math.min(signals.contractTrapsList.length * 10, 30);
    finePrintScore = Math.max(finePrintScore - deduction, 0);
    if (signals.contractTrapsList.length > 0) {
      warnings.push(`Contract contains: ${signals.contractTrapsList.slice(0, 3).join(", ")}.`);
    }
  }

  finePrintScore = Math.max(0, Math.min(100, finePrintScore));

  // PHASE 5: Warranty Score (0-100) [Weight 10%]
  let warrantyScore = 0;

  if (signals.hasWarrantyMention) {
    warrantyScore += 30;
  }
  if (signals.hasLaborWarranty) {
    warrantyScore += 40;
  }
  if (signals.warrantyDurationYears !== null && signals.warrantyDurationYears > 1) {
    warrantyScore += 15;
  }
  if (signals.hasLifetimeWarranty) {
    warrantyScore += 15;
  }
  if (signals.hasTransferableWarranty) {
    warrantyScore += 10;
  }

  if (!signals.hasWarrantyMention) {
    missingItems.push("No warranty terms stated (labor/workmanship + manufacturer coverage).");
  }

  warrantyScore = Math.max(0, Math.min(100, warrantyScore));

  // PHASE 6: Price Score (0-100) [Weight 20%]
  let priceScore = 40;

  if (pricePerOpeningValue !== null) {
    if (pricePerOpeningValue < 1000) {
      priceScore = 40;
    } else if (pricePerOpeningValue < 1200) {
      priceScore = 65;
    } else if (pricePerOpeningValue <= 1800) {
      priceScore = 95;
    } else if (pricePerOpeningValue <= 2500) {
      priceScore = 75;
    } else {
      priceScore = 55;
      if (signals.hasPremiumIndicators) {
        priceScore = Math.min(priceScore + 10, 75);
      }
    }
  } else {
    missingItems.push("Could not compute price per opening (missing total price or opening count).");
  }

  priceScore = Math.max(0, Math.min(100, priceScore));

  // PHASE 7: Overall Score + Summary
  const overallScore = Math.round(
    safetyScore * 0.30 +
    scopeScore * 0.25 +
    priceScore * 0.20 +
    finePrintScore * 0.15 +
    warrantyScore * 0.10
  );

  let summary = "";
  const lowestScore = Math.min(safetyScore, scopeScore, priceScore, finePrintScore, warrantyScore);
  
  if (safetyScore === lowestScore && safetyScore < 50) {
    summary = "Quote lacks impact compliance proof—verify NOA/FL approval and laminated glass before signing.";
  } else if (finePrintScore === lowestScore && finePrintScore < 50) {
    summary = "Risky payment terms or contract traps detected—review deposit and final payment conditions.";
  } else if (scopeScore === lowestScore && scopeScore < 50) {
    summary = "Scope is vague—get written clarification on permits, installation details, and wall repairs.";
  } else if (warrantyScore === lowestScore && warrantyScore < 50) {
    summary = "Warranty terms unclear or missing—request written labor and manufacturer warranty details.";
  } else if (priceScore === lowestScore && priceScore < 60) {
    summary = "Price may be outside typical market range—compare with other quotes and verify scope.";
  } else if (overallScore >= 80) {
    summary = "Quote appears comprehensive with good compliance documentation and fair terms.";
  } else if (overallScore >= 60) {
    summary = "Quote is acceptable but has some gaps—review warnings and missing items before signing.";
  } else {
    summary = "Quote has significant concerns—address warnings and missing items before proceeding.";
  }

  return {
    overallScore,
    safetyScore,
    scopeScore,
    priceScore,
    finePrintScore,
    warrantyScore,
    pricePerOpening,
    warnings: warnings.slice(0, 6),
    missingItems: missingItems.slice(0, 6),
    summary,
  };
}

// ============================================
// GRADING RUBRIC (for question mode context)
// ============================================

const GRADING_RUBRIC = `
You are **WINDOW QUOTE AUDITOR AI**, a strict evidence-based compliance and risk auditor for Florida impact-window/door quotes.
You help homeowners understand their quotes and answer questions about window replacement projects.
Be helpful, specific, and focus on Florida building codes and impact window requirements.
`;

// ============================================
// USER PROMPT TEMPLATE
// ============================================

function USER_PROMPT_TEMPLATE(
  openingCount: number | null,
  areaName: string | null,
  notesFromCalculator: string | null
): string {
  let prompt = `Extract evidence signals from the following window/door quote image.

If the image is not a window/door quote, set isValidQuote to false and explain why in validityReason.

---
`;

  if (openingCount) {
    prompt += `\nHINT: The homeowner says there are approximately ${openingCount} openings.`;
  }

  if (areaName) {
    prompt += `\nHINT: The project is in ${sanitizeForPrompt(areaName)}, Florida.`;
  }

  if (notesFromCalculator) {
    prompt += `\nHINT: Additional context from the homeowner's calculator: ${sanitizeForPrompt(notesFromCalculator)}`;
  }

  prompt += `\n\nExtract all evidence signals from the quote according to the extraction rubric and return your findings as a JSON object.`;

  return prompt;
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIp(req);

  try {
    // GUARD: Require JSON content-type and parse body
    const rawBody = await requireJson(req);
    
    // GUARD: Cap body size (7MB for image)
    capBodySize(rawBody, 7_000_000);
    
    // GUARD: Rate limit (10 per hour per IP)
    const rateLimitCheck = await checkRateLimit(clientIP, "quote-scanner", 10, 3600000);
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

    const { mode, imageBase64, mimeType, openingCount, areaName, notesFromCalculator, question, analysisContext } = parseResult.data;

    console.log(`[QuoteScanner] Request: mode=${mode}, IP=${clientIP}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const body: {
      model: string;
      messages: ChatMessage[];
      response_format?: JsonSchemaResponseFormat;
    } = {
      model: "google/gemini-2.5-flash",
      messages,
    };

    if (responseFormat) {
      body.response_format = responseFormat;
    }

    console.log("[QuoteScanner] Calling Lovable AI with mode:", mode);

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

      const scored = scoreFromSignals(extracted, openingCount ?? null);

      console.log("[QuoteScanner] Analysis complete. Overall score:", scored.overallScore);

      return new Response(JSON.stringify(scored), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return handleGuardError(error);
  }
});
