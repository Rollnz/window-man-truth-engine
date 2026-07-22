# Sprint 07A — Golden Quote Benchmark Harness & Ground-Truth Specification (Revised)

## Phase 0 — Preflight Integrity Gate
- Verify repo checkpoint `38637761db8f348c892549ebef448f5fd2ea46aa` and last commit `Fixed CORS import in Orchestrator`.
- Confirm untouched: canonical `types.ts`/`schema.ts`/`validation.ts`/`constants.ts`, `extraction-prompts.ts`, `four-pass-orchestrator.ts`, `canonical-merge.ts`, `quote-scanner/**`, `orchestrate-vnext-extraction/**`, migrations, `src/**`.
- `deno test` on `_shared/scanner-brain/vnext/` → expect 124 passed / 0 failed.
- Grep confirms no vNext wiring into `/scan` or shipping scanner.
- Return `PASS` / `REPAIRED` / `BLOCKED`.

## Isolated Directory
All work under `supabase/functions/_shared/scanner-brain/vnext/benchmark/`:

```
benchmark/
  benchmark-types.ts
  error-taxonomy.ts
  ground-truth.ts
  canonical-expectation.ts
  normalization.ts
  run-manifest.ts
  benchmark-runner.ts
  metrics.ts
  scorer.ts
  benchmark-thresholds.ts
  adapters/
    adapter-contract.ts
    capability-matrix.ts
    vnext-adapter.ts
    brain3-adapter.ts
    wmmvp-adapter.ts
  fixtures/
    synthetic-ground-truth.ts
    mock-system-outputs.ts
  benchmark.test.ts
  GOLDEN_BENCHMARK_SPEC.md
  GOLDEN_ANNOTATION_GUIDE.md
  README.md
```

## Phase 1 — Two-Layer Ground Truth (Fairness Foundation)

### Layer A — Source-Neutral Human Ground Truth (`ground-truth.ts`, `benchmark-types.ts`)
- `GroundTruthFact { fact_id, semantic_field, expected_status: found|not_found|uncertain|not_applicable, value, entity_role?, evidence[], certainty: definite|ambiguous|not_present|not_applicable, severity: critical|major|minor, notes? }`.
- `GroundTruthEvidence { page?, source_text?, location_hint?, annotator_note? }`.
- Annotation QA metadata: `annotated_by, reviewed_by, annotation_version, review_status, adjudication_status, adjudication_notes, locked: boolean`.
- Validator functions; no imports from canonical `types.ts` / `schema.ts`.

### Layer B — Canonical Expectation Projection (`canonical-expectation.ts`)
- Pure deterministic function `projectToCanonicalExpectation(groundTruth) → CanonicalExpectation`.
- Used ONLY for vNext canonical-coverage/contract evaluation, never for cross-system scoring.
- Documented invariant: cross-system scoring MUST consume Layer A only.

## Phase 2 — Error Taxonomy (`error-taxonomy.ts`)
Full machine-readable enum:
- Classification: `CLASSIFICATION_ERROR`.
- Entity: `ENTITY_MISS`, `ENTITY_MISATTRIBUTION`.
- Value: `VALUE_MISS`, `VALUE_WRONG`, `FALSE_NOT_FOUND`, `FALSE_FOUND`, `HALLUCINATION`.
- Evidence (distinct from hallucination): `EVIDENCE_MISSING`, `EVIDENCE_UNSUPPORTED`, `PAGE_REFERENCE_WRONG`.
- Line items: `LINE_ITEM_MISS`, `LINE_ITEM_FABRICATION`, `LINE_ITEM_MATCH_AMBIGUOUS`.
- Products: `PRODUCT_CONFIG_ERROR`, `PRODUCT_ASSOCIATION_ERROR`.
- Cross-cutting: `UNCERTAINTY_MISUSE`, `CROSS_DOMAIN_INCONSISTENCY`, `ANOMALY_NOT_PRESERVED`, `CROSS_REFERENCE_DANGLING`, `CROSS_REFERENCE_INCORRECT`.
- Infra: `TRANSPORT_FAILURE`, `PARSE_FAILURE`, `CANONICAL_VALIDATION_FAILURE`.
- Meta: `UNSUPPORTED_BY_SYSTEM`, `HUMAN_REVIEW_REQUIRED`.
- Severity table maps each code to `critical|major|minor`.

