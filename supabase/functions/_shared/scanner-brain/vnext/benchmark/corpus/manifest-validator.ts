// Sprint 07B — Deterministic manifest validation.
import {
  CORPUS_ARCHETYPES,
  type CorpusInventory,
  type GoldenDocumentManifest,
} from "./manifest-types.ts";

export interface ValidationIssue {
  document_id?: string;
  code: string;
  message: string;
}

const SHA256_RE = /^[0-9a-f]{64}$/;
const ARCHETYPE_SET = new Set<string>(CORPUS_ARCHETYPES);

export function validateDocumentManifest(
  m: GoldenDocumentManifest,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (code: string, message: string) =>
    issues.push({ document_id: m?.document_id, code, message });

  if (!m || typeof m !== "object") {
    return [{ code: "MANIFEST_NOT_OBJECT", message: "manifest is not an object" }];
  }
  if (!m.document_id || !/^GQ-\d{3,}$/.test(m.document_id)) {
    push("DOCUMENT_ID_INVALID", "document_id must match GQ-\\d{3,}");
  }
  if (!m.corpus_version) push("CORPUS_VERSION_MISSING", "corpus_version required");
  if (!SHA256_RE.test(m.sha256 ?? "")) {
    push("SHA256_INVALID", "sha256 must be 64 hex chars lowercase");
  }
  if (!m.asset?.logical_asset_reference) {
    push("ASSET_REFERENCE_MISSING", "asset.logical_asset_reference required");
  }
  if (!m.asset?.mime_type) push("MIME_TYPE_MISSING", "asset.mime_type required");
  if (!(typeof m.asset?.page_count === "number" && m.asset.page_count >= 1)) {
    push("PAGE_COUNT_INVALID", "asset.page_count must be >= 1");
  }
  if (m.dataset_split !== "development" && m.dataset_split !== "holdout") {
    push("DATASET_SPLIT_MISSING", "dataset_split required");
  }
  if (!Array.isArray(m.archetypes) || m.archetypes.length === 0) {
    push("ARCHETYPES_MISSING", "at least one archetype required");
  } else {
    for (const a of m.archetypes) {
      if (!ARCHETYPE_SET.has(a)) push("ARCHETYPE_UNKNOWN", `unknown archetype: ${a}`);
    }
  }
  if (!m.annotation_version) {
    push("ANNOTATION_VERSION_MISSING", "annotation_version required");
  }
  if (!m.pii_review_status) {
    push("PII_STATUS_MISSING", "pii_review_status required");
  }
  if (m.pii_review_status === "deidentified_pending_review" && m.locked) {
    push(
      "AUTHORITATIVE_PII_UNVERIFIED",
      "documents with pending PII review cannot be locked/authoritative",
    );
  }
  if (m.source_type === "synthetic" && m.pii_review_status !== "synthetic") {
    push("PII_STATUS_INCONSISTENT", "synthetic docs must have pii_review_status=synthetic");
  }
  return issues;
}

export function validateCorpusInventory(inv: CorpusInventory): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const devIds = new Set<string>();
  const holdoutIds = new Set<string>();

  if (!inv?.corpus_version) {
    issues.push({ code: "CORPUS_VERSION_MISSING", message: "inventory corpus_version required" });
  }
  for (const doc of inv.documents ?? []) {
    for (const iss of validateDocumentManifest(doc)) issues.push(iss);
    if (doc.document_id) {
      if (ids.has(doc.document_id)) {
        issues.push({
          document_id: doc.document_id,
          code: "DOCUMENT_ID_DUPLICATE",
          message: "duplicate document_id",
        });
      }
      ids.add(doc.document_id);
      if (doc.dataset_split === "development") devIds.add(doc.document_id);
      if (doc.dataset_split === "holdout") holdoutIds.add(doc.document_id);
    }
  }
  for (const id of devIds) {
    if (holdoutIds.has(id)) {
      issues.push({
        document_id: id,
        code: "SPLIT_OVERLAP",
        message: "document appears in both development and holdout",
      });
    }
  }
  return issues;
}

export function isAuthoritative(m: GoldenDocumentManifest): boolean {
  return (
    m.locked === true &&
    (m.pii_review_status === "synthetic" ||
      m.pii_review_status === "deidentified_verified") &&
    m.adjudication_status !== "pending"
  );
}
