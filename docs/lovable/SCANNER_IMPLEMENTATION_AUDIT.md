# WindowMan Scanner — Active Implementation Audit

## 00. AUDIT CONTROL

| Field | Value |
|---|---|
| Document ID | `WM-SCANNER-AUDIT-001` |
| Audited Repository | `Rollnz/window-man-truth-engine` (this workspace) |
| Audited Ref | Source SHA `81538915754c2f3a6e282b7ae7142fdbb880d493` (2026-07-22). Files under `src/**` and `supabase/functions/**` were unchanged between the prior source commit and the audit commit. |
| Target Contract | [`SCANNER_CONTRACT.md`](./SCANNER_CONTRACT.md) v1.0.0 |
| Parent Manifest | [`MASTER_MANIFEST.MD`](./MASTER_MANIFEST.MD) v1.1.0 |
| Status | `AUDIT COMPLETE — READ ONLY. No implementation delivered.` |
| Scope | End-to-end scanner path: upload UI → upload edge functions → AI extraction → deterministic scoring → forensic summary → result consumers. Frontend acquisition flow (`/scan`) is inspected only for adapter compatibility. |
| No-Code-Change Declaration | This sprint modified only `docs/lovable/MASTER_MANIFEST.MD`, `docs/lovable/SCANNER_CONTRACT.md`, and created `docs/lovable/SCANNER_IMPLEMENTATION_AUDIT.md`. No `src/**`, `supabase/functions/**`, `public/**`, or config files were altered. No database migration, edge function deployment, or backend mutation was performed. |
| Donor Repository | `Mongoloyd/wm-mvp @ forensic_report_v2` — NOT mounted in this workspace; NOT inspected in this audit. |

---

## 01. EXECUTIVE SUMMARY

### 01.1 Overall Compatibility Assessment

The active scanner is a **structurally coherent boolean-signal extractor + deterministic score compiler**. It is **broadly reusable for scoring math and rate-limited AI orchestration**, but is **structurally misaligned with the five-layer contract** on three material dimensions:

1. **Extraction shape.** The AI is asked to emit ~40 booleans plus a handful of scalars. The contract requires a typed fact model with `value + confidence + source_page + source_text_or_reference`.
2. **Epistemic model.** Nothing in the current pipeline distinguishes FOUND vs NOT FOUND vs INFERENCE. Absence of a signal is silently treated as absence of a good property, then penalized.
3. **Entity separation.** Only contractor identity is (partially) modeled. Homeowner, Property, and Salesperson entities do not exist as concepts anywhere in `ExtractionSignals`, `AnalysisData`, or the response envelope.

The current implementation can serve as a **transitional Layer 4 engine** while a Layer 2–3 typed extractor is built alongside it. It cannot be evolved in place into a contract-compliant scanner without a schema replacement.

### 01.2 Strongest Reusable Assets

1. `supabase/functions/_shared/scanner-brain/*` — isomorphic scoring/forensic modules with clean single-source-of-truth exports (`scoreFromSignals`, `generateForensicSummary`, `calculateLetterGrade`).
2. `supabase/functions/quote-scanner/index.ts` — deduplication (SHA-256 image hash → `quote_analyses` cache), rate limiting, Zod validation, structured error taxonomy, AI-gateway plumbing.
3. `supabase/functions/wm-analyze-quote/index.ts` — stateless service-to-service variant of the same pipeline, cleanly separated from tracking/DB writes.
4. `useQuoteScanner.ts` / `useDeterministicScanner.ts` / `useGatedAIScanner.ts` — client-side compression, base64 handoff, session persistence, tab-recovery pattern.
5. Hard-cap → forensic-summary handshake (`HardCapResult` explicitly passed from `scoring.ts` to `forensic.ts`) — a clean deterministic-first pattern already in place.

### 01.3 Largest Gaps

1. No Layer 1 document-type enum — only binary `isValidQuote`.
2. No Layer 2 homeowner / property / salesperson entities.
3. No Layer 3 typed fact envelope; extraction is presence-only booleans.
4. No provenance (source page / snippet) anywhere in the pipeline.
5. No FOUND / NOT FOUND / INFERENCE tri-state; hard caps convert NOT FOUND → statutory accusation.

### 01.4 Highest-Risk Legacy Assumptions

1. **Absence-as-failure**: `!signals.licenseNumberPresent` → statute citation `F.S. 489.119` and a score ceiling of 25. The document not showing a license number is treated as the contractor being unlicensed.
2. **Coarse price model**: `total_price / opening_count` rounded to the nearest $50 becomes the entire price pillar and is banded against fixed thresholds regardless of product, configuration, or door-vs-window mix.
3. **Legal assertion in headline**: `headline`, `summary`, and `warnings` are rendered directly into user-facing UI and include statutory framing that has never been reviewed against actual document evidence.
4. **Lead-gate coupling**: The `/ai-scanner` gated variant treats a Supabase session or "verified lead" flag as a bypass for the phone-first funnel — this predates the Progressive Access Model core rule.
5. **Boolean conflation**: The AI JSON schema marks most booleans as `required: true`; there is no way for the model to say "I couldn't tell." False and unknown are the same value.

