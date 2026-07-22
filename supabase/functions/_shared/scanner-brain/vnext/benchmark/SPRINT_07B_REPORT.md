# Sprint 07B — Final Report

## 1. Previous Sprint Preflight — **PASS**
07A harness verified in-place under `supabase/functions/_shared/scanner-brain/vnext/benchmark/`:
- Source-neutral ground truth (`ground-truth.ts`) — Layer A, does not depend on `CanonicalExtractionV1`.
- Canonical expectation projection (`canonical-expectation.ts`) — separate, vNext-only.
- Headless runner (`benchmark-runner.ts`), deterministic scoring semantics (`error-taxonomy.ts`, `scorer.ts`), fact status semantics (`FOUND / NOT_FOUND / UNCERTAIN / NOT_APPLICABLE`).
- Formal capability matrix (`adapters/capability-matrix.ts`) with `SUPPORTED / PARTIALLY_SUPPORTED / UNSUPPORTED / RUNTIME_NOT_AVAILABLE`.
- Deterministic line-item matching with `LINE_ITEM_MATCH_AMBIGUOUS` escape (`metrics.ts`).
- Versioned thresholds (`benchmark-thresholds.ts`, `t-v1`), immutable run manifests (`run-manifest.ts`), JSON-compatible reports (`benchmark-types.ts`).
- Annotation workflow: `annotation_version`, `review_status`, `adjudication_status`, `locked` — unlocked truth is non-authoritative.

**Regression check:** 151 prior vNext tests still pass. No 07A repairs required.

## 2. Files Created
- `benchmark/corpus/manifest-types.ts`
- `benchmark/corpus/manifest-validator.ts`
- `benchmark/corpus/corpus-lock.ts`
- `benchmark/corpus/coverage-report.ts`
- `benchmark/corpus/inventory.ts`
- `benchmark/corpus/documents/GQ-001.json` (synthetic control)
- `benchmark/corpus/documents/GQ-002.json` (synthetic control)
- `benchmark/corpus/GOLDEN_CORPUS_LOCK.json` (generated)
- `benchmark/corpus/corpus.test.ts` (15 new tests)
- `benchmark/adapters/vnext-adapter-readiness.ts`
- `benchmark/adapters/brain3-adapter-readiness.ts`
- `benchmark/adapters/wmmvp-adapter-readiness.ts`
- `benchmark/execution/benchmark-execution-config.ts`
- `benchmark/execution/call-budget.ts`
- `benchmark/execution/dry-run.ts`
- `benchmark/GOLDEN_CORPUS_PROTOCOL.md`
- `benchmark/GOLDEN_CORPUS_PRIVACY_PROTOCOL.md`
- `benchmark/ADAPTER_READINESS_REPORT.md`
- `benchmark/BENCHMARK_EXECUTION_PLAN.md`
- `benchmark/CORPUS_COVERAGE.md` + `benchmark/CORPUS_COVERAGE.json`
- `benchmark/SPRINT_07B_REPORT.md` (this file)

No production code was modified. No files under `src/**`, `supabase/migrations/**`, `supabase/config.toml`, `supabase/functions/quote-scanner/**`, `supabase/functions/orchestrate-vnext-extraction/**`, or the vNext intelligence core were touched.

## 3. Corpus Inventory
| Metric | Value |
|---|---|
| Total documents | **2** (synthetic controls only) |
| Development | 1 (`GQ-001`) |
| Holdout | 1 (`GQ-002`) |
| Synthetic | 2 |
| De-identified real | **0** |
| Locked | 2 |
| PII verified | 2 |
| PII pending | 0 |
| MIME | `application/pdf` × 2 |
| Pages | 1–2 |

## 4. Archetype Coverage
| Archetype | Status |
|---|---|
| `CLEAN_SIMPLE_ESTIMATE` | COVERED (`GQ-001`) |
| `SPARSE_ESTIMATE` | COVERED (`GQ-002`) |
| `SYNTHETIC_CONTROL` | COVERED |
| `DETAILED_MULTI_PAGE` | MISSING |
| `MULTI_PRODUCT` | MISSING |
| `ENTITY_AMBIGUITY` | MISSING |
| `FINANCING_HEAVY` | MISSING |
| `SIGNED_CONTRACT` | MISSING |
| `POOR_QUALITY_SCAN` | MISSING |
| `HANDWRITTEN` | MISSING |
| `AGGREGATE_ONLY` | MISSING |
| `CONFLICTING_REVISIONS` | MISSING |
| `NON_QUOTE` | MISSING |
| `TABLE_HEAVY` | MISSING |
| `VERY_LONG` | MISSING |
| `MIXED_WINDOWS_DOORS` | MISSING |

## 5. Privacy / De-Identification
- `GOLDEN_CORPUS_PRIVACY_PROTOCOL.md` implemented.
- All corpus documents are `pii_review_status: synthetic`.
- Zero unresolved PII; zero de-identified-real documents pending review (because none exist yet).

## 6. Annotation Status
- Primary annotated: 2/2 (synthetic controls have deterministic known-value ground truth).
- Secondary reviewed: 2/2.
- Adjudicated: n/a (`not_required` for synthetic).
- Locked: 2/2.
- Non-authoritative for real-world claims: **all** — synthetic controls do not measure real-world accuracy.

