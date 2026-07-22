# Scanner vNext — Golden Benchmark Harness (Sprint 07A)

Measurement system only. No prompt tuning, no schema/orchestrator/DB changes, no live provider calls.

## Layout
```
benchmark/
  benchmark-types.ts        Machine-readable contracts + version constants
  error-taxonomy.ts         Enum + severity table
  ground-truth.ts           Layer A (source-neutral) validator; NO canonical imports
  canonical-expectation.ts  Layer B projection (vNext-only usage)
  normalization.ts          Conservative deterministic equivalence rules
  run-manifest.ts           Immutable versioned run manifest (frozen)
  benchmark-runner.ts       Headless coordinator (dependency-injected)
  metrics.ts                Line-item matching, evidence classification, anomaly, cross-ref, stability
  scorer.ts                 Deterministic scorer + aggregate
  benchmark-thresholds.ts   Versioned readiness thresholds
  adapters/
    adapter-contract.ts     BenchmarkSystemAdapter interface
    capability-matrix.ts    Per-system capability declarations
    vnext-adapter.ts        vNext adapter (DI provider)
    brain3-adapter.ts       Read-only (RUNNER_NOT_YET_SAFE)
    wmmvp-adapter.ts        Reference (RUNTIME_NOT_AVAILABLE)
  fixtures/
    synthetic-ground-truth.ts  DEV_DOC_1/2 + HOLDOUT_DOC_1 (no PII)
    mock-system-outputs.ts     Perfect vNext + Brain 3 mocks
  benchmark.test.ts         27 deterministic tests
  GOLDEN_BENCHMARK_SPEC.md
  GOLDEN_ANNOTATION_GUIDE.md
  README.md
```

## Invariants (all covered by tests)
1. `ground-truth.ts` and `benchmark-types.ts` do not import from `../types.ts` or `../schema.ts`.
2. Cross-system scoring uses Layer A only. Canonical expectation projection is vNext-only.
3. `UNSUPPORTED_BY_SYSTEM ≠ MISS ≠ HALLUCINATION`.
4. `NOT_APPLICABLE` and `HUMAN_REVIEW_REQUIRED` never silently succeed or fail.
5. Correct fact without evidence is `EVIDENCE_MISSING`, not a hallucination.
6. Line-item ambiguity → `HUMAN_REVIEW_REQUIRED`, never a forced pairing.
7. Anomalies (e.g. 120% deposit) must be preserved verbatim.
8. Threshold config is versioned & frozen; critical hallucinations override aggregate score.
9. Every report carries `benchmark_schema_version, normalizer_version, scorer_version, metric_version, threshold_config_version`.
10. Runs against unlocked ground truth are marked `authoritative=false`.

## Not This Sprint
Corpus assembly, Brain 3 headless run, WM MVP donor runtime, live provider calls, DB writes, UI, Layer 4.
