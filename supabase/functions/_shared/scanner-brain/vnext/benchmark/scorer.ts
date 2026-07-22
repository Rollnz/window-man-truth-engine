// Sprint 07A — Deterministic scorer. Uses source-neutral ground truth only.
import type {
  DocumentScorecard,
  ErrorInstance,
  GroundTruthDocument,
  NormalizedSystemOutput,
  SystemAggregateScorecard,
  SystemCapabilityDeclaration,
  AssertedFact,
  GroundTruthFact,
} from "./benchmark-types.ts";
import { ERROR_CODES, SEVERITY_TABLE, INFRA_CODES, type ErrorCode } from "./error-taxonomy.ts";
import { valueEquivalent } from "./normalization.ts";
import {
  classifyEvidence,
  emptyEvidenceBucket,
  checkAnomalyPreservation,
  checkCrossReferenceCoherence,
} from "./metrics.ts";
import { isSystemSupported } from "./adapters/capability-matrix.ts";
import type { ThresholdConfig } from "./benchmark-thresholds.ts";

// Map semantic field → capability id. Simple prefix rules.
export function fieldToCapability(semantic_field: string): string {
  if (semantic_field.startsWith("entity.homeowner")) return "entity.homeowner";
  if (semantic_field.startsWith("entity.property")) return "entity.property";
  if (semantic_field.startsWith("entity.contractor")) return "entity.contractor";
  if (semantic_field.startsWith("entity.salesperson")) return "entity.salesperson";
  if (semantic_field.startsWith("entity.role_separation")) return "entity.role_separation";
  if (semantic_field.startsWith("classification")) return "classification";
  if (semantic_field.startsWith("pricing.payment_schedule")) return "pricing.payment_schedule";
  if (semantic_field.startsWith("pricing")) return "pricing.commercial_facts";
  if (semantic_field.startsWith("line_items")) return "line_items";
  if (semantic_field.startsWith("product_configurations")) return "product_configurations";
  if (semantic_field.startsWith("cross_reference")) return "cross_references";
  return "pricing.commercial_facts";
}

// Field kind hint for normalization dispatch.
function fieldKind(semantic_field: string): Parameters<typeof valueEquivalent>[2] {
  if (/total|subtotal|price|tax|deposit|amount|discount/i.test(semantic_field)) return "money";
  if (/date|expiration/i.test(semantic_field)) return "date";
  if (/phone/i.test(semantic_field)) return "phone";
  if (/email/i.test(semantic_field)) return "email";
  if (/address/i.test(semantic_field)) return "address";
  if (/name/i.test(semantic_field)) return "name";
  if (/noa|permit|license|id$/i.test(semantic_field)) return "identifier";
  if (/manufacturer|series/i.test(semantic_field)) return "manufacturer";
  return "raw";
}

export interface ScoreDocumentInput {
  system_id: string;
  system_capabilities: SystemCapabilityDeclaration;
  document: GroundTruthDocument;
  output: NormalizedSystemOutput;
  latency_ms: number;
  infra_failure?: ErrorCode;
  expected_associations?: Array<{ product_configuration_id: string; line_item_ids: string[] }>;
}

