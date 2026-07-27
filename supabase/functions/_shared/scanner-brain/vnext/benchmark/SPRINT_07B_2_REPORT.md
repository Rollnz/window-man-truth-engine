# SPRINT 07B.2 — TARGETED GOLDEN CORPUS EXPANSION & BRAIN 3 BENCHMARK READINESS

**Live provider calls:** 0 · **Production/scanner changes:** 0 · **Tests:** 187 passed / 0 failed (was 166)

## Objective 1 — Brain 3 safe adapter: RESOLVED
- `adapters/brain3-safe-runner.ts` invokes the **actual** Brain 3 path (`EXTRACTION_RUBRIC`, `USER_PROMPT_TEMPLATE`, `ExtractionSignalsJsonSchema`, `scoreFromSignals`, `generateForensicSummary`, `extractIdentity`) unmodified, mirroring `quote-scanner` (mode=`analyze`).
- All side effects are injected fail-closed stubs across 5 surfaces (persistence, cache, tracking, communications, storage). Any attempt throws `BRAIN3_SIDE_EFFECT_ATTEMPT` and is recorded. The runner contains no `fetch`, no Supabase client, no env access; the provider call is injected.
- Cache is structurally absent → every run measures real extraction, never a cached row.
- `brain3-normalization.ts` maps legacy signals to the source-neutral fact space **separately**; native output is preserved verbatim.
- Readiness promoted to `READY_FOR_CONTROLLED_EXECUTION` (`brain3-adapter-v1.0.0-safe-runner`), capability matrix corrected to what legacy-signals-v1 actually emits (no homeowner/salesperson/line-items/evidence/confidence) and versioned `v1.0.0-safe-runner`.

## Objective 2 — Corpus intake infrastructure: BUILT (inputs still required)
`corpus/intake-checklist.ts` emits a deterministic gap report: +11 documents minimum, +6 development, +3 holdout, 10+ missing archetypes, accepted MIME types, a 15-item de-identification checklist, structure-preservation rules and an 11-step intake workflow. No documents were fabricated.

## Objective 3 — Ground-truth workflow: ENFORCED
`corpus/annotation-lock.ts` blocks authoritative scoring on `ANNOTATION_NOT_LOCKED`, `PII_REVIEW_PENDING`, `SECONDARY_REVIEW_INCOMPLETE`, `ADJUDICATION_PENDING`, `CRITICAL_FACT_NOT_REVIEWED`, and `AI_SELF_APPROVAL_FORBIDDEN` (AI-prepared real-document annotations cannot self-approve). Annotation edits deterministically require an `annotation_version` bump.

## Objective 4 — Offline dry run: PASS
`execution/dry-run-artifacts.ts` serializes BENCHMARK_RESULTS / DOCUMENT_SCORECARDS / SYSTEM_SCORECARDS / BENCHMARK_COMPARISON / HUMAN_REVIEW_QUEUE, every artifact stamped `NON_AUTHORITATIVE_DRY_RUN`, `authoritative: false`, `provider_calls: 0`.

## Final gate — `CORPUS_INPUT_REQUIRED`
Adapter blocker is cleared; the corpus/annotation blocker is not. Sprint 07C stays blocked until 11+ de-identified real documents with locked, human-adjudicated Layer A ground truth are supplied and `gq-v1` is re-locked. "We built a better architecture" remains justified; "we built a better scanner" does not.
