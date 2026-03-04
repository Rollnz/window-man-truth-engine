// scanner-brain/index.ts

// 1. Versioning
export const BRAIN_VERSION = "3.0.0";

// 2. Constants & Rubrics
export { EXTRACTION_RUBRIC, GRADING_RUBRIC, USER_PROMPT_TEMPLATE } from "./rubric";
export { ExtractionSignalsJsonSchema } from "./schema";

// 3. Core Engine Functions
export { scoreFromSignals, calculateLetterGrade, generateSafePreview } from "./scoring";
export { generateForensicSummary, extractIdentity } from "./forensic";
export { sanitizeForPrompt } from "./schema";

// 4. Types for Consumers (Manus/Lovable)
export type { ExtractionSignals, AnalysisData } from "./schema";
export type { ScoredResult, HardCapResult, SafePreview } from "./scoring";
export type { ForensicSummary, ExtractedIdentity } from "./forensic";