---

## 02. CURRENT END-TO-END SCANNER FLOW

Evidence trace, in call order:

1. **File select (client)** — `src/pages/QuoteFirstLanding.tsx` → `src/features/quote-first/QuoteFirstStage.tsx` → `src/features/quote-first/QuoteFirstFlow.tsx` (`/scan`). Legacy consumers: `src/hooks/useQuoteScanner.ts`, `src/hooks/audit/useDeterministicScanner.ts`, `src/hooks/useGatedAIScanner.ts`.
2. **Image compression (client)** — inline `compressImage()` duplicated across the three hooks above (identical implementation, max 2000px, JPEG q=0.8, target 4 MB base64, PDF passthrough ≤ ~5 MB).
3. **Invocation (client → edge)** — `heavyAIRequest.sendRequest('quote-scanner', {...})` from `src/lib/aiRequest.ts`. Sends `mode: 'analyze'` + `imageBase64` + `mimeType` + `sessionId` + `leadId`.
4. **Guards (edge)** — `supabase/functions/quote-scanner/guards.ts`: CORS, JSON content-type, 7 MB body cap, IP rate limit (50/hour). Zod validation via `supabase/functions/quote-scanner/validation.ts` (`QuoteScannerRequestSchema`).
5. **Dedup cache (edge)** — `computeImageHash()` → `quote_analyses.image_hash` lookup. Cache HIT returns cached `analysis_json` untouched.
6. **AI extraction (edge)** — `supabase/functions/quote-scanner/index.ts` posts to `https://ai.gateway.lovable.dev/v1/chat/completions` with:
   - system prompt = `EXTRACTION_RUBRIC` (`_shared/scanner-brain/rubric.ts`),
   - user prompt = `USER_PROMPT_TEMPLATE(openingCount, areaName, notesFromCalculator)`,
   - `response_format: { type: 'json_schema', strict: true, schema: ExtractionSignalsJsonSchema }` (`_shared/scanner-brain/schema.ts`),
   - model = `AI_MODEL_VERSION || 'google/gemini-3-flash-preview'`.
7. **Signal parse (edge)** — `JSON.parse(content) as ExtractionSignals`. No secondary validation beyond `response_format: strict`.
8. **Deterministic scoring (edge)** — `scoreFromSignals(extracted, openingCount)` in `_shared/scanner-brain/scoring.ts`. Applies validity gate, five pillar scores, curve, hard caps, summary. Emits `ScoredResult` (extends `AnalysisData`) with `HardCapResult`.
9. **Forensic summary (edge)** — `generateForensicSummary(extracted, scored)` in `_shared/scanner-brain/forensic.ts`. Composes headline, `statuteCitations[]`, `questionsToAsk[]`, `positiveFindings[]`, `riskLevel`.
10. **Identity envelope (edge)** — `extractIdentity(extracted)` → `{ contractorName, licenseNumber, noaNumbers }`.
11. **Persistence (edge)** — `quote_analyses` row insert (id, session_id, lead_id, quote_file_id, image_hash, overall_score, `analysis_json`, timestamps).
12. **Attribution log (edge)** — `logAttributionEvent()` from `supabase/functions/_shared/attributionLogger.ts` → `wm_events`.
13. **Return to client** — Full `responsePayload` (`overallScore`, `finalGrade`, five pillar scores, `pricePerOpening`, `warnings[]`, `missingItems[]`, `summary`, `forensic`, `extractedIdentity`).
14. **Client aftercare** — `wmScannerUpload` GTM fire, `awardScore({ eventType: 'QUOTE_UPLOADED' })` via `useCanonicalScore`, `logScannerCompleted` high-value signal, `updateField('quoteAnalysisResult', ...)` into session storage. `useDeterministicScanner` transitions `analyzing → partial → gated → unlocked`.

Parallel stateless variant: `supabase/functions/wm-analyze-quote/index.ts` (Bearer-secret authenticated, no DB writes, no attribution) executes steps 6–10 only and returns an envelope with `meta`, `preview`, `full.dashboard`, `full.forensic`, `full.extracted_identity`.

Parallel legacy upload path: `supabase/functions/upload-quote/index.ts` handles a multipart upload directly to Supabase Storage `quotes` bucket → `quote_files` table → `wm_event_log` ledger. This path is **not currently called by `/scan`** (QuoteFirstFlow does not invoke it) — it is used by `useQuoteUpload` from `src/hooks/useQuoteUpload.ts`, which is legacy `beat-your-quote` infrastructure.

---

## 03. LAYER 1 AUDIT — DOCUMENT CLASSIFICATION

