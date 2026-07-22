# Scanner vNext — Four-Pass Prompt & Orchestration Contract

**Status:** EXPERIMENTAL — not wired to `/scan`, `quote-scanner`,
`wm-analyze-quote`, or `orchestrate-quote-analysis`.
**Sprint of record:** 06B (builds on 05C architecture, 06A prompt contracts).

---

## 1. What this module is

A single reusable orchestration engine that turns **one document** into **one
`CanonicalExtractionV1`** by running four parallel provider calls (Pass A/B/C/D)
and merging their outputs with the already-proven `mergeFourPass` +
`validateCanonicalExtractionV1` pipeline.

```text
ONE DOCUMENT
      │
      ├── PASS A  (classification + entities + extraction_meta)
      ├── PASS B  (quote.metadata|pricing|payment|opening_count|line_items_aggregate_only)
      ├── PASS C  (quote.scope|warranties|terms)
      └── PASS D  (quote.line_items + quote.product_configurations)
                       │
                       ▼
                 mergeFourPass()
                       │
                       ▼
           validateCanonicalExtractionV1()
                       │
                       ▼
                ONE CanonicalExtractionV1
```

## 2. Why four parallel passes

Sprint 05B proved the canonical schema (44 KB, depth 16) exceeds the provider's
strict-JSON-schema complexity ceiling. Sprint 05C selected
`FOUR_PASS_PARALLEL_CANONICAL_MERGE` and proved:

- Each `PARTITION_SPECS.{classificationEntitiesMeta,threePassB,threePassC,twoPassB}`
  projection is small enough for strict-JSON-schema transport.
- Cross-pass ID coherence is preserved because `line_items` and
  `product_configurations` **must** stay in Pass D together (see
  `PARTITION_OWNERSHIP` in `canonical-merge.ts`).
- A concurrent four-pass run is ~3× faster than sequential.

## 3. Prompt contracts (locked, Sprint 06A)

Defined in `extraction-prompts.ts`:

| Pass | Owner in `PARTITION_OWNERSHIP` | Version | Partition spec |
| ---- | ------------------------------ | ------- | -------------- |
| A    | `passA` — classification, entities, extraction_meta | `A-v1` | `classificationEntitiesMeta` |
| B    | `passB` — quote.metadata/pricing/payment/opening_count/line_items_aggregate_only | `B-v1` | `threePassB` |
| C    | `passC` — quote.scope/warranties/terms | `C-v1` | `threePassC` |
| D    | `passD` — quote.line_items + quote.product_configurations | `D-v1` | `twoPassB` |

Every pass's system prompt is `SHARED_EXTRACTION_DOCTRINE + PASS_x_RULES`. The
doctrine encodes ten locked rules (anti-fabrication, `not_found ⇒ value:null`,
"AI does not judge", anomaly preservation, deterministic `LI-###` / `PC-###`
id scheme, etc.). `PROMPT_OWNERSHIP` mirrors canonical `PARTITION_OWNERSHIP`
one-for-one; the parity test suite fails closed if either drifts.

## 4. Orchestrator core — `four-pass-orchestrator.ts`

Pure, reusable, provider-agnostic. No HTTP framework, no DB, no `Deno.env`.

```ts
runFourPassOrchestration(
  input: { fileBase64, mimeType, requestId?, model? },
  deps:  { providerCall: ProviderCaller, now?: () => number },
): Promise<OrchestratorResult>
```

### Invariants

1. **Input validation happens before any provider call.** Unsupported MIME,
   empty/oversized/non-base64 payloads → zero cost, `INVALID_INPUT`.
2. **All four passes launch concurrently** (`Promise.allSettled` over four
   already-in-flight promises). Confirmed by test T2.
3. **Every pass receives the identical document bytes + MIME** (test T3),
   its own prompt + version + JSON schema (test T4), and a per-pass abort
   signal (`PER_PASS_TIMEOUT_MS = 60_000`) chained under the whole-
   orchestration abort (`TOTAL_ORCHESTRATION_TIMEOUT_MS = 90_000`).