## Phase 3 — Normalization (`normalization.ts`)
Conservative, deterministic equivalence for cross-system comparison:
- Money: numeric value + currency; formatting-agnostic.
- Dates: ISO conversion; ambiguous formats → `HUMAN_REVIEW_REQUIRED`.
- Names: whitespace/case fold, order preservation; near-matches → `HUMAN_REVIEW_REQUIRED`.
- Phones: E.164 where derivable; else raw digits.
- Emails: lowercase, trim.
- Addresses: token-set + ZIP anchor; deliberate under-normalization to avoid conflating distinct addresses.
- Identifiers/NOAs: exact alnum match; hyphenation-insensitive; else `HUMAN_REVIEW_REQUIRED`.
- Dimensions: value + unit normalized to inches when unit specified.
- Manufacturer/series: canonical brand alias table (small, explicit); no fuzzy string similarity.
- Rule: never fuzzy-collapse materially different values; always prefer `HUMAN_REVIEW_REQUIRED` over false equivalence.

## Phase 4 — Deterministic Line-Item Matching (`metrics.ts`)
Explicit signal table (weights frozen and versioned via `scorer_version`):
| Signal | Weight | Rule |
|---|---|---|
| stable_line_id (if present) | 100 | exact match → hard pair |
| opening_location | 25 | normalized equality |
| product_type | 15 | canonical enum equality |
| dimensions (w×h) | 20 | ±0.5" tolerance |
| quantity | 10 | exact |
| unit_price | 15 | ±$1 or 1% |
| manufacturer+series | 10 | canonical alias match |
| description token overlap | 5 | Jaccard ≥ 0.6, non-tiebreaking |

Matching algorithm:
1. Assign hard pairs on stable ids.
2. Greedy optimal assignment on remaining rows by total score.
3. **Ambiguity policy:** if the top candidate for a ground-truth row scores within 15% of the second-best candidate AND both share no distinguishing hard signal (id/location/dims), emit `LINE_ITEM_MATCH_AMBIGUOUS` + `HUMAN_REVIEW_REQUIRED`; do NOT force a pairing.
4. Unmatched ground-truth rows → `LINE_ITEM_MISS`; unmatched scanner rows unsupported by document → `LINE_ITEM_FABRICATION`.

## Phase 5 — Evidence Scoring Policy (deterministic, no LLM judge)
Classifications:
- `EXACT_OR_NORMALIZED_MATCH` — scanner-cited text normalizes to ground-truth evidence text.
- `TEXT_CONTAINMENT_SUPPORTED` — scanner evidence substring contained in ground-truth evidence (or vice versa) above a defined length floor.
- `PAGE_MATCH_SUPPORTED` — page matches ground-truth page, text unresolvable.
- `MISSING` — factual value correct but no evidence supplied (`EVIDENCE_MISSING`, NOT hallucination).
- `UNSUPPORTED` — evidence supplied does not contain the asserted value (`EVIDENCE_UNSUPPORTED`).
- `PAGE_REFERENCE_WRONG` — page cited disagrees with ground-truth page for that fact.
- `HUMAN_REVIEW_REQUIRED` — semantic judgment needed.

Hallucination vs evidence distinction is a first-class invariant enforced in the scorer and tested.