| Contract Requirement | Current Implementation | Verdict |
|---|---|---|
| Distinguish quote / contract / invoice / unrelated / unreadable | `EXTRACTION_RUBRIC` PHASE 0 sets `isValidQuote` boolean + free-text `validityReason` (`_shared/scanner-brain/rubric.ts` lines 19–33). No document-type enum. | **PARTIAL — binary only** |
| `classification_confidence` | NOT FOUND. Schema has no confidence field. | **NOT FOUND** |
| `page_count` | NOT FOUND. Client compresses to a single JPEG for image inputs; PDFs are forwarded but never inspected for page count. | **NOT FOUND** |
| `readability` / `extraction_quality` | NOT FOUND. Failure paths only distinguish "AI returned empty/invalid" (500) from "not a quote" (422). | **NOT FOUND** |
| Valid / uncertain / invalid tri-state | Two states only: `isValidQuote === true` → full pipeline runs; `isValidQuote === false` → `wm-analyze-quote` returns 422 `INVALID_QUOTE`; `quote-scanner` returns a zero-score record with `finalGrade: 'F'` and message "Not a window/door quote." (`scoring.ts` lines 168–183). | **PARTIAL — no uncertain state** |
| Recovery expectation (explicit non-success surface) | `wm-analyze-quote` returns structured 422 `INVALID_QUOTE`. `quote-scanner` returns a **200 success** with a zeroed record — this can misleadingly look like a valid low-scoring quote to a downstream consumer that doesn't inspect the summary text. | **PARTIAL — recovery surface inconsistent** |
| No fabrication on invalid docs | `scoreFromSignals` short-circuits before scoring on `!isValidQuote`. Forensic summary is not called in that branch. Layer 1 refusal is respected. | **OK** |

**Files/functions:**
- `supabase/functions/_shared/scanner-brain/rubric.ts` (`EXTRACTION_RUBRIC` PHASE 0)
- `supabase/functions/_shared/scanner-brain/schema.ts` (`isValidQuote`, `validityReason` in `ExtractionSignalsJsonSchema`)
- `supabase/functions/_shared/scanner-brain/scoring.ts` (validity gate, lines 168–183)
- `supabase/functions/wm-analyze-quote/index.ts` (`INVALID_QUOTE` 422 branch, line 139)
- `supabase/functions/quote-scanner/index.ts` (zeroed 200 return, lines 336–398)

---

## 04. LAYER 2 AUDIT — ENTITY EXTRACTION

### 04.1 Homeowner (§2.1)

| Field | Extracted? | Confidence? | Source? | Notes |
|---|---|---|---|---|
| `name` | **NOT FOUND** | — | — | No homeowner concept in `ExtractionSignals` |
| `email` | **NOT FOUND** | — | — | Same |
| `phone` | **NOT FOUND** | — | — | Same |
| `mailing_address` | **NOT FOUND** | — | — | Same |

Homeowner identity is captured only downstream, via `useLeadFormSubmit` after the user types into the gate. There is no OCR homeowner extraction.

### 04.2 Property (§2.2)

| Field | Extracted? | Notes |
|---|---|---|
| `service_address` | **NOT FOUND** | Client passes an `areaName` string hint (defaulted to `'Florida'`) into the AI prompt as context only. Not extracted from the document. |
| `city` / `state` / `zip` | **NOT FOUND** | Same |

### 04.3 Contractor (§2.3)

| Field | Extracted? | Confidence? | Source? | Notes |
|---|---|---|---|---|
| `company_name` | **PARTIAL** | No | No | `contractorNameExtracted: string \| null` in `schema.ts` |
| `license_number` | **PARTIAL** | No | No | `licenseNumberValue: string \| null` + presence flag `licenseNumberPresent: boolean` |
| `address` | **NOT FOUND** | — | — | — |
| `phone` | **NOT FOUND** | — | — | — |
| `email` | **NOT FOUND** | — | — | — |
| `website` | **NOT FOUND** | — | — | — |

Surfaced via `extractIdentity()` in `_shared/scanner-brain/forensic.ts` → `{ contractorName, licenseNumber, noaNumbers[] }`. There is no confidence attached and no page/snippet reference.

### 04.4 Salesperson (§2.4)

All fields **NOT FOUND**. No salesperson concept exists anywhere in `ExtractionSignals`, `AnalysisData`, or the response envelope.

### 04.5 Attribution Rule Compliance (§2.6)

The critical rule "MUST NOT assume the first phone/email/name/address on the document belongs to the homeowner" is trivially satisfied only because the scanner never attempts to extract homeowner identity. Once homeowner extraction is added, the rule will require enforcement that does not currently exist. **RISK — silent-compliance.**

### 04.6 Confidence Behavior (§2.7)

**NOT FOUND.** No HIGH / MEDIUM / LOW model exists in the schema, the response envelope, or the reveal UI.

---

## 05. LAYER 3 AUDIT — QUOTE FACTS

Presence-only booleans dominate. Values are captured for a small set of fields. Provenance is absent everywhere.

### 05.1 Document / Commercial Facts (§3.1)

