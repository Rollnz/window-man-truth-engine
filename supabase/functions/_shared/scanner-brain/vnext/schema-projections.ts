// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — SCHEMA PROJECTION UTILITY (Sprint 05B)
//
// Programmatically derives TEST / TRANSPORT projections of the canonical
// CanonicalExtractionV1JsonSchema. The canonical schema (`schema.ts`) is
// the source of truth and is NEVER mutated. Projections are deep-cloned
// subsets used exclusively for provider transport bisection probes.
//
// Guarantees:
//   • deep clone (no shared references with the canonical object)
//   • `additionalProperties: false` and `required[]` remain in parity
//     with the selected keys
//   • nested subtrees are preserved verbatim to keep referential
//     relationships intact (e.g. `quote.line_items` + `product_configurations`
//     stay coherent within any projection that includes them)
//   • deterministic serialization for bytes/depth measurement
//
// Zero runtime dependencies. Safe for Deno + Node.js.
// ═══════════════════════════════════════════════════════════════════════════

import { CanonicalExtractionV1JsonSchema } from "./schema.ts";

// The canonical schema uses `as const` and readonly arrays. We work on
// mutable clones so that filtering does not require type gymnastics.
type JSONSchema = Record<string, unknown>;

// ── Deep clone (structural, no reference sharing) ─────────────────────────

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// ── Root schema (mutable clone) ────────────────────────────────────────────

export function cloneCanonicalSchema(): JSONSchema {
  return deepClone(CanonicalExtractionV1JsonSchema as unknown as JSONSchema);
}

// ── Root-level projection: pick a subset of top-level properties ──────────
//
// `contract_version` is always retained: consumers need a stable version
// marker in every partition response so downstream merge can pin them.

export interface RootProjectionOptions {
  /** Top-level property keys to KEEP (e.g. ["classification", "entities"]). */
  keepTopLevel: readonly string[];
  /**
   * Optional sub-projection for the `quote` subtree, if `quote` is kept.
   * If provided, only these keys under `quote.properties` are retained.
   * Referential coherence (e.g. line_items + product_configurations)
   * is the caller's responsibility — passing one without the other is
   * deliberately allowed for bisection but flagged via `warnings`.
   */
  keepQuoteKeys?: readonly string[];
  /** Optional human-readable name written into schema.title for logs. */
  title?: string;
}

export interface ProjectionResult {
  schema: JSONSchema;
  serialized: string;
  bytes: number;
  approxDepth: number;
  topLevelKept: string[];
  quoteKeysKept: string[] | null;
  warnings: string[];
}

const ROOT_ALWAYS_KEEP = ["contract_version"] as const;

export function projectSchema(opts: RootProjectionOptions): ProjectionResult {
  const clone = cloneCanonicalSchema();
  const warnings: string[] = [];

  const rootProps = clone.properties as Record<string, JSONSchema>;
  const rootRequired = clone.required as string[];

  const keepSet = new Set<string>([
    ...ROOT_ALWAYS_KEEP,
    ...opts.keepTopLevel,
  ]);

  // Unknown top-level requests → warning
  for (const k of opts.keepTopLevel) {
    if (!(k in rootProps)) {
      warnings.push(`unknown top-level key requested: ${k}`);
    }
  }

  // Filter root properties + required
  const filteredProps: Record<string, JSONSchema> = {};
  for (const k of Object.keys(rootProps)) {
    if (keepSet.has(k)) filteredProps[k] = rootProps[k];
  }
  clone.properties = filteredProps;
  clone.required = rootRequired.filter((k) => keepSet.has(k));

  // Optional quote sub-projection
  let quoteKeysKept: string[] | null = null;
  if (opts.keepQuoteKeys && keepSet.has("quote")) {
    const quoteSchema = filteredProps.quote as JSONSchema;
    const qProps = quoteSchema.properties as Record<string, JSONSchema>;
    const qRequired = quoteSchema.required as string[];
    const qKeep = new Set<string>(opts.keepQuoteKeys);

    for (const k of opts.keepQuoteKeys) {
      if (!(k in qProps)) {
        warnings.push(`unknown quote key requested: ${k}`);
      }
    }

    const nextQProps: Record<string, JSONSchema> = {};
    for (const k of Object.keys(qProps)) {
      if (qKeep.has(k)) nextQProps[k] = qProps[k];
    }
    quoteSchema.properties = nextQProps;
    quoteSchema.required = qRequired.filter((k) => qKeep.has(k));
    quoteKeysKept = [...opts.keepQuoteKeys];

    // Referential coherence warning
    const hasLineItems = qKeep.has("line_items");
    const hasProductConfigs = qKeep.has("product_configurations");
    if (hasLineItems !== hasProductConfigs) {
      warnings.push(
        "line_items and product_configurations should stay together to preserve line_item_id ↔ product_configuration_id references",
      );
    }
  } else if (opts.keepQuoteKeys && !keepSet.has("quote")) {
    warnings.push("keepQuoteKeys provided but 'quote' is not in keepTopLevel — ignored");
  }

  if (opts.title) clone.title = opts.title;

  const serialized = stableStringify(clone);
  return {
    schema: clone,
    serialized,
    bytes: byteLength(serialized),
    approxDepth: measureDepth(clone),
    topLevelKept: Object.keys(filteredProps),
    quoteKeysKept,
    warnings,
  };
}

