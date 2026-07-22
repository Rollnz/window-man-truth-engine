// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — DETERMINISTIC CANONICAL MERGE (Sprint 05B)
//
// Pure local utility. NO remote calls. NO database writes. NO side effects.
//
// Reconstructs one CanonicalExtractionV1 from multiple provider-partition
// outputs, then runs the frozen `validateCanonicalExtractionV1` validator.
// Every canonical top-level field must have exactly ONE authoritative
// partition owner — see PARTITION_OWNERSHIP below.
//
// Cross-pass ID coherence: `line_items` and `product_configurations` are
// deliberately owned by the SAME partition (`twoPassB`), so no independent
// AI call is ever asked to invent an id the other call must guess.
// ═══════════════════════════════════════════════════════════════════════════

import { CANONICAL_CONTRACT_VERSION } from "./constants.ts";
import { CanonicalExtractionV1JsonSchema } from "./schema.ts";
import type { CanonicalExtractionV1, QuoteFacts } from "./types.ts";
import {
  validateCanonicalExtractionV1,
  type ValidationResult,
} from "./validation.ts";

// ── Ownership contract ─────────────────────────────────────────────────────
//
// Keys are canonical top-level (or `quote.*`) field paths.
// Values are the partition that authoritatively produces them.
// This map is asserted at test time against the canonical schema to
// guarantee no field ever becomes unowned as the contract evolves.

// Sprint 05C — architecture selected: FOUR_PASS_PARALLEL_CANONICAL_MERGE.
// The two-pass owners (`twoPassA`/`twoPassB`) are retained as ALIASES so
// legacy `mergeTwoPass` callers and existing consistency tests continue to
// compile. The canonical, live-serving architecture is four-pass.
export type PartitionOwner =
  | "passA"
  | "passB"
  | "passC"
  | "passD"
  | "shared_metadata"
  // legacy aliases (still exported for back-compat; do not use in new code)
  | "twoPassA"
  | "twoPassB";

export const PARTITION_OWNERSHIP: Readonly<Record<string, PartitionOwner>> = {
  // Shared: every partition must echo the same literal contract_version.
  // Merge asserts equality; conflicts fail closed.
  contract_version: "shared_metadata",

  // Pass A — document-level facts.
  classification: "passA",
  entities: "passA",
  extraction_meta: "passA",

  // Pass B — quote header (metadata + pricing + payment + opening summary).
  "quote.metadata": "passB",
  "quote.pricing": "passB",
  "quote.payment": "passB",
  "quote.opening_count": "passB",
  "quote.line_items_aggregate_only": "passB",

  // Pass C — quote scope + warranties + terms.
  "quote.scope": "passC",
  "quote.warranties": "passC",
  "quote.terms": "passC",

  // Pass D — quote line-level detail. `line_items` and `product_configurations`
  // MUST stay together in this pass to preserve line_item_id ↔
  // product_configuration_id coherence.
  "quote.line_items": "passD",
  "quote.product_configurations": "passD",
};

// ── Coverage assertion (schema-evolution guard) ────────────────────────────

export interface CoverageResult {
  ok: boolean;
  unowned: string[];
  unknown: string[];
}

/**
 * Walks the canonical schema and confirms every canonical field is owned
 * by exactly one partition (or explicitly marked shared_metadata). Fails
 * closed if a new canonical field is added without a partition owner.
 */
export function assertPartitionCoverage(): CoverageResult {
  const canonical = CanonicalExtractionV1JsonSchema as unknown as {
    properties: Record<string, { properties?: Record<string, unknown> }>;
  };

  const canonicalPaths: string[] = [];
  for (const top of Object.keys(canonical.properties)) {
    canonicalPaths.push(top);
    if (top === "quote") {
      const quoteProps = canonical.properties.quote.properties ?? {};
      for (const qk of Object.keys(quoteProps)) {
        canonicalPaths.push(`quote.${qk}`);
      }
    }
  }

  const ownedSet = new Set(Object.keys(PARTITION_OWNERSHIP));
  const canonicalSet = new Set(canonicalPaths);

  // `quote` itself is a container — ownership is expressed via `quote.*`.
  ownedSet.add("quote");
  canonicalSet.add("quote");

  const unowned = canonicalPaths.filter((p) => !ownedSet.has(p));
  const unknown = [...ownedSet].filter((p) => !canonicalSet.has(p) && p !== "quote");

  return { ok: unowned.length === 0 && unknown.length === 0, unowned, unknown };
}

