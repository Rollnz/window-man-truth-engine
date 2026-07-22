# scanner-brain / vnext

**Status:** Experimental. Code-only. No runtime wiring. No deployment.

## Namespace intent

| Namespace | Role |
|---|---|
| `../` (legacy) | Production/current scanner brain: `BRAIN_VERSION="3.0.0"`, `ANALYSIS_SCHEMA_VERSION="legacy-signals-v1"`. Actively used by `supabase/functions/quote-scanner`. |
| `./vnext` (this folder) | Canonical typed extraction contract targeting a future Scanner vNext. Not imported by any Edge Function. |

The legacy scanner MUST remain operational. Nothing in this folder is wired
into `quote-scanner`, `wm-analyze-quote`, or any other function this sprint.

## What this contract covers

Layers from `docs/lovable/SCANNER_CONTRACT.md`:

- **Layer 1** — Document Classification (`document_type`, `readability`, ...)
- **Layer 2** — Entity Extraction (homeowner / property / contractor / salesperson, kept structurally separate)
- **Layer 3** — Quote Facts (metadata, pricing, payment, line items, products, scope, warranties, terms)

Explicitly OUT OF SCOPE:

- Layer 4 — Derived analysis / scoring
- Layer 5 — UI / user context / CRO thresholds
- AI prompt design (a later sprint will target this schema)
- Persistence, DB migrations, deployment

## Core principle

> **AI extracts observable evidence. Deterministic logic (later) interprets it.**

The contract deliberately refuses to ask the AI whether a quote is fair,
legal, good, or bad. It records facts and their evidence; downstream
deterministic code will render judgements.

## Fact envelope

Every important fact is wrapped in:

```ts
{ status, value, confidence, evidence }
```

Semantics:

- `found` — value MUST be non-null.
- `not_found` — value MUST be null. Does **not** mean `false`.
- `uncertain` — value MAY be null; confidence reflects uncertainty.

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
- `validation.ts` — deterministic zero-dependency validator + assert helper
- `fixtures.ts` — non-PII fixtures A–E
- `contract.test.ts` — Deno-runnable isolated tests

## Running the tests

```bash
deno test supabase/functions/_shared/scanner-brain/vnext/contract.test.ts
```