## Phase 6 — Metrics (`metrics.ts`)
Pure functions:
- Classification accuracy + confusion matrix.
- Entity precision/recall/F1 per role; separate `ENTITY_MISATTRIBUTION` counter (weighted more severe than miss).
- Critical commercial accuracy (total, subtotal, discount, tax, deposit, quote number/date/expiration, opening count, financing, milestones).
- Line-item recall/precision + per-attribute accuracy (quantity, dims, price, location, description).
- Product-configuration field accuracy.
- `CROSS_REFERENCE_COHERENCE`: valid links / dangling / incorrect / missing (scored separately from product-field accuracy).
- `NOT_FOUND` fidelity: TRUE_NOT_FOUND, FALSE_NOT_FOUND, FALSE_FOUND.
- Hallucination rate (severity-bucketed) — evidence gaps excluded by construction.
- Evidence support rate (per classification).
- Confidence calibration buckets (0.90–1.00 / 0.80–0.89 / 0.60–0.79 / <0.60) — capture only.
- Uncertainty use: `CORRECT_UNCERTAINTY`, `UNNECESSARY_UNCERTAINTY`, `MISSED_UNCERTAINTY`.
- `ANOMALY_PRESERVATION_RATE`: ground-truth facts flagged `anomaly=true` (e.g., 120% deposit) must appear verbatim; silent normalization → `ANOMALY_NOT_PRESERVED`.
- `FIELD_STABILITY_RATE`: contract + logic accepting a run group of N runs for identical `{document, model, prompt_version, brain_version}` and reporting per-field stability; no live provider calls in 07A.
- Cross-domain diagnostics (opening_count vs line-item qty sum; total vs line-item sum; payment % sum): reported, not gated.
- Latency (p50/p95/max) and token totals from run manifests.

## Phase 7 — Denominator Rules (`scorer.ts`)
Explicit and tested:
- `UNSUPPORTED_BY_SYSTEM` excluded from that system's recall denominator.
- `NOT_APPLICABLE` ground-truth facts excluded from `NOT_FOUND` precision denominator.
- `HUMAN_REVIEW_REQUIRED` reported in a separate bucket; NEVER silently pass/fail.
- `TRANSPORT_FAILURE` / `PARSE_FAILURE` / `CANONICAL_VALIDATION_FAILURE` reported in an infra bucket; excluded from factual accuracy denominators for that run.
- Critical hallucinations override aggregate score in the report — surfaced as a gate failure regardless of index.

## Phase 8 — System Capability Matrix (`adapters/capability-matrix.ts`)
Formal declaration per system with states `SUPPORTED | PARTIALLY_SUPPORTED | UNSUPPORTED | RUNTIME_NOT_AVAILABLE` across capabilities: classification, homeowner/property/contractor/salesperson roles, four-role entity separation, pricing facts, payment schedule, line items, product configurations, cross-references, evidence with page, confidence, found/not_found/uncertain semantics, anomaly preservation.

Scorer builds denominators from the intersection of ground-truth-required facts and the system's declared capability. Reports split into `SHARED_CAPABILITY_COMPARISON` and `EXPANDED_CAPABILITY_COVERAGE`. Invariant enforced by test: `UNSUPPORTED_BY_SYSTEM ≠ MISS ≠ HALLUCINATION`.

## Phase 9 — Adapters (`adapters/`)
- `adapter-contract.ts`: `BenchmarkSystemAdapter { systemId, adapterVersion, capabilities, run(doc, ctx), normalize(raw) }`.
- `vnext-adapter.ts`: wraps `runFourPassOrchestration` via dependency-injected `providerCall`; no live calls in tests.
- `brain3-adapter.ts`: read-only inspection; capability declaration; classified `RUNNER_NOT_YET_SAFE` where headless invocation would cause side effects.
- `wmmvp-adapter.ts`: interface + capability declaration; `REFERENCE_RUNTIME_NOT_AVAILABLE` until donor runtime access is decided.

## Phase 10 — Immutable Run Manifest (`run-manifest.ts`)
`createRunManifest({...})` returns frozen object containing:
`run_id, run_group_id, document_id, document_sha256, dataset_split, annotation_version, system_id, adapter_version, system_version, brain_version?, analysis_schema_version?, prompt_version?, provider, model, benchmark_schema_version, normalizer_version, scorer_version, metric_version, threshold_config_version, timestamp, latency_ms, tokens{prompt, completion, total}, raw_output_reference, normalized_output_reference, status, failure_code?`.

