# Sprint 05 — Provider + Document Transport Compatibility Report

**Namespace:** `supabase/functions/_shared/scanner-brain/vnext/`
**Status:** Empirical DEV/TEST probe complete. No production side effects.

---

## 1. Environment & Provenance

| Field | Value |
| --- | --- |
| Git SHA (baseline) | `1dd1c462b81bd38ad6096269b795edf154cdb8d1` |
| Probe timestamp | 2026-07-22 (UTC, run in DEV sandbox) |
| Environment | Lovable DEV/TEST sandbox (`/dev-server`) |
| Gateway endpoint | `https://ai.gateway.lovable.dev/v1/chat/completions` |
| Resolved model | `google/gemini-3-flash-preview` (default fallback; `AI_MODEL_VERSION` unset in sandbox — matches current active `quote-scanner` fallback in source) |
| Canonical contract version | `canonical-extraction-v1-dev` (`VNEXT_ANALYSIS_SCHEMA_VERSION`) |
| Brain version | `4.0.0-dev` (`VNEXT_BRAIN_VERSION`) |
| Canonical schema serialized bytes | 44,744 |
| Canonical schema SHA-256 fingerprint | `4d3d32dfc6a1f9f35e030cc46f9b71db187e7acb8072cae1611f3b4a36015f1a` |
| Canonical schema approx. nesting depth | 16 |
| Provider adapter version | None (adapter deliberately NOT created — see §6) |
| Live provider calls consumed | **20 / 20** (budget exhausted) |

Secrets safety: `LOVABLE_API_KEY` was read from environment only; never logged, echoed, written to source, or embedded in report. No Authorization headers or fixture base64 captured in logs.

---

## 2. Output Schema Compatibility Matrix

All atomic probes issued a single live request each against the Lovable AI gateway, using `response_format.type = "json_schema"` with `strict: true`.

| # | Feature | Status | Evidence | Adapter |
| --- | --- | --- | --- | --- |
| 01 | Strict root object (`additionalProperties: false` + full `required`) | **PROVEN_SUPPORTED** | HTTP 200, valid JSON returned | none |
| 02 | Deep nested strict objects (3 levels) | **PROVEN_SUPPORTED** | HTTP 200, valid nested JSON | none |
| 03 | Nullable primitive unions `type: ["string"\|"number"\|"integer","null"]` | **PROVEN_SUPPORTED** | HTTP 200, null values returned | none |
| 04 | Nullable object union `type: ["object","null"]` | **PROVEN_SUPPORTED** | HTTP 200, `null` accepted | none |
| 05 | Deep arrays of objects (quote → line_items[] → evidence[]) | **PROVEN_SUPPORTED** | HTTP 200, structurally correct array of objects | none |
| 06 | Fully populated required arrays with required object fields | **PROVEN_SUPPORTED** | HTTP 200 | none |
| 07 | Numeric constraints (`minimum`, `maximum`) | **PROVEN_SUPPORTED** | HTTP 200 (value within bounds) | none (enforcement not stress-tested with out-of-range prompt) |
| 08 | String constraints (`minLength`, `maxLength`) | **PROVEN_SUPPORTED** | HTTP 200 (value within bounds) | none (enforcement not stress-tested) |
| 09 | `const` (canonical `contract_version` shape) | **PROVEN_SUPPORTED** | HTTP 200, exact literal returned | none |
| 10 | `enum` (canonical fact status enum) | **PROVEN_SUPPORTED** | HTTP 200, enum value returned | none |
| 11 | `$schema: "http://json-schema.org/draft-07/schema#"` at root | **PROVEN_SUPPORTED** | HTTP 200 with the field present — request accepted (tolerance not distinguishable from enforcement) | none |
| 12 | Combined stress schema (const + enum + nullable + nested arrays + bounds) | **PROVEN_SUPPORTED** | HTTP 200, all features composed successfully | none |

Every atomic feature required by the canonical contract is individually and combinatorially compatible at moderate complexity.

---

## 3. Full Canonical Schema Result

| Check | Result |
| --- | --- |
| Request accepted | ❌ NO |
| HTTP status | **400** (`upstream_error` → Google AI Studio `INVALID_ARGUMENT`) |
| Latency | 2,371 ms |
| Response returned | none |
| JSON parsed | n/a |
| Canonical validator run | n/a |
| Truncation observed | n/a |
| Adapter used | none (baseline) |

Adapter probe attempts (budgeted):

