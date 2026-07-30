// Sprint 07B.3 — Local-only corpus intake pipeline.
//
// Zero ambient side effects: every write goes through an injected StagingIO.
// Fail-closed: nothing may be staged or promoted while PII remains.
import {
  createSubstitutionRegistry,
  numericFingerprint,
  PII_SCANNER_VERSION,
  scanText,
  type PiiFinding,
  type SubstitutionRegistry,
} from "./pii-scanner.ts";
import { validateDocumentManifest } from "./manifest-validator.ts";
import type { GoldenDocumentManifest } from "./manifest-types.ts";

export const INTAKE_PIPELINE_VERSION = "corpus-intake-pipeline-v1.0.0";

export const STAGING_DIR = "staging";
export const STAGING_MANIFEST_DIR = "staging/manifests";

export interface DocumentPayload {
  /** Caller-local identifier. MUST NOT contain PII. */
  id: string;
  mime_type: string;
  page_count: number;
  /** Extracted text layer of the document. */
  raw_text: string;
  /** Optional parsed field structure. String leaves are scrubbed too. */
  structured?: Record<string, unknown>;
  /** Document metadata (author/producer/EXIF). Always dropped before staging. */
  metadata?: Record<string, unknown>;
}

export type ScreeningStatus = "clean" | "requires_scrub" | "blocked";

export class PiiPromotionBlockedError extends Error {
  readonly code = "PII_PROMOTION_BLOCKED";
  constructor(readonly reasons: string[]) {
    super(`PII_PROMOTION_BLOCKED: ${reasons.join(", ")}`);
    this.name = "PiiPromotionBlockedError";
  }
}

export class UnscrubbedAssetError extends Error {
  readonly code = "UNSCRUBBED_ASSET";
  constructor(readonly reasons: string[]) {
    super(`UNSCRUBBED_ASSET: ${reasons.join(", ")}`);
    this.name = "UnscrubbedAssetError";
  }
}

export class StructurePreservationError extends Error {
  readonly code = "STRUCTURE_NOT_PRESERVED";
  constructor(readonly reasons: string[]) {
    super(`STRUCTURE_NOT_PRESERVED: ${reasons.join(", ")}`);
    this.name = "StructurePreservationError";
  }
}

export interface StagingIO {
  mkdir(path: string): Promise<void>;
  writeTextFile(path: string, contents: string): Promise<void>;
}

export interface ScreeningReport {
  document_id: string;
  scanner_version: string;
  pipeline_version: string;
  status: ScreeningStatus;
  findings: PiiFinding[];
  structured_findings: PiiFinding[];
  substitutions: Record<string, string>;
}

// ── helpers ──────────────────────────────────────────────────────────────

function scrubStringLeaves(
  value: unknown,
  registry: SubstitutionRegistry,
  findings: PiiFinding[],
): unknown {
  if (typeof value === "string") {
    const r = scanText(value, registry);
    findings.push(...r.findings);
    return r.scrubbed_text;
  }
  if (Array.isArray(value)) {
    return value.map((v) => scrubStringLeaves(v, registry, findings));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = scrubStringLeaves(v, registry, findings);
    }
    return out;
  }
  return value;
}

/** Numbers that survive scrubbing: original numbers outside PII spans. */
function survivingNumbers(text: string, findings: PiiFinding[]): string[] {
  let masked = text;
  const spans = [...findings].sort((a, b) => b.match_span.start - a.match_span.start);
  for (const f of spans) {
    masked = masked.slice(0, f.match_span.start) + " " + masked.slice(f.match_span.end);
  }
  return masked.match(/\d+(?:\.\d+)?/g) ?? [];
}

function columnProfile(text: string): number[] {
  return text.split("\n").map((line) => line.split(/\t|\s{2,}/).length);
}

// ── public API ───────────────────────────────────────────────────────────

/** Non-mutating screening pass. */
export function screenDocument(payload: DocumentPayload): {
  status: ScreeningStatus;
  report: ScreeningReport;
} {
  const registry = createSubstitutionRegistry();
  const textScan = scanText(payload.raw_text ?? "", registry);
  const structuredFindings: PiiFinding[] = [];
  if (payload.structured) {
    scrubStringLeaves(payload.structured, registry, structuredFindings);
  }
  const all = [...textScan.findings, ...structuredFindings];
  const criticalInStructured = structuredFindings.some(
    (f) => f.severity === "critical",
  );
  const status: ScreeningStatus = criticalInStructured
    ? "blocked"
    : all.length > 0
    ? "requires_scrub"
    : "clean";

  return {
    status,
    report: {
      document_id: payload.id,
      scanner_version: PII_SCANNER_VERSION,
      pipeline_version: INTAKE_PIPELINE_VERSION,
      status,
      findings: textScan.findings,
      structured_findings: structuredFindings,
      substitutions: { ...registry.tokens },
    },
  };
}

