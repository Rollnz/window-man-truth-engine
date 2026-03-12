// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DEFINITIONS
// TypeScript interfaces, JSON schema for AI, prompt sanitization
// Zero external dependencies — safe for both Node.js and Deno runtimes
// ═══════════════════════════════════════════════════════════════════════════

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
} as const;

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
  finalGrade: string;
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
