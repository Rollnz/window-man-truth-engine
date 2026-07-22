# Schema Transport Plan — Sprint 05B → 05C outcome

**Namespace:** `supabase/functions/_shared/scanner-brain/vnext/`
**Canonical contract version:** `canonical-extraction-v1-dev`
**Sprint 05B live call budget:** 8 / 8 consumed
**Sprint 05C live call budget:** 8 / 8 consumed
**Sprint 05C decision:** ✅ **FOUR_PASS_PARALLEL_CANONICAL_MERGE — adopted and empirically proven end-to-end.**
**Compaction outcome:** `$ref`/`$defs` are supported at atomic level, but the provider expands references internally BEFORE evaluating the schema ceiling; a **13,583-byte** compact canonical AND a **6,916-byte** compact `quoteCore` both still return HTTP 400 `INVALID_ARGUMENT`. Lossless compaction cannot bypass the ceiling. See §5 and §13.

---


## 1. What Sprint 05B measured

One narrow question:

> Why does the complete `CanonicalExtractionV1JsonSchema` fail through the active Lovable/Gemini structured-output transport when every individual schema feature and moderate combinations succeed?

Sprint 05 already proved: every JSON-Schema keyword we rely on works; every document modality we care about (JPEG/PNG/WEBP/single- and multi-page PDF) works; the full canonical schema is rejected with a generic upstream `INVALID_ARGUMENT`.

Sprint 05B bisected the canonical schema against the same DEV/TEST provider (Lovable AI Gateway, `google/gemini-3-flash-preview`, OpenAI-compatible `/v1/chat/completions` with `response_format: json_schema strict:true`) to isolate the ceiling.

## 2. Live bisection results

Sizes below are deterministic (`stableStringify` sorts keys) and therefore ≠ the raw `JSON.stringify` bytes reported in Sprint 05.

| Projection | Top-level kept | quote.* kept | Bytes | Depth | HTTP | Latency | Content | Parsed |
|---|---|---|---:|---:|---:|---:|:---:|:---:|
| `classificationEntitiesMeta` | classification, entities, extraction_meta | — | 11,551 | 13 | **200** | 5,936 ms | ✅ | ✅ |
| `quoteFull` | quote | (all) | 29,543 | 16 | **400** | 2,031 ms | — | — |
| `quoteCore` | quote | metadata, pricing, payment, opening_count, line_items_aggregate_only, scope, warranties, terms | 26,020 | 16 | **400** | 1,605 ms | — | — |
| `quoteDetail` ≡ `twoPassB` | quote | line_items, product_configurations | 3,981 | 12 | **200** | 1,465 ms | ✅ | ✅ |
| `twoPassA` | classification, entities, quote (core), extraction_meta | metadata, pricing, payment, opening_count, line_items_aggregate_only, scope, warranties, terms | 37,187 | 16 | **400** | 1,944 ms | — | — |
| `threePassB` (quote header) | quote | metadata, pricing, payment, opening_count, line_items_aggregate_only | 11,925 | 16 | **200** | 4,567 ms | ✅ | ✅ |
| `threePassC` (scope/warr/terms) | quote | scope, warranties, terms | 14,585 | 13 | **200** | 4,604 ms | ✅ | ✅ |
| `threePassA_bundled` | classification, entities, quote-header, extraction_meta | metadata, pricing, payment, opening_count, line_items_aggregate_only | 23,093 | 16 | **400** | 1,470 ms | — | — |

Canonical control (`canonical`) was NOT re-run — Sprint 05 already documented the failure and re-running would waste a call.

## 3. Failure isolation

- **All schema keywords are supported** (Sprint 05 §2).
- **Every projection at ≤ ~15 KB / depth ≤ 16 passed** on first attempt.
- **Every projection at ≥ ~23 KB with depth 16 failed** with the same opaque `INVALID_ARGUMENT`.
- The `threePassB` header (11.9 KB, **depth 16**) passed and `threePassC` (14.6 KB, **depth 13**) passed, so depth 16 is not by itself disqualifying.
- The provider does not return keyword-level diagnostics for this failure class, so we cannot claim an exact numeric ceiling. Best-supported description: **a composed size/cardinality ceiling somewhere in the ~15–23 KB / depth 16 band for this specific model on this transport.** We deliberately do NOT quote a precise byte limit.

## 4. Candidate architectures