| Probe | Transformation | Status | Bytes |
| --- | --- | --- | --- |
| 19 | Strip root `$schema`; `const` → single-value `enum` (semantically lossless) | **400 INVALID_ARGUMENT** | 44,691 |
| 20 | Same as #19 plus removal of all `minLength` / `maxLength` / `minimum` / `maximum` (enforcement-deferred) | **400 INVALID_ARGUMENT** | 39,830 |

Provider returned the generic Vertex/Gemini `INVALID_ARGUMENT` without keyword-level detail, so the failure cannot be attributed to a single unsupported keyword. Given that every keyword and moderate composition passed individually and combined (#01–#12), the residual variable is **schema size / depth / composed cardinality**: 44 KB, depth ≈ 16, dozens of nested strict objects with recursive required arrays.

Status: **UNVERIFIED — interaction failure at full canonical complexity.** Not attributable to a single feature. Not proven unsupported for the contract as such; proven unsupported for the specific serialized form at this size/depth against this specific model via this transport.

---

## 4. Input Modality Matrix

All modality probes required the model to echo a unique synthetic sentinel embedded in the fixture. Sentinel absence in the response fails the probe regardless of HTTP status.

| Modality | Primary Gateway (`google/gemini-3-flash-preview` via Lovable OpenAI-compatible) | Sentinel Extracted | Latency | Notes |
| --- | --- | --- | --- | --- |
| JPEG (`image/jpeg`, 700×400 synthetic) | **PROVEN_SUPPORTED** | ✅ `WM-PROBE-JPEG-7421` | 1,741 ms | |
| PNG (`image/png`) | **PROVEN_SUPPORTED** | ✅ `WM-PROBE-PNG-9134` | 1,452 ms | |
| WEBP (`image/webp`) | **PROVEN_SUPPORTED** | ✅ `WM-PROBE-WEBP-3320` | 1,681 ms | |
| Single-page PDF (`application/pdf`, `data:` URL via `image_url` content part) | **PROVEN_SUPPORTED** | ✅ `WM-PROBE-PDF-P1-5510` | 1,468 ms | PDF binary transported successfully through the OpenAI-style `image_url` part. |
| Multi-page PDF (2 pages, sentinel ONLY on page 2) | **PROVEN_SUPPORTED** | ✅ `WM-PROBE-PDF-P2-8842` | 1,681 ms | Provider genuinely read beyond page 1 — not just first-page OCR. |
| HEIC / HEIF | **BLOCKED** | — | — | No `libheif`/`pyheif` in probe sandbox to synthesize a safe non-PII HEIC fixture. WindowMan upload surfaces' current HEIC acceptance not empirically verified this sprint. |

**Native Gemini transport (`generateContent` + `inline_data.mime_type` + base64):** **BLOCKED** — no separate DEV/TEST Gemini credential was safely available in the probe sandbox; the Lovable gateway is the sole authorized transport. Since the primary gateway proved PDF ingestion end-to-end (including page-2 evidence), no native-Gemini fallback probe was necessary within this sprint's budget.

---

## 5. Performance / Reliability Summary

- All 12 atomic schema probes succeeded on first attempt: 200 OK, latencies 1.26 s – 2.53 s.
- All 5 modality probes succeeded on first attempt: 1.45 s – 1.74 s.
- Full canonical + 2 adapter variants: 3 × HTTP 400 (upstream `INVALID_ARGUMENT`), latencies 1.97 s – 2.37 s.
- No 429 (rate limit), 402 (credits), or 5xx observed.
- No truncation observed (no successful full-canonical response to measure).
- `finish_reason` was `stop` on all successful calls.

---

## 6. Adapter Architecture

**No `provider-adapter.ts` was created.** Rationale: the empirical failure at the full canonical schema is **not attributable to any single provider-incompatible keyword** — every keyword we care about (`const`, `enum`, nullable unions, `additionalProperties:false`, deep `required`, nested strict objects, numeric/string bounds, `$schema`) proved supported individually and in a combined moderate-complexity stress probe. Two safe transformations (strip `$schema`, `const→enum`, drop enforcement-deferred bounds) did not lift the rejection, indicating a size/depth/composition ceiling rather than a keyword incompatibility. Building an adapter now would be **speculative**, which the sprint expressly forbids.

If a follow-up sprint proves a keyword-level ceiling, the adapter must:

- Preserve every business field, every entity, every `product_configuration`, every line-item → configuration reference, every `found/not_found/uncertain` semantic, every `evidence[]` provenance.
- Perform only lossless (`const → single-value enum`, strip `$schema`) or enforcement-deferred (`minLength/maxLength/minimum/maximum` removal, revalidated by `validateCanonicalExtractionV1` post-response) transformations.
- Never make a required business field optional, collapse entities, flatten line items, drop evidence, or coerce numeric anomalies to strings.

---

## 7. Evidence-Renderability Assessment (documentation only)

- **Page-level evidence:** feasible today. Both the single-page and page-2-only PDF probes prove the model can attribute content to a specific page. The canonical `FactEvidence.page` integer is a legitimate LLM-derivable field for immediate use, though it must be treated as **model-attested, not deterministic**.
- **Exact visual highlighting (bounding boxes / character spans):** **not currently possible from the provider alone.** The OpenAI-compatible chat transport returns no OCR coordinates, no layout tokens, and no stable page-span identifiers. Asking the LLM to invent bounding boxes is disallowed by our own rules.
- **Required future infrastructure for true visual evidence:**
  1. A deterministic document → per-page image renderer (for PDFs).
  2. A deterministic OCR + layout engine (e.g., PDF text extraction with character bounding boxes, or a vision OCR service) producing stable `(page, char_start, char_end, bbox)` anchors.
  3. An anchoring pass that fuzzy-matches LLM-returned `evidence.text` snippets back to those deterministic anchors before UI render.
- **Interim capability:** page-level "Finding X — cited from page N" is safe to ship. Highlighted-region overlays are a later infrastructure sprint.

---

## 8. Known Limitations

- HEIC transport unverified (BLOCKED).
- Native Gemini `generateContent` transport unverified (BLOCKED — not authorized to introduce a second credential in this sprint).
- Full canonical schema at 44 KB / depth 16 rejected with generic `INVALID_ARGUMENT`; the provider does not surface keyword-level diagnostics for this failure class, so we cannot yet isolate whether the ceiling is size, depth, cardinality of `required[]` arrays, or a compositional edge case.
- Bounds enforcement (`minLength` / `maxLength` / `minimum` / `maximum`) was not stress-tested with prompts designed to *violate* the bound — we only confirmed the provider does not reject the schema and returns compliant values.
- Structured-output response for the full canonical case never returned, so token usage / truncation behavior at canonical scale is unknown.

---

## 9. Isolation Confirmation

- No production data touched.
- No DB writes.
- No migrations authored or applied.
- No Edge Functions deployed or modified. The active `quote-scanner`, `wm-analyze-quote`, `orchestrate-quote-analysis`, `upload-quote`, `scan-quote` sources were read-only inspected; not one byte changed.
- No legacy scanner-brain files (`index.ts`, `rubric.ts`, `schema.ts`, `scoring.ts`, `forensic.ts`) modified.
- No canonical vNext files modified (`types.ts`, `schema.ts`, `validation.ts`, `constants.ts`, `contract.test.ts`).
- No frontend, routing, tracking, GTM, Meta CAPI, auth, RLS, Storage, Twilio, or config changes.
- Sole external side effect: 20 bounded LIVE AI provider calls against DEV/TEST `LOVABLE_API_KEY` with synthetic non-PII fixtures.

---

## 10. Next-Gate Recommendation

**`MORE_PROBES_REQUIRED`** — with a narrow, well-defined follow-up scope.

Justification:

- Schema keywords: **all PROVEN_SUPPORTED**, individually and combined. No adapter justified today.
- Document modalities the product cares about (JPEG, PNG, WEBP, single-page PDF, multi-page PDF): **all PROVEN_SUPPORTED end-to-end with sentinel extraction**, including genuine multi-page reading. Direct PDF transport through the current `image_url` data-URL pattern works — no PDF-to-image renderer is required to unblock prompt engineering.
- Only unresolved gate: **full canonical schema at current size/depth fails as an opaque `INVALID_ARGUMENT`.** Recommended narrow follow-up (Sprint 05B, ≤ 6 live calls):
  1. Bisect the canonical schema (e.g., quote-only, entities-only, classification+meta only) to isolate whether the ceiling is total size, `required[]` breadth at one level, or a specific compositional pattern.
  2. If a compositional ceiling is confirmed, evaluate emitting the canonical output as two or three chained provider calls (classification+entities first, then quote/line_items) with each sub-schema staying comfortably below the observed ceiling, followed by server-side merge + `validateCanonicalExtractionV1`.
  3. Re-attempt only after (1)/(2) with a targeted, tiny adapter if — and only if — bisection identifies a real keyword-level issue.

Do **not** begin vNext prompt engineering, shadow scanner, Layer 4 scoring, PDF renderer implementation, `QuoteFirstFlow` integration, Partial Reveal UI, Truth Report UI, Visual Evidence Drawer, or Market Intelligence Sink until the canonical transport path is proven end-to-end.

---

*This report proves TRANSPORT COMPATIBILITY only. It does not measure OCR accuracy, entity accuracy, line-item accuracy, evidence accuracy, finding quality, pricing intelligence, legal correctness, Truth Report quality, or conversion performance.*

---

## Sprint 05B — Canonical Schema Bisection

**Live call budget:** 8 / 8 consumed.
**Baseline:** current `main` (post-Sprint 05, canonical contract unchanged).
**Environment:** identical to Sprint 05 — Lovable AI Gateway `/v1/chat/completions`, `google/gemini-3-flash-preview`, `response_format: json_schema strict:true`.
**Full analysis and reproducibility instructions:** see [`SCHEMA_TRANSPORT_PLAN.md`](./SCHEMA_TRANSPORT_PLAN.md).

### Reproducible probe artifacts (new this sprint)

| File | Purpose |
| --- | --- |
| `schema-projections.ts` | Programmatic projection utility (`projectSchema`, `buildProjection`, `PARTITION_SPECS`). Deep-clones the canonical schema; never mutates it. |
| `provider-probe.ts` | Deno-runnable probe: prints structural metrics + HTTP status only. Never logs the API key, Authorization header, or response body content. |
| `canonical-merge.ts` | Pure local `mergeTwoPass` + `assertPartitionCoverage` (schema-evolution guard). No remote calls, no DB writes. |
| `schema-projections.test.ts` | 13 tests covering projection, ownership coverage, and merge Tests A–E. |
| `SCHEMA_TRANSPORT_PLAN.md` | This sprint's architecture decision, ownership map, evolution guard, and Sprint 05C recommendation. |

### Bisection results (live)

Sizes are `stableStringify` bytes (sorted keys, deterministic).

| Probe | Bytes | Depth | HTTP | Latency | JSON parsed |
|---|---:|---:|---:|---:|:---:|
| classificationEntitiesMeta | 11,551 | 13 | **200** | 5,936 ms | ✅ |
| quoteFull | 29,543 | 16 | **400** | 2,031 ms | — |
| quoteCore | 26,020 | 16 | **400** | 1,605 ms | — |
| quoteDetail (≡ twoPassB) | 3,981 | 12 | **200** | 1,465 ms | ✅ |
| twoPassA | 37,187 | 16 | **400** | 1,944 ms | — |
| threePassB (quote header) | 11,925 | 16 | **200** | 4,567 ms | ✅ |
| threePassC (scope/warr/terms) | 14,585 | 13 | **200** | 4,604 ms | ✅ |
| threePassA_bundled | 23,093 | 16 | **400** | 1,470 ms | — |

Every failure returned the same opaque upstream `INVALID_ARGUMENT` (Google AI Studio) with no keyword-level detail. Failures cluster ≥ ~23 KB at depth 16; every projection ≤ ~15 KB passed regardless of depth. **We do NOT claim an exact numeric provider limit.**

### Architecture decision

**`MORE_BISECTION_REQUIRED`.**

Neither a two-pass (`twoPassA` failed) nor a genuine three-pass (`quoteCore` and `threePassA_bundled` both failed) architecture fits under the observed ceiling for this model. A **four-partition** split whose members are individually proven does exist (classification+entities+meta / quote header / quote scope+warranties+terms / line_items+product_configurations), but `FOUR_PASS_CANONICAL_MERGE` is not in this sprint's allowed decision enum.

Sprint 05C must either broaden the enum to formalize four-pass, or probe an alternate model whose structured-output ceiling permits a genuine 3-pass split — see `SCHEMA_TRANSPORT_PLAN.md` §11.

### Isolation

- No production data touched. No DB writes. No migrations authored or applied. No Edge Functions deployed or modified. No frontend, routing, tracking, GTM, Meta CAPI, auth, RLS, Storage, Twilio, or config changes.
- No canonical vNext files modified (`types.ts`, `schema.ts`, `validation.ts`, `constants.ts`, `contract.test.ts`).
- Sole external side effect: 8 bounded LIVE AI provider calls against DEV/TEST `LOVABLE_API_KEY` with synthetic non-PII schema-echo prompts.
