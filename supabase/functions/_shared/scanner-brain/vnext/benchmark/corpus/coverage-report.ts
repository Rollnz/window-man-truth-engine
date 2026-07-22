// Sprint 07B — Corpus coverage report (JSON authoritative, Markdown presentation).
import {
  CORPUS_ARCHETYPES,
  type CorpusArchetype,
  type CorpusInventory,
  type GoldenDocumentManifest,
} from "./manifest-types.ts";

// Archetypes required for Corpus v1 credibility (Phase 31).
export const REQUIRED_ARCHETYPES: readonly CorpusArchetype[] = [
  "CLEAN_SIMPLE_ESTIMATE",
  "DETAILED_MULTI_PAGE",
  "MULTI_PRODUCT",
  "ENTITY_AMBIGUITY",
  "SPARSE_ESTIMATE",
  "FINANCING_HEAVY",
  "SIGNED_CONTRACT",
  "POOR_QUALITY_SCAN",
  "AGGREGATE_ONLY",
  "CONFLICTING_REVISIONS",
  "NON_QUOTE",
  "TABLE_HEAVY",
];

export interface CoverageReport {
  corpus_version: string;
  totals: {
    documents: number;
    development: number;
    holdout: number;
    synthetic: number;
    deidentified_real: number;
    pii_verified: number;
    pii_pending: number;
    locked: number;
    pending_review: number;
  };
  archetype_coverage: Record<
    string,
    { covered_by: string[]; count: number; status: "COVERED" | "MISSING" }
  >;
  missing_required_archetypes: string[];
  mime_distribution: Record<string, number>;
  page_count_distribution: {
    p1_2: number;
    p3_7: number;
    p8_14: number;
    p15_plus: number;
  };
  synthetic_vs_real: { synthetic: number; deidentified_real: number };
  ready_for_authoritative_execution: boolean;
  readiness_blockers: string[];
}

export function buildCoverageReport(inv: CorpusInventory): CoverageReport {
  const docs = inv.documents ?? [];
  const totals = {
    documents: docs.length,
    development: 0,
    holdout: 0,
    synthetic: 0,
    deidentified_real: 0,
    pii_verified: 0,
    pii_pending: 0,
    locked: 0,
    pending_review: 0,
  };
  const archetypeMap: Record<string, string[]> = {};
  for (const a of CORPUS_ARCHETYPES) archetypeMap[a] = [];
  const mime: Record<string, number> = {};
  const pages = { p1_2: 0, p3_7: 0, p8_14: 0, p15_plus: 0 };

  for (const d of docs) {
    if (d.dataset_split === "development") totals.development++;
    if (d.dataset_split === "holdout") totals.holdout++;
    if (d.source_type === "synthetic") totals.synthetic++;
    if (d.source_type === "deidentified_real") totals.deidentified_real++;
    if (d.pii_review_status === "deidentified_verified" || d.pii_review_status === "synthetic") {
      totals.pii_verified++;
    }
    if (d.pii_review_status === "deidentified_pending_review") totals.pii_pending++;
    if (d.locked) totals.locked++;
    else totals.pending_review++;
    for (const a of d.archetypes ?? []) {
      if (archetypeMap[a]) archetypeMap[a].push(d.document_id);
    }
    const mt = d.asset?.mime_type ?? "unknown";
    mime[mt] = (mime[mt] ?? 0) + 1;
    const pc = d.asset?.page_count ?? 0;
    if (pc <= 2) pages.p1_2++;
    else if (pc <= 7) pages.p3_7++;
    else if (pc <= 14) pages.p8_14++;
    else pages.p15_plus++;
  }

  const archetype_coverage: CoverageReport["archetype_coverage"] = {};
  for (const a of CORPUS_ARCHETYPES) {
    const ids = archetypeMap[a];
    archetype_coverage[a] = {
      covered_by: ids,
      count: ids.length,
      status: ids.length > 0 ? "COVERED" : "MISSING",
    };
  }
  const missing_required_archetypes = REQUIRED_ARCHETYPES.filter(
    (a) => archetypeMap[a].length === 0,
  );

  const blockers: string[] = [];
  if (totals.deidentified_real === 0) {
    blockers.push("NO_DEIDENTIFIED_REAL_DOCUMENTS");
  }
  if (totals.documents < 13) blockers.push("CORPUS_BELOW_MINIMUM_13");
  if (totals.holdout < 5) blockers.push("HOLDOUT_BELOW_MINIMUM_5");
  if (missing_required_archetypes.length > 0) {
    blockers.push("REQUIRED_ARCHETYPES_MISSING");
  }
  if (totals.pii_pending > 0) blockers.push("PII_REVIEW_PENDING");

  return {
    corpus_version: inv.corpus_version,
    totals,
    archetype_coverage,
    missing_required_archetypes: missing_required_archetypes as string[],
    mime_distribution: mime,
    page_count_distribution: pages,
    synthetic_vs_real: {
      synthetic: totals.synthetic,
      deidentified_real: totals.deidentified_real,
    },
    ready_for_authoritative_execution: blockers.length === 0,
    readiness_blockers: blockers,
  };
}

export function renderCoverageMarkdown(r: CoverageReport): string {
  const lines: string[] = [];
  lines.push(`# Golden Corpus Coverage — ${r.corpus_version}`);
  lines.push("");
  lines.push(`- Documents: **${r.totals.documents}** (dev ${r.totals.development} / holdout ${r.totals.holdout})`);
  lines.push(`- Synthetic: ${r.totals.synthetic} · De-identified real: ${r.totals.deidentified_real}`);
  lines.push(`- PII verified: ${r.totals.pii_verified} · PII pending: ${r.totals.pii_pending}`);
  lines.push(`- Locked: ${r.totals.locked} · Pending review: ${r.totals.pending_review}`);
  lines.push("");
  lines.push(`## Archetype coverage`);
  for (const [a, v] of Object.entries(r.archetype_coverage)) {
    lines.push(`- \`${a}\`: ${v.status} (${v.count})`);
  }
  lines.push("");
  lines.push(`## Missing required archetypes`);
  if (r.missing_required_archetypes.length === 0) lines.push("- None");
  else for (const a of r.missing_required_archetypes) lines.push(`- \`${a}\``);
  lines.push("");
  lines.push(`## Readiness`);
  lines.push(`- Ready for authoritative execution: **${r.ready_for_authoritative_execution}**`);
  if (r.readiness_blockers.length > 0) {
    lines.push(`- Blockers:`);
    for (const b of r.readiness_blockers) lines.push(`  - ${b}`);
  }
  return lines.join("\n") + "\n";
}

// Aggregate helper for tests: separates synthetic vs real result buckets.
export function partitionSyntheticVsReal<T extends { document_id: string }>(
  results: T[],
  inv: CorpusInventory,
): { synthetic: T[]; deidentified_real: T[] } {
  const byId = new Map<string, GoldenDocumentManifest>();
  for (const d of inv.documents) byId.set(d.document_id, d);
  const synthetic: T[] = [];
  const deidentified_real: T[] = [];
  for (const r of results) {
    const d = byId.get(r.document_id);
    if (d?.source_type === "synthetic") synthetic.push(r);
    else if (d?.source_type === "deidentified_real") deidentified_real.push(r);
  }
  return { synthetic, deidentified_real };
}
