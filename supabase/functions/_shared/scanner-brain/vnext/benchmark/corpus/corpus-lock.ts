// Sprint 07B — Deterministic corpus lock snapshot.
// Produces a stable hash for a frozen benchmark input set.
import type { CorpusInventory, GoldenDocumentManifest } from "./manifest-types.ts";

// Deterministic JSON: sorted keys, no whitespace.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") +
    "}"
  );
}

// SHA-256 via Web Crypto if available; falls back to a deterministic non-crypto
// digest for pure-JS test environments. Both are deterministic for equal inputs,
// which is what the lock invariant requires.
async function sha256Hex(input: string): Promise<string> {
  const g = globalThis as unknown as { crypto?: { subtle?: SubtleCrypto } };
  if (g.crypto?.subtle) {
    const buf = new TextEncoder().encode(input);
    const digest = await g.crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Deterministic fallback (FNV-1a 64-bit expanded to 64 hex chars).
  let h1 = 0xcbf29ce4n;
  let h2 = 0x84222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < input.length; i++) {
    const c = BigInt(input.charCodeAt(i));
    h1 = BigInt.asUintN(64, (h1 ^ c) * prime);
    h2 = BigInt.asUintN(64, (h2 ^ (c + 131n)) * prime);
  }
  const hex = (n: bigint) => n.toString(16).padStart(16, "0");
  return (hex(h1) + hex(h2) + hex(h1 ^ h2) + hex(h2 ^ 0xdeadbeefn)).slice(0, 64);
}

export interface CorpusLockFile {
  corpus_version: string;
  generated_at: string;
  document_count: number;
  documents: Array<{
    document_id: string;
    sha256: string;
    dataset_split: string;
    annotation_version: string;
    locked: boolean;
    pii_review_status: string;
    known_prompt_exposure: string;
    archetypes: string[];
  }>;
  corpus_identity_hash: string;
  capability_matrix_version?: string;
  threshold_config_version?: string;
}

function projectForHash(m: GoldenDocumentManifest) {
  return {
    document_id: m.document_id,
    sha256: m.sha256,
    dataset_split: m.dataset_split,
    annotation_version: m.annotation_version,
    locked: m.locked,
    pii_review_status: m.pii_review_status,
    known_prompt_exposure: m.known_prompt_exposure,
    archetypes: [...m.archetypes].sort(),
  };
}

export async function buildCorpusLock(
  inv: CorpusInventory,
  opts: {
    generated_at?: string;
    capability_matrix_version?: string;
    threshold_config_version?: string;
  } = {},
): Promise<CorpusLockFile> {
  const sorted = [...(inv.documents ?? [])].sort((a, b) =>
    a.document_id.localeCompare(b.document_id),
  );
  const projections = sorted.map(projectForHash);
  const hashInput = stableStringify({
    corpus_version: inv.corpus_version,
    documents: projections,
    capability_matrix_version: opts.capability_matrix_version ?? null,
    threshold_config_version: opts.threshold_config_version ?? null,
  });
  const corpus_identity_hash = await sha256Hex(hashInput);
  return {
    corpus_version: inv.corpus_version,
    generated_at: opts.generated_at ?? "1970-01-01T00:00:00.000Z",
    document_count: sorted.length,
    documents: projections,
    corpus_identity_hash,
    capability_matrix_version: opts.capability_matrix_version,
    threshold_config_version: opts.threshold_config_version,
  };
}
