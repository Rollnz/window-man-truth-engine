// Sprint 07B.2 — Corpus intake, annotation lock and dry-run artifact tests.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { CORPUS_V1_PRE_INVENTORY } from "./inventory.ts";
import {
  buildIntakeChecklist,
  renderIntakeMarkdown,
  TARGET_CORPUS,
  ACCEPTED_MIME_TYPES,
  DEIDENTIFICATION_CHECKLIST,
} from "./intake-checklist.ts";
import {
  annotationVersionIsValid,
  checkAuthoritativeAnnotation,
  createBlankAnnotationTemplate,
  requiresNewAnnotationVersion,
} from "./annotation-lock.ts";
import { buildDryRunArtifacts, DRY_RUN_LABEL } from "../execution/dry-run-artifacts.ts";
import { runOfflineBenchmarkDryRun } from "../execution/dry-run.ts";
import type { GroundTruthDocument } from "../benchmark-types.ts";

Deno.test("intake checklist quantifies the real gap to gq-v1", () => {
  const c = buildIntakeChecklist(CORPUS_V1_PRE_INVENTORY);
  assertEquals(c.current.total, 2);
  assertEquals(c.current.deidentified_real, 0);
  assertEquals(
    c.required_additional.total_min,
    TARGET_CORPUS.total_min - 2,
  );
  assert(c.missing_archetypes.length >= 10);
  assertEquals(c.accepted_mime_types.length, ACCEPTED_MIME_TYPES.length);
  assert(c.deidentification_checklist.length === DEIDENTIFICATION_CHECKLIST.length);
  assert(c.intake_steps.length >= 10);
  assert(c.blockers.length > 0);
});

Deno.test("intake markdown renders deterministically", () => {
  const c = buildIntakeChecklist(CORPUS_V1_PRE_INVENTORY);
  const a = renderIntakeMarkdown(c);
  const b = renderIntakeMarkdown(buildIntakeChecklist(CORPUS_V1_PRE_INVENTORY));
  assertEquals(a, b);
  assert(a.includes("Missing archetypes"));
});

function gt(overrides: Partial<GroundTruthDocument["meta"]> = {}): GroundTruthDocument {
  return {
    document_id: "GQ-100",
    document_sha256: "a".repeat(64),
    dataset_split: "holdout",
    meta: {
      annotated_by: "human:reviewer-a",
      reviewed_by: "human:reviewer-b",
      annotation_version: "1.0.0",
      review_status: "agreed",
      adjudication_status: "not_required",
      locked: true,
      ...overrides,
    },
    facts: [],
  };
}

Deno.test("unlocked annotation is not authoritative", () => {
  const r = checkAuthoritativeAnnotation(gt({ locked: false }));
  assertEquals(r.authoritative, false);
  assert(r.blockers.includes("ANNOTATION_NOT_LOCKED"));
});

Deno.test("secondary review and adjudication gates block authority", () => {
  assert(
    checkAuthoritativeAnnotation(gt({ review_status: "unreviewed" })).blockers.includes(
      "SECONDARY_REVIEW_INCOMPLETE",
    ),
  );
  assert(
    checkAuthoritativeAnnotation(
      gt({ review_status: "disagreed", adjudication_status: "pending" }),
    ).blockers.includes("ADJUDICATION_PENDING"),
  );
});

Deno.test("AI-prepared real-document annotation cannot self-approve", () => {
  const r = checkAuthoritativeAnnotation(
    gt({ annotated_by: "ai:lovable", reviewed_by: "ai:lovable" }),
  );
  assertEquals(r.authoritative, false);
  assert(r.blockers.includes("AI_SELF_APPROVAL_FORBIDDEN"));
});

Deno.test("fully locked human-reviewed annotation is authoritative", () => {
  assertEquals(checkAuthoritativeAnnotation(gt()).authoritative, true);
});

Deno.test("PII-pending manifest blocks authoritative scoring", () => {
  const r = checkAuthoritativeAnnotation(gt(), {
    document_id: "GQ-100",
    corpus_version: "gq-v1",
    source_type: "deidentified_real",
    archetypes: ["CLEAN_SIMPLE_ESTIMATE"],
    sha256: "a".repeat(64),
    asset: {
      logical_asset_reference: "external://GQ-100",
      mime_type: "application/pdf",
      page_count: 2,
    },
    dataset_split: "holdout",
    annotation_version: "1.0.0",
    annotation_status: "annotated",
    review_status: "agreed",
    adjudication_status: "not_required",
    locked: true,
    pii_review_status: "deidentified_pending_review",
    known_prompt_exposure: "none",
  } as never);
  assert(r.blockers.includes("PII_REVIEW_PENDING"));
});

Deno.test("annotation edits require a new annotation_version", () => {
  const before = gt();
  before.facts = [
    {
      fact_id: "F1",
      semantic_field: "quote.total",
      expected_status: "present",
      value: 100,
      evidence: [],
      certainty: "certain",
      severity: "critical",
    },
  ];
  const after = structuredClone(before);
  after.facts[0].value = 200;
  assertEquals(requiresNewAnnotationVersion(before, after), true);
  assertEquals(annotationVersionIsValid(before, after), false);
  after.meta.annotation_version = "1.1.0";
  assertEquals(annotationVersionIsValid(before, after), true);
});

Deno.test("blank annotation template is explicitly non-authoritative", () => {
  const t = createBlankAnnotationTemplate("GQ-101", "b".repeat(64), "development");
  assertEquals(t.meta.locked, false);
  assertEquals(checkAuthoritativeAnnotation(t).authoritative, false);
  assert(t.facts.length > 15);
});

Deno.test("offline dry run produces artifacts labeled non-authoritative with 0 provider calls", () => {
  const res = runOfflineBenchmarkDryRun({
    inventory: CORPUS_V1_PRE_INVENTORY,
    systems: ["vnext", "brain3"],
    mockOutputs: [
      {
        system_id: "vnext",
        document_id: "GQ-001",
        normalized: { facts: [], line_items: [], product_configurations: [] },
        latency_ms: 1200,
        facts_considered: 10,
        facts_correct: 9,
      },
      {
        system_id: "brain3",
        document_id: "GQ-001",
        normalized: { facts: [], line_items: [], product_configurations: [] },
        latency_ms: 900,
        facts_considered: 10,
        facts_correct: 6,
        human_review_required: 1,
      },
    ],
    shared_capability_scope: ["quote.total"],
    expanded_capability_scope: { vnext: ["line_items"] },
  });
  assertEquals(res.provider_calls, 0);
  const artifacts = buildDryRunArtifacts(res.report, {
    corpus_version: CORPUS_V1_PRE_INVENTORY.corpus_version,
    provider_calls: res.provider_calls,
  });
  for (const a of Object.values(artifacts)) {
    assertEquals(a.label, DRY_RUN_LABEL);
    assertEquals(a.authoritative, false);
    assertEquals(a.provider_calls, 0);
  }
  assertEquals(artifacts["SYSTEM_SCORECARDS.json"].data.length, 2);
  assertEquals(artifacts["HUMAN_REVIEW_QUEUE.json"].data.length, 1);
});
