// Sprint 07A — Source-neutral human ground truth (Layer A).
// INVARIANT: This module MUST NOT import from ../types.ts or ../schema.ts.
// Test benchmark.test.ts asserts this via source-code inspection.

import type {
  GroundTruthDocument,
  GroundTruthFact,
  GroundTruthAnnotationMeta,
} from "./benchmark-types.ts";

export interface ValidationIssue {
  path: string;
  message: string;
}

export function validateGroundTruthDocument(
  doc: GroundTruthDocument,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!doc.document_id) issues.push({ path: "document_id", message: "required" });
  if (!doc.document_sha256 || !/^[a-f0-9]{64}$/i.test(doc.document_sha256)) {
    issues.push({ path: "document_sha256", message: "must be 64-char hex" });
  }
  if (doc.dataset_split !== "development" && doc.dataset_split !== "holdout") {
    issues.push({ path: "dataset_split", message: "must be development|holdout" });
  }

  issues.push(...validateAnnotationMeta(doc.meta));

  const seenIds = new Set<string>();
  doc.facts.forEach((f, i) => {
    const p = `facts[${i}]`;
    if (!f.fact_id) issues.push({ path: `${p}.fact_id`, message: "required" });
    if (seenIds.has(f.fact_id)) {
      issues.push({ path: `${p}.fact_id`, message: `duplicate ${f.fact_id}` });
    }
    seenIds.add(f.fact_id);
    if (!f.semantic_field) {
      issues.push({ path: `${p}.semantic_field`, message: "required" });
    }
    issues.push(...validateFact(f, p));
  });

  return issues;
}

function validateAnnotationMeta(meta: GroundTruthAnnotationMeta): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!meta) return [{ path: "meta", message: "required" }];
  if (!meta.annotated_by) issues.push({ path: "meta.annotated_by", message: "required" });
  if (!meta.annotation_version) {
    issues.push({ path: "meta.annotation_version", message: "required" });
  }
  const validReview = ["unreviewed", "in_review", "agreed", "disagreed"];
  if (!validReview.includes(meta.review_status)) {
    issues.push({ path: "meta.review_status", message: "invalid" });
  }
  const validAdj = ["not_required", "pending", "adjudicated"];
  if (!validAdj.includes(meta.adjudication_status)) {
    issues.push({ path: "meta.adjudication_status", message: "invalid" });
  }
  if (meta.locked && meta.review_status !== "agreed" && meta.adjudication_status !== "adjudicated") {
    issues.push({
      path: "meta.locked",
      message: "locked requires review_status=agreed OR adjudication_status=adjudicated",
    });
  }
  return issues;
}

function validateFact(f: GroundTruthFact, p: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const validStatus = ["found", "not_found", "uncertain", "not_applicable"];
  if (!validStatus.includes(f.expected_status)) {
    issues.push({ path: `${p}.expected_status`, message: "invalid" });
  }
  if (f.expected_status === "found" && (f.value === undefined || f.value === null)) {
    issues.push({ path: `${p}.value`, message: "required when expected_status=found" });
  }
  if (f.expected_status === "not_found" && f.value !== null) {
    issues.push({ path: `${p}.value`, message: "must be null when expected_status=not_found" });
  }
  const validCertainty = ["definite", "ambiguous", "not_present", "not_applicable"];
  if (!validCertainty.includes(f.certainty)) {
    issues.push({ path: `${p}.certainty`, message: "invalid" });
  }
  const validSeverity = ["critical", "major", "minor"];
  if (!validSeverity.includes(f.severity)) {
    issues.push({ path: `${p}.severity`, message: "invalid" });
  }
  if (!Array.isArray(f.evidence)) {
    issues.push({ path: `${p}.evidence`, message: "must be an array" });
  }
  return issues;
}

export function isLocked(doc: GroundTruthDocument): boolean {
  return doc.meta.locked === true;
}
