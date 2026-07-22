// Sprint 07A — Layer B: canonical expectation projection.
// Deterministic projection FROM source-neutral ground truth INTO a vNext-shaped
// expectation record. Used ONLY for vNext canonical-coverage/contract evaluation.
// NEVER used for cross-system scoring.

import type { GroundTruthDocument, GroundTruthFact } from "./benchmark-types.ts";

export interface CanonicalFieldExpectation {
  semantic_field: string;
  status: "found" | "not_found" | "uncertain" | "not_applicable";
  value: unknown;
}

export interface CanonicalExpectation {
  document_id: string;
  fields: CanonicalFieldExpectation[];
  // Deliberately does NOT reconstruct the full canonical object.
  // vNext canonical validation is a separate deterministic pass.
}

export function projectToCanonicalExpectation(
  doc: GroundTruthDocument,
): CanonicalExpectation {
  const fields: CanonicalFieldExpectation[] = doc.facts.map((f: GroundTruthFact) => ({
    semantic_field: f.semantic_field,
    status: f.expected_status,
    value: f.expected_status === "not_found" ? null : f.value,
  }));
  // Deterministic ordering — sort by semantic_field for stable snapshots.
  fields.sort((a, b) => a.semantic_field.localeCompare(b.semantic_field));
  return {
    document_id: doc.document_id,
    fields,
  };
}
