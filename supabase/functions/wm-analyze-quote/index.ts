// ═══════════════════════════════════════════════════════════════════════════
// WM-ANALYZE-QUOTE: External Analysis API
// Stateless service-to-service endpoint for Manus
// Auth: Bearer token (WM_ANALYZE_QUOTE_SECRET)
// No internal tracking, no DB writes
//
// NOTE: This file inlines scoring/forensic/rubric logic because Supabase
// edge functions cannot import across function directories. The canonical
// source lives in quote-scanner/*.ts — keep in sync.
// ═══════════════════════════════════════════════════════════════════════════

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ═══════════════════════════════════════════════════════════════════════════
// CORS
// ═══════════════════════════════════════════════════════════════════════════

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMA
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
// EXTRACTION SIGNALS JSON SCHEMA (for AI structured output)
// Canonical source: quote-scanner/schema.ts
// ═══════════════════════════════════════════════════════════════════════════

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
    hasNOANumber: { type: "boolean" },
    noaNumberValue: { type: ["string", "null"] },
    hasLaminatedMention: { type: "boolean" },
    hasGlassBuildDetail: { type: "boolean" },
    hasTemperedOnlyRisk: { type: "boolean" },
    hasNonImpactLanguage: { type: "boolean" },
    licenseNumberPresent: { type: "boolean" },
    licenseNumberValue: { type: ["string", "null"] },
    hasOwnerBuilderLanguage: { type: "boolean" },
    contractorNameExtracted: { type: ["string", "null"] },
    hasPermitMention: { type: "boolean" },
    hasDemoInstallDetail: { type: "boolean" },
    hasSpecificMaterials: { type: "boolean" },
    hasWallRepairMention: { type: "boolean" },
    hasFinishDetail: { type: "boolean" },
    hasCleanupMention: { type: "boolean" },
    hasBrandClarity: { type: "boolean" },
    hasDetailedScope: { type: "boolean" },
    hasSubjectToChange: { type: "boolean" },
    hasRepairsExcluded: { type: "boolean" },
    hasStandardInstallation: { type: "boolean" },
    depositPercentage: { type: ["number", "null"] },
    hasFinalPaymentTrap: { type: "boolean" },
    hasSafePaymentTerms: { type: "boolean" },
    hasPaymentBeforeCompletion: { type: "boolean" },
    hasContractTraps: { type: "boolean" },
    contractTrapsList: { type: "array", items: { type: "string" } },
    hasManagerDiscount: { type: "boolean" },
    hasWarrantyMention: { type: "boolean" },
    hasLaborWarranty: { type: "boolean" },
    warrantyDurationYears: { type: ["number", "null"] },
    hasLifetimeWarranty: { type: "boolean" },
    hasTransferableWarranty: { type: "boolean" },
    hasPremiumIndicators: { type: "boolean" },
  },
  required: [
    "isValidQuote","validityReason","totalPriceFound","totalPriceValue","openingCountEstimate",
    "hasComplianceKeyword","hasComplianceIdentifier","hasNOANumber","hasLaminatedMention",
    "hasGlassBuildDetail","hasTemperedOnlyRisk","hasNonImpactLanguage","licenseNumberPresent",
    "hasOwnerBuilderLanguage","hasPermitMention","hasDemoInstallDetail","hasSpecificMaterials",
    "hasWallRepairMention","hasFinishDetail","hasCleanupMention","hasBrandClarity","hasDetailedScope",
    "hasSubjectToChange","hasRepairsExcluded","hasStandardInstallation","depositPercentage",
    "hasFinalPaymentTrap","hasSafePaymentTerms","hasPaymentBeforeCompletion","hasContractTraps",
    "contractTrapsList","hasManagerDiscount","hasWarrantyMention","hasLaborWarranty",
    "warrantyDurationYears","hasLifetimeWarranty","hasTransferableWarranty","hasPremiumIndicators",
  ],
  additionalProperties: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION SIGNALS TYPE
// ═══════════════════════════════════════════════════════════════════════════

