# scanner-brain / vnext

**Status:** Experimental. Code-only. No runtime wiring. No deployment.

## Namespace intent

| Namespace | Role |
|---|---|
| `../` (legacy) | Production scanner brain (`BRAIN_VERSION="3.0.0"`, `ANALYSIS_SCHEMA_VERSION="legacy-signals-v1"`). Actively used by `supabase/functions/quote-scanner`. |
| `./vnext` (this folder) | Canonical typed extraction contract targeting a future Scanner vNext. Not imported by any Edge Function. |

The legacy scanner MUST remain operational. Nothing in this folder is wired
into `quote-scanner`, `wm-analyze-quote`, or any other function.

## What this contract covers

Layers from `docs/lovable/SCANNER_CONTRACT.md`:

- **Layer 1** — Document Classification
- **Layer 2** — Entity Extraction (homeowner / property / contractor / salesperson, kept structurally separate)
- **Layer 3** — Quote Facts (metadata, pricing, payment, line items, product configurations, scope, warranties, terms)

Explicitly OUT OF SCOPE: Layer 4 (derived analysis / scoring), Layer 5 (UI), AI prompt design, persistence, deployment.

## Core principle — Extraction fidelity vs business validity

> Layer 3 records what the document literally says. It does NOT judge whether
> values are plausible, legal, fair, or good. Anomalies are preserved verbatim
> and Layer 4 (later) flags them.

Examples that Layer 3 **preserves** (never rejects):

- `deposit_percentage = 120`
- `payment milestone percentage = 150`
- `total_price = -500`
- Line-item priced in EUR while `pricing.currency = USD`

Layer 3 still rejects **structural** malformations (missing required keys,
unknown properties, wrong types, broken evidence envelopes, etc.).

## AI-authored vs deterministic separation

The AI extracts observable facts + evidence. It MUST NOT be asked to:

| Concern | Owner |
|---|---|
| E.164 phone normalization | deterministic (post-processing) |
| Address component reconstruction (`full_address` from parts) | deterministic |
| Analysis eligibility (`is_supported_for_quote_analysis`) | deterministic (derived from `document_type` + `readability`) |
| Currency conflict reconciliation | Layer 4 |
| Same-as-mailing detection | Layer 4 (compare normalized addresses) |
| Contract vs proposal merging | Layer 4 behavioral mapping |

Fields intentionally **removed** from the AI-authored payload in Sprint 04A:

- `DocumentClassification.is_supported_for_quote_analysis`
- `PhoneCandidate.normalized_candidate`
- `AddressCandidate.full_address` (renamed to `raw_display_address` and populated ONLY when the source itself prints a complete single-line address)

## Multi-product configuration model

A quote may bundle multiple product configurations (e.g. PGT WinGuard 5500
single-hungs + a separately-manufactured sliding-glass-door). Sprint 04A
replaces the single global `ProductFacts` object with a plural
`ProductConfiguration[]`:

```text
quote
 ├── line_items[]                (each has optional product_configuration_id)
 └── product_configurations[]    (each has confidence + evidence + applies_to_line_item_ids)
```

- Multiple configurations MUST be representable.
- Associations are captured on **both sides** for auditability; the
  validator enforces referential integrity (a line-item pointer must
  resolve; a configuration's `applies_to_line_item_ids` must reference
  known line-item IDs).
- The AI MUST NOT fabricate an association. An empty array is valid.

## Fact envelope + repeated-record exception

Top-level critical facts use the full `ExtractedFact<T>` envelope:

```ts
{ status, value, confidence, evidence[] }
```

Semantics:
- `found` — value MUST be non-null.
- `not_found` — value MUST be null. Does **not** mean `false`.
- `uncertain` — value MAY be null; confidence reflects uncertainty.