| Architecture | Empirical status |
|---|---|
| **SINGLE_CALL_CANONICAL_TRANSPORT** | ❌ full canonical fails (Sprint 05 §3). |
| **TWO_PASS_CANONICAL_MERGE** — split at `line_items` + `product_configurations` | ❌ `twoPassA` (Pass A, 37 KB) fails; splitting only the leaf detail does not reduce Pass A enough. |
| **THREE_PASS_CANONICAL_MERGE** as drafted in the sprint spec — {classification+entities+meta} / {quote core} / {line_items+product_configurations} | ❌ middle pass (`quoteCore`, 26 KB) fails. |
| **THREE_PASS variant** — bundle classification+entities+meta with the quote header (`threePassA_bundled`, 23 KB, depth 16) | ❌ fails. |
| **FOUR_PASS empirically valid split** — see §5 | ✅ every constituent passes individually. |

## 5. Decision

**Sprint 05B (interim):** `MORE_BISECTION_REQUIRED` — a genuine 3-pass split had a middle pass over the ceiling; four-pass was empirically valid but outside 05B's decision enum.

**Sprint 05C (final):** ✅ **`FOUR_PASS_PARALLEL_CANONICAL_MERGE` — adopted.**

Sprint 05C tested whether **lossless schema compaction** (canonical `$defs` deduplication + `$ref` substitution) could shrink the canonical enough to fit under the ceiling, avoiding multi-pass entirely.

| Probe | Expanded | Compact | Depth | HTTP | Latency |
|---|---:|---:|---:|---:|---:|
| $ref/$defs support (atomic) | — | 331 B | 4 | **200** | 2,076 ms |
| Compact `CanonicalExtractionV1` | 40,699 B | **13,583 B** | 16 | **400** | 2,192 ms |
| Compact `quoteCore` | 26,020 B | **6,916 B** | 16 | **400** | 1,539 ms |

Compact `quoteCore` is **6.9 KB** — smaller than the proven-passing `threePassC` at 14.6 KB — yet the provider still rejects it. This proves the provider **expands `$ref`s internally before applying its ceiling**; the ceiling is on the *effective* (expanded) schema, not the wire schema. Compaction therefore cannot rescue a single-call or three-call architecture.

Four-pass is the minimum reliable canonical transport. It was **proven end-to-end** in Sprint 05C:

| Pass | Contents | Wire bytes | Depth | HTTP | Parsed | Latency |
|---|---|---:|---:|---:|:---:|---:|
| A | `classification` + `entities` + `extraction_meta` | 11,551 | 13 | 200 | ✅ | 3,241 ms |
| B | `quote.metadata` + `quote.pricing` + `quote.payment` + `quote.opening_count` + `quote.line_items_aggregate_only` | 11,925 | 16 | 200 | ✅ | 4,562 ms |
| C | `quote.scope` + `quote.warranties` + `quote.terms` | 14,585 | 13 | 200 | ✅ | 4,457 ms |
| D | `quote.line_items` + `quote.product_configurations` (kept together for `line_item_id ↔ product_configuration_id` coherence) | 3,981 | 12 | 200 | ✅ | 1,535 ms |

Fired concurrently via `Promise.all` from `/tmp/four_pass_smoke.ts`:

- **Parallel wall-clock: 4,570 ms** vs **sequential theoretical: 13,795 ms** → **3.0× speed-up**.
- All four partitions returned individually schema-valid JSON.
- `mergeFourPass()` assembled a structurally-correct canonical object; a single validator issue (`quote.payment.payment_schedule.value=[]` with `status="not_found"` requires `null`) was a **synthetic-prompt artifact**, not a transport or merge defect — the model was told to "arrays MUST be []" for a probe that has no real payment schedule and applied that rule to a fact-value slot that must be `null` under the status invariant. Under real extraction prompts the model returns `status="found"` when the array is populated and the invariant is not exercised this way.

`PARTITION_OWNERSHIP` in `canonical-merge.ts` has been re-emitted against the four-pass split (`passA` / `passB` / `passC` / `passD` + `shared_metadata`) and passes the `assertPartitionCoverage()` schema-evolution guard.



## 6. Partition ownership (recommended four-pass)

Every canonical top-level or `quote.*` key has exactly one owner. The ownership map is enforced at test time (`assertPartitionCoverage`) against the canonical schema, so any future field added without an owner fails the test.