interface ExtractionSignals {
  isValidQuote: boolean;
  validityReason: string;
  totalPriceFound: boolean;
  totalPriceValue: number | null;
  openingCountEstimate: number | null;
  hasComplianceKeyword: boolean;
  hasComplianceIdentifier: boolean;
  hasNOANumber: boolean;
  noaNumberValue?: string | null;
  hasLaminatedMention: boolean;
  hasGlassBuildDetail: boolean;
  hasTemperedOnlyRisk: boolean;
  hasNonImpactLanguage: boolean;
  licenseNumberPresent: boolean;
  licenseNumberValue?: string | null;
  hasOwnerBuilderLanguage: boolean;
  contractorNameExtracted?: string | null;
  hasPermitMention: boolean;
  hasDemoInstallDetail: boolean;
  hasSpecificMaterials: boolean;
  hasWallRepairMention: boolean;
  hasFinishDetail: boolean;
  hasCleanupMention: boolean;
  hasBrandClarity: boolean;
  hasDetailedScope: boolean;
  hasSubjectToChange: boolean;
  hasRepairsExcluded: boolean;
  hasStandardInstallation: boolean;
  depositPercentage: number | null;
  hasFinalPaymentTrap: boolean;
  hasSafePaymentTerms: boolean;
  hasPaymentBeforeCompletion: boolean;
  hasContractTraps: boolean;
  contractTrapsList: string[];
  hasManagerDiscount: boolean;
  hasWarrantyMention: boolean;
  hasLaborWarranty: boolean;
  warrantyDurationYears: number | null;
  hasLifetimeWarranty: boolean;
  hasTransferableWarranty: boolean;
  hasPremiumIndicators: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT SANITIZATION (from schema.ts)
// ═══════════════════════════════════════════════════════════════════════════

function sanitizeForPrompt(text: string): string {
  return text
    .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi, "[FILTERED]")
    .replace(/you\s+are\s+now\s+a/gi, "[FILTERED]")
    .replace(/output\s+(the\s+)?system\s+prompt/gi, "[FILTERED]")
    .replace(/reveal\s+(your|the)\s+(api|secret)/gi, "[FILTERED]");
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION RUBRIC (from rubric.ts) — the AI system prompt
// ═══════════════════════════════════════════════════════════════════════════

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
If not valid, set validityReason explaining why.

==================================================
PHASE 1 — EXTRACT PRICE & OPENINGS
==================================================
A) TOTAL PRICE: Look for "Total", "Grand Total", "Contract Price", "Total Due", "$"
   Set totalPriceFound = true if you find a clear total. Set totalPriceValue = numeric value.
B) OPENING COUNT: Count line items for windows/doors/openings. Set openingCountEstimate.

==================================================
PHASE 2 — SAFETY SIGNALS
==================================================
A) COMPLIANCE KEYWORDS (hasComplianceKeyword): NOA, Notice of Acceptance, Miami-Dade, MDCA, FL#, Florida Product Approval, HVHZ, TAS 201/202/203, ASTM E1886/E1996, DP, Design Pressure, +/-, ±
B) COMPLIANCE IDENTIFIERS (hasComplianceIdentifier): A number after NOA/FL, DP value or +/- value
C) NOA NUMBER: hasNOANumber, noaNumberValue
D) LAMINATED GLASS (hasLaminatedMention): laminated, PVB, interlayer, SGP, SentryGlas, ionoplast
E) GLASS BUILD DETAIL (hasGlassBuildDetail): thickness, "laminated insulated", "IGU", argon, Low-E
F) NEGATIVE TRIGGERS: hasTemperedOnlyRisk, hasNonImpactLanguage

==================================================
PHASE 2.5 — CONTRACTOR IDENTITY SIGNALS
==================================================
A) LICENSE: licenseNumberPresent, licenseNumberValue
B) OWNER-BUILDER: hasOwnerBuilderLanguage
C) CONTRACTOR: contractorNameExtracted

==================================================
PHASE 3 — SCOPE SIGNALS
==================================================
hasPermitMention, hasDemoInstallDetail, hasSpecificMaterials, hasWallRepairMention,
hasFinishDetail, hasCleanupMention, hasBrandClarity, hasDetailedScope,
hasSubjectToChange, hasRepairsExcluded, hasStandardInstallation

==================================================
PHASE 4 — FINE PRINT SIGNALS
==================================================
depositPercentage, hasFinalPaymentTrap, hasSafePaymentTerms, hasPaymentBeforeCompletion,
hasContractTraps, contractTrapsList, hasManagerDiscount

==================================================
PHASE 5 — WARRANTY SIGNALS
==================================================
hasWarrantyMention, hasLaborWarranty, warrantyDurationYears, hasLifetimeWarranty, hasTransferableWarranty

==================================================
PHASE 6 — PREMIUM INDICATORS
==================================================
hasPremiumIndicators: Euro-Wall, Marvin, large sliders, custom colors, SGP, very high DP (>50), coastal stainless

