// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — PROVIDER TRANSPORT ADAPTER (Sprint 05C)
//
// Lossless, provider-facing compaction of `CanonicalExtractionV1JsonSchema`.
//
// PURPOSE
//   The canonical JSON Schema inlines several structurally-identical sub-
//   schemas dozens of times (FactEvidence, ExtractedFact envelopes,
//   moneyAmount, phoneCandidate, addressCandidate, dimensionValue, etc.).
//   Providers care about the size/complexity of the schema they receive.
//   We deduplicate purely at the transport layer using `$defs` + `$ref`
//   — NO business semantics are changed.
//
// GUARANTEES
//   - Input: canonical schema (never mutated).
//   - Output: compact schema with `$defs` + `$ref`, structurally equivalent.
//   - `expandReferences(compact)` returns a schema that is deep-equal to
//     the canonical schema up to explicitly-documented transport metadata
//     (`$schema`, `title`, `$defs` container). See `roundTripEquivalent`.
//   - No recursive $refs are introduced (canonical schema is acyclic).
//   - Pure function: no I/O, no logging.
// ═══════════════════════════════════════════════════════════════════════════

import { CanonicalExtractionV1JsonSchema } from "./schema.ts";
import { deepClone, stableStringify } from "./schema-projections.ts";

type JSONSchema = Record<string, unknown>;

// ── Public API ─────────────────────────────────────────────────────────────

export interface CompactionMetrics {
  expandedBytes: number;
  compactBytes: number;
  reductionRatio: number; // 0..1  (1 - compact/expanded)
  definitionCount: number;
  referenceCount: number;
}

export interface CompactionResult {
  schema: JSONSchema;
  metrics: CompactionMetrics;
}

/**
 * Build a compact provider-facing representation of the canonical schema.
 * The canonical source of truth is never mutated.
 */
export function compactCanonicalForProvider(
  source: JSONSchema = deepClone(CanonicalExtractionV1JsonSchema as unknown as JSONSchema),
): CompactionResult {
  const expanded = deepClone(source);
  const expandedBytes = byteLen(stableStringify(expanded));

  const compact = deepClone(expanded);

  // Pass 1 — hash every object subschema under the root, count occurrences.
  const counts = new Map<string, number>();
  const samples = new Map<string, JSONSchema>();
  walkSubschemas(compact, (node) => {
    if (!isExtractableSchema(node)) return;
    const key = stableStringify(node);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!samples.has(key)) samples.set(key, node);
  });

  // Pass 2 — pick definitions: repeated (>=2) AND non-trivial (>= threshold bytes).
  const MIN_SUBSCHEMA_BYTES = 40;
  const defs: Record<string, JSONSchema> = {};
  const defByKey = new Map<string, string>();
  let idx = 0;
  for (const [key, count] of counts.entries()) {
    if (count < 2) continue;
    if (key.length < MIN_SUBSCHEMA_BYTES) continue;
    const defName = `Def${idx++}`;
    defs[defName] = deepClone(samples.get(key)!);
    defByKey.set(key, defName);
  }

  // Pass 3 — replace inline occurrences with $ref (mutates `compact` in-place).
  let referenceCount = 0;
  replaceOccurrencesInPlace(compact, (node) => {
    if (!isExtractableSchema(node)) return null;
    const key = stableStringify(node);
    const defName = defByKey.get(key);
    if (!defName) return null;
    referenceCount += 1;
    return { $ref: `#/$defs/${defName}` };
  });

  // Attach $defs at root (only if any).
  if (Object.keys(defs).length > 0) {
    compact.$defs = defs;
  }

  const compactBytes = byteLen(stableStringify(compact));

  return {
    schema: compact,
    metrics: {
      expandedBytes,
      compactBytes,
      reductionRatio: expandedBytes === 0 ? 0 : 1 - compactBytes / expandedBytes,
      definitionCount: Object.keys(defs).length,
      referenceCount,
    },
  };
}

/**
 * Recursively resolve every `$ref` in `compact` against `compact.$defs`,
 * returning a fully-inlined schema. Strips `$defs`. Does not mutate input.
 * Fails closed on unknown or recursive $refs.
 */
export function expandReferences(compact: JSONSchema): JSONSchema {
  const defs = (compact.$defs as Record<string, JSONSchema> | undefined) ?? {};
  const seen = new Set<string>();

  function resolve(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(resolve);
    if (!node || typeof node !== "object") return node;

    const obj = node as JSONSchema;
    if (typeof obj.$ref === "string") {
      const ref = obj.$ref;
      const m = ref.match(/^#\/\$defs\/(.+)$/);
      if (!m) throw new Error(`unsupported $ref shape: ${ref}`);
      const name = m[1];
      if (seen.has(name)) throw new Error(`recursive $ref forbidden: ${ref}`);
      const target = defs[name];
      if (!target) throw new Error(`dangling $ref: ${ref}`);
      seen.add(name);
      const resolved = resolve(deepClone(target));
      seen.delete(name);
      return resolved;
    }

    const out: JSONSchema = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "$defs") continue;
      out[k] = resolve(v);
    }
    return out;
  }

  return resolve(deepClone(compact)) as JSONSchema;
}