**Repeated-record exception (intentional):** to avoid enormous AI payloads,
`QuoteLineItem`, `PaymentMilestone`, and `ProductConfiguration` do NOT wrap
every inner field in its own envelope. Instead, each record carries a
record-level `{ confidence: number, evidence: FactEvidence[] }`. Fields
inside those records are typed nullable values. This is intentional and
documented; do not claim uniform envelope everywhere.

## Version constants

```ts
VNEXT_BRAIN_VERSION            = "4.0.0-dev"
VNEXT_ANALYSIS_SCHEMA_VERSION  = "canonical-extraction-v1-dev"
CANONICAL_CONTRACT_VERSION     = VNEXT_ANALYSIS_SCHEMA_VERSION
```

These are contract identifiers only. They MUST NOT be persisted to
`quote_analyses` and MUST NOT replace the legacy constants exported from
`../index.ts`.

## Files

- `constants.ts` — version identifiers
- `types.ts` — TypeScript contract for all three layers
- `schema.ts` — strict JSON Schema (Draft-07) mirror of the TS contract
- `validation.ts` — hardened zero-dependency validator (enforces required
  keys, rejects unknown properties, validates nested value shapes and
  cross-record references)
- `fixtures.ts` — non-PII fixtures A–F (F is a multi-product mixed quote)
- `contract.test.ts` — Deno-runnable isolated tests

## Running the tests

```bash
deno test supabase/functions/_shared/scanner-brain/vnext/contract.test.ts
```

## Structured-Output Compatibility Notes

The active AI transport (`supabase/functions/quote-scanner/index.ts`) posts to
the Lovable AI gateway `/v1/chat/completions` with an OpenAI-compatible
`response_format: { type: "json_schema", json_schema: { strict: true, schema } }`,
and the default model is `google/gemini-3-flash-preview`. The current legacy
`ExtractionSignalsJsonSchema` in `../schema.ts` is a shallow object without
`additionalProperties` or `required` and uses `type: ["number", "null"]`
unions — so several features this vNext schema relies on are NOT proven at
the transport level yet:

| Schema feature | Status vs current transport |
|---|---|
| `type: ["string", "null"]` union | **SUPPORTED** — used by legacy schema. |
| `type: ["object", "null"]` union | **UNVERIFIED** — legacy schema does not exercise this at object level. |
| `additionalProperties: false` | **UNVERIFIED** — legacy schema omits it. OpenAI strict mode requires it; Gemini via OpenAI-compat behavior on structured output is not proven statically. |
| Fully populated `required: [...]` on every object | **UNVERIFIED** — legacy schema omits `required`. |
| `const` (e.g. pinned `contract_version`) | **UNVERIFIED** — no legacy usage. |
| Deeply nested arrays of objects (line items, milestones, configurations) | **UNVERIFIED** — legacy schema is flat. |
| `maxLength` / `minimum` / `maximum` | **UNVERIFIED** — no legacy usage. |
| Draft-07 `$schema` declaration | **UNVERIFIED** — provider tolerance not confirmed from code. |

Action item for the next sprint: run a DEV/TEST structured-output probe
against the actual gateway before finalizing the prompt. If any of the
above prove unsupported, a provider-specific schema adapter will be
introduced then. This canonical schema is NOT silently rewritten to guess
provider compatibility.

## Sprint 04A hardening summary

- Removed AI-authored deterministic fields (`is_supported_for_quote_analysis`,
  `normalized_candidate`, `full_address`).
- Introduced plural `ProductConfiguration[]` model with bi-directional
  line-item associations.
- Added `confidence` to `QuoteLineItem` and `PaymentMilestone`; every
  `ProductConfiguration` also carries `confidence + evidence`.
- Hardened the validator to enforce required keys, reject unknown
  properties, and validate nested value shapes at parity with the JSON
  Schema.
- Removed extraction-layer 0..100 caps on `deposit_percentage` and
  milestone percentages (anomaly preservation).
- Added Fixture F (multi-product) and a suite of hardening tests
  covering parity, references, and anomaly acceptance.