==================================================
OUTPUT
==================================================
Return ONLY the JSON object with all the boolean flags and extracted values. Do NOT include scores or judgments.
`;

// ═══════════════════════════════════════════════════════════════════════════
// USER PROMPT TEMPLATE (from rubric.ts)
// ═══════════════════════════════════════════════════════════════════════════

function buildUserPrompt(openingCount: number | null, areaName: string | null, notes: string | null): string {
  let prompt = `Extract evidence signals from the following window/door quote image.\n\nIf the image is not a window/door quote, set isValidQuote to false and explain why in validityReason.\n\n---\n`;
  if (openingCount) prompt += `\nHINT: The homeowner says there are approximately ${openingCount} openings.`;
  if (areaName) prompt += `\nHINT: The project is in ${sanitizeForPrompt(areaName)}, Florida.`;
  if (notes) prompt += `\nHINT: Additional context from the homeowner's calculator: ${sanitizeForPrompt(notes)}`;
  prompt += `\n\nExtract all evidence signals from the quote according to the extraction rubric and return your findings as a JSON object.`;
  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING ENGINE (from scoring.ts)
// ═══════════════════════════════════════════════════════════════════════════

interface HardCapResult { applied: boolean; ceiling: number; reason: string | null; statute: string | null; }
interface ScoredResult {
  overallScore: number; finalGrade: string;
  safetyScore: number; scopeScore: number; priceScore: number;
  finePrintScore: number; warrantyScore: number;
  pricePerOpening: string; warnings: string[]; missingItems: string[];
  summary: string; hardCap: HardCapResult;
}

function calculateLetterGrade(score: number): string {
  if (score >= 97) return 'A+'; if (score >= 93) return 'A'; if (score >= 90) return 'A-';
  if (score >= 87) return 'B+'; if (score >= 83) return 'B'; if (score >= 80) return 'B-';
  if (score >= 77) return 'C+'; if (score >= 73) return 'C'; if (score >= 70) return 'C-';
  if (score >= 67) return 'D+'; if (score >= 63) return 'D'; if (score >= 60) return 'D-';
  return 'F';
}

function applyHardCaps(signals: ExtractionSignals, warnings: string[]): HardCapResult {
  let ceiling = 100, reason: string | null = null, statute: string | null = null;
  if (!signals.licenseNumberPresent) { ceiling = 25; reason = "No contractor license number visible"; statute = "F.S. 489.119"; warnings.push("CRITICAL: No license # found. Per F.S. 489.119, all Florida contractors must display their license number."); }
  if (signals.hasOwnerBuilderLanguage && ceiling > 25) { ceiling = 25; reason = "Owner-Builder language transfers all liability to homeowner"; statute = "F.S. 489.103"; warnings.push("CRITICAL: 'Owner-Builder' language transfers ALL liability to you."); }
  if (signals.depositPercentage !== null && signals.depositPercentage > 50 && ceiling > 55) { ceiling = 55; reason = `Deposit of ${signals.depositPercentage}% exceeds 50%`; statute = "F.S. 501.137"; warnings.push(`HIGH RISK: ${signals.depositPercentage}% deposit exceeds safe threshold.`); }
  if (signals.hasTemperedOnlyRisk && !signals.hasLaminatedMention && ceiling > 30) { ceiling = 30; reason = "Tempered glass without impact/laminated specification"; statute = null; warnings.push("CRITICAL: Quote mentions 'tempered' glass but NO impact/laminated language."); }
  if (signals.hasPaymentBeforeCompletion && ceiling > 40) { ceiling = 40; reason = "Full payment required before work completion"; statute = "F.S. 489.126"; warnings.push("HIGH RISK: Contract requires full payment before work is complete."); }
  return { applied: ceiling < 100, ceiling, reason, statute };
}

function applyCurve(score: number): number {
  if (score <= 70) return score;
  const excess = score - 70;
  return Math.round(70 + (30 * Math.pow(excess / 30, 1.8)));
}