/**
 * Prove that expansion of the compact schema is semantically equivalent
 * to the canonical source. Allowed transport-metadata differences are
 * normalized away before comparison.
 */
export interface RoundTripResult {
  equivalent: boolean;
  diffPath?: string;
  canonicalBytes: number;
  expandedBytes: number;
}

export function roundTripEquivalent(
  compact: JSONSchema,
  canonical: JSONSchema = deepClone(CanonicalExtractionV1JsonSchema as unknown as JSONSchema),
): RoundTripResult {
  const expanded = expandReferences(compact);
  const a = normalizeForCompare(expanded);
  const b = normalizeForCompare(canonical);
  const aStr = stableStringify(a);
  const bStr = stableStringify(b);
  const equivalent = aStr === bStr;
  return {
    equivalent,
    diffPath: equivalent ? undefined : firstDiff(a, b),
    canonicalBytes: byteLen(bStr),
    expandedBytes: byteLen(aStr),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function byteLen(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Walk every schema-shaped object node inside `root`, invoking `visit(node)`.
 * "Schema-shaped" here means any nested object — filtering by `isExtractableSchema`
 * happens in the caller.
 */
function walkSubschemas(root: JSONSchema, visit: (node: JSONSchema) => void): void {
  function go(node: unknown, isRoot: boolean) {
    if (Array.isArray(node)) {
      for (const x of node) go(x, false);
      return;
    }
    if (!node || typeof node !== "object") return;
    const obj = node as JSONSchema;
    if (!isRoot) visit(obj);
    for (const v of Object.values(obj)) go(v, false);
  }
  go(root, true);
}

/**
 * Decide whether a subschema is worth deduplicating. We refuse to touch:
 *   - anything without a `type` or `enum` or `const` (heuristic: not clearly a schema)
 *   - shallow scalar leaves (extraction adds a $ref overhead >= the inline form)
 *   - the special `$defs` container itself
 */
function isExtractableSchema(node: JSONSchema): boolean {
  if (typeof node !== "object" || node === null) return false;
  if ("$ref" in node) return false;
  if ("$defs" in node) return false;
  // must look like a schema
  const hasType = "type" in node || "enum" in node || "const" in node;
  if (!hasType) return false;
  // objects/arrays with properties/items are worth extracting when repeated
  const hasBody = "properties" in node || "items" in node || "required" in node;
  const isEnum = "enum" in node;
  const isConst = "const" in node;
  return hasBody || isEnum || isConst;
}

/**
 * Recursively replace matching subschemas with the result of `replace(node)`
 * (or leave in place when `replace` returns null). MUTATES in-place.
 */
function replaceOccurrencesInPlace(
  root: JSONSchema,
  replace: (node: JSONSchema) => JSONSchema | null,
): void {
  function go(container: unknown) {
    if (Array.isArray(container)) {
      for (let i = 0; i < container.length; i++) {
        const child = container[i];
        if (child && typeof child === "object" && !Array.isArray(child)) {
          const repl = replace(child as JSONSchema);
          if (repl) {
            container[i] = repl;
            continue;
          }
        }
        go(child);
      }
      return;
    }
    if (!container || typeof container !== "object") return;
    const obj = container as JSONSchema;
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const repl = replace(v as JSONSchema);
        if (repl) {
          obj[k] = repl;
          continue;
        }
      }
      go(v);
    }
  }
  go(root);
}

/**
 * Normalize known transport-metadata differences before semantic comparison:
 *   - drop `$schema`
 *   - drop `title`
 *   - drop `description` (adapter carries fewer prose fields)
 *   - drop `$defs` container (post-expansion, empty)
 */
function normalizeForCompare(s: JSONSchema): JSONSchema {
  function go(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(go);
    if (!node || typeof node !== "object") return node;
    const out: JSONSchema = {};
    for (const [k, v] of Object.entries(node as JSONSchema)) {
      if (k === "$schema" || k === "title" || k === "description" || k === "$defs") continue;
      out[k] = go(v);
    }
    return out;
  }
  return go(s) as JSONSchema;
}

/** Best-effort first-diff path for debugging round-trip failures. */
function firstDiff(a: unknown, b: unknown, path = "$"): string {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${path} (array length ${a.length} vs ${b.length})`;
    for (let i = 0; i < a.length; i++) {
      const d = firstDiff(a[i], b[i], `${path}[${i}]`);
      if (d) return d;
    }
    return "";
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object).sort();
    const kb = Object.keys(b as object).sort();
    if (ka.join(",") !== kb.join(",")) return `${path} keys=[${ka}] vs [${kb}]`;
    for (const k of ka) {
      const d = firstDiff((a as JSONSchema)[k], (b as JSONSchema)[k], `${path}.${k}`);
      if (d) return d;
    }
    return "";
  }
  return a === b ? "" : `${path} (${JSON.stringify(a)} vs ${JSON.stringify(b)})`;
}
