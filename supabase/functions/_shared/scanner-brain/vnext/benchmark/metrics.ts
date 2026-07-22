// Sprint 07A — Metrics: deterministic line-item matching, evidence classification,
// anomaly preservation, cross-reference coherence, field stability.

import type {
  AssertedLineItem,
  AssertedProductConfiguration,
  EvidenceBucket,
  FieldStabilitySample,
  GroundTruthDocument,
  NormalizedSystemOutput,
} from "./benchmark-types.ts";
import { ERROR_CODES } from "./error-taxonomy.ts";
import {
  dimensionEquivalent,
  manufacturerEquivalent,
  normalizeName,
} from "./normalization.ts";

// -------- Line-item matching contract --------

export interface GroundTruthLineItem {
  gt_line_id: string;
  stable_line_id?: string;
  opening_location?: string;
  product_type?: string;
  quantity?: number;
  unit_price?: number;
  width_in?: number;
  height_in?: number;
  manufacturer?: string;
  series?: string;
  description?: string;
  page?: number;
}

export const LINE_ITEM_SIGNAL_WEIGHTS = Object.freeze({
  stable_line_id: 100,
  opening_location: 25,
  product_type: 15,
  dimensions: 20,
  quantity: 10,
  unit_price: 15,
  manufacturer_series: 10,
  description: 5,
});

export const LINE_ITEM_AMBIGUITY_MARGIN = 0.15; // 15%

export interface LineItemPairing {
  gt_line_id: string | null;
  candidate_index: number | null;
  score: number;
  ambiguous: boolean;
  has_hard_signal: boolean;
}

export function scoreLineItemPair(
  gt: GroundTruthLineItem,
  cand: AssertedLineItem,
): { score: number; hardSignal: boolean } {
  let score = 0;
  let hardSignal = false;
  if (gt.stable_line_id && cand.stable_line_id && gt.stable_line_id === cand.stable_line_id) {
    return { score: LINE_ITEM_SIGNAL_WEIGHTS.stable_line_id, hardSignal: true };
  }
  const loc = normalizeName(gt.opening_location);
  const cLoc = normalizeName(cand.opening_location);
  if (loc && cLoc && loc === cLoc) {
    score += LINE_ITEM_SIGNAL_WEIGHTS.opening_location;
    hardSignal = true;
  }
  if (gt.product_type && cand.product_type && gt.product_type === cand.product_type) {
    score += LINE_ITEM_SIGNAL_WEIGHTS.product_type;
  }
  if (
    gt.width_in != null && cand.width_in != null &&
    gt.height_in != null && cand.height_in != null
  ) {
    const wEq = dimensionEquivalent(gt.width_in, cand.width_in).kind === "equal";
    const hEq = dimensionEquivalent(gt.height_in, cand.height_in).kind === "equal";
    if (wEq && hEq) {
      score += LINE_ITEM_SIGNAL_WEIGHTS.dimensions;
      hardSignal = true;
    }
  }
  if (gt.quantity != null && cand.quantity != null && gt.quantity === cand.quantity) {
    score += LINE_ITEM_SIGNAL_WEIGHTS.quantity;
  }
  if (
    gt.unit_price != null && cand.unit_price != null &&
    Math.abs(gt.unit_price - cand.unit_price) <= Math.max(1, gt.unit_price * 0.01)
  ) {
    score += LINE_ITEM_SIGNAL_WEIGHTS.unit_price;
  }
  if (gt.manufacturer && cand.manufacturer) {
    const eq = manufacturerEquivalent(gt.manufacturer, cand.manufacturer).kind === "equal";
    if (eq) score += LINE_ITEM_SIGNAL_WEIGHTS.manufacturer_series;
  }
  if (gt.description && cand.description) {
    const j = jaccard(gt.description, cand.description);
    if (j >= 0.6) score += LINE_ITEM_SIGNAL_WEIGHTS.description;
  }
  return { score, hardSignal };
}

/**
 * Deterministic matcher. Emits ambiguous when top and runner-up are within 15%
 * AND the top pair has no hard signal (stable_id / location / dims).
 */
export function matchLineItems(
  gt: GroundTruthLineItem[],
  candidates: AssertedLineItem[],
): {
  pairings: LineItemPairing[];
  unmatched_gt: string[];
  unmatched_candidates: number[];
} {
  const pairings: LineItemPairing[] = [];
  const usedCandidates = new Set<number>();

  // Sort ground truth deterministically.
  const orderedGt = [...gt].sort((a, b) => a.gt_line_id.localeCompare(b.gt_line_id));

  for (const g of orderedGt) {
    const scored = candidates.map((c, i) => ({ i, ...scoreLineItemPair(g, c) }))
      .filter((s) => !usedCandidates.has(s.i))
      .sort((a, b) => b.score - a.score || a.i - b.i);

    if (scored.length === 0 || scored[0].score === 0) {
      pairings.push({
        gt_line_id: g.gt_line_id, candidate_index: null, score: 0,
        ambiguous: false, has_hard_signal: false,
      });
      continue;
    }

    const top = scored[0];
    const second = scored[1];
    const margin = second ? (top.score - second.score) / Math.max(top.score, 1) : 1;
    const ambiguous = !!second && margin < LINE_ITEM_AMBIGUITY_MARGIN && !top.hardSignal;

    if (ambiguous) {
      // Do NOT force a pairing.
      pairings.push({
        gt_line_id: g.gt_line_id,
        candidate_index: null,
        score: top.score,
        ambiguous: true,
        has_hard_signal: false,
      });
    } else {
      usedCandidates.add(top.i);
      pairings.push({
        gt_line_id: g.gt_line_id,
        candidate_index: top.i,
        score: top.score,
        ambiguous: false,
        has_hard_signal: top.hardSignal,
      });
    }
  }

  const unmatched_gt = pairings.filter((p) => p.candidate_index == null && !p.ambiguous)
    .map((p) => p.gt_line_id!);
  const matchedSet = new Set(pairings.map((p) => p.candidate_index).filter((x) => x != null));
  const unmatched_candidates: number[] = [];
  for (let i = 0; i < candidates.length; i++) {
    if (!matchedSet.has(i)) unmatched_candidates.push(i);
  }
  return { pairings, unmatched_gt, unmatched_candidates };
}