UUID / clock / hash injected via deps for deterministic tests. No mutation API. `run_group_id` enables future stability runs.

## Phase 11 — Threshold Configuration (`benchmark-thresholds.ts`)
Versioned TypeScript object (`THRESHOLD_CONFIG_VERSION = "t-v1"`), frozen:
- `critical_hallucinations_allowed_holdout: 0`
- `canonical_validity_min: 0.99`
- `critical_commercial_accuracy_min: 0.98`
- `entity_role_accuracy_min: 0.98`
- `overall_hallucination_rate_max: 0.02`
- `evidence_support_min: 0.95`
- `not_found_precision_min: 0.95`
- `line_item_recall_min_itemized: 0.90`
- `product_config_accuracy_min: 0.90`

`threshold_config_version` stored on every run manifest and report. Critical gates override aggregate index; test proves a high aggregate cannot mask a critical hallucination.

## Phase 12 — Headless Benchmark Runner (`benchmark-runner.ts`)
Side-effect-free coordinator:
```
runBenchmark({
  documents,             // dev|holdout selection
  systems,               // one or more adapters
  thresholdConfig,       // frozen versioned config
  deps: { now, uuid, hash, providerCall? }
}) → BenchmarkComparisonReport
```
Pipeline: select docs → freeze versions → invoke adapters (concurrent per system, per-document) → capture raw run → normalize → project to canonical expectation (vNext only) → score against Layer A truth → build `DocumentScorecard` and `SystemAggregateScorecard` → assemble `BenchmarkComparisonReport`. Supports `dataset_split` selection. Tests use mock adapters exclusively; no provider calls.

## Phase 13 — Machine-Readable Report Contracts
In `benchmark-types.ts`:
- `BenchmarkRunResult` — per system/document.
- `DocumentScorecard`.
- `SystemAggregateScorecard`.
- `BenchmarkComparisonReport { comparison_id, generated_at, threshold_config_version, systems[], documents[], scorecards[], gate_status, human_review_queue[] }`.
Markdown is presentation only; JSON-compatible objects are the measurement truth. Serialization test round-trips a report.

## Phase 14 — Fixtures (`fixtures/`)
- `synthetic-ground-truth.ts`: 2–3 tiny fully synthetic docs (no PII) covering classification, entities across all four roles, pricing, line items with cross-references, an anomaly case (e.g., 120% deposit), a not_present financing case, an ambiguous line-item pair case.
- `mock-system-outputs.ts`: deterministic canned outputs mimicking each adapter — no live calls.