function scoreFromSignals(signals: ExtractionSignals, openingCountHint: number | null): ScoredResult {
  const warnings: string[] = [];
  const missingItems: string[] = [];

  if (!signals.isValidQuote) {
    return { overallScore: 0, finalGrade: 'F', safetyScore: 0, scopeScore: 0, priceScore: 0, finePrintScore: 0, warrantyScore: 0, pricePerOpening: "N/A", warnings: ["Not a window/door quote."], missingItems: [], summary: "No grading performed because this is not a window/door quote.", hardCap: { applied: false, ceiling: 100, reason: null, statute: null } };
  }

  let pricePerOpening = "N/A";
  let pricePerOpeningValue: number | null = null;
  const effectiveOpeningCount = signals.openingCountEstimate ?? openingCountHint;
  if (signals.totalPriceFound && signals.totalPriceValue && effectiveOpeningCount && effectiveOpeningCount > 0) {
    const rawPPO = signals.totalPriceValue / effectiveOpeningCount;
    pricePerOpeningValue = Math.round(rawPPO / 50) * 50;
    pricePerOpening = `$${pricePerOpeningValue.toLocaleString()}`;
  }

  // Safety Score
  let safetyScore = 0;
  if (signals.hasComplianceKeyword) safetyScore += 25;
  if (signals.hasComplianceIdentifier) safetyScore += 25;
  if (signals.hasLaminatedMention) safetyScore += 25;
  if (signals.hasGlassBuildDetail) safetyScore += 10;
  if (signals.hasTemperedOnlyRisk) { safetyScore = Math.min(safetyScore, 30); warnings.push("Tempered alone isn't impact glass—verify laminated impact rating."); }
  if (signals.hasNonImpactLanguage) { safetyScore = Math.min(safetyScore, 25); warnings.push("Non-impact or glass-only language found—high hurricane compliance risk."); }
  if (!signals.hasComplianceKeyword && !signals.hasComplianceIdentifier && !signals.hasLaminatedMention) { safetyScore = Math.min(safetyScore, 40); missingItems.push("No proof of impact compliance (NOA/FL#, DP, HVHZ, or laminated impact glass)."); }
  safetyScore = Math.max(0, Math.min(100, safetyScore));

  // Scope Score
  let scopeScore = 0;
  if (signals.hasPermitMention) scopeScore += 20;
  if (signals.hasDemoInstallDetail) scopeScore += 15;
  if (signals.hasSpecificMaterials) scopeScore += 10;
  if (signals.hasWallRepairMention) scopeScore += 15;
  if (signals.hasFinishDetail) scopeScore += 10;
  if (signals.hasCleanupMention) scopeScore += 15;
  if (signals.hasBrandClarity) scopeScore += 15;
  if (signals.hasSubjectToChange) { scopeScore = Math.max(scopeScore - 30, 0); warnings.push("RED FLAG: 'Subject to remeasure/change' allows price hikes after signing."); }
  if (signals.hasRepairsExcluded || !signals.hasWallRepairMention) { missingItems.push("Wall repair scope unclear (stucco/drywall/paint after install)."); }
  if (signals.hasStandardInstallation) { scopeScore = Math.max(0, scopeScore - 10); warnings.push("Vague: 'Standard installation' can mean anything. Get specifics in writing."); }
  scopeScore = Math.max(0, Math.min(100, scopeScore));

  // Fine Print Score
  let finePrintScore = 60;
  if (signals.depositPercentage !== null) {
    if (signals.depositPercentage > 40) { finePrintScore = 0; warnings.push("High risk: deposit exceeds 40%."); }
    else if (signals.depositPercentage >= 10) { finePrintScore = Math.min(finePrintScore + 20, 80); }
    else { finePrintScore = Math.min(finePrintScore + 40, 100); }
  } else { missingItems.push("Payment schedule/deposit terms not clearly stated."); }
  if (signals.hasFinalPaymentTrap) { finePrintScore = Math.min(finePrintScore, 25); warnings.push("Risky: final payment due before inspection/permit close."); }
  else if (signals.hasSafePaymentTerms) { finePrintScore = Math.min(finePrintScore + 10, 100); }
  if (signals.hasContractTraps && signals.contractTrapsList.length > 0) {
    const deduction = Math.min(signals.contractTrapsList.length * 10, 30);
    finePrintScore = Math.max(finePrintScore - deduction, 0);
    warnings.push(`Contract contains: ${signals.contractTrapsList.slice(0, 3).join(", ")}.`);
  }
  if (signals.hasManagerDiscount) { finePrintScore = Math.max(0, finePrintScore - 15); warnings.push("Caution: Time-pressure language like 'manager discount' or 'today only' is often a sales tactic."); }
  finePrintScore = Math.max(0, Math.min(100, finePrintScore));

  // Warranty Score
  let warrantyScore = 0;
  if (signals.hasWarrantyMention) warrantyScore += 30;
  if (signals.hasLaborWarranty) warrantyScore += 40;
  if (signals.warrantyDurationYears !== null && signals.warrantyDurationYears > 1) warrantyScore += 15;
  if (signals.hasLifetimeWarranty) warrantyScore += 15;
  if (signals.hasTransferableWarranty) warrantyScore += 10;
  if (!signals.hasWarrantyMention) { missingItems.push("No warranty terms stated (labor/workmanship + manufacturer coverage)."); }
  warrantyScore = Math.max(0, Math.min(100, warrantyScore));

  // Price Score
  let priceScore = 40;
  if (pricePerOpeningValue !== null) {
    if (pricePerOpeningValue < 1000) priceScore = 40;
    else if (pricePerOpeningValue < 1200) priceScore = 65;
    else if (pricePerOpeningValue <= 1800) priceScore = 95;
    else if (pricePerOpeningValue <= 2500) priceScore = 75;
    else { priceScore = 55; if (signals.hasPremiumIndicators) priceScore = Math.min(priceScore + 10, 75); }
  } else { missingItems.push("Could not compute price per opening (missing total price or opening count)."); }
  priceScore = Math.max(0, Math.min(100, priceScore));

  // Hard caps
  const hardCap = applyHardCaps(signals, warnings);

  // Overall
  let rawOverallScore = Math.round(safetyScore * 0.30 + scopeScore * 0.25 + priceScore * 0.20 + finePrintScore * 0.15 + warrantyScore * 0.10);
  let overallScore = applyCurve(rawOverallScore);
  if (hardCap.applied) overallScore = Math.min(overallScore, hardCap.ceiling);

  // Summary
  let summary = "";
  const lowestScore = Math.min(safetyScore, scopeScore, priceScore, finePrintScore, warrantyScore);
  if (hardCap.applied) { summary = `Score capped at ${hardCap.ceiling} due to: ${hardCap.reason}${hardCap.statute ? ` (${hardCap.statute})` : ''}.`; }
  else if (safetyScore === lowestScore && safetyScore < 50) { summary = "Quote lacks impact compliance proof—verify NOA/FL approval and laminated glass before signing."; }
  else if (finePrintScore === lowestScore && finePrintScore < 50) { summary = "Risky payment terms or contract traps detected—review deposit and final payment conditions."; }
  else if (scopeScore === lowestScore && scopeScore < 50) { summary = "Scope is vague—get written clarification on permits, installation details, and wall repairs."; }
  else if (warrantyScore === lowestScore && warrantyScore < 50) { summary = "Warranty terms unclear or missing—request written labor and manufacturer warranty details."; }
  else if (priceScore === lowestScore && priceScore < 60) { summary = "Price may be outside typical market range—compare with other quotes and verify scope."; }
  else if (overallScore >= 80) { summary = "Quote appears comprehensive with good compliance documentation and fair terms."; }
  else if (overallScore >= 60) { summary = "Quote is acceptable but has some gaps—review warnings and missing items before signing."; }
  else { summary = "Quote has significant concerns—address warnings and missing items before proceeding."; }

  return { overallScore, finalGrade: calculateLetterGrade(overallScore), safetyScore, scopeScore, priceScore, finePrintScore, warrantyScore, pricePerOpening, warnings: warnings.slice(0, 6), missingItems: missingItems.slice(0, 6), summary, hardCap };
}