// ── Deterministic serialization (sorted keys) ──────────────────────────────

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const src = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src).sort()) out[k] = sortKeys(src[k]);
    return out;
  }
  return v;
}

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

function measureDepth(v: unknown, current = 0): number {
  if (Array.isArray(v)) {
    let m = current + 1;
    for (const x of v) m = Math.max(m, measureDepth(x, current + 1));
    return m;
  }
  if (v && typeof v === "object") {
    let m = current + 1;
    for (const x of Object.values(v as Record<string, unknown>)) {
      m = Math.max(m, measureDepth(x, current + 1));
    }
    return m;
  }
  return current;
}

// ── Named canonical partition specs (Sprint 05B) ──────────────────────────
//
// These match the ownership contract documented in SCHEMA_TRANSPORT_PLAN.md
// and canonical-merge.ts. They are exported so probe scripts, tests, and
// the merge coverage assertion share a single source of truth.

export const PARTITION_SPECS = {
  /** Projection A — Classification + Entities + Meta (no quote subtree). */
  classificationEntitiesMeta: {
    keepTopLevel: ["classification", "entities", "extraction_meta"] as const,
    title: "CanonicalExtractionV1__ClassificationEntitiesMeta",
  },
  /** Projection B — Full quote subtree (control). */
  quoteFull: {
    keepTopLevel: ["quote"] as const,
    title: "CanonicalExtractionV1__QuoteFull",
  },
  /** Projection B1 — Quote core (excludes line_items + product_configurations). */
  quoteCore: {
    keepTopLevel: ["quote"] as const,
    keepQuoteKeys: [
      "metadata",
      "pricing",
      "payment",
      "opening_count",
      "line_items_aggregate_only",
      "scope",
      "warranties",
      "terms",
    ] as const,
    title: "CanonicalExtractionV1__QuoteCore",
  },
  /** Projection B2 — Quote detail (line_items + product_configurations kept together). */
  quoteDetail: {
    keepTopLevel: ["quote"] as const,
    keepQuoteKeys: ["line_items", "product_configurations"] as const,
    title: "CanonicalExtractionV1__QuoteDetail",
  },
  /** Two-pass PASS A — Classification + Entities + Quote Core + Meta. */
  twoPassA: {
    keepTopLevel: ["classification", "entities", "quote", "extraction_meta"] as const,
    keepQuoteKeys: [
      "metadata",
      "pricing",
      "payment",
      "opening_count",
      "line_items_aggregate_only",
      "scope",
      "warranties",
      "terms",
    ] as const,
    title: "CanonicalExtractionV1__TwoPass_A",
  },
  /** Two-pass PASS B — Quote detail (line_items + product_configurations). */
  twoPassB: {
    keepTopLevel: ["quote"] as const,
    keepQuoteKeys: ["line_items", "product_configurations"] as const,
    title: "CanonicalExtractionV1__TwoPass_B",
  },
} as const;

export type PartitionName = keyof typeof PARTITION_SPECS;

export function buildProjection(name: PartitionName): ProjectionResult {
  const spec = PARTITION_SPECS[name] as RootProjectionOptions;
  return projectSchema(spec);
}