## Phase 15 — Tests (`benchmark.test.ts`)
Deterministic Deno tests covering (each numbered test explicit):
1. Ground-truth schema valid/invalid.
2. Status semantics (found/not_found/uncertain/not_applicable) distinct.
3. Source-neutral truth module does not import canonical `types.ts`/`schema.ts` (proved by module-graph inspection / no-import assertion).
4. Canonical expectation projection deterministic and lossy-only-by-design.
5. Entity misattribution classified `ENTITY_MISATTRIBUTION`, not generic wrong value.
6. Correct NOT_FOUND, false NOT_FOUND, hallucination each classified correctly.
7. Correct fact without evidence → `EVIDENCE_MISSING`, NOT hallucination.
8. `UNSUPPORTED_BY_SYSTEM` excluded from recall denominator.
9. `NOT_APPLICABLE` excluded from NOT_FOUND denominator.
10. Shared vs expanded capability reporting separated.
11. Money/date normalization equivalence; ambiguous formats → `HUMAN_REVIEW_REQUIRED`.
12. Line-item deterministic matching; ambiguous pair → `LINE_ITEM_MATCH_AMBIGUOUS` + `HUMAN_REVIEW_REQUIRED` (no forced pairing).
13. Product-configuration association scored separately from field accuracy; dangling refs classified.
14. Evidence classifications (`EXACT_OR_NORMALIZED_MATCH`, `TEXT_CONTAINMENT_SUPPORTED`, `PAGE_MATCH_SUPPORTED`, `MISSING`, `UNSUPPORTED`, `PAGE_REFERENCE_WRONG`).
15. Anomaly preservation: 120% deposit preserved = correct; silently normalized = `ANOMALY_NOT_PRESERVED`.
16. Cross-reference coherence: valid/dangling/incorrect/missing counted separately.
17. `FIELD_STABILITY_RATE` computes correctly across a run group (synthetic multi-run fixture).
18. Annotation lock/review status: runs against unlocked ground truth flagged non-authoritative.
19. Threshold config versioning stored in manifest; frozen object rejects mutation.
20. Critical hallucination gate overrides aggregate score.
21. Immutable provenance: runs with different `prompt_version` produce distinct `run_id`s and remain distinguishable.
22. Development/holdout split cannot be silently collapsed.
23. Machine-readable report serialization round-trip.
24. Normalizer/scorer/metric/threshold versions present on every report.
25. Severity weighting for critical errors.
26. Headless runner: mock adapters produce end-to-end comparison report with zero live side effects.
27. Transport/parse/canonical-validation failure excluded from factual accuracy denominators.

Prior 124 vNext tests remain green; total = 124 + new benchmark tests.

## Phase 16 — Documentation

### `GOLDEN_BENCHMARK_SPEC.md`
Objective, systems under test, fairness model (Layer A vs Layer B, shared vs expanded), source-neutral truth, capability matrix, normalization, metrics catalog, error taxonomy, denominator rules, dataset splits, run versioning, threshold configuration, decision gates (`PROCEED_TO_LAYER_4`, `PROMPT_REFINEMENT_REQUIRED`, `CANONICAL_CONTRACT_REVISION_REQUIRED`, `ORCHESTRATOR_RELIABILITY_WORK_REQUIRED`, `EXPAND_BENCHMARK_BEFORE_DECISION`), future execution protocol, page-accuracy scoring protocol.

### `GOLDEN_ANNOTATION_GUIDE.md`
Operational rules sections 1–12 (classification, entity attribution incl. explicit anti-misattribution rules, opening count, pricing, payment schedule, line items, product configurations, scope, warranties/terms, NOT_FOUND, UNCERTAIN, conflicting documents) PLUS QA workflow:
```
PRIMARY ANNOTATION → SECONDARY REVIEW → DISAGREEMENT → ADJUDICATION → LOCKED GOLDEN TRUTH
```
Stronger review required for: holdout docs, critical commercial facts, entity attribution, conflicting/ambiguous documents. Defines LOCKED state; benchmark runs against unlocked truth are marked non-authoritative in reports.

### `README.md`
Directory entry point; link from `vnext/README.md` (only edit outside `benchmark/`).

## Phase 17 — Verification
- `deno test` on vnext dir: expect 124 prior + new benchmark tests, 0 failed.
- Grep confirms zero edits to protected paths (`src/**`, `quote-scanner/**`, canonical vNext files, orchestrator, prompts, migrations, config).
- Preview `/scan` and `/beat-your-quote` visually unchanged, no console errors, mobile unchanged.

## Final Report Sections (delivered after implementation)
1. Preflight (PASS/REPAIRED/BLOCKED). 2. Files created/modified. 3. Architecture diagram. 4. Ground-truth model (two-layer). 5. Annotation rules + QA workflow. 6. Adapter/system status. 7. Metrics list. 8. Error taxonomy. 9. Fairness protections. 10. Tests (prior/new/total/failed). 11. Isolation confirmation.

## Final Gate
`READY_FOR_CORPUS_ASSEMBLY` only if every phase-16 exit item exists and all tests pass; else `BENCHMARK_HARNESS_BLOCKED`.