4. **Fail-closed at every boundary.** Any of: provider throw, non-2xx,
   non-JSON body, non-object body, `contract_version` mismatch, missing
   `quote` object (B/C/D), `mergeFourPass` error, `validateCanonicalExtractionV1`
   failure — all produce a typed `FailureCode` and NEVER a partial success.
5. **Diagnostics never contain document bytes, auth material, or secrets**
   (test T11). They contain per-pass latency, HTTP status, token counts,
   parse status, plus one merge summary line.
6. **Out-of-authority fields are silently dropped by `mergeFourPass`**
   (test T12). A rogue pass cannot overwrite another pass's owned field.

### Failure taxonomy (`FAILURE_CODES`)

```
INVALID_INPUT
PASS_{A|B|C|D}_PROVIDER_FAILURE
PASS_{A|B|C|D}_PARSE_FAILURE
MERGE_FAILURE
CANONICAL_VALIDATION_FAILURE
ORCHESTRATION_TIMEOUT
INTERNAL_ERROR
```

Every failure result carries a `diagnostics` object so upstream reviewers can
distinguish provider-side, contract-side, and orchestrator-side failure modes
without a re-run.

### Dependency-injected provider

`ProviderCaller` is a single-function interface. Two callers are shipped:

- **Real:** `createLovableGatewayProviderCaller(apiKey)` posts to
  `https://ai.gateway.lovable.dev/v1/chat/completions` with
  `response_format: { type: "json_schema", json_schema: { name, strict: true, schema } }`
  and the per-pass projected schema.
- **Tests:** every test in `four-pass-orchestrator.test.ts` injects a
  deterministic mock — no live gateway calls, no `Deno.env`, no HTTP.

## 5. Experimental edge function — `orchestrate-vnext-extraction`

Thin HTTP wrapper. Contains zero business logic. Delegates to the core.

- Accepts `POST { fileBase64, mimeType, requestId?, model? }`.
- Requires `LOVABLE_API_KEY` from env (already present in this project).
- Maps `INVALID_INPUT → 400`, any other failure → 502, success → 200.
- Always returns `diagnostics` so a caller can inspect per-pass status.
- **NOT** wired into any user flow. `verify_jwt` policy MUST be decided
  before any future deployment.

## 6. Test evidence

`deno test` in `supabase/functions/_shared/scanner-brain/vnext/`:

```
ok | 124 passed | 0 failed
```

New this sprint (13 tests in `four-pass-orchestrator.test.ts`):

| ID  | Coverage |
| --- | -------- |
| T1  | Happy path — four valid partitions produce a valid `CanonicalExtractionV1`. |
| T2  | Logical concurrency — all four passes are scheduled before any resolves. |
| T3  | Identical document bytes + MIME forwarded to every pass. |
| T4  | Each pass receives the correct prompt / version / partition / schema. |
| T5  | Invalid input causes zero provider calls (four bad shapes). |
| T6  | Provider failure on any single pass fails closed with pass-specific code. |
| T7  | Non-JSON body on any pass fails closed with pass-specific parse code. |
| T8  | `contract_version` mismatch on any pass fails closed. |
| T9  | Dangling `product_configuration_id` fails closed at canonical validation. |
| T10 | Sprint 05C regression — `not_found ⇒ value:[]` rejected by canonical validation. |
| T11 | Diagnostics never contain document bytes or auth material. |
| T12 | Out-of-authority owner smuggling cannot overwrite another pass's field. |
| T13 | Default Lovable-gateway provider caller factory is constructible. |

Pre-existing suites (Sprint 04–06A) continue to pass unchanged: contract (35),
canonical-merge (13), extraction-prompts (13), provider-schema-adapter (5),
schema-projections (13), plus fixtures, four-pass merge, and validation
suites.

## 7. Explicitly out of scope for this sprint

- Layer 4 analysis / scoring / grading.
- Golden Quote benchmark.
- Any change to `quote-scanner`, `wm-analyze-quote`,
  `orchestrate-quote-analysis`, `/scan`, DB schema, or migrations.
- Deployment of `orchestrate-vnext-extraction`.
- Cost/budget analysis for four-pass live traffic.

These will be reviewed as separate sprints on top of this locked contract.
