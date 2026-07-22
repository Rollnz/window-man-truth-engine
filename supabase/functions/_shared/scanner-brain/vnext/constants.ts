// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — VERSION CONSTANTS
// Experimental/shadow contract identifiers ONLY.
// These MUST NOT replace the legacy `BRAIN_VERSION` / `ANALYSIS_SCHEMA_VERSION`
// exported from `../index.ts`. No runtime code persists these values yet.
// ═══════════════════════════════════════════════════════════════════════════

export const VNEXT_BRAIN_VERSION = "4.0.0-dev";
export const VNEXT_ANALYSIS_SCHEMA_VERSION = "canonical-extraction-v1-dev";

// Contract identifier embedded inside every CanonicalExtractionV1 payload.
// Kept in sync with VNEXT_ANALYSIS_SCHEMA_VERSION so consumers can pin.
export const CANONICAL_CONTRACT_VERSION = VNEXT_ANALYSIS_SCHEMA_VERSION;