## Explicit Non-Goals (preserved from prior plan)
No prompt tuning, canonical schema/validator/orchestrator/prompt changes, Brain 3 or WM MVP donor edits, full live benchmark, real corpus ingestion, provider calls, DB writes, migrations, deployments, Supabase changes, `/scan` integration, Layer 4, Truth Report, Partial Reveal, benchmark UI.

## Next-Sprint Recommendation (post-implementation)
Sprint 07B — Golden Corpus Assembly, Annotation & Adapter Readiness: 8–12 dev + 5–10 holdout synthetic/deidentified docs across the 15 archetypes; PII de-id protocol; primary→review→adjudication→lock workflow; adapter readiness checks for Brain 3 headless invocation and WM MVP runtime access; no provider calls; exit when locked corpus + adapters green.

---

## Changes Made From Previous Plan
1. **Two-layer ground truth** — added `canonical-expectation.ts` and enforced cross-system scoring on Layer A only, closing vNext-bias risk.
2. **Headless benchmark runner** added as a first-class module (`benchmark-runner.ts`) with dependency-injected clock/uuid/hash and no live calls.
3. **Deterministic line-item matching contract** — explicit signal/weight table + ambiguity threshold (15% margin without a distinguishing hard signal) → `HUMAN_REVIEW_REQUIRED`, replacing vague "Hungarian-ish" language.
4. **Hallucination vs evidence distinction** — new `EVIDENCE_MISSING`, `EVIDENCE_UNSUPPORTED`, `PAGE_REFERENCE_WRONG` classes; scorer and tests enforce that a correct fact without evidence is NOT a hallucination.
5. **Deterministic evidence-scoring policy** — six explicit classifications; no LLM judge; ambiguity escapes to `HUMAN_REVIEW_REQUIRED`.
6. **Capability matrix** — formal per-system declaration with four states; scorer excludes `UNSUPPORTED_BY_SYSTEM` from denominators; shared vs expanded coverage reported separately.
7. **Anomaly preservation** — first-class metric + error class + test (e.g., 120% deposit).
8. **Cross-reference coherence** — first-class metric separated from product-field accuracy.
9. **Repeatability contract** — `FIELD_STABILITY_RATE` and `run_group_id` added without live runs.
10. **Annotation QA workflow** — primary → review → adjudication → LOCKED, with ground-truth metadata and non-authoritative marking for unlocked runs.
11. **Versioned threshold configuration** — machine-readable `benchmark-thresholds.ts` with `threshold_config_version` stamped on every run; critical-gate override enforced by test.
12. **Expanded immutable provenance** — added `adapter_version`, `benchmark_schema_version`, `normalizer_version`, `scorer_version`, `metric_version`, `threshold_config_version`, `run_group_id`, `annotation_version`, `dataset_split`; injected deps for deterministic tests.
13. **Machine-readable report contracts** — JSON-compatible `BenchmarkRunResult`, `DocumentScorecard`, `SystemAggregateScorecard`, `BenchmarkComparisonReport`; Markdown demoted to presentation.
14. **Denominator rules** — explicit exclusions for `UNSUPPORTED_BY_SYSTEM`, `NOT_APPLICABLE`, `HUMAN_REVIEW_REQUIRED`, transport/parse/canonical-validation failures; tested.
15. **Conservative entity normalization** — explicit rules for names/phones/emails/addresses/NOAs/dimensions/manufacturer; near-matches route to `HUMAN_REVIEW_REQUIRED` rather than false equivalence.
16. **Expanded test matrix** — grew from 16 to 27 deterministic tests covering every new fairness/provenance/matching/evidence/anomaly/coherence/stability/threshold rule.
17. **Refined directory** — matches requested tree (`benchmark-runner.ts`, `canonical-expectation.ts`, `benchmark-thresholds.ts`, `adapters/capability-matrix.ts`).
18. **Hardened exit criteria** — final gate now requires every foundational element present, or returns `BENCHMARK_HARNESS_BLOCKED`.
