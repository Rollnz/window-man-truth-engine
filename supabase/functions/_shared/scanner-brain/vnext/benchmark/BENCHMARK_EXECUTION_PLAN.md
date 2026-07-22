# Benchmark Execution Plan — Sprint 07C (Draft, Frozen Versions)

Sprint 07C executes the head-to-head scored benchmark using the frozen artifacts produced in Sprint 07B. Sprint 07C is **not** authorized to run yet.

## Frozen versions (from `execution/benchmark-execution-config.ts`)
| Artifact                  | Version                        |
|---------------------------|--------------------------------|
| Execution config          | `exec-config-v1.0.0`           |
| Capability matrix         | `cap-matrix-v1.0.0`            |
| Benchmark schema          | `b-v1.0.0`                     |
| Normalizer                | `n-v1.0.0`                     |
| Scorer                    | `s-v1.0.0`                     |
| Metric                    | `m-v1.0.0`                     |
| Threshold config          | `t-v1`                         |
| vNext adapter             | `vnext-adapter-v1.0.0`         |
| Brain 3 adapter           | `brain3-adapter-v0.2.0-wrapper-required` |
| WM MVP adapter            | `wmmvp-adapter-v0.1.0-runtime-unavailable` |

## Corpus
- Currently locked: **`gq-v1-pre`** (2 synthetic controls). This is **not** a scored-benchmark corpus.
- Scored execution requires promotion to **`gq-v1`** with 13–22 documents including 8–12 development and 5–10 holdout, covering the required archetypes listed in `CORPUS_COVERAGE.md`.

## Models
- vNext: `google/gemini-3-flash-preview` (pinned; drift throws).
- Brain 3: as-built model in the shipping configuration (recorded honestly per manifest).
- WM MVP: n/a (runtime not available).

## Runs and repeatability
- Default runs per document: 1.
- Repeatability subset: 3–5 documents chosen after `gq-v1` promotion (simple, multi-product, entity-ambiguous, complex/table-heavy, sparse/conflicting). Each runs 3× for stability analysis.

## Concurrency
- Max 2 parallel documents, 1 system per document.

## Provider call budget
Structural estimator (`execution/call-budget.ts`), evaluated at plan-time only. For a 15-document `gq-v1` at 1 run each:
- vNext: 15 × 1 × 4 = **60** AI calls.
- Brain 3: 15 × 1 × 1 = **15** AI calls.
- WM MVP: 0 (runtime unavailable).
- Total: **75** AI calls before repeatability. Repeatability adds `subset × 2 × (calls_per_run)` more.
- Policy: `STRUCTURAL_ONLY_NO_LIVE` until Sprint 07C is separately approved.

## Blind / holdout policy
- All prompts, scorer, thresholds, and adapter versions are frozen before execution.
- No prompt tuning during scored run.
- No manual correction of scanner outputs.
- If a catastrophic infrastructure bug occurs, invalidate affected runs — do not patch mid-run and mix versions.

## Contamination policy
Documents used heavily during scanner development are labeled `known_prompt_exposure: substantial` and are preferentially excluded from holdout.

## Failure handling
- `TRANSPORT_FAILURE`, `PARSE_FAILURE`, `CANONICAL_VALIDATION_FAILURE` are logged as infra failures and excluded from accuracy denominators.
- Critical hallucinations override aggregate accuracy in gate evaluation.

## Reports produced by Sprint 07C
- Per-document scorecards (`DocumentScorecard`).
- Per-system aggregate scorecards (`SystemAggregateScorecard`).
- Comparison report (`BenchmarkComparisonReport`) — machine-readable JSON is authoritative.
- Failure-taxonomy breakdown.
- Human-review queue.
- Final gate decision: `PROCEED_TO_LAYER_4` | `PROMPT_REFINEMENT_REQUIRED` | `CANONICAL_CONTRACT_REVISION_REQUIRED` | `ORCHESTRATOR_RELIABILITY_WORK_REQUIRED` | `EXPAND_BENCHMARK_BEFORE_DECISION`.
