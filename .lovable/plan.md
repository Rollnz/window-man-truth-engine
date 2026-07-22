
# Sprint 07B — Golden Corpus Assembly & Adapter Readiness

## Honest posture up front

The Lovable sandbox contains **zero real (de-identified) homeowner window quotes**. The sprint explicitly forbids fabricating a "real-world" corpus to hit a quota. Therefore the honest final gate for this pass will be:

**`CORPUS_INPUT_REQUIRED`**

That is not a failure — it is the correct Phase-29 outcome. We will still build every piece of infrastructure so that as soon as real de-identified PDFs are provided, Sprint 07C can execute immediately.

## Scope (all under `supabase/functions/_shared/scanner-brain/vnext/benchmark/`)

### Phase 0 — 07A preflight
- Verify all 07A files exist (already confirmed) and re-run existing 151-test suite as baseline. No repairs unless a defect surfaces.

### Corpus infrastructure (new files)
- `corpus/manifest-types.ts` — TypeScript contract for `GoldenDocumentManifest`, `AnnotationRecord`, `ReviewRecord`, `AdjudicationRecord`, `pii_review_status`, `dataset_split`, `known_prompt_exposure`, archetype enum.
- `corpus/manifest-validator.ts` — deterministic validator that rejects missing sha256 / split / annotation / PII status / unlocked authoritative rows.
- `corpus/corpus-lock.ts` — pure function that deterministically hashes the manifest set into a `GOLDEN_CORPUS_LOCK.json` snapshot.
- `corpus/coverage-report.ts` — computes archetype/MIME/page-count coverage; emits JSON + Markdown.
- `corpus/documents/` — one manifest JSON per synthetic control doc (2 controls only, clearly labeled `source_type: synthetic`, `known_prompt_exposure: none`).
- `corpus/GOLDEN_CORPUS_LOCK.json` — generated snapshot for the 2 synthetic controls (marked `corpus_version: "gq-v1-pre"` — infrastructure preview, not authoritative).

### Adapter readiness (extend existing adapters folder)
- `adapters/vnext-adapter-readiness.ts` — pinned model policy (`google/gemini-3-flash-preview`), version capture, mock-only readiness assertions. Returns `READY_FOR_CONTROLLED_EXECUTION`.
- `adapters/brain3-adapter-readiness.ts` — READ-ONLY inspection of `supabase/functions/quote-scanner` and `_shared/scanner-brain`; classifies as `SAFE_WRAPPER_REQUIRED` (Brain 3 today writes to `quote_analyses` and touches tracking — needs a benchmark-only wrapper before scored execution).
- `adapters/wmmvp-adapter-readiness.ts` — no donor code present in this repo → `REFERENCE_RUNTIME_NOT_AVAILABLE`; may only participate as `PROMPT_SCHEMA_REFERENCE_ONLY` and MUST be excluded from the runtime accuracy leaderboard.

### Execution config freeze
- `execution/benchmark-execution-config.ts` — versioned frozen config referencing corpus version, capability matrix version, scorer/normalizer/metric/threshold versions, model policy, repetition plan, call-budget estimate (documents × systems × 4 passes for vNext, N=1 for Brain 3, 0 for WM MVP runtime).
- `execution/call-budget.ts` — deterministic structural estimate; no dollar figures.

### Dry-run pipeline
- `execution/dry-run.ts` — wires locked synthetic manifests + mock adapter outputs through: select → runner → normalize → score → aggregate → gate → JSON report. Zero provider calls.

### Documentation (Markdown, benchmark-scoped)
- `GOLDEN_CORPUS_PROTOCOL.md` — corpus purpose, privacy, intake, versioning, lock procedure, synthetic-control policy.
- `GOLDEN_CORPUS_PRIVACY_PROTOCOL.md` — sensitive-field list, de-identification rules, stable-replacement law, metadata sanitation, PII review states.
- `ADAPTER_READINESS_REPORT.md` — per-system readiness classifications with the honest ceiling for WM MVP.
- `CORPUS_COVERAGE.md` + `CORPUS_COVERAGE.json` — coverage report for the 2 synthetic controls, listing every MISSING archetype as an intake requirement.
- `BENCHMARK_EXECUTION_PLAN.md` — Sprint 07C procedure, frozen versions, blind/holdout policy, contamination policy, repeatability plan, cost budget.
- `SPRINT_07B_REPORT.md` — the final Sprint 07B report with the single gate `CORPUS_INPUT_REQUIRED` and exact intake checklist.

### Tests (new file: `corpus/corpus.test.ts`)
All 15 required Sprint 07B tests, offline only:
1. Manifest missing hash/split/annotation/PII fails validator.
2. `deidentified_pending_review` cannot be authoritative.
3. Unlocked truth cannot produce authoritative benchmark score.
4. Ground-truth mutation requires new `annotation_version`.
5. Corpus lock hash is deterministic for identical inputs.
6. No document may belong to both development and holdout.
7. Coverage report identifies missing target archetypes accurately.
8. Aggregate report separates synthetic vs deidentified-real.
9. vNext adapter cannot silently drift model/version.
10. Brain 3 adapter guard rejects invocations that would trigger DB writes in tests.
11. WM MVP static reference mode cannot masquerade as runtime-ready.
12. Capability matrix freeze — scored config references one immutable version.
13. Changing prompt/model/thresholds/corpus/scorer changes benchmark identity hash.
14. Dry-run end-to-end produces a complete comparison report with 0 provider calls.
15. No provider calls asserted across suite.

## What is NOT modified
- Any file under `src/**`, migrations, `supabase/config.toml`, production edge functions, vNext core files (`types.ts`, `schema.ts`, `validation.ts`, `four-pass-orchestrator.ts`, prompts, canonical-merge).
- No secrets, no RLS, no auth, no Twilio, no tracking, no deployment, no live AI calls.

## Final gate returned
`CORPUS_INPUT_REQUIRED` with an exact acquisition checklist (missing archetypes 1–15, target 8–12 dev + 5–10 holdout de-identified real documents, PII-review verification steps).

## Recommended next sprint
**Sprint 07B.1 — Golden Corpus Intake & De-Identification Completion** (per Phase 36 rules for the returned gate). Sprint 07C is explicitly NOT recommended yet.
