// scanner-brain/index.ts
// Barrel file — single entry point for all scanner-brain exports
// Uses .ts extensions for Deno compatibility (edge functions)

// 1. Versioning
export const BRAIN_VERSION = "3.0.0";

// 2. Constants & Rubrics
export { EXTRACTION_RUBRIC, GRADING_RUBRIC, USER_PROMPT_TEMPLATE } from "./rubric.ts";
export { ExtractionSignalsJsonSchema } from "./schema.ts";

// 3. Core Engine Functions
export { scoreFromSignals, calculateLetterGrade, generateSafePreview } from "./scoring.ts";
export { generateForensicSummary, extractIdentity } from "./forensic.ts";
export { sanitizeForPrompt } from "./schema.ts";

// 4. Types for Consumers (Manus/Lovable/Edge Functions)
export type { ExtractionSignals, AnalysisData } from "./schema.ts";
export type { ScoredResult, HardCapResult, SafePreview, PillarWeights } from "./scoring.ts";
export { DEFAULT_WEIGHTS } from "./scoring.ts";
export type { ForensicSummary, ExtractedIdentity } from "./forensic.ts";