export function scoreDocument(input: ScoreDocumentInput): DocumentScorecard {
  const errors: ErrorInstance[] = [];
  const bucket = emptyEvidenceBucket();

  let facts_considered = 0;
  let facts_correct = 0;
  let hallucinations = 0;
  let critical_hallucinations = 0;
  let evidence_missing = 0;
  let evidence_unsupported = 0;
  let unsupported_by_system = 0;
  let human_review_required = 0;
  let infra_failures = 0;

  if (input.infra_failure) {
    infra_failures++;
    errors.push({
      code: input.infra_failure,
      severity: SEVERITY_TABLE[input.infra_failure],
      detail: "run reported infra failure",
    });
    // Infra failures are recorded but do NOT enter the factual accuracy denominator.
    return finalize();
  }

  const byField = new Map<string, AssertedFact>();
  for (const f of input.output.facts) byField.set(f.semantic_field, f);

  for (const gt of input.document.facts) {
    // Denominator rule 1: NOT_APPLICABLE excluded.
    if (gt.expected_status === "not_applicable") continue;

    // Denominator rule 2: UNSUPPORTED_BY_SYSTEM excluded from that system's recall.
    const cap = fieldToCapability(gt.semantic_field);
    if (!isSystemSupported(input.system_capabilities, cap)) {
      unsupported_by_system++;
      errors.push({
        code: ERROR_CODES.UNSUPPORTED_BY_SYSTEM,
        severity: "minor",
        semantic_field: gt.semantic_field,
        fact_id: gt.fact_id,
      });
      continue;
    }

    facts_considered++;
    const asserted = byField.get(gt.semantic_field);
    const evalResult = evaluateFact(gt, asserted);

    if (evalResult.kind === "human_review") {
      human_review_required++;
      bucket.HUMAN_REVIEW_REQUIRED++;
      errors.push({
        code: ERROR_CODES.HUMAN_REVIEW_REQUIRED,
        severity: "minor",
        semantic_field: gt.semantic_field,
        fact_id: gt.fact_id,
        detail: evalResult.reason,
      });
      continue;
    }

    if (evalResult.kind === "correct") {
      facts_correct++;
    } else {
      const code = evalResult.code;
      const sev = SEVERITY_TABLE[code];
      errors.push({
        code, severity: sev,
        semantic_field: gt.semantic_field, fact_id: gt.fact_id,
        detail: evalResult.detail,
      });
      if (code === ERROR_CODES.HALLUCINATION) {
        hallucinations++;
        if (sev === "critical") critical_hallucinations++;
      }
    }

    // Evidence classification (does not affect factual correctness).
    if (asserted && evalResult.kind === "correct") {
      const gtEv = gt.evidence[0];
      const cls = classifyEvidence(
        gtEv?.source_text, gtEv?.page,
        asserted.evidence?.source_text, asserted.evidence?.page,
        true,
      );
      bucket[cls]++;
      if (cls === "MISSING") {
        evidence_missing++;
        errors.push({
          code: ERROR_CODES.EVIDENCE_MISSING, severity: "minor",
          semantic_field: gt.semantic_field, fact_id: gt.fact_id,
        });
      } else if (cls === "UNSUPPORTED") {
        evidence_unsupported++;
        errors.push({
          code: ERROR_CODES.EVIDENCE_UNSUPPORTED, severity: "major",
          semantic_field: gt.semantic_field, fact_id: gt.fact_id,
        });
      } else if (cls === "PAGE_REFERENCE_WRONG") {
        errors.push({
          code: ERROR_CODES.PAGE_REFERENCE_WRONG, severity: "minor",
          semantic_field: gt.semantic_field, fact_id: gt.fact_id,
        });
      }
    }
  }

  const anomaly = checkAnomalyPreservation(input.document, input.output);
  if (anomaly.expected > anomaly.preserved) {
    for (const a of input.document.facts.filter((f) => f.anomaly)) {
      const asserted = byField.get(a.semantic_field);
      if (!asserted || String(asserted.value) !== String(a.value)) {
        errors.push({
          code: ERROR_CODES.ANOMALY_NOT_PRESERVED, severity: "critical",
          semantic_field: a.semantic_field, fact_id: a.fact_id,
        });
      }
    }
  }

  const cross = checkCrossReferenceCoherence(input.output, input.expected_associations);

  const line_items_ambiguous = 0; // Wired here so shape stays complete; caller may increment via metrics helpers.

  function finalize(): DocumentScorecard {
    return {
      system_id: input.system_id,
      document_id: input.document.document_id,
      annotation_locked: input.document.meta.locked,
      errors,
      counts: {
        facts_considered,
        facts_correct,
        hallucinations,
        critical_hallucinations,
        evidence_missing,
        evidence_unsupported,
        line_items_ambiguous,
        human_review_required,
        unsupported_by_system,
        anomalies_expected: anomaly?.expected ?? 0,
        anomalies_preserved: anomaly?.preserved ?? 0,
        cross_ref_valid: cross?.valid ?? 0,
        cross_ref_dangling: cross?.dangling ?? 0,
        cross_ref_incorrect: cross?.incorrect ?? 0,
        cross_ref_missing: cross?.missing ?? 0,
        infra_failures,
      },
      evidence_buckets: bucket,
      latency_ms: input.latency_ms,
    };
  }
  return finalize();
}

interface EvalCorrect { kind: "correct" }
interface EvalWrong { kind: "wrong"; code: ErrorCode; detail?: string }
interface EvalReview { kind: "human_review"; reason: string }
type EvalResult = EvalCorrect | EvalWrong | EvalReview;

