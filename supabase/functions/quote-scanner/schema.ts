// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DEFINITIONS
// Zod validation schemas, JSON schema for AI, TypeScript interfaces
// ═══════════════════════════════════════════════════════════════════════════

import { z } from "./deps.ts";

// ═══════════════════════════════════════════════════════════════════════════
// ZOD VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const AnalysisContextSchema = z.object({
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

export const QuoteScannerRequestSchema = z.object({
  mode: z.enum(["analyze", "email", "question", "phoneScript"]),
  imageBase64: z.string().max(6_600_000).optional(),
  mimeType: z.string().max(100).optional(),
  openingCount: z.number().int().min(1).max(200).optional(),
  areaName: z.string().max(100).optional(),
  notesFromCalculator: z.string().max(2000).optional(),
  question: z.string().max(2000).optional(),
  analysisContext: AnalysisContextSchema.optional(),
  // Golden Thread: Attribution tracking
  sessionId: z.string().uuid('Invalid session ID format').optional(),
  leadId: z.string().uuid('Invalid lead ID format').optional(),
  clientId: z.string().max(100).optional(),
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

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize text to prevent prompt injection
 */
export function sanitizeForPrompt(text: string): string {
  return text
    .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi, "[FILTERED]")
    .replace(/you\s+are\s+now\s+a/gi, "[FILTERED]")
    .replace(/output\s+(the\s+)?system\s+prompt/gi, "[FILTERED]")
    .replace(/reveal\s+(your|the)\s+(api|secret)/gi, "[FILTERED]");
}

// ═══════════════════════════════════════════════════════════════════════════
// JSON SCHEMA FOR AI STRUCTURED OUTPUT
// ═══════════════════════════════════════════════════════════════════════════

export const ExtractionSignalsJsonSchema = {
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
    // Contractor Identity (HYBRID RUBRIC)
    licenseNumberPresent: { type: "boolean" },
    licenseNumberValue: { type: ["string", "null"] },
    hasOwnerBuilderLanguage: { type: "boolean" },
    contractorNameExtracted: { type: ["string", "null"] },
    // Scope signals
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
    // Fine print signals
    depositPercentage: { type: ["number", "null"] },
    hasFinalPaymentTrap: { type: "boolean" },
    hasSafePaymentTerms: { type: "boolean" },
    hasPaymentBeforeCompletion: { type: "boolean" },
    hasContractTraps: { type: "boolean" },
    contractTrapsList: { type: "array", items: { type: "string" } },
    hasManagerDiscount: { type: "boolean" },
    // Warranty signals
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
    "hasNOANumber",
    "hasLaminatedMention",
    "hasGlassBuildDetail",
    "hasTemperedOnlyRisk",
    "hasNonImpactLanguage",
    "licenseNumberPresent",
    "hasOwnerBuilderLanguage",
    "hasPermitMention",
    "hasDemoInstallDetail",
    "hasSpecificMaterials",
    "hasWallRepairMention",
    "hasFinishDetail",
    "hasCleanupMention",
    "hasBrandClarity",
    "hasDetailedScope",
    "hasSubjectToChange",
    "hasRepairsExcluded",
    "hasStandardInstallation",
    "depositPercentage",
    "hasFinalPaymentTrap",
    "hasSafePaymentTerms",
    "hasPaymentBeforeCompletion",
    "hasContractTraps",
    "contractTrapsList",
    "hasManagerDiscount",
    "hasWarrantyMention",
    "hasLaborWarranty",
    "warrantyDurationYears",
    "hasLifetimeWarranty",
    "hasTransferableWarranty",
    "hasPremiumIndicators",
  ],
  additionalProperties: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPESCRIPT INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExtractionSignals {
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
  // Contractor Identity
  licenseNumberPresent: boolean;
  licenseNumberValue?: string | null;
  hasOwnerBuilderLanguage: boolean;
  contractorNameExtracted?: string | null;
  // Scope signals
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
  // Fine print signals
  depositPercentage: number | null;
  hasFinalPaymentTrap: boolean;
  hasSafePaymentTerms: boolean;
  hasPaymentBeforeCompletion: boolean;
  hasContractTraps: boolean;
  contractTrapsList: string[];
  hasManagerDiscount: boolean;
  // Warranty signals
  hasWarrantyMention: boolean;
  hasLaborWarranty: boolean;
  warrantyDurationYears: number | null;
  hasLifetimeWarranty: boolean;
  hasTransferableWarranty: boolean;
  hasPremiumIndicators: boolean;
}

export interface AnalysisData {
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
