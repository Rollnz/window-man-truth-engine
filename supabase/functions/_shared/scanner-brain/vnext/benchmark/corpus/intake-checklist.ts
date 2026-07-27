// Sprint 07B.2 — Corpus intake infrastructure.
// Turns the honest gap between the current corpus and the required corpus into
// a deterministic, machine-readable checklist. Nothing here fabricates
// documents; it only describes what must be supplied by a legitimate source.
import type { CorpusInventory, CorpusArchetype } from "./manifest-types.ts";
import { buildCoverageReport, REQUIRED_ARCHETYPES } from "./coverage-report.ts";

export const CORPUS_INTAKE_VERSION = "corpus-intake-v1.0.0";

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
] as const;

export const TARGET_CORPUS = {
  development_min: 8,
  development_max: 12,
  holdout_min: 5,
  holdout_max: 10,
  total_min: 13,
  total_max: 22,
} as const;

export const DEIDENTIFICATION_CHECKLIST = [
  "homeowner names",
  "phone numbers",
  "email addresses",
  "street addresses",
  "signatures",
  "loan / application identifiers",
  "bank / payment / card data",
  "date of birth",
  "government identifiers",
  "QR codes",
  "barcodes",
  "PDF document metadata",
  "image EXIF metadata",
  "file names containing PII",
  "embedded PDF comments / annotations",
] as const;

export const STRUCTURE_PRESERVATION_RULES = [
  "preserve page structure and layout",
  "preserve tables and column ordering",
  "preserve role relationships (who is contractor vs salesperson vs homeowner)",
  "preserve entity ambiguity where the original was ambiguous",
  "preserve pricing placement and line-item complexity",
  "map each original entity consistently to one synthetic replacement",
] as const;

export interface IntakeStep {
  step: number;
  action: string;
}

export const INTAKE_STEPS: IntakeStep[] = [
  { step: 1, action: "Collect source documents from a legitimate, consented source." },
  { step: 2, action: "Run the PII review checklist; record findings without copying PII into the repo." },
  { step: 3, action: "De-identify using consistent entity substitution while preserving structure." },
  { step: 4, action: "Compute SHA256 of the de-identified binary; store the binary OUTSIDE Git." },
  { step: 5, action: "Create a manifest at corpus/documents/GQ-###.json with a logical asset reference." },
  { step: 6, action: "Assign dataset_split BEFORE any scanner is executed against the document." },
  { step: 7, action: "Author Layer A source-neutral ground truth (primary human annotation)." },
  { step: 8, action: "Independent secondary review of all critical facts; record disagreements." },
  { step: 9, action: "Adjudicate disagreements; set adjudication_status=adjudicated." },
  { step: 10, action: "Set pii_review_status=deidentified_verified and locked=true." },
  { step: 11, action: "Regenerate GOLDEN_CORPUS_LOCK.json and CORPUS_COVERAGE.json/md." },
];

export interface CorpusIntakeChecklist {
  intake_version: string;
  corpus_version: string;
  current: {
    total: number;
    development: number;
    holdout: number;
    synthetic: number;
    deidentified_real: number;
    locked: number;
    pii_verified: number;
  };
  required_additional: {
    total_min: number;
    development_min: number;
    holdout_min: number;
  };
  missing_archetypes: CorpusArchetype[];
  accepted_mime_types: string[];
  deidentification_checklist: string[];
  structure_preservation_rules: string[];
  intake_steps: IntakeStep[];
  blockers: string[];
}

export function buildIntakeChecklist(inv: CorpusInventory): CorpusIntakeChecklist {
  const cov = buildCoverageReport(inv);
  const t = cov.totals;
  const missing = REQUIRED_ARCHETYPES.filter(
    (a) => cov.archetype_coverage[a].count === 0,
  );
  return {
    intake_version: CORPUS_INTAKE_VERSION,
    corpus_version: inv.corpus_version,
    current: {
      total: t.documents,
      development: t.development,
      holdout: t.holdout,
      synthetic: t.synthetic,
      deidentified_real: t.deidentified_real,
      locked: t.locked,
      pii_verified: t.pii_verified,
    },
    required_additional: {
      total_min: Math.max(0, TARGET_CORPUS.total_min - t.documents),
      development_min: Math.max(0, TARGET_CORPUS.development_min - t.development),
      holdout_min: Math.max(0, TARGET_CORPUS.holdout_min - t.holdout),
    },
    missing_archetypes: [...missing],
    accepted_mime_types: [...ACCEPTED_MIME_TYPES],
    deidentification_checklist: [...DEIDENTIFICATION_CHECKLIST],
    structure_preservation_rules: [...STRUCTURE_PRESERVATION_RULES],
    intake_steps: INTAKE_STEPS,
    blockers: cov.readiness_blockers,
  };
}

export function renderIntakeMarkdown(c: CorpusIntakeChecklist): string {
  const l: string[] = [];
  l.push(`# Golden Corpus Intake Checklist — ${c.corpus_version}`);
  l.push("");
  l.push(`Intake infrastructure version: \`${c.intake_version}\``);
  l.push("");
  l.push("## Current inventory");
  l.push(`- Total: **${c.current.total}** (dev ${c.current.development} / holdout ${c.current.holdout})`);
  l.push(`- Synthetic: ${c.current.synthetic} · De-identified real: ${c.current.deidentified_real}`);
  l.push(`- Locked: ${c.current.locked} · PII verified: ${c.current.pii_verified}`);
  l.push("");
  l.push("## Additional documents required");
  l.push(`- Total: **+${c.required_additional.total_min}**`);
  l.push(`- Development: +${c.required_additional.development_min}`);
  l.push(`- Holdout: +${c.required_additional.holdout_min}`);
  l.push("");
  l.push("## Missing archetypes");
  if (c.missing_archetypes.length === 0) l.push("- None");
  else for (const a of c.missing_archetypes) l.push(`- \`${a}\``);
  l.push("");
  l.push("## Accepted file types");
  for (const m of c.accepted_mime_types) l.push(`- \`${m}\``);
  l.push("");
  l.push("## De-identification checklist (per document)");
  for (const d of c.deidentification_checklist) l.push(`- [ ] ${d}`);
  l.push("");
  l.push("## Structure preservation");
  for (const s of c.structure_preservation_rules) l.push(`- ${s}`);
  l.push("");
  l.push("## Intake steps");
  for (const s of c.intake_steps) l.push(`${s.step}. ${s.action}`);
  l.push("");
  l.push("## Blockers");
  if (c.blockers.length === 0) l.push("- None");
  else for (const b of c.blockers) l.push(`- ${b}`);
  return l.join("\n") + "\n";
}
