# SPRINT 06A — Four-Pass Extraction Prompt Contract & Canonical Validation Closure

## Scope guardrail

Author prompt contracts + tests + one live closure run under `supabase/functions/_shared/scanner-brain/vnext/**` only. **No** `orchestrate-vnext-extraction`, no edge deploy, no DB, no migration, no frontend, no config, no changes to the live scanner path or any of its siblings.

## Exit criteria (all required)

1. Four production prompt contracts (A/B/C/D) exist under a single shared doctrine module.
2. Dedicated `mergeFourPass` tests exist and pass (8 named groups below).
3. One live synthetic non-PII four-pass run produces `merge.ok === true` **AND** `validation.valid === true` **AND** `validation.issues.length === 0`.
4. `deno test` in the vnext folder is green (existing 80 + new).
5. Zero visible change to `/scan`, `/beat-your-quote`, mobile UI, DB, RLS, Storage, Auth, Twilio, tracking, or any Edge Function.

If (3) does not go green within the ≤8 live-call budget, return `PROMPT_CONTRACT_BLOCKED` — do NOT loosen the validator, and do NOT loosen the schema.

---

## Part 1 — Files created / modified

**New**

- `supabase/functions/_shared/scanner-brain/vnext/extraction-prompts.ts` — shared doctrine + four pass prompt contracts.
- `supabase/functions/_shared/scanner-brain/vnext/extraction-prompts.test.ts` — static prompt-contract tests (no live calls).
- `supabase/functions/_shared/scanner-brain/vnext/canonical-merge.test.ts` — dedicated `mergeFourPass` tests (currently the merge tests live inside `schema-projections.test.ts`; this file becomes the single home).
- `supabase/functions/_shared/scanner-brain/vnext/four-pass-prompt-smoke.ts` — one-shot live synthetic runner (invoked ad-hoc via `deno run`, not part of the test suite).
- `supabase/functions/_shared/scanner-brain/vnext/PROMPT_CONTRACT.md` — the frozen prompt doctrine (reference document).

**Updated**

- `supabase/functions/_shared/scanner-brain/vnext/README.md` — one paragraph pointing at `PROMPT_CONTRACT.md` and describing the Sprint 06A additions.
- `supabase/functions/_shared/scanner-brain/vnext/SCHEMA_TRANSPORT_PLAN.md` — append a §14 "Sprint 06A closure" note recording the strict validator pass.

**Not touched (canonical contract, read-only)**

`types.ts`, `schema.ts`, `validation.ts`, `constants.ts`, `contract.test.ts`.

**Not touched (everything else)**

`quote-scanner/**`, `orchestrate-quote-analysis/**`, `wm-analyze-quote/**`, `upload-quote/**`, all other edge functions, `src/**`, migrations, `config.toml`, secrets, RLS, Auth, Storage, tracking, Twilio.

---

## Part 2 — Shared extraction doctrine (locked in `extraction-prompts.ts`)

One exported string constant `SHARED_EXTRACTION_DOCTRINE` compiled into each of the four pass system prompts. It encodes the ten rules from the sprint spec:

