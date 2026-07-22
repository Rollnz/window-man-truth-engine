// Sprint 07B — Golden Corpus manifest contracts.
// Stable, non-semantic document identity + full provenance for benchmark inputs.

export const CORPUS_MANIFEST_SCHEMA_VERSION = "corpus-v1.0.0";

export type SourceType = "synthetic" | "deidentified_real";

export type PiiReviewStatus =
  | "synthetic"
  | "deidentified_pending_review"
  | "deidentified_verified";

export type DatasetSplit = "development" | "holdout";

export type KnownPromptExposure = "none" | "limited" | "substantial";

export type AnnotationStatus =
  | "not_started"
  | "primary_in_progress"
  | "primary_complete"
  | "in_secondary_review"
  | "adjudication_pending"
  | "locked";

export type ReviewStatus = "unreviewed" | "in_review" | "agreed" | "disagreed";
export type AdjudicationStatus = "not_required" | "pending" | "adjudicated";

export const CORPUS_ARCHETYPES = [
  "CLEAN_SIMPLE_ESTIMATE",
  "DETAILED_MULTI_PAGE",
  "MULTI_PRODUCT",
  "ENTITY_AMBIGUITY",
  "SPARSE_ESTIMATE",
  "FINANCING_HEAVY",
  "SIGNED_CONTRACT",
  "POOR_QUALITY_SCAN",
  "HANDWRITTEN",
  "AGGREGATE_ONLY",
  "CONFLICTING_REVISIONS",
  "NON_QUOTE",
  "TABLE_HEAVY",
  "VERY_LONG",
  "MIXED_WINDOWS_DOORS",
  "SYNTHETIC_CONTROL",
] as const;

export type CorpusArchetype = (typeof CORPUS_ARCHETYPES)[number];

export interface AssetReference {
  // Logical (not absolute) reference resolved by the future execution environment.
  logical_asset_reference: string;
  mime_type: string;
  page_count: number;
}

export interface GoldenDocumentManifest {
  document_id: string;                       // GQ-001, GQ-002, ...
  corpus_version: string;                    // e.g. "gq-v1-pre"
  source_type: SourceType;
  archetypes: CorpusArchetype[];
  sha256: string;                            // hex, lowercase, 64 chars
  asset: AssetReference;
  dataset_split: DatasetSplit;

  annotation_version: string;                // semver-ish, e.g. "1.0.0"
  annotation_status: AnnotationStatus;
  review_status: ReviewStatus;
  adjudication_status: AdjudicationStatus;
  locked: boolean;

  pii_review_status: PiiReviewStatus;
  known_prompt_exposure: KnownPromptExposure;

  ground_truth_reference?: string;           // logical pointer to ground-truth artifact
  notes?: string;
}

export interface CorpusInventory {
  corpus_version: string;
  documents: GoldenDocumentManifest[];
}
