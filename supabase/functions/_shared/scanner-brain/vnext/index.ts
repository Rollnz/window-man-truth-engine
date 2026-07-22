// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — BARREL
//
// This namespace is EXPERIMENTAL and NOT wired to any runtime.
// The production/current scanner is `../index.ts`.
//
// See ./README.md for the full architectural note.
// ═══════════════════════════════════════════════════════════════════════════

export {
  VNEXT_BRAIN_VERSION,
  VNEXT_ANALYSIS_SCHEMA_VERSION,
  CANONICAL_CONTRACT_VERSION,
} from "./constants.ts";

export type {
  FactStatus,
  FactEvidence,
  ExtractedFact,
  DocumentType,
  Readability,
  DocumentClassification,
  PhoneCandidate,
  AddressCandidate,
  HomeownerEntity,
  PropertyEntity,
  ContractorEntity,
  SalespersonEntity,
  EntitySet,
  MoneyAmount,
  QuoteMetadata,
  PricingFacts,
  PaymentMilestone,
  PaymentFacts,
  DimensionValue,
  QuoteLineItem,
  ProductFacts,
  ScopeFacts,
  WarrantyFacts,
  ContractTerms,
  QuoteFacts,
  ExtractionMeta,
  CanonicalExtractionV1,
} from "./types.ts";

export { CanonicalExtractionV1JsonSchema } from "./schema.ts";

export {
  validateCanonicalExtractionV1,
  assertCanonicalExtractionV1,
} from "./validation.ts";
export type { ValidationIssue, ValidationResult } from "./validation.ts";