| Fact | Status | Evidence |
|---|---|---|
| `quote_number` | **NONE** | Not in schema |
| `quote_date` | **NONE** | Not in schema |
| `expiration_date` | **NONE** | Not in schema |
| `total_price` | **FULL** (value) | `totalPriceFound: boolean`, `totalPriceValue: number \| null` |
| `subtotal` | **NONE** | — |
| `discounts` | **NONE** | Only pressure-tactic `hasManagerDiscount` flag |
| `taxes` | **NONE** | — |
| `deposit` | **PARTIAL** | `depositPercentage: number \| null` only; no absolute amount |
| `financing` | **NONE** | — |
| `payment_schedule` | **PARTIAL** | Booleans `hasFinalPaymentTrap`, `hasSafePaymentTerms`, `hasPaymentBeforeCompletion`; no schedule[] structure |

### 05.2 Project / Opening Facts (§3.2)

| Fact | Status |
|---|---|
| `opening_count` | **PARTIAL** — `openingCountEstimate: number \| null` (AI-estimated); client can override via `openingCount` hint |
| `line_items[]` with per-item envelope | **NONE** — no line-item array anywhere |

### 05.3 Product / Glass / Compliance Facts (§3.3)

Boolean flags only: `hasComplianceKeyword`, `hasComplianceIdentifier`, `hasNOANumber` (+ `noaNumberValue`), `hasLaminatedMention`, `hasGlassBuildDetail`, `hasTemperedOnlyRisk`, `hasNonImpactLanguage`, `hasBrandClarity`, `hasPremiumIndicators`. No DP numeric value, no glass makeup breakdown (Low-E / Argon / tint captured only as "hasGlassBuildDetail" umbrella), no manufacturer/series/model fields.

### 05.4 Scope Facts (§3.4)

Boolean flags only: `hasPermitMention`, `hasDemoInstallDetail`, `hasSpecificMaterials`, `hasWallRepairMention`, `hasFinishDetail`, `hasCleanupMention`, `hasSubjectToChange`, `hasRepairsExcluded`, `hasStandardInstallation`, `hasDetailedScope` (composite). No textual scope statements captured.

### 05.5 Warranty / Contract Facts (§3.5)

`hasWarrantyMention`, `hasLaborWarranty`, `warrantyDurationYears`, `hasLifetimeWarranty`, `hasTransferableWarranty`, `hasContractTraps` + `contractTrapsList[]`. **Product warranty is not separated from labor warranty.** No callback process, exclusions, or timeline.

### 05.6 Absence Handling (§3.6)

- Numeric fields (`totalPriceValue`, `openingCountEstimate`, `depositPercentage`, `warrantyDurationYears`, `noaNumberValue`, `licenseNumberValue`, `contractorNameExtracted`) correctly use `null` for "not stated." **OK.**
- Boolean fields collapse "absent" and "false" into the single value `false`. There is no way for the AI to signal "I could not determine." **CONTRACT VIOLATION.**

### 05.7 Provenance (§3.7)

**NOT FOUND** for every fact. No page number, no source snippet, no bounding box, no line reference. Provenance is not part of the AI response schema and is not synthesized post-hoc.

---

## 06. LAYER 4 AUDIT — DERIVED ANALYSIS

### 06.1 AI vs Deterministic Split

- **AI-generated:** everything in `ExtractionSignals` (the ~40 booleans and handful of scalars). No AI judgment/reasoning is stored — the AI is instructed explicitly to "EXTRACT what you see... You do NOT score or judge." (`rubric.ts` line 16).
- **Deterministic:** all scoring, all hard caps, all citations, all headlines, all questions, all positive findings. Implemented in `_shared/scanner-brain/scoring.ts` and `_shared/scanner-brain/forensic.ts`. This is a clean deterministic-first pattern and matches Contract §4.

### 06.2 Scoring Bands (`scoring.ts`)

- Pillar weights: safety 0.30, scope 0.25, price 0.20, fine-print 0.15, warranty 0.10.
- Curve: linear ≤ 70; exponential compression above 70 (`70 + 30 * ((s-70)/30)^1.8`).
- Letter grade: standard A+/A/A-/B+/.../F thresholds in `calculateLetterGrade()`.
- Risk level bands: ≤30 critical / ≤50 high / ≤70 moderate / else acceptable.

### 06.3 Hard Caps (§0.4 statute alignment)

`applyHardCaps()` — five caps, each writes a warning and cites a statute:

| Cap | Ceiling | Statute | Trigger |
|---|---|---|---|
| Missing license | 25 | F.S. 489.119 | `!signals.licenseNumberPresent` |
| Owner-builder language | 25 | F.S. 489.103 | `hasOwnerBuilderLanguage` |
| Deposit > 50% | 55 | F.S. 501.137 | `depositPercentage > 50` |
| Tempered-only glass | 30 | (none) | `hasTemperedOnlyRisk && !hasLaminatedMention` |
| Payment before completion | 40 | F.S. 489.126 | `hasPaymentBeforeCompletion` |

### 06.4 Price Model

`pricePerOpening = round(totalPriceValue / effectiveOpeningCount / 50) * 50`, then banded:

| PPO band ($) | priceScore |
|---|---|
| < 1000 | 40 |
| 1000–1199 | 65 |
| 1200–1800 | 95 |
| 1801–2500 | 75 |
| > 2500 | 55 (+10 if `hasPremiumIndicators`) |

No product-type, configuration, door-vs-window, or manufacturer context. **PRICE MODEL RISK — flagged.**

### 06.5 Absence Handling in Scoring

- `!hasWallRepairMention` → push to `missingItems`.
- `!hasWarrantyMention` → push to `missingItems`.
- `depositPercentage === null` → push to `missingItems`.
- `!hasComplianceKeyword && !hasComplianceIdentifier && !hasLaminatedMention` → safety capped at 40 + missingItem.
- `!signals.licenseNumberPresent` → **hard cap 25 + statutory warning: "CRITICAL: No license # found. Per F.S. 489.119, all Florida contractors must display their license number."** — this is the most dangerous absence-as-failure path because it converts NOT FOUND into a **legal accusation** in user-facing copy. **ABSENCE-AS-FAILURE RISK — flagged.**

### 06.6 NOT FOUND → BAD Conversion

Present in scoring at every pillar (see §06.5). Present in `forensic.ts` where `!signals.hasComplianceIdentifier && !signals.hasNOANumber` pushes `"FL Building Code Section 1626 - NOA documentation required"` into citations — asserting a code obligation was breached based on document silence. **LEGAL ASSERTION RISK — flagged.**

### 06.7 Evidence Preservation in Findings

**NOT FOUND.** All warnings, missingItems, citations, questions, and positive findings are pre-authored English strings composed from booleans. None references a page number, snippet, or bounding box. Users have no way to see "where in my document did the system find this."

---

## 07. LAYER 5 AUDIT — USER CONTEXT

| Requirement | Status |
|---|---|
| `already_signed` / `still_deciding` / `passed` as canonical state | **NOT FOUND** as an enum. `supabase/functions/qualify-flow-b/index.ts` exists and stores qualification-flow points against a lead, but does not persist these three canonical values. |
| Decision-reason codes (5.2.1–5.2.3) | **NOT FOUND** anywhere in code |
| User corrections to OCR identity (§5.3) preserved without destroying originals | **NOT FOUND.** `useLeadFormSubmit` overwrites lead fields. No editable OCR-identity dossier UI exists in the active `/scan` implementation. |
| User context influences Truth Report copy (§5.4) | **NOT FOUND.** `summary` and `headline` are pure functions of scored signals — no branch on transaction state or reason. |
| OTP coupling | `useGatedAIScanner` (`src/hooks/useGatedAIScanner.ts`) uses `useLeadIdentity`'s `isVerifiedLead` and `useAuth`'s `isAuthenticated` to **bypass** the lead gate. This predates the Progressive Access Model core rule that estimate scans MUST always require OTP even for Vault-logged-in users. **LEGACY BYPASS — flagged, but out of scope for this contract sprint.** |
| Identity confirmation coupled to lead capture | Yes. Lead capture (`captureLead` → `useLeadFormSubmit` → `save-lead` edge function) is the only path by which homeowner identity enters the system, and it happens before any correction/verification step. |

---

## 08. PORTABLE `QuoteFirstFlow` COMPATIBILITY

### 08.1 Reusable Infrastructure

Likely reusable behind an adapter:

- File handling and compression (`compressImage()` — currently duplicated across three hooks; should be extracted into `src/lib/`).
- `heavyAIRequest` transport (`src/lib/aiRequest.ts`).
- `supabase/functions/quote-scanner` guards, dedup cache, rate limiting, Zod validation, Supabase persistence.
- `supabase/functions/wm-analyze-quote` stateless envelope (better fit for a portable adapter because it has no attribution/tracking baked in).
- `_shared/scanner-brain/*` scoring, forensic, letter-grade — **the scoring math is intact and reusable even under a new extraction schema**, as long as the new schema either maps back to `ExtractionSignals` or the scoring engine is refactored to consume a superset.

### 08.2 Legacy Coupling to Avoid

`useGatedAIScanner.ts` and `useDeterministicScanner.ts` couple the scanner to:

- Lead-capture modals (`useLeadFormSubmit`, `explain_score_gate`, `quote_upload_gate`).
- `wmScannerUpload` GTM ScannerUpload firing (`src/lib/wmTracking.ts`).
- `awardScore({ eventType: 'QUOTE_UPLOADED' })` canonical score writes.
- `logScannerCompleted` high-value signal writes.
- Session storage keys (`wte_ai_scanner_state`, `wm_pending_analysis_id`) with 30-minute TTL semantics.
- Auto-bypass semantics driven by `isVerifiedLead` / `isAuthenticated`.
- `sessionData.windowCount` implicit dependency on `useSessionData`.
- `wm_events` attribution logging in `quote-scanner/index.ts`.

`useQuoteScanner.ts` couples the scanner to the same set plus `updateField('quoteAnalysisResult', ...)` session persistence.

