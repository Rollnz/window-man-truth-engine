// Sprint 07B.3 — Staging manifest helpers.
// Locked golden records (gq-v1) are immutable; staging is a separate namespace.
import type {
  CorpusArchetype,
  CorpusInventory,
  DatasetSplit,
  GoldenDocumentManifest,
} from "./manifest-types.ts";
import { validateDocumentManifest, type ValidationIssue } from "./manifest-validator.ts";

export const STAGING_CORPUS_VERSION = "gq-v1-staging";
export const LOCKED_CORPUS_VERSIONS = new Set<string>(["gq-v1"]);

export class LockedRecordImmutableError extends Error {
  readonly code = "LOCKED_RECORD_IMMUTABLE";
  constructor(readonly document_ids: string[]) {
    super(`LOCKED_RECORD_IMMUTABLE: ${document_ids.join(", ")}`);
    this.name = "LockedRecordImmutableError";
  }
}

export class StagingManifestInvalidError extends Error {
  readonly code = "STAGING_MANIFEST_INVALID";
  constructor(readonly issues: ValidationIssue[]) {
    super(`STAGING_MANIFEST_INVALID: ${issues.map((i) => i.code).join(", ")}`);
    this.name = "StagingManifestInvalidError";
  }
}

export interface CreateStagingManifestInput {
  document_id: string;
  sha256: string;
  logical_asset_reference: string;
  mime_type: string;
  page_count: number;
  archetypes: CorpusArchetype[];
  dataset_split: DatasetSplit;
  annotation_version?: string;
  notes?: string;
}

/** Build an unlocked, PII-pending staging manifest. Never authoritative. */
export function createStagingManifest(
  input: CreateStagingManifestInput,
): GoldenDocumentManifest {
  const manifest: GoldenDocumentManifest = {
    document_id: input.document_id,
    corpus_version: STAGING_CORPUS_VERSION,
    source_type: "deidentified_real",
    archetypes: input.archetypes,
    sha256: input.sha256,
    asset: {
      logical_asset_reference: input.logical_asset_reference,
      mime_type: input.mime_type,
      page_count: input.page_count,
    },
    dataset_split: input.dataset_split,
    annotation_version: input.annotation_version ?? "0.1.0",
    annotation_status: "not_started",
    review_status: "unreviewed",
    adjudication_status: "not_required",
    locked: false,
    pii_review_status: "deidentified_pending_review",
    known_prompt_exposure: "none",
    ...(input.notes ? { notes: input.notes } : {}),
  };
  const issues = validateDocumentManifest(manifest);
  if (issues.length > 0) throw new StagingManifestInvalidError(issues);
  return manifest;
}

/**
 * Pure merge. Returns a NEW inventory; `base` is never mutated. Any attempt to
 * replace a locked record, or a record belonging to a locked corpus version,
 * throws LockedRecordImmutableError.
 */
export function mergeStagingIntoInventory(
  base: CorpusInventory,
  staged: GoldenDocumentManifest[],
): CorpusInventory {
  const existing = new Map<string, GoldenDocumentManifest>();
  for (const d of base.documents ?? []) existing.set(d.document_id, d);

  const violations: string[] = [];
  for (const s of staged) {
    const prior = existing.get(s.document_id);
    if (!prior) continue;
    if (prior.locked === true || LOCKED_CORPUS_VERSIONS.has(prior.corpus_version)) {
      violations.push(s.document_id);
    }
  }
  if (violations.length > 0) throw new LockedRecordImmutableError(violations);

  const issues: ValidationIssue[] = [];
  for (const s of staged) issues.push(...validateDocumentManifest(s));
  if (issues.length > 0) throw new StagingManifestInvalidError(issues);

  const merged = new Map(existing);
  for (const s of staged) merged.set(s.document_id, { ...s });

  return {
    corpus_version: base.corpus_version,
    documents: [...merged.values()].sort((a, b) =>
      a.document_id.localeCompare(b.document_id)
    ),
  };
}

/** Next free GQ-### id given an existing inventory. */
export function nextDocumentId(base: CorpusInventory): string {
  let max = 0;
  for (const d of base.documents ?? []) {
    const m = /^GQ-(\d+)$/.exec(d.document_id ?? "");
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `GQ-${String(max + 1).padStart(3, "0")}`;
}