/**
 * Produce a scrubbed copy. Metadata is dropped entirely. Structure invariants
 * (line count, surviving numbers, column profile) must hold or we throw.
 */
export function scrubDocument(payload: DocumentPayload): {
  payload: DocumentPayload;
  report: ScreeningReport;
} {
  const registry = createSubstitutionRegistry();
  const textScan = scanText(payload.raw_text ?? "", registry);
  const structuredFindings: PiiFinding[] = [];
  const structured = payload.structured
    ? (scrubStringLeaves(payload.structured, registry, structuredFindings) as Record<
      string,
      unknown
    >)
    : undefined;

  const original = payload.raw_text ?? "";
  const scrubbed = textScan.scrubbed_text;

  const problems: string[] = [];
  if (original.split("\n").length !== scrubbed.split("\n").length) {
    problems.push("LINE_COUNT_CHANGED");
  }
  const before = survivingNumbers(original, textScan.findings).join("|");
  const after = numericFingerprint(scrubbed).join("|");
  if (before !== after) problems.push("NUMERIC_FACTS_CHANGED");
  if (columnProfile(original).join(",") !== columnProfile(scrubbed).join(",")) {
    problems.push("COLUMN_PROFILE_CHANGED");
  }
  if (problems.length > 0) throw new StructurePreservationError(problems);

  const out: DocumentPayload = {
    id: payload.id,
    mime_type: payload.mime_type,
    page_count: payload.page_count,
    raw_text: scrubbed,
    ...(structured ? { structured } : {}),
    // metadata intentionally dropped — never staged.
  };

  return {
    payload: out,
    report: {
      document_id: payload.id,
      scanner_version: PII_SCANNER_VERSION,
      pipeline_version: INTAKE_PIPELINE_VERSION,
      status: textScan.findings.length + structuredFindings.length > 0
        ? "requires_scrub"
        : "clean",
      findings: textScan.findings,
      structured_findings: structuredFindings,
      substitutions: { ...registry.tokens },
    },
  };
}

export interface StagedDocument {
  document_id: string;
  fixture_path: string;
  manifest_path: string;
  redactions: number;
  report: ScreeningReport;
}

export interface StageOptions {
  manifest?: GoldenDocumentManifest;
  baseDir?: string;
}

/**
 * Fail-closed staging. Writes NOTHING unless the re-scan of the scrubbed
 * payload is completely clean.
 */
export async function stageDocument(
  payload: DocumentPayload,
  io: StagingIO,
  opts: StageOptions = {},
): Promise<StagedDocument> {
  const pre = screenDocument(payload);
  if (pre.status === "blocked") {
    throw new UnscrubbedAssetError(["CRITICAL_PII_IN_STRUCTURED_FIELDS"]);
  }

  const { payload: scrubbed, report } = scrubDocument(payload);

  // Re-scan the scrubbed artifact: residual PII must be zero.
  const verify = screenDocument(scrubbed);
  const residual = verify.report.findings.length +
    verify.report.structured_findings.length;
  if (residual > 0) throw new UnscrubbedAssetError(["RESIDUAL_PII_AFTER_SCRUB"]);

  const base = opts.baseDir ? `${opts.baseDir}/` : "";
  const fixture_path = `${base}${STAGING_DIR}/${payload.id}.scrubbed.json`;
  const manifest_path = `${base}${STAGING_MANIFEST_DIR}/${payload.id}.json`;

  await io.mkdir(`${base}${STAGING_DIR}`);
  await io.mkdir(`${base}${STAGING_MANIFEST_DIR}`);
  await io.writeTextFile(fixture_path, JSON.stringify(scrubbed, null, 2) + "\n");
  if (opts.manifest) {
    await io.writeTextFile(
      manifest_path,
      JSON.stringify(opts.manifest, null, 2) + "\n",
    );
  }

  return {
    document_id: payload.id,
    fixture_path,
    manifest_path,
    redactions: report.findings.length + report.structured_findings.length,
    report,
  };
}

/** Fail-closed promotion gate into the scored corpus. */
export function assertPromotable(
  manifest: GoldenDocumentManifest,
  findings: PiiFinding[],
): void {
  const reasons: string[] = [];
  if ((findings?.length ?? 0) > 0) reasons.push("RESIDUAL_PII_FINDINGS");
  if (
    manifest?.pii_review_status !== "synthetic" &&
    manifest?.pii_review_status !== "deidentified_verified"
  ) {
    reasons.push("PII_REVIEW_NOT_VERIFIED");
  }
  for (const issue of validateDocumentManifest(manifest)) {
    reasons.push(`MANIFEST_${issue.code}`);
  }
  if (reasons.length > 0) throw new PiiPromotionBlockedError(reasons);
}