`useQuoteUpload.ts` + `supabase/functions/upload-quote/index.ts` are `beat-your-quote`-shaped: they hard-code `source_page = 'beat-your-quote'` and route into `wm_event_log` as `source_tool: 'ai_scanner'`. Not currently used by `/scan`.

### 08.3 Recommended Adapter Boundary (conceptual only)

```text
QuoteFirstFlow (portable)
        │
        │  { file, sessionId?, leadId?, hints? }
        ▼
Canonical Scanner Adapter  ← new, lives under src/features/quote-first/adapter/
        │
        │  translates → invokes → normalizes
        ▼
Existing scanner infrastructure
  (quote-scanner OR wm-analyze-quote  +  _shared/scanner-brain)
```

The adapter should:

- Own compression (extracted from the three hooks).
- Own invocation and error normalization.
- Emit a normalized result the flow consumes, isolating the flow from `ExtractionSignals` / `AnalysisData` schema churn.
- **Not** invoke `wmScannerUpload`, `awardScore`, `logScannerCompleted`, or `logAttributionEvent` — those are acquisition-layer concerns the flow should decide about explicitly.

No adapter is implemented in this sprint.

---

## 09. REUSE / EXTEND / REFACTOR / REPLACE MATRIX

| Capability | Current File / Function | Current Behavior | Contract Requirement | Gap | Disposition |
|---|---|---|---|---|---|
| Image compression | `useQuoteScanner.ts` `compressImage`; duplicated in `useDeterministicScanner.ts`, `useGatedAIScanner.ts` | Canvas resize + JPEG q=0.8, PDF passthrough | Reusable primitive shared across all adapters | Duplicated in three hooks | REFACTOR (extract to `src/lib/`) |
| AI transport | `src/lib/aiRequest.ts` `heavyAIRequest` | 60s timeout override for scanner | Any adapter needs this | None substantive | REUSE |
| Edge guards / rate limit / body cap | `supabase/functions/quote-scanner/guards.ts` | 50/hr per IP, 7 MB cap, JSON check | Same | None | REUSE |
| Request validation | `supabase/functions/quote-scanner/validation.ts` `QuoteScannerRequestSchema` | Zod; multiple modes (`analyze` / `email` / `question` / `phoneScript`) | Analyze-mode only for canonical path | Auxiliary modes are legacy | EXTEND (add richer analyze fields) or REPLACE with new endpoint |
| Dedup cache | `quote-scanner/index.ts` `computeImageHash` + `quote_analyses.image_hash` | SHA-256 of raw base64 | Preserve for performance | Cached shape is the current AnalysisData; will need a version key when schema changes | EXTEND (add `brain_version` to cache key) |
| AI extraction prompt | `_shared/scanner-brain/rubric.ts` `EXTRACTION_RUBRIC` | Boolean-signal extractor with FL-specific keyword lists | Typed fact model with confidence + source | Presence-only; no fact envelope; no provenance | REPLACE |
| AI extraction schema | `_shared/scanner-brain/schema.ts` `ExtractionSignalsJsonSchema` | ~40 booleans + scalars, strict JSON schema | Layer 2 entity groups + Layer 3 typed facts with `value/confidence/source_page/source_text_or_reference` | Boolean conflation of absent vs false; no entities beyond contractor stub | REPLACE |
| Deterministic scoring | `_shared/scanner-brain/scoring.ts` `scoreFromSignals` | Five pillars, curve, letter grade | Deterministic-first Layer 4 | Consumes booleans that will be replaced; hard caps assert statutes on absence | REFACTOR (retain math, rewire inputs, remove absence→statute) |
| Forensic summary | `_shared/scanner-brain/forensic.ts` `generateForensicSummary` | Headline, citations, questions, positives | Layer 4 outputs, FOUND/NOT FOUND/INFERENCE | Legal citations rendered from absence | REFACTOR |
| Extracted identity envelope | `_shared/scanner-brain/forensic.ts` `extractIdentity` | Contractor name + license + NOA[] | Full Layer 2 with confidence + source | Missing homeowner/property/salesperson | EXTEND → effectively REPLACE with Layer 2 emitter |
| Persistence | `quote-scanner/index.ts` DB write to `quote_analyses` | Stores `analysis_json`, `overall_score`, `image_hash`, session/lead linkage | Must persist Layers 1–4 + provenance | JSON blob shape follows current schema | REFACTOR (schema evolution, out of scope this sprint) |
| Attribution event | `quote-scanner/index.ts` `logAttributionEvent('quote_scanned')` | Fires to `wm_events` | Acquisition-layer concern | Coupled inside scanner endpoint | REFACTOR (move to adapter or leave and skip in `wm-analyze-quote` variant) |
| Stateless variant | `supabase/functions/wm-analyze-quote/index.ts` | Bearer-secret; no DB; envelope with `meta/preview/full` | Better fit for canonical adapter | Same schema constraints as above | REUSE (as the substrate for the new endpoint) |
| Legacy upload path | `supabase/functions/upload-quote/index.ts` + `useQuoteUpload.ts` | Multipart → Storage → `quote_files` → ledger | Not used by `/scan` | Coupled to `beat-your-quote` semantics; frozen | REMOVE from Quote-First scope (leave for BeatYourQuote per Freeze Boundary) |
| Gated lead scanner | `src/hooks/useGatedAIScanner.ts` | idle → uploaded → locked → analyzing → revealed with lead-form gate + Vault bypass | Contract-neutral scanner has no lead gate | Coupled to acquisition; conflicts with Progressive Access Model on OTP | REMOVE from Quote-First scope (used by `/ai-scanner`, not `/scan`) |
| Deterministic audit scanner | `src/hooks/audit/useDeterministicScanner.ts` | idle → analyzing → partial → gated → unlocked | Overlaps with QuoteFirstFlow's target sequence | Different gate semantics; duplicated compression | REFACTOR (fold behaviors into QuoteFirstFlow adapter) |
| Client scanner hook | `src/hooks/useQuoteScanner.ts` | Full-featured hook: analyze + email + phone-script + Q&A | Only `analyze` is on the canonical V1 path | Auxiliary modes are legacy V2 territory | EXTEND (keep as legacy consumer) / REUSE analyze path only |