function evaluateFact(gt: GroundTruthFact, asserted: AssertedFact | undefined): EvalResult {
  const kind = fieldKind(gt.semantic_field);
  if (!asserted) {
    // Scanner said nothing.
    if (gt.expected_status === "not_found") return { kind: "correct" };
    return { kind: "wrong", code: ERROR_CODES.VALUE_MISS };
  }
  if (asserted.status === "unsupported_by_system") {
    return { kind: "wrong", code: ERROR_CODES.UNSUPPORTED_BY_SYSTEM };
  }

  // Entity role misattribution: scanner asserted for wrong role.
  if (gt.entity_role && asserted.entity_role && gt.entity_role !== asserted.entity_role) {
    return {
      kind: "wrong",
      code: ERROR_CODES.ENTITY_MISATTRIBUTION,
      detail: `expected role=${gt.entity_role}, got role=${asserted.entity_role}`,
    };
  }

  if (gt.expected_status === "not_found") {
    if (asserted.status === "not_found") return { kind: "correct" };
    if (asserted.status === "found") {
      // Fact says not present in document but scanner asserted a value → hallucination.
      return { kind: "wrong", code: ERROR_CODES.HALLUCINATION };
    }
    if (asserted.status === "uncertain") return { kind: "correct" };
    return { kind: "wrong", code: ERROR_CODES.FALSE_FOUND };
  }

  if (gt.expected_status === "found") {
    if (asserted.status === "not_found") return { kind: "wrong", code: ERROR_CODES.FALSE_NOT_FOUND };
    if (asserted.status === "uncertain") {
      return { kind: "wrong", code: ERROR_CODES.UNCERTAINTY_MISUSE, detail: "known value asserted uncertain" };
    }
    const eq = valueEquivalent(gt.value, asserted.value, kind);
    if (eq.kind === "equal") return { kind: "correct" };
    if (eq.kind === "human_review_required") return { kind: "human_review", reason: eq.reason };
    return { kind: "wrong", code: ERROR_CODES.VALUE_WRONG };
  }

  // expected_status === "uncertain"
  if (asserted.status === "uncertain") return { kind: "correct" };
  return { kind: "wrong", code: ERROR_CODES.UNCERTAINTY_MISUSE };
}

// -------- Aggregate --------

export function aggregateSystemScorecards(
  system_id: string,
  scorecards: DocumentScorecard[],
  thresholds: ThresholdConfig,
): SystemAggregateScorecard {
  const filtered = scorecards.filter((s) => s.system_id === system_id);
  const totalConsidered = filtered.reduce((a, s) => a + s.counts.facts_considered, 0);
  const totalCorrect = filtered.reduce((a, s) => a + s.counts.facts_correct, 0);
  const totalHall = filtered.reduce((a, s) => a + s.counts.hallucinations, 0);
  const criticalHall = filtered.reduce((a, s) => a + s.counts.critical_hallucinations, 0);
  const evidenceTotal = filtered.reduce((a, s) => {
    return a + Object.values(s.evidence_buckets).reduce((x, y) => x + y, 0);
  }, 0);
  const evidenceGood = filtered.reduce((a, s) => {
    const b = s.evidence_buckets;
    return a + b.EXACT_OR_NORMALIZED_MATCH + b.TEXT_CONTAINMENT_SUPPORTED + b.PAGE_MATCH_SUPPORTED;
  }, 0);
  const anomExp = filtered.reduce((a, s) => a + s.counts.anomalies_expected, 0);
  const anomPres = filtered.reduce((a, s) => a + s.counts.anomalies_preserved, 0);
  const crossTotal = filtered.reduce((a, s) => {
    const c = s.counts;
    return a + c.cross_ref_valid + c.cross_ref_dangling + c.cross_ref_incorrect + c.cross_ref_missing;
  }, 0);
  const crossValid = filtered.reduce((a, s) => a + s.counts.cross_ref_valid, 0);
  const latencies = filtered.map((s) => s.latency_ms).sort((a, b) => a - b);
  const p50 = latencies.length ? latencies[Math.floor(latencies.length * 0.5)] : 0;
  const p95 = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : 0;

  const aggregate = totalConsidered > 0 ? totalCorrect / totalConsidered : 0;
  const hallRate = totalConsidered > 0 ? totalHall / totalConsidered : 0;
  const evidenceRate = evidenceTotal > 0 ? evidenceGood / evidenceTotal : 0;
  const anomRate = anomExp > 0 ? anomPres / anomExp : 1;
  const crossRate = crossTotal > 0 ? crossValid / crossTotal : 1;

  const gate_failures: string[] = [];
  // Critical hallucinations ALWAYS override aggregate.
  if (criticalHall > thresholds.critical_hallucinations_allowed_holdout) {
    gate_failures.push(`critical_hallucinations=${criticalHall} exceeds threshold`);
  }
  if (aggregate < thresholds.critical_commercial_accuracy_min) {
    gate_failures.push(`aggregate_accuracy ${aggregate.toFixed(3)} < threshold ${thresholds.critical_commercial_accuracy_min}`);
  }
  if (hallRate > thresholds.overall_hallucination_rate_max) {
    gate_failures.push(`hallucination_rate ${hallRate.toFixed(3)} > threshold`);
  }

  return {
    system_id,
    documents: filtered.length,
    aggregate_accuracy: aggregate,
    critical_hallucinations: criticalHall,
    hallucination_rate: hallRate,
    evidence_support_rate: evidenceRate,
    anomaly_preservation_rate: anomRate,
    cross_reference_coherence_rate: crossRate,
    human_review_required: filtered.reduce((a, s) => a + s.counts.human_review_required, 0),
    latency_ms_p50: p50,
    latency_ms_p95: p95,
    gate_failures,
  };
}

void INFRA_CODES;