function jaccard(a: string, b: string): number {
  const A = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const B = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (A.size === 0 && B.size === 0) return 0;
  const inter = [...A].filter((t) => B.has(t)).length;
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 0 : inter / union;
}

// -------- Evidence classification --------

export type EvidenceClassification = keyof EvidenceBucket;

export function classifyEvidence(
  gtEvidenceText: string | undefined,
  gtPage: number | undefined,
  scannerEvidenceText: string | undefined,
  scannerPage: number | undefined,
  factCorrect: boolean,
): EvidenceClassification {
  if (factCorrect && !scannerEvidenceText && scannerPage == null) return "MISSING";
  const gt = (gtEvidenceText ?? "").trim().toLowerCase();
  const sc = (scannerEvidenceText ?? "").trim().toLowerCase();

  if (gt && sc) {
    if (gt === sc) return "EXACT_OR_NORMALIZED_MATCH";
    if (sc.length >= 6 && (gt.includes(sc) || sc.includes(gt))) {
      return "TEXT_CONTAINMENT_SUPPORTED";
    }
    // Both texts exist, neither contains the other → text disagrees.
    if (gtPage != null && scannerPage != null && gtPage !== scannerPage) {
      return "PAGE_REFERENCE_WRONG";
    }
    return "UNSUPPORTED";
  }
  if (gtPage != null && scannerPage != null) {
    if (gtPage === scannerPage) return "PAGE_MATCH_SUPPORTED";
    return "PAGE_REFERENCE_WRONG";
  }
  if (sc && !gt) return "HUMAN_REVIEW_REQUIRED";
  return "MISSING";
}

export function emptyEvidenceBucket(): EvidenceBucket {
  return {
    EXACT_OR_NORMALIZED_MATCH: 0,
    TEXT_CONTAINMENT_SUPPORTED: 0,
    PAGE_MATCH_SUPPORTED: 0,
    MISSING: 0,
    UNSUPPORTED: 0,
    PAGE_REFERENCE_WRONG: 0,
    HUMAN_REVIEW_REQUIRED: 0,
  };
}

// -------- Anomaly preservation --------

export function checkAnomalyPreservation(
  doc: GroundTruthDocument,
  out: NormalizedSystemOutput,
): { expected: number; preserved: number } {
  const anomalies = doc.facts.filter((f) => f.anomaly === true);
  let preserved = 0;
  for (const a of anomalies) {
    const asserted = out.facts.find((x) => x.semantic_field === a.semantic_field);
    if (asserted && asserted.status === "found" && String(asserted.value) === String(a.value)) {
      preserved++;
    }
  }
  return { expected: anomalies.length, preserved };
}

// -------- Cross-reference coherence --------

export interface CrossRefStats {
  valid: number;
  dangling: number;
  incorrect: number;
  missing: number;
}

export function checkCrossReferenceCoherence(
  out: NormalizedSystemOutput,
  expectedAssociations?: Array<{ product_configuration_id: string; line_item_ids: string[] }>,
): CrossRefStats {
  const stats: CrossRefStats = { valid: 0, dangling: 0, incorrect: 0, missing: 0 };
  const productIds = new Set(out.product_configurations.map((p) => p.product_configuration_id));
  const liIds = new Set(out.line_items.map((li) => li.line_item_id).filter(Boolean));

  for (const li of out.line_items) {
    if (li.product_configuration_id) {
      if (productIds.has(li.product_configuration_id)) stats.valid++;
      else stats.dangling++;
    }
  }
  for (const pc of out.product_configurations) {
    if (pc.applies_to_line_item_ids) {
      for (const id of pc.applies_to_line_item_ids) {
        if (!liIds.has(id)) stats.dangling++;
      }
    }
  }

  if (expectedAssociations) {
    for (const exp of expectedAssociations) {
      const pc = out.product_configurations.find((p) => p.product_configuration_id === exp.product_configuration_id);
      if (!pc) { stats.missing++; continue; }
      const actual = new Set(pc.applies_to_line_item_ids ?? []);
      const expected = new Set(exp.line_item_ids);
      for (const id of expected) {
        if (!actual.has(id)) stats.missing++;
      }
      for (const id of actual) {
        if (!expected.has(id)) stats.incorrect++;
      }
    }
  }
  return stats;
}

// -------- Field stability (repeatability) --------

export interface FieldStabilityResult {
  field: string;
  runs: number;
  distinct_values: number;
  stability_rate: number;
}

export function computeFieldStability(
  samples: FieldStabilitySample[],
): FieldStabilityResult[] {
  const byField: Record<string, unknown[]> = {};
  for (const s of samples) {
    for (const f of s.facts) {
      (byField[f.semantic_field] ||= []).push(JSON.stringify(f.value ?? null));
    }
  }
  return Object.entries(byField).map(([field, values]) => {
    const counts = new Map<string, number>();
    for (const v of values) counts.set(String(v), (counts.get(String(v)) ?? 0) + 1);
    const modeCount = Math.max(...counts.values());
    return {
      field,
      runs: values.length,
      distinct_values: counts.size,
      stability_rate: values.length === 0 ? 0 : modeCount / values.length,
    };
  }).sort((a, b) => a.field.localeCompare(b.field));
}

// Suppress unused import warning
void ERROR_CODES;