---

## 10. DATA CONTRACT GAPS

1. `ExtractionSignals` has no top-level entity groups (`homeowner`, `property`, `contractor`, `salesperson`).
2. `ExtractionSignals` has no typed `quote` object (`quote_number`, `quote_date`, `expiration_date`, `subtotal`, `discounts`, `taxes`, `financing`, `payment_schedule[]`).
3. `ExtractionSignals` has no `line_items[]`.
4. `ExtractionSignals` boolean fields have no tri-state and no `source` sibling.
5. `AnalysisData` warnings, missingItems, and forensic outputs are `string[]` — no structured `{ code, severity, evidence, epistemicClass: 'FOUND'|'NOT_FOUND'|'INFERENCE' }`.
6. `quote_analyses.analysis_json` currently persists the flat `AnalysisData + forensic + extractedIdentity` envelope; a schema-version field would be needed before layering a new shape alongside.
7. No `document_type` enum persisted.
8. No `brain_version` (or equivalent) currently written into `quote_analyses` rows despite `BRAIN_VERSION` existing in `_shared/scanner-brain/index.ts` — cached rows cannot be attributed to a prompt/rubric version.

---

## 11. AI PROMPT / RUBRIC GAPS

Against `EXTRACTION_RUBRIC`:

1. Prompt instructs "You do NOT score or judge" — good deterministic-first hygiene, keep.
2. Prompt asks the AI to emit ~40 booleans keyed to Florida-specific keywords, effectively coupling extraction to a FL keyword taxonomy rather than to document facts. **Rewrite** for a typed fact model.
3. Prompt has no instruction to preserve source text / page. **Add.**
4. Prompt has no instruction to distinguish "not stated" from "explicitly denied." **Add.**
5. Prompt has no instructions on entity separation (contractor phone vs homeowner phone, salesperson vs sales manager). **Add.**
6. `USER_PROMPT_TEMPLATE` passes `openingCount`, `areaName`, `notesFromCalculator` hints — this is useful context but risks anchoring the AI. Any Layer 3 rewrite should isolate hints as clearly labeled "user-supplied context, not document evidence."
7. `sanitizeForPrompt` in `_shared/scanner-brain/schema.ts` handles a small denylist. Adequate for now but should be re-audited when Layer 5 user text is injected.

---

## 12. RISK REGISTER

| # | Risk | Evidence | Severity |
|---|---|---|---|
| R1 | **Absence-as-failure** — hard caps and statute citations fire on `!signals.<something>` | `scoring.ts` `applyHardCaps`; `forensic.ts` citations | HIGH |
| R2 | **Legal assertion in user copy** — statutory language (F.S. 489.119, 489.103, 489.126, 501.137; FL Building Code §1626) is written into `warnings[]` and `statuteCitations[]` and rendered verbatim to homeowners | `scoring.ts` `applyHardCaps`; `forensic.ts` `generateForensicSummary` | HIGH |
| R3 | **Coarse price scoring** — `total / openings` becomes 20% of the overall score with no product context | `scoring.ts` price bands | MEDIUM |
| R4 | **Entity misclassification (latent)** — no separation model exists, so once homeowner extraction is added there is no scaffolding to prevent contractor/salesperson data collapsing into homeowner | schema absence | MEDIUM (latent) |
| R5 | **Data loss / provenance** — no page or snippet references anywhere; forensic findings cannot be traced back to the document | pipeline-wide | MEDIUM |
| R6 | **Hallucination pathway** — strict JSON schema constrains shape but does not constrain factuality; scalars like `licenseNumberValue`, `noaNumberValue`, `contractorNameExtracted` can be plausibly invented | `schema.ts` + `rubric.ts` | MEDIUM |
| R7 | **Legacy lead-gate coupling** — `useGatedAIScanner` treats Vault session as gate bypass, conflicting with the Progressive Access Model | `useGatedAIScanner.ts` lines 201–204 | MEDIUM (out of scope for this contract sprint but flagged) |
| R8 | **OTP coupling** — no OTP integration exists in the current `/scan` path; Manifest v1.1.0 §3 correctly states V1 does not require OTP | — | LOW (compliant with current lock) |
| R9 | **Duplicate session/lead creation** — dedup cache key is image-only; two different sessions uploading the same image share the same cached record; `lead_id` is patched via `.update()` post-cache-hit | `quote-scanner/index.ts` lines 158–173 | LOW |
| R10 | **Portability** — three near-identical `compressImage` implementations across hooks; `quote-scanner` endpoint mixes attribution writes with pure extraction | file evidence above | LOW (mechanical to fix) |
| R11 | **Boolean conflation of absent vs false** — AI cannot express "I couldn't tell" | `ExtractionSignalsJsonSchema` (most fields `required`) | HIGH |
| R12 | **Cache version blindness** — `quote_analyses.image_hash` cache does not encode `BRAIN_VERSION`; a rubric upgrade will silently serve stale analyses | `quote-scanner/index.ts` dedup block | LOW |