## 7. Ground-Truth QA
Critical-fact double-review is fully specified (`GOLDEN_CORPUS_PROTOCOL.md` §workflow) but has no de-identified-real documents to apply against yet.

## 8. Dataset Split
- Development: `GQ-001`
- Holdout: `GQ-002`
- Overlap: none (validator enforces).

## 9. Corpus Version
- `corpus_version`: `gq-v1-pre` (infrastructure preview — **not** an authoritative scored-benchmark corpus).
- `corpus_identity_hash`: `53e5182517afde25e75a6517d00b89e8a8a0754f6e51aab82e1a712742c70738`.
- Annotation versions: `1.0.0` for both documents.

## 10. Adapter Readiness
| System   | Status                                  |
|----------|-----------------------------------------|
| vNext    | `READY_FOR_CONTROLLED_EXECUTION`        |
| Brain 3  | `SAFE_WRAPPER_REQUIRED`                 |
| WM MVP   | `REFERENCE_RUNTIME_NOT_AVAILABLE` (only `PROMPT_SCHEMA_REFERENCE_ONLY` participation) |

Details in `ADAPTER_READINESS_REPORT.md`.

## 11. Capability Matrix
Frozen: `cap-matrix-v1.0.0`. Shared vs expanded partitioning already implemented in `capability-matrix.ts::partitionCapabilityScope`.

## 12. Benchmark Execution Configuration
Frozen: `exec-config-v1.0.0` referencing corpus `gq-v1-pre`, `cap-matrix-v1.0.0`, `b-v1.0.0`, `n-v1.0.0`, `s-v1.0.0`, `m-v1.0.0`, `t-v1`. Repetition default 1; repeatability subset empty pending real corpus. Concurrency: 2 docs × 1 system. Provider budget: `STRUCTURAL_ONLY_NO_LIVE`.

## 13. Offline Dry Run — **PASS**
`runOfflineBenchmarkDryRun` walks locked synthetic manifests + mock outputs through select → normalize → score → aggregate → gate → JSON report. Verified: 4 scorecards, critical-hallucination gate overrides aggregate, authoritative flag preserved, provider calls = 0.

## 14. Tests
- Prior vNext tests: **151**.
- New Sprint 07B tests: **15** (all 15 required test categories).
- Total passing: **166**. Total failing: **0**.

## 15. Isolation — Confirmed
- Live provider calls: **0**.
- Deployments: 0. DB writes: 0. Migrations: 0. `supabase/config.toml` changes: 0.
- Scanner intelligence changes: 0 (vNext core files, prompts, four-pass orchestrator, canonical-merge untouched).
- Frontend changes: 0. Tracking / Auth / RLS / Twilio changes: 0.
- WM MVP donor: unchanged (not vendored).

## 16. Current Benchmark Risks
- **Zero de-identified real documents.** Every required real-world archetype is missing.
- Brain 3 requires a benchmark-only side-effect wrapper before scored execution.
- WM MVP cannot participate in the runtime leaderboard.
- Holdout is a single synthetic control — insufficient for stability analysis.

## FINAL GATE

**`CORPUS_INPUT_REQUIRED`**

Sprint 07B built and locked the corpus infrastructure, adapter-readiness classifications, frozen execution configuration, structural call budget, and an offline end-to-end dry run. The Lovable sandbox contains no de-identified real quote documents; per the Phase 29 "no fake corpus completion" rule, we honestly return `CORPUS_INPUT_REQUIRED` rather than manufacture fake real-world coverage.

### Intake / de-identification checklist (Sprint 07B.1 inputs)
Provide 13–22 real quote documents split ~8–12 development / ~5–10 holdout that together cover the missing archetypes above (at minimum `DETAILED_MULTI_PAGE`, `MULTI_PRODUCT`, `ENTITY_AMBIGUITY`, `FINANCING_HEAVY`, `SIGNED_CONTRACT`, `POOR_QUALITY_SCAN`, `AGGREGATE_ONLY`, `CONFLICTING_REVISIONS`, `NON_QUOTE`, `TABLE_HEAVY`). For each document:
1. Sanitize PDF metadata / EXIF / filenames.
2. Apply the stable synthetic-replacement de-identification defined in `GOLDEN_CORPUS_PRIVACY_PROTOCOL.md`.
3. Compute SHA256, add a `GQ-###` manifest with `source_type: deidentified_real`, `pii_review_status: deidentified_pending_review`, assigned `dataset_split`, and `known_prompt_exposure`.
4. Perform primary + secondary annotation using the source-neutral fact model; adjudicate disagreements; then set `locked: true` and promote `pii_review_status` to `deidentified_verified`.
5. Re-run `buildCorpusLock` and freeze the corpus as `gq-v1`.

## Next Sprint Recommendation

**SPRINT 07B.1 — GOLDEN CORPUS INTAKE & DE-IDENTIFICATION COMPLETION**

Scope: acquire real quote documents, apply the privacy protocol, run the primary → secondary → adjudication → lock annotation workflow, promote the corpus from `gq-v1-pre` (synthetic controls only) to `gq-v1` (13–22 documents with the required archetype coverage), and re-run the offline dry run against the promoted corpus.

Sprint 07C (scored head-to-head benchmark execution) is explicitly **not** recommended yet — it cannot deliver a defensible verdict against a synthetic-only corpus.
