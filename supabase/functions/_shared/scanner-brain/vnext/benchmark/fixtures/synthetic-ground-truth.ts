// Sprint 07A — synthetic ground truth fixtures (no PII).
import type { GroundTruthDocument } from "../benchmark-types.ts";

const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);
const SHA_C = "c".repeat(64);

export const DEV_DOC_1: GroundTruthDocument = {
  document_id: "dev-001",
  document_sha256: SHA_A,
  dataset_split: "development",
  archetype: "standard_windows_quote",
  meta: {
    annotated_by: "reviewer-1",
    reviewed_by: "reviewer-2",
    annotation_version: "a-v1",
    review_status: "agreed",
    adjudication_status: "not_required",
    locked: true,
  },
  facts: [
    {
      fact_id: "F001", semantic_field: "classification.document_type",
      expected_status: "found", value: "quote", evidence: [{ page: 1, source_text: "Estimate" }],
      certainty: "definite", severity: "critical",
    },
    {
      fact_id: "F002", semantic_field: "entity.homeowner.name",
      expected_status: "found", value: "Alex Testhome", entity_role: "homeowner",
      evidence: [{ page: 1, source_text: "Alex Testhome" }],
      certainty: "definite", severity: "critical",
    },
    {
      fact_id: "F003", semantic_field: "pricing.total",
      expected_status: "found", value: 12500,
      evidence: [{ page: 2, source_text: "Total: $12,500.00" }],
      certainty: "definite", severity: "critical",
    },
    {
      fact_id: "F004", semantic_field: "pricing.deposit_percent",
      expected_status: "found", value: 120, anomaly: true,
      evidence: [{ page: 2, source_text: "Deposit: 120%" }],
      certainty: "definite", severity: "critical",
    },
    {
      fact_id: "F005", semantic_field: "pricing.financing",
      expected_status: "not_found", value: null,
      evidence: [], certainty: "not_present", severity: "minor",
    },
    {
      fact_id: "F006", semantic_field: "pricing.tax",
      expected_status: "not_applicable", value: null,
      evidence: [], certainty: "not_applicable", severity: "minor",
    },
  ],
};

export const DEV_DOC_2: GroundTruthDocument = {
  document_id: "dev-002",
  document_sha256: SHA_B,
  dataset_split: "development",
  meta: {
    annotated_by: "reviewer-1",
    annotation_version: "a-v1",
    review_status: "unreviewed",
    adjudication_status: "not_required",
    locked: false,
  },
  facts: [
    {
      fact_id: "G001", semantic_field: "pricing.total",
      expected_status: "found", value: 9800,
      evidence: [{ page: 1, source_text: "Grand Total $9,800" }],
      certainty: "definite", severity: "critical",
    },
  ],
};

export const HOLDOUT_DOC_1: GroundTruthDocument = {
  document_id: "hold-001",
  document_sha256: SHA_C,
  dataset_split: "holdout",
  meta: {
    annotated_by: "reviewer-1",
    reviewed_by: "reviewer-2",
    annotation_version: "a-v1",
    review_status: "agreed",
    adjudication_status: "adjudicated",
    adjudication_notes: "reviewers agreed after re-check",
    locked: true,
  },
  facts: [
    {
      fact_id: "H001", semantic_field: "entity.salesperson.name",
      expected_status: "found", value: "Sam Rep", entity_role: "salesperson",
      evidence: [{ page: 1, source_text: "Sales Rep: Sam Rep" }],
      certainty: "definite", severity: "critical",
    },
  ],
};