---

## 13. RECOMMENDED MIGRATION SEQUENCE

Ordered phases. No implementation is delivered in this sprint.

1. **Phase A — Schema versioning & cache safety.** Introduce a `brain_version` (or `analysis_schema_version`) column on `quote_analyses` and encode it into the dedup key. Prerequisite for any coexistence of old and new extraction shapes.
2. **Phase B — Canonical adapter skeleton.** Create `src/features/quote-first/adapter/` (name TBD). Move shared compression into `src/lib/`. Route `QuoteFirstFlow` through the adapter to today's `quote-scanner` (behavior unchanged).
3. **Phase C — Absence-as-failure remediation (surface).** Behind a feature flag, soften copy in `warnings[]` and `statuteCitations[]` so that NOT FOUND phrases as "not visible in the uploaded document" instead of "the contractor is unlicensed / non-compliant." Deterministic engine unchanged.
4. **Phase D — Layer 1 upgrade.** Replace binary `isValidQuote` with a `document_type` enum + `classification_confidence` + `readability` in the AI response, and surface an "uncertain" state to the reveal UI.
5. **Phase E — Layer 2/3 typed extractor.** Introduce a new extraction schema (`entities: { homeowner, property, contractor, salesperson }` + `facts: { commercial, openings, line_items[], products[], scope, warranty }`), each field carrying `{ value, confidence, source_page, source_text_or_reference }`. Author a new prompt against this schema. Run in shadow mode alongside the legacy schema, persisting both to `quote_analyses.analysis_json` under distinct keys.
6. **Phase F — Deterministic engine rewire.** Refactor `scoreFromSignals` to consume the new typed facts. Rewrite hard caps to require positive evidence for statutory framing (e.g. Owner-Builder language explicitly present, not license number absent).
7. **Phase G — Layer 5 canonical state.** Persist `already_signed | still_deciding | passed` and reason codes from §5.2 onto the lead/session and read them into report personalization.
8. **Phase H — Provenance in reveal UI.** Surface source-page snippets under each finding.
9. **Phase I — Deprecate legacy consumers.** Once `/scan` is the sole caller, retire `useGatedAIScanner`, the legacy `beat-your-quote` upload path from Quote-First scope, and the auxiliary `email` / `phoneScript` / `question` modes from the canonical endpoint (they MAY remain on a separate legacy endpoint).

---

## 14. OPEN DECISIONS (Product Owner)

Only decisions that cannot be resolved from code or from `MASTER_MANIFEST.MD` / `SCANNER_CONTRACT.md`:

1. **Statute-citation policy in V1 user copy.** The contract prohibits converting NOT FOUND into a contractor accusation. The Product Owner must decide whether the softened Phase C copy (e.g. "License number not visible on the uploaded document — please verify with the contractor") is the new V1 default, or whether all statutory phrasing must be pulled from user-facing surfaces entirely and reserved for internal risk flags.
2. **Layer 1 document-type taxonomy.** Contract §1.2 lists five minimum types. Product Owner should confirm whether `contract` and `proposal` are one code or two, and whether `unreadable` and `unsupported` are one code or two.
3. **Payment-schedule modeling depth for V1.** Contract §3.1 requires `payment_schedule`. Product Owner should confirm whether V1 needs full milestone-by-milestone array extraction or a summarized `{ deposit_pct, has_progress_payments, has_final_at_completion }` shape first.
4. **Line-item envelope granularity for V1.** Contract §3.2 requires per-item dimensions/quantity/product envelope. Product Owner should confirm whether V1 requires per-item extraction or a rolled-up "openings summary" is acceptable for the first release, with line items deferred.
5. **Cache versioning behavior.** When `brain_version` changes, should stale cache rows be invalidated (re-run AI on next hit), soft-invalidated (serve stale + queue background rerun), or preserved for audit only. This is an ops choice not derivable from the contract.

---

*End of SCANNER_IMPLEMENTATION_AUDIT.md.*