1. Document is the ONLY fact source. No outside knowledge.
2. Never fabricate. Missing → `status="not_found"`, `value=null`. Never `false` / `0` / `""` / `[]` / `{}` as a substitute for `null`.
3. `status="found"` requires a non-null value grounded in the document.
4. `status="not_found"` requires `value=null`. **No array exception.** `payment_schedule` (a fact-envelope wrapping an array) when absent MUST be `{ status:"not_found", value:null, evidence:[] }` — not `value:[]`. This is the exact Sprint 05C failure being closed.
5. `status="uncertain"` is for genuine ambiguity (handwritten digits, conflicting values, obscured amounts), not for missing information.
6. Absence is neutral. `not_found` never implies bad / illegal / noncompliant / unsafe.
7. Anomalies preserved verbatim. `Deposit: 120%` → extract `120`. Negative totals, currency mismatches: preserved. Layer 4 will judge them.
8. Evidence is grounded: `page` (model-attested integer or null), `text` (short verbatim excerpt, ≤240 chars — the schema's `maxLength`), `location_hint` (e.g. "totals row", "signature block"). Do not paraphrase as if it were a quote. Do not invent page numbers.
9. Confidence measures extraction clarity (readability + attribution), NOT quality/legality/fairness.
10. Entity roles are separate. Never silently map first phone/email/name to homeowner. Use printed labels + context. Ambiguous role → `uncertain`.

Doctrine also states:
- Return exactly one JSON object matching the provided strict schema. No prose, no markdown, no code fences.
- `contract_version` MUST equal `"canonical-extraction-v1-dev"` (imported from `constants.ts`).

## Part 3 — Pass ownership (exclusive authority law)

Encoded as `PROMPT_OWNERSHIP` in `extraction-prompts.ts` and asserted 1:1 against `PARTITION_OWNERSHIP` (`canonical-merge.ts`) by a test.

| Pass | Owns |
|---|---|
| A | `classification`, `entities`, `extraction_meta` |
| B | `quote.metadata`, `quote.pricing`, `quote.payment`, `quote.opening_count`, `quote.line_items_aggregate_only` |
| C | `quote.scope`, `quote.warranties`, `quote.terms` |
| D | `quote.line_items`, `quote.product_configurations` (kept together for `line_item_id ↔ product_configuration_id` coherence) |

`shared_metadata`: `contract_version` echoed by every pass; merge asserts equality.

## Part 4 — Per-pass prompt contracts

Each pass exports:

```ts
export const PASS_X = {
  version: "A-v1" | "B-v1" | "C-v1" | "D-v1",
  partition: "classificationEntitiesMeta" | "threePassB" | "threePassC" | "twoPassB",
  system: string,        // SHARED_EXTRACTION_DOCTRINE + pass-specific rules
  userTemplate: string,  // instruction shown alongside the document parts
} as const;
```

### Pass A — Document & Entity Specialist
- Owns classification (document_type, readability, page_count, classification_reason) and the four entity roles (homeowner, property, contractor, salesperson) as structurally separate objects.
- Explicit safeguards: contractor phone/email never silently assigned to homeowner; salesperson contact never silently assigned to contractor/homeowner; ambiguous role → `uncertain` with evidence.
- Phone: `raw_value` = exactly as printed (keep punctuation/extensions); `context_hint` = printed label (e.g. "Sales rep cell"). No E.164 normalization.
- Address: components filled only when the source prints them; `raw_display_address` set only when the source itself prints a complete single-line address. Never reconstruct.
- Does NOT touch quote/scope/warranty/pricing/line items.

### Pass B — Commercial Fact Specialist
- Owns metadata (quote_number/date/expiration as raw strings), pricing (currency + subtotal/discounts/taxes/total_price as MoneyAmount), payment (deposit_amount/percentage independently; financing_offered nullable boolean; financing_provider/terms; **payment_schedule as a fact-envelope**), `opening_count` fact-envelope integer, and `line_items_aggregate_only` plain boolean.
- **Payment-schedule law (the Sprint 05C fix, called out in bold in the prompt):** when no schedule appears, `{ status:"not_found", value:null, confidence:0, evidence:[] }`. When present, `status:"found"` with a non-empty array. `status:"not_found"` with `value:[]` is forbidden.
- Anomalies preserved: percentages > 100, negative amounts, currency mismatches.
- Does NOT judge fairness, price competitiveness, financing quality, or deposit safety.

### Pass C — Scope / Warranty / Terms Specialist
- Owns all 15 scope fields (installation, removal, disposal, permits, engineering, inspection, remeasure, waterproofing, sealant, anchoring, stucco_repair, drywall_repair, paint_repair, cleanup, change_orders), 3 warranty fields, and 5 term fields — each a nullable-string ExtractedFact.
- **Silence ≠ exclusion.** If permit responsibility isn't stated: `not_found`, not "permit excluded". If cancellation language exists: capture the printed clause verbatim (no legal conclusion).
- Preserve document wording verbatim (trimmed) rather than paraphrasing.

### Pass D — Line Item & Product Configuration Specialist
- Owns `line_items[]` and `product_configurations[]` (kept together to preserve referential coherence).
- **Deterministic IDs** (canonical linkage only, never claimed to be source-printed): `LI-001`, `LI-002`, ... in document order; `PC-001`, `PC-002`, ... in first-observed configuration order. Prompt explicitly forbids implying these came from the source.
- **Bi-directional association law**: every `line_item.product_configuration_id` (when set) MUST resolve to a `PC-*` this pass returned; every `product_configuration.applies_to_line_item_ids[]` entry MUST resolve to an `LI-*` this pass returned. Empty `[]` is preferred over guessing. Post-merge `validateCanonicalExtractionV1` rejects dangling refs, so the prompt calls this out inline.
- Anomalies preserved (negative quantities, line currency ≠ pricing.currency, missing unit price with valid extended price).
- **Aggregate fallback**: "14 impact windows" with no per-line detail → return `line_items: []` (Pass B independently sets `line_items_aggregate_only=true`). Do NOT fabricate 14 line items.
- Multiple manufacturers/families/series/models supported by design; every product_configuration carries `manufacturer/brand/series/model/noa_identifier/florida_approval_identifier/dp_rating/impact_designation/glass_package/low_e/argon/tint/glass_makeup/frame_material` per canonical schema.

## Part 5 — Prompt versions

Exported constants:

```
VNEXT_PROMPT_VERSION  = "four-pass-extraction-v1"
PASS_A_PROMPT_VERSION = "A-v1"
PASS_B_PROMPT_VERSION = "B-v1"
PASS_C_PROMPT_VERSION = "C-v1"
PASS_D_PROMPT_VERSION = "D-v1"
```

`VNEXT_BRAIN_VERSION` and `VNEXT_ANALYSIS_SCHEMA_VERSION` are NOT modified. Prompt versions are a separate observability dimension.

---

## Part 6 — Dedicated `mergeFourPass` tests (`canonical-merge.test.ts`)

Eight named groups, each with 1–3 cases:

1. **Happy path** — valid A+B+C+D (built via fixtures adjusted to four-pass split) → `merge.ok === true`, `validation.valid === true`, `issues.length === 0`.
2. **Missing partitions** — four cases, one per pass omitted, each returns `ok:false` with an explicit `missing pass X output` error.
3. **Contract-version mismatch** — one pass returns a wrong `contract_version` → `ok:false`, error names the offending versions.
4. **Malformed partitions** — B/C/D each with a non-object `quote` field → `ok:false` with a structural error.
5. **Authority isolation** — a rogue pass returns an out-of-authority key (e.g. Pass B returns a `scope` field); `mergeFourPass`'s defensive picks drop it and the merged canonical still validates. Assert the rogue key is NOT present in `merged.quote`.
6. **Referential integrity** — Pass D returns a `line_item.product_configuration_id` that doesn't exist in `product_configurations[]` → `validation.valid === false` with the exact validator issue path. Symmetric test for `applies_to_line_item_ids` referencing a missing `line_item_id`.
7. **Status/value invariants (the Sprint 05C fix)** — explicit case: `payment_schedule = { status:"not_found", value:[] }` → validator rejects with the exact path. Companion: `payment_schedule = { status:"not_found", value:null }` → validator accepts.
8. **Ownership completeness** — asserts `PROMPT_OWNERSHIP` (from `extraction-prompts.ts`) matches `PARTITION_OWNERSHIP` (from `canonical-merge.ts`) exactly, and that `assertPartitionCoverage()` returns `ok:true` with empty `unowned` and `unknown`. This is the schema-evolution guard against a canonical field being added without a prompt owner.

The existing merge tests inside `schema-projections.test.ts` will be moved (not duplicated) so there's one home for merge coverage.

## Part 7 — Live synthetic four-pass closure run

Ad-hoc runner: `four-pass-prompt-smoke.ts` (not in the test suite; executed once with `deno run`).

- Fixture: one synthetic non-PII quote description encoded as a single text block (no image). This is deliberately minimal — the goal is prompt-semantics closure, not extraction breadth. Includes: a company name, a homeowner name, 2 line items, a subtotal + total, NO payment schedule, NO permit language (to exercise the not_found/value=null path from Sprint 05C).
- Concurrency: `Promise.all([A, B, C, D])` against `https://ai.gateway.lovable.dev/v1/chat/completions`, model `google/gemini-3-flash-preview`, `response_format: { type:"json_schema", json_schema:{ name, strict:true, schema } }` where `schema` = `buildProjection(pass.partition).schema`.
- Header `X-Lovable-AIG-SDK: sprint-06a-four-pass-closure`. `LOVABLE-API-Key` from env; never logged.
- Post: parse each `choices[0].message.content` → JSON → `mergeFourPass({...})` → `validateCanonicalExtractionV1(merged)`.
- **Required exit result:** `merge.ok === true` AND `validation.valid === true` AND `validation.issues.length === 0`.
- **Live-call budget: ≤ 8.** Preferred: 4 (one clean pass). Reserve 4 for exactly one corrected retry if the first run surfaces a prompt-semantics gap. No repeated tuning loops. If retry still fails, return `PROMPT_CONTRACT_BLOCKED`.

## Part 8 — Reporting artifact

At the end of the sprint, produce a report (in the chat reply, not committed) containing:

1. Files created/modified — exact paths.
2. Shared doctrine summary (locked rules: found/not_found/uncertain/confidence/evidence/null).
3. Pass ownership table.
4. Prompt versions list.
5. `mergeFourPass` test results — group-by-group PASS/FAIL.
6. Live canonical closure — per-pass HTTP + parse, parallel wall-clock, merge result, validation result, issue count (target 0).
7. Isolation confirmation — no edge fn, no deploy, no DB, no migration, no frontend, no scanner touch, no tracking/auth/RLS/Twilio touch.
8. Next gate — exactly one of `READY_FOR_EXPERIMENTAL_ORCHESTRATOR` or `PROMPT_CONTRACT_BLOCKED`.

---

## Technical details

- `four-pass-prompt-smoke.ts` reads `LOVABLE_API_KEY` from env only; never echoes it, never writes it, never commits it.
- Runner prints structural metrics only: HTTP status, latency_ms, wire bytes, parsed boolean, sanitized 240-char error snippet on failure.
- Existing four-pass merge in `canonical-merge.ts` remains unchanged; Sprint 06A only adds test coverage and asserts ownership parity between prompts and merge.
- The projection specs already exist (`PARTITION_SPECS.classificationEntitiesMeta`, `threePassB`, `threePassC`, `twoPassB` in `schema-projections.ts`) and Sprint 05C proved each is under the provider ceiling — no new schema work needed.
- No provider change from Sprint 05C: `google/gemini-3-flash-preview` at the OpenAI-compatible `/v1/chat/completions` gateway endpoint with `response_format: json_schema strict:true`.
- Deno test invocation: `deno test --allow-read` from the vnext folder. Live smoke: `deno run --allow-net --allow-env --allow-read` (one call).

## What this sprint does NOT do (deferred)

`orchestrate-vnext-extraction` edge function, Golden Quote Benchmark, Layer 4 truth engine, `/scan` wiring, Partial Reveal, Truth Report UI, Evidence Drawer, Market Intelligence Sink, persistence to `quote_analyses`, model comparison probes, cost/latency dashboards.