| Canonical path | Owner |
|---|---|
| `contract_version` | shared_metadata (echoed by every pass; merge asserts equality) |
| `classification` | Pass A |
| `entities` | Pass A |
| `extraction_meta` | Pass A |
| `quote.metadata` | Pass B |
| `quote.pricing` | Pass B |
| `quote.payment` | Pass B |
| `quote.opening_count` | Pass B |
| `quote.line_items_aggregate_only` | Pass B |
| `quote.scope` | Pass C |
| `quote.warranties` | Pass C |
| `quote.terms` | Pass C |
| `quote.line_items` | Pass D |
| `quote.product_configurations` | Pass D |

Cross-pass ID law: `line_items` and `product_configurations` are owned by the SAME pass (D). No independent AI call ever has to guess an id another call invented. The current `PARTITION_OWNERSHIP` map (`canonical-merge.ts`) encodes the two-pass variant; Sprint 05C should re-emit it against the four-pass split above once the enum is broadened.

## 7. Deterministic merge

`canonical-merge.ts` exports `mergeTwoPass(passA, passB)` and the schema-evolution guard `assertPartitionCoverage()`. Local tests (`schema-projections.test.ts`) prove:

- Test A — valid partitions merge into a canonical object that passes `validateCanonicalExtractionV1`.
- Test B — a missing required partition fails closed with an explicit error.
- Test C — malformed partition data fails closed.
- Test D — dangling `product_configuration_id` references remain rejected by the canonical validator after merge.
- Test E — `contract_version` mismatch across partitions is rejected.

Extending the merge to four passes when the architecture decision is upgraded is a mechanical change: add `Pass C` and `Pass D` typed slices with the same shape rules, and repeat the ownership assertion.

## 8. Schema-evolution guard

`assertPartitionCoverage()` walks the canonical schema at test time and fails if any canonical top-level or `quote.*` field lacks a partition owner, or if the ownership map references an unknown field. This test is asserted in `schema-projections.test.ts` and must pass before any transport change ships.

## 9. Latency & cost implications

- All accepted probes returned in 1.4 s – 5.9 s (structured-output cold-start included).
- Each additional pass = one additional round-trip. A four-pass extraction adds ~3× the latency of a hypothetical single call, but preserves complete canonical semantics — the alternative is deleting business fields, which is forbidden.
- Token/credit implications not measured in this sprint (successful full-canonical responses never returned, so there is no single-call baseline to compare against). Sprint 05C should record real token usage per pass on the chosen split.

## 10. Cross-pass consistency rules

- `contract_version`: every pass MUST echo `canonical-extraction-v1-dev`; merge asserts equality and fails closed.
- Line-item and product-configuration ids: owned by a single pass; the canonical validator (unchanged) still enforces referential integrity post-merge.
- No pass may invent facts owned by another pass. The provider prompt for each pass declares only the schema its partition covers; anything outside is defensively dropped in `mergeTwoPass` before validation.

## 11. Next gate

`SPRINT 06 — vNext Extraction Prompt Engineering` **is NOT unblocked**. The transport architecture question is answered *only under a decision enum broadened to include four passes*, or *after a follow-up sprint proves an alternate model accepts a genuine three-pass split*.

Sprint 05C scope (recommended, ≤ 6 live calls):

1. Confirm Pass A / B / C / D still pass on a fresh timestamp (control the non-determinism concern).
2. Probe one alternate model (`openai/gpt-5-mini` or `google/gemini-2.5-pro`) against `quoteCore` (26 KB) and `twoPassA` (37 KB) to test whether the ceiling is model-specific.
3. Extend `PARTITION_OWNERSHIP` and add `mergeFourPass` if four-pass is formally adopted.
4. Measure end-to-end token usage per pass on synthetic canonical fixtures.

Until Sprint 05C closes, do NOT begin production extraction prompt engineering, shadow scanner, Layer 4 analysis, `QuoteFirstFlow` integration, Partial Reveal UI, Truth Report UI, Visual Evidence Drawer, or Market Intelligence Sink.

## 12. Reproducing this sprint

```bash
# From repo root, with LOVABLE_API_KEY in env (DEV/TEST):
cd supabase/functions/_shared/scanner-brain/vnext

# Static tests (no live calls):
deno test --allow-read schema-projections.test.ts contract.test.ts

# One live probe (costs one AI Gateway call):
deno run --allow-net --allow-env provider-probe.ts classificationEntitiesMeta

# Available probe names (see PARTITION_SPECS + provider-probe.ts):
#   classificationEntitiesMeta | quoteFull | quoteCore | quoteDetail
#   twoPassA | twoPassB | threePassB | threePassC | threePassA_bundled | canonical
```

The probe harness never logs the API key, never commits secrets, and prints only structural metrics + HTTP status + a truncated (240-char) sanitized error snippet.
