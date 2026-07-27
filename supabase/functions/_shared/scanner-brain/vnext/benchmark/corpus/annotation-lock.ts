// Sprint 07B.2 — Annotation lock enforcement.
// Authoritative scoring requires locked, human-reviewed, PII-safe ground truth.
// AI-prepared annotations are structurally forbidden from self-approval.
import type {
  GroundTruthDocument,
  GroundTruthFact,
} from "../benchmark-types.ts";
import type { GoldenDocumentManifest } from "./manifest-types.ts";

export const ANNOTATION_WORKFLOW_VERSION = "annotation-workflow-v1.0.0";

/** Facts that require an independent secondary human review before lock. */
export const CRITICAL_REVIEW_FIELDS = [
  "document.classification",
  "entity.homeowner.name",
  "entity.property.address",
  "entity.contractor.name",
  "entity.salesperson.name",
  "quote.total",
  "quote.subtotal",
  "quote.discount",
  "quote.tax",
  "quote.deposit",
  "quote.payment_schedule",
  "quote.opening_count",
  "quote.financing",
  "line_items",
  "product_configurations",
  "product.noa_number",
  "scope.inclusions",
  "scope.exclusions",
  "warranty",
  "terms.cancellation",
  "terms.change_order",
] as const;

export type AnnotationBlockCode =
  | "ANNOTATION_NOT_LOCKED"
  | "PII_REVIEW_PENDING"
  | "SECONDARY_REVIEW_INCOMPLETE"
  | "ADJUDICATION_PENDING"
  | "CRITICAL_FACT_NOT_REVIEWED"
  | "AI_SELF_APPROVAL_FORBIDDEN";

export interface AuthoritativeCheck {
  authoritative: boolean;
  blockers: AnnotationBlockCode[];
  details: string[];
}

const AI_ANNOTATOR_RE = /^(ai|lovable|model|auto)[:\-_]/i;

/**
 * A document may score authoritatively only when annotation lock, human review,
 * adjudication and PII verification are ALL satisfied.
 */
export function checkAuthoritativeAnnotation(
  gt: GroundTruthDocument,
  manifest?: GoldenDocumentManifest,
): AuthoritativeCheck {
  const blockers: AnnotationBlockCode[] = [];
  const details: string[] = [];
  const meta = gt.meta;

  if (!meta?.locked) {
    blockers.push("ANNOTATION_NOT_LOCKED");
    details.push("ground truth meta.locked is false");
  }
  if (meta?.review_status !== "agreed") {
    blockers.push("SECONDARY_REVIEW_INCOMPLETE");
    details.push(`review_status=${meta?.review_status}`);
  }
  if (meta?.adjudication_status === "pending") {
    blockers.push("ADJUDICATION_PENDING");
    details.push("adjudication_status=pending");
  }
  const isSynthetic = manifest?.source_type === "synthetic";
  if (!isSynthetic && meta?.annotated_by && AI_ANNOTATOR_RE.test(meta.annotated_by)) {
    if (!meta.reviewed_by || AI_ANNOTATOR_RE.test(meta.reviewed_by)) {
      blockers.push("AI_SELF_APPROVAL_FORBIDDEN");
      details.push("AI-prepared real-document annotation lacks a human reviewer");
    }
  }
  if (manifest) {
    if (manifest.pii_review_status === "deidentified_pending_review") {
      blockers.push("PII_REVIEW_PENDING");
      details.push("pii_review_status=deidentified_pending_review");
    }
    if (!manifest.locked) {
      if (!blockers.includes("ANNOTATION_NOT_LOCKED")) blockers.push("ANNOTATION_NOT_LOCKED");
      details.push("manifest.locked is false");
    }
  }

  const missingCritical = missingCriticalReview(gt.facts);
  if (missingCritical.length > 0) {
    blockers.push("CRITICAL_FACT_NOT_REVIEWED");
    details.push(`unreviewed critical fields: ${missingCritical.join(", ")}`);
  }

  return { authoritative: blockers.length === 0, blockers, details };
}

/** Critical facts present in the annotation but flagged as needing review. */
export function missingCriticalReview(facts: GroundTruthFact[]): string[] {
  const out: string[] = [];
  for (const f of facts ?? []) {
    const isCritical = CRITICAL_REVIEW_FIELDS.some(
      (c) => f.semantic_field === c || f.semantic_field.startsWith(`${c}.`),
    );
    if (isCritical && f.certainty === "ambiguous" && !f.notes) {
      out.push(f.semantic_field);
    }
  }
  return out;
}

/** Annotation edits must bump annotation_version — proven deterministically. */
export function requiresNewAnnotationVersion(
  before: GroundTruthDocument,
  after: GroundTruthDocument,
): boolean {
  const project = (d: GroundTruthDocument) =>
    JSON.stringify(
      d.facts.map((f) => [f.fact_id, f.semantic_field, f.expected_status, f.value]),
    );
  return project(before) !== project(after);
}

export function annotationVersionIsValid(
  before: GroundTruthDocument,
  after: GroundTruthDocument,
): boolean {
  if (!requiresNewAnnotationVersion(before, after)) return true;
  return before.meta.annotation_version !== after.meta.annotation_version;
}

/** Blank, non-authoritative annotation template (AI may prepare these). */
export function createBlankAnnotationTemplate(
  document_id: string,
  document_sha256: string,
  dataset_split: "development" | "holdout",
): GroundTruthDocument {
  return {
    document_id,
    document_sha256,
    dataset_split,
    meta: {
      annotated_by: "unassigned",
      annotation_version: "0.1.0-draft",
      review_status: "unreviewed",
      adjudication_status: "not_required",
      locked: false,
    },
    facts: CRITICAL_REVIEW_FIELDS.map((field, i) => ({
      fact_id: `${document_id}-F${String(i + 1).padStart(3, "0")}`,
      semantic_field: field,
      expected_status: "not_applicable",
      value: null,
      evidence: [],
      certainty: "not_applicable",
      severity: "major",
      notes: "TEMPLATE — requires primary human annotation",
    })),
  };
}
