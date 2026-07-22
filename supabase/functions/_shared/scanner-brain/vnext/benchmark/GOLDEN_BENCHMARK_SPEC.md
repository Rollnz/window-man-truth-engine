# Golden Benchmark Spec (Sprint 07A)

Version: `b-v1.0.0` (benchmark schema), threshold config `t-v1`.

## Objective
Objectively compare Scanner vNext against Brain 3 and WM MVP on identical documents against source-neutral human ground truth.

## Systems Under Test
- **vNext** — canonical four-pass orchestrator.
- **Brain 3** — current production scanner (read-only adapter until Sprint 07B).
- **WM MVP** — historical reference (runtime not yet available).

## Fairness Model
- **Layer A — Source-Neutral Human Ground Truth**: the only truth used for cross-system scoring. Independent of any scanner's output schema.
- **Layer B — Canonical Expectation Projection**: derived deterministically from Layer A. Used ONLY for vNext canonical-coverage/contract evaluation.
- **Capability Matrix**: each system declares its capability state (`SUPPORTED | PARTIALLY_SUPPORTED | UNSUPPORTED | RUNTIME_NOT_AVAILABLE`) per capability. Facts a system does not claim to support are excluded from that system's recall denominator (`UNSUPPORTED_BY_SYSTEM`).
- **Reports separate SHARED_CAPABILITY_COMPARISON from EXPANDED_CAPABILITY_COVERAGE.**

## Error Taxonomy (canonical enums)
Classification, Entity (miss/misattribution), Value (miss/wrong/false-not-found/false-found/hallucination), Evidence (missing/unsupported/page-wrong), Line items (miss/fabrication/ambiguous), Products (config/association), Cross-cutting (uncertainty/cross-domain/anomaly/cross-ref-dangling/cross-ref-incorrect), Infra (transport/parse/canonical-validation), Meta (unsupported/human-review). Severity table pins each code to critical/major/minor.

## Normalization
Conservative and deterministic: money, dates (ambiguous → HUMAN_REVIEW), names, phones, emails, addresses, identifiers/NOAs, dimensions, manufacturer aliases. Never fuzzy-collapse materially different values.

## Line-Item Matching
Explicit signal weights (stable_id 100, opening_location 25, dimensions 20, product_type 15, unit_price 15, quantity 10, manufacturer/series 10, description ≥0.6 Jaccard = 5). Ambiguity policy: if top and runner-up scores are within 15% AND the top pair has no hard signal (stable_id/location/dims), emit `LINE_ITEM_MATCH_AMBIGUOUS` + `HUMAN_REVIEW_REQUIRED` — never force a pairing.

## Evidence Scoring (no LLM judge)
Deterministic classifications: `EXACT_OR_NORMALIZED_MATCH | TEXT_CONTAINMENT_SUPPORTED | PAGE_MATCH_SUPPORTED | MISSING | UNSUPPORTED | PAGE_REFERENCE_WRONG | HUMAN_REVIEW_REQUIRED`.

## Metrics Catalog
Classification accuracy, entity P/R/F1, critical commercial accuracy, line-item recall/precision, product-configuration field accuracy, cross-reference coherence, NOT_FOUND fidelity, hallucination rate (severity-bucketed), evidence support rate, confidence calibration, uncertainty use, anomaly preservation rate, field stability rate, cross-domain diagnostics, latency (p50/p95/max), tokens.

## Denominator Rules
- `UNSUPPORTED_BY_SYSTEM` excluded from that system's recall denominator.
- `NOT_APPLICABLE` GT facts excluded.
- `HUMAN_REVIEW_REQUIRED` reported in a separate bucket, never silently pass/fail.
- Transport/parse/canonical-validation failures reported in an infra bucket; excluded from factual accuracy.
- **Critical hallucinations override aggregate score.**

## Dataset Splits
`development` (visible during tuning) and `holdout` (never used for tuning). Non-authoritative flag applied if any doc in a run is unlocked.

## Run Versioning
Every run manifest stamps: `benchmark_schema_version, normalizer_version, scorer_version, metric_version, threshold_config_version, brain_version, analysis_schema_version, prompt_version, adapter_version, system_version, provider, model, run_group_id, annotation_version, dataset_split`.

## Threshold Configuration
Frozen `DEFAULT_THRESHOLDS` (`t-v1`). See `benchmark-thresholds.ts` for values.

## Decision Gates
`PROCEED_TO_LAYER_4 | PROMPT_REFINEMENT_REQUIRED | CANONICAL_CONTRACT_REVISION_REQUIRED | ORCHESTRATOR_RELIABILITY_WORK_REQUIRED | EXPAND_BENCHMARK_BEFORE_DECISION`.

## Future Execution Protocol
Sprint 07B assembles the locked corpus and prepares Brain 3 headless invocation + WM MVP runtime access. Sprint 07C performs the head-to-head run with capped live calls.

## Page Accuracy Scoring
Handled by `classifyEvidence`: exact/containment/page-match/missing/unsupported/page-wrong. Deterministic; escapes to `HUMAN_REVIEW_REQUIRED` where semantic judgment is required.