// ── Partition input shapes ─────────────────────────────────────────────────
//
// The partitions are deliberately typed as `Partial<CanonicalExtractionV1>`
// slices: each pass returns a subset of the canonical shape that must be
// verbatim-mergeable. The provider is instructed to return exactly the
// keys its projected schema declares; we defensively drop anything it
// hallucinates outside its ownership.

export interface TwoPassAOutput {
  contract_version: string;
  classification: CanonicalExtractionV1["classification"];
  entities: CanonicalExtractionV1["entities"];
  extraction_meta: CanonicalExtractionV1["extraction_meta"];
  quote: Pick<
    QuoteFacts,
    | "metadata"
    | "pricing"
    | "payment"
    | "opening_count"
    | "line_items_aggregate_only"
    | "scope"
    | "warranties"
    | "terms"
  >;
}

export interface TwoPassBOutput {
  contract_version: string;
  quote: Pick<QuoteFacts, "line_items" | "product_configurations">;
}

export interface MergeSuccess {
  ok: true;
  value: CanonicalExtractionV1;
  validation: ValidationResult;
}

export interface MergeFailure {
  ok: false;
  error: string;
  details?: unknown;
  validation?: ValidationResult;
}

export type MergeResult = MergeSuccess | MergeFailure;

// ── Deterministic merge (two-pass) ─────────────────────────────────────────

export function mergeTwoPass(
  passA: TwoPassAOutput | null | undefined,
  passB: TwoPassBOutput | null | undefined,
): MergeResult {
  if (!passA) return { ok: false, error: "missing pass A output" };
  if (!passB) return { ok: false, error: "missing pass B output" };

  if (!isPlainObject(passA) || !isPlainObject(passB)) {
    return { ok: false, error: "partition outputs must be objects" };
  }

  // Shared-metadata invariant: both partitions must agree on contract_version
  // and both must equal the canonical CONTRACT_VERSION.
  if (
    passA.contract_version !== CANONICAL_CONTRACT_VERSION ||
    passB.contract_version !== CANONICAL_CONTRACT_VERSION
  ) {
    return {
      ok: false,
      error: "contract_version mismatch across partitions",
      details: {
        expected: CANONICAL_CONTRACT_VERSION,
        passA: passA.contract_version,
        passB: passB.contract_version,
      },
    };
  }

  if (!isPlainObject(passA.quote) || !isPlainObject(passB.quote)) {
    return { ok: false, error: "partition outputs must include 'quote' object" };
  }

  // Build the canonical `quote` from the two partitions' owned keys.
  const quote: QuoteFacts = {
    metadata: passA.quote.metadata,
    pricing: passA.quote.pricing,
    payment: passA.quote.payment,
    line_items: passB.quote.line_items,
    line_items_aggregate_only: passA.quote.line_items_aggregate_only,
    opening_count: passA.quote.opening_count,
    product_configurations: passB.quote.product_configurations,
    scope: passA.quote.scope,
    warranties: passA.quote.warranties,
    terms: passA.quote.terms,
  };

  const merged: CanonicalExtractionV1 = {
    contract_version: CANONICAL_CONTRACT_VERSION,
    classification: passA.classification,
    entities: passA.entities,
    quote,
    extraction_meta: passA.extraction_meta,
  };

  const validation = validateCanonicalExtractionV1(merged);
  if (!validation.valid) {
    return {
      ok: false,
      error: "merged canonical object failed validateCanonicalExtractionV1",
      validation,
    };
  }

  return { ok: true, value: merged, validation };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
