# SPRINT 07C — PREFLIGHT REPORT & BLOCKING VERDICT

**Status:** `BLOCKED` at Phase 0 (Previous-Sprint Integrity & Repair Gate)
**Live provider calls made:** 0
**Production surface changes:** 0
**Scanner intelligence changes:** 0
**Scored benchmark executed:** No — halted before the freeze point per Sprint 07C protocol.

---

## 1. Preflight Result

| Check | Result | Notes |
|---|---|---|
| 0.1 07A harness integrity | PASS | Layer A ground truth, canonical expectation, deterministic scorer, normalization, matcher, taxonomy, capability matrix, thresholds, immutable manifests, headless runner, machine-readable contracts all present. |
| 0.2 Test baseline | PASS | `deno test` under `vnext/`: **166 passed / 0 failed** (151 07A + 15 07B). |
| 0.3 Corpus version present | PASS (partial) | One frozen lock exists. |
| 0.4 Authoritative documents present | **FAIL** | Corpus contains only **2 synthetic control** documents (`GQ-001`, `GQ-002`). Zero de-identified real-world documents. |
| 0.5 Ground-truth review locked | **FAIL** | No holdout secondary review, no adjudicated real-world annotations. Synthetic controls only. Gate `ANNOTATION_NOT_LOCKED` applies to any real-world claim. |
| 0.6 Dev/holdout split integrity | PASS (trivially) | `GQ-001`=development, `GQ-002`=holdout, no overlap. `known_prompt_exposure=none`. Split is too small to be meaningful. |
| 0.7 Archetype coverage | **FAIL** | 2 of 13 required archetypes present (`CLEAN_SIMPLE_ESTIMATE`, `SPARSE_ESTIMATE`). Missing: multi-page, multi-product, entity ambiguity, financing, signed contract, poor scan, aggregate-only, conflicting/revised, non-quote, table-heavy, mixed windows+doors. |
| 0.8 Capability matrix frozen | PASS | `cap-matrix-v1.0.0`. |
| 0.9 Thresholds frozen | PASS | `t-v1`. |
| 0.10 Execution configuration frozen | PASS | `exec-config-v1.0.0` present (`execution/benchmark-execution-config.ts`). |
| 0.11 Adapter readiness | **FAIL** | vNext: `READY_FOR_CONTROLLED_EXECUTION`. Brain 3: `SAFE_WRAPPER_REQUIRED` — safe wrapper not yet resolved to `READY_FOR_CONTROLLED_EXECUTION`. WM MVP: `REFERENCE_RUNTIME_NOT_AVAILABLE` — static reference only (permitted). |

**Localized repairs performed:** None. All failures are corpus/annotation/adapter readiness — not benchmark plumbing defects. Per Sprint 07C protocol, these are not repairable inside Sprint 07C.

---

## 2. Blocking Verdict

Per Sprint 07C Phase 0:

- Rule 0.4 → any unlocked / PII-pending / non-authoritative document must be excluded, not silently included.
- Rule 0.5 → `ANNOTATION_NOT_LOCKED` ⇒ **STOP. No live benchmark.**
- Rule 0.7 → corpus too weak ⇒ **STOP. Return `EXPAND_BENCHMARK_BEFORE_DECISION`.**
- Rule 0.11 → Brain 3 (required baseline) not in a safe executable state ⇒ **`ADAPTER_READINESS_BLOCKED`.**

Any of these individually is a hard stop. All three apply. Executing scored provider calls against a 2-document synthetic corpus without a locked baseline would produce a benchmark that is not defensible and would burn budget on a knowingly inadequate experiment.

**No freeze snapshot was created and no scored provider call was issued** — the freeze point is protocol-gated on Phase 0 PASS.

---

## 3. Head-to-Head Verdict

Not applicable. No scored run executed. Making a vNext-vs-Brain-3 claim here would violate Phase 20 (Claim Discipline).

Current justified position remains:

> "We built a better architecture." — justified.
> "We built a better scanner." — **not yet justified.**

---

## 4. Final Decision (exactly one)

**`EXPAND_BENCHMARK_BEFORE_DECISION`**

Rationale: the corpus is 2 synthetic controls covering 2 of 13 required archetypes with zero de-identified real-world documents and no locked adjudicated ground truth. Even if Brain 3's safe wrapper were resolved today, a scored run on this corpus cannot support a readiness verdict.

---

## 5. Recommended Next Sprint (do NOT execute)

**`SPRINT 07B.2 — TARGETED GOLDEN CORPUS EXPANSION`** (recommendation only)

Required inputs to promote `gq-v1-pre` → `gq-v1`:

1. **De-identified real documents (13–22 total)** covering the 11 currently missing archetypes:
   - multi-page quote
   - multi-product quote
   - entity/contact ambiguity
   - financing / complex payment
   - signed contract / terms
   - poor-quality scan
   - aggregate-only
   - conflicting / revised quote
   - non-quote
   - table-heavy
   - mixed windows + doors
2. Dev/holdout split assigned **before** any scanner is run against them; holdout `known_prompt_exposure = none`.
3. Per-document Layer A source-neutral ground truth authored, secondary-reviewed on 100% of holdout, disagreements adjudicated, all authoritative annotations `locked=true`.
4. PII review: every document → `synthetic` or `deidentified_verified`.
5. New `GOLDEN_CORPUS_LOCK.json` regenerated → `corpus_version: "gq-v1"` with fresh `corpus_identity_hash`.
6. Brain 3 adapter promoted from `SAFE_WRAPPER_REQUIRED` → `READY_FOR_CONTROLLED_EXECUTION` (safe wrapper isolating DB writes, cache writes, tracking, lead/scan creation, calls/SMS).

Once those inputs land, Sprint 07C re-runs Phase 0 from the top and — on PASS — proceeds to freeze snapshot and scored execution against the frozen 07B execution configuration and call budget.

---

## 6. Invariants Preserved This Sprint

- No edits to `src/**`, production edge functions, migrations, `config.toml`, secrets, RLS, Auth, Storage, Twilio, or any scanner intelligence.
- No edits to vNext canonical types/schema/validation/constants, `extraction-prompts.ts`, `four-pass-orchestrator.ts`, `canonical-merge.ts`.
- No prompt tuning, no scorer/normalizer/threshold/capability changes.
- No production backend mutations. No live provider calls. No new tests encoding observed answers.
- Frontend `/scan` and `/beat-your-quote` unchanged.
- vNext test suite: **166 passed / 0 failed** (unchanged).