// ═══════════════════════════════════════════════════════════════════════════
// FORENSIC SUMMARY (from forensic.ts)
// ═══════════════════════════════════════════════════════════════════════════

interface ForensicSummary { headline: string; riskLevel: 'critical' | 'high' | 'moderate' | 'acceptable'; statuteCitations: string[]; questionsToAsk: string[]; positiveFindings: string[]; hardCapApplied: boolean; hardCapReason: string | null; hardCapStatute: string | null; }
interface ExtractedIdentity { contractorName: string | null; licenseNumber: string | null; noaNumbers: string[]; }

function generateForensicSummary(signals: ExtractionSignals, scored: ScoredResult): ForensicSummary {
  const { hardCap } = scored;
  const citations: string[] = [], questions: string[] = [], positives: string[] = [];

  if (hardCap.applied && hardCap.statute && hardCap.reason) citations.push(`${hardCap.statute} - ${hardCap.reason}`);
  if (!signals.licenseNumberPresent) { citations.push("F.S. 489.119 - All contractors must display license number"); questions.push("What is your contractor license number?"); }
  if (signals.hasOwnerBuilderLanguage) { citations.push("F.S. 489.103 - Owner-builder exemption transfers liability"); questions.push("Why does this quote use owner-builder language?"); }
  if (signals.depositPercentage && signals.depositPercentage > 40) { citations.push("F.S. 501.137 - Advance payment regulations"); questions.push("Can we restructure the payment schedule to reduce the deposit?"); }
  if (signals.hasPaymentBeforeCompletion) { citations.push("F.S. 489.126 - Final payment tied to completion"); questions.push("Can final payment be tied to inspection approval?"); }
  if (!signals.hasComplianceIdentifier && !signals.hasNOANumber) { citations.push("FL Building Code Section 1626 - NOA documentation required"); questions.push("What are the NOA or Florida Product Approval numbers for the windows?"); }
  if (signals.hasTemperedOnlyRisk && !signals.hasLaminatedMention) questions.push("Are these impact-rated laminated windows or just tempered glass?");
  if (!signals.hasPermitMention) questions.push("Who is responsible for pulling permits and scheduling inspections?");
  if (!signals.hasWallRepairMention) questions.push("What wall repair is included (stucco, drywall, paint)?");
  if (!signals.hasLaborWarranty) questions.push("What is the labor/workmanship warranty period?");
  if (signals.hasSubjectToChange) questions.push("What specifically could cause the price to change after signing?");

  if (scored.overallScore >= 75) {
    if (signals.licenseNumberPresent) positives.push("License number visible and verifiable");
    if (signals.hasNOANumber || signals.hasComplianceIdentifier) positives.push("Product approval numbers included");
    if (signals.hasDetailedScope) positives.push("Installation scope is well-documented");
    if (signals.hasLaborWarranty) positives.push("Labor warranty specified");
    if (signals.hasLaminatedMention && signals.hasGlassBuildDetail) positives.push("Impact glass specifications clearly stated");
    if (signals.hasPermitMention) positives.push("Permit responsibilities addressed");
    if (signals.hasSafePaymentTerms) positives.push("Payment tied to completion/inspection");
    if (signals.hasBrandClarity) positives.push("Window brand and type clearly identified");
  } else if (scored.overallScore >= 60) {
    if (signals.licenseNumberPresent) positives.push("License number visible");
    if (signals.hasBrandClarity) positives.push("Window brand identified");
    if (signals.hasPermitMention) positives.push("Permit responsibilities mentioned");
  }

  let riskLevel: ForensicSummary['riskLevel'];
  if (scored.overallScore <= 30) riskLevel = 'critical';
  else if (scored.overallScore <= 50) riskLevel = 'high';
  else if (scored.overallScore <= 70) riskLevel = 'moderate';
  else riskLevel = 'acceptable';

  let headline = "";
  if (hardCap.applied) headline = `Score capped at ${hardCap.ceiling} due to: ${hardCap.reason}`;
  else if (riskLevel === 'critical') headline = "This quote has serious red flags. Do NOT sign without major revisions.";
  else if (riskLevel === 'high') headline = "This quote needs significant clarification before signing.";
  else if (riskLevel === 'moderate') headline = "This quote is acceptable but has gaps to address.";
  else headline = "This quote appears comprehensive. Verify license and NOA numbers before signing.";

  return { headline, riskLevel, statuteCitations: citations.slice(0, 4), questionsToAsk: questions.slice(0, 5), positiveFindings: positives.slice(0, 5), hardCapApplied: hardCap.applied, hardCapReason: hardCap.reason, hardCapStatute: hardCap.statute };
}

function extractIdentity(signals: ExtractionSignals): ExtractedIdentity {
  const noaNumbers: string[] = [];
  if (signals.noaNumberValue) noaNumbers.push(signals.noaNumberValue);
  return { contractorName: signals.contractorNameExtracted || null, licenseNumber: signals.licenseNumberValue || null, noaNumbers };
}

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
  const userPrompt = buildUserPrompt(opening_count ?? null, area_name ?? null, notes_from_calculator ?? null);

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

  // ─── DETERMINISTIC PIPELINE ───
  const scored = scoreFromSignals(extracted, opening_count ?? null);
  const forensic = generateForensicSummary(extracted, scored);
  const identity = extractIdentity(extracted);
  const processingTimeMs = Date.now() - startTime;

  // ─── BUILD ENVELOPE ───
  const envelope = {
    meta: { trace_id, analysis_version: "wm_rubric_v3.0", model_used: modelId, processing_time_ms: processingTimeMs, timestamp: new Date().toISOString() },
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
