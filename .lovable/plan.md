

# Full Audit: Extraction Logic, Rubrics & Orchestration Flow

---

## 1. Every File Containing an AI Prompt for Quote Analysis

| # | File | Prompt/Rubric | Purpose |
|---|------|---------------|---------|
| 1 | `supabase/functions/quote-scanner/rubric.ts` | `EXTRACTION_RUBRIC` | **Canonical source.** Signal extraction for consumer-facing scanner. ~180 lines, 6 phases. |
| 2 | `supabase/functions/quote-scanner/rubric.ts` | `GRADING_RUBRIC` | Short 3-line system prompt for "question" mode (follow-up Q&A about a quote). |
| 3 | `supabase/functions/quote-scanner/rubric.ts` | `USER_PROMPT_TEMPLATE()` | Builds the user-role message with optional hints (opening count, area, notes). |
| 4 | `supabase/functions/wm-analyze-quote/index.ts` (line 164) | `EXTRACTION_RUBRIC` (inlined copy) | **Duplicate.** Compressed version of #1 for Manus API. Same signals, shorter prose. |
| 5 | `supabase/functions/wm-analyze-quote/index.ts` (line 241) | `buildUserPrompt()` (inlined copy) | Duplicate of #3. |
| 6 | `supabase/functions/quote-scanner/index.ts` (line 215) | Inline email prompt | "You are a professional negotiation assistant. Draft a polite but firm email..." |
| 7 | `supabase/functions/quote-scanner/index.ts` (line 227) | Inline phoneScript prompt | Negotiation coach: Opening, The Ask, Objection Handling. |
| 8 | `supabase/functions/analyze-consultation-quote/index.ts` (line 143) | **Completely different rubric** | "Forensic Sales Intelligence Analyst" — extracts itemized openings, competitor name, measurements, colors, installation type, warranty, red flags, sales angle. Schema v2 via tool calling. |
| 9 | `supabase/functions/expert-chat/index.ts` (line 151) | Expert chat system prompt | Window consultant persona with dynamic context injection (cost of inaction, reality check score, etc.). |
| 10 | `supabase/functions/roleplay-chat/index.ts` (line 9) | `SYSTEM_PROMPT` | "The Closer" — high-pressure salesman roleplay training. Not extraction. |
| 11 | `supabase/functions/slide-over-chat/index.ts` (line 116) | `buildSystemPrompt()` | "Hurricane Hero" persona — site-wide Q&A chat. Not extraction. |
| 12 | `supabase/functions/generate-quote/index.ts` (line 117) | Inline estimator prompt | Cost estimate generator for the Quote Builder tool. Not extraction. |

---

## 2. Are There Multiple Versions?

**Yes. There are THREE distinct rubric families:**

### Family A: Consumer Scanner Rubric (EXTRACTION_RUBRIC)
- **Canonical source:** `quote-scanner/rubric.ts`
- **Inlined copy:** `wm-analyze-quote/index.ts` (compressed but semantically identical)
- **Purpose:** Extract 37 boolean/value signals → deterministic scoring → forensic summary
- **Output:** `ExtractionSignals` JSON (37 fields) → fed into `scoreFromSignals()` → letter grade, pillar scores, warnings, missing items
- **Version identifier:** `wm_rubric_v3.0` (in wm-analyze-quote), `"2.2"` was the old version

### Family B: Sales Intelligence Rubric (analyze-consultation-quote)
- **Location:** `analyze-consultation-quote/index.ts` (self-contained, ~200 lines of prompt)
- **Purpose:** CRM-internal. Extracts competitor name, itemized openings with measurements/colors/glass, installation type, warranty, red flags, and a `sales_angle` for the sales rep.
- **Output:** Schema v2 JSON via tool calling — `project_overview`, `itemized_openings[]`, `installation_scope`, `warranty`, `detected_markup_level`, `red_flags`, `sales_angle`
- **Model:** `google/gemini-2.5-flash` (hardcoded, not using `AI_MODEL_VERSION` secret)
- **Triggered by:** CRM admin flow when a consultation has a quote file attached

### Family C: Support Prompts (not extraction)
- `expert-chat`, `roleplay-chat`, `slide-over-chat`, `generate-quote` — these are conversational/generative, not quote extraction. No overlap with your scanner brain.

### PhoneCall.bot Webhook
The `call-dispatcher` does **NOT** contain any AI prompt. It simply forwards `first_message` (a pre-interpolated string from `call_agents.first_message_template` in the DB) plus flat metadata to PhoneCall.bot's webhook. The phone agent's personality/script lives **inside PhoneCall.bot's dashboard**, not in your codebase.

---

## 3. Orchestration Flow: What Happens When a User Uploads a Quote

```text
USER BROWSER
    │
    ▼
[upload-quote]  ─── Validates file (magic bytes, MIME, size)
    │                 Uploads to Storage bucket "quotes"
    │                 Inserts row into quote_files table
    │                 Logs scanner_upload_completed to wm_event_log
    │                 Returns { file_id, pending_scan_uuid, quote_analysis_id }
    │
    ▼
[Frontend polls / calls quote-scanner with mode="analyze"]
    │
    ▼
[quote-scanner/index.ts]
    │
    ├─ 1. DEDUP CHECK: Compute SHA-256 of imageBase64
    │     Query quote_analyses by image_hash → if HIT, return cached
    │
    ├─ 2. AI EXTRACTION: Send image + EXTRACTION_RUBRIC to Gemini
    │     Uses ExtractionSignalsJsonSchema for structured output
    │     Returns ExtractionSignals (37 boolean/value fields)
    │
    ├─ 3. DETERMINISTIC SCORING: scoreFromSignals(signals, openingCount)
    │     ├─ Price per opening calculation
    │     ├─ 5 pillar scores (safety, scope, price, fine_print, warranty)
    │     ├─ Hard caps (F.S. 489.119, 489.103, 501.137, 489.126)
    │     ├─ Exponential curve (makes 90+ rare)
    │     ├─ Letter grade via calculateLetterGrade()
    │     └─ Warnings[] + MissingItems[] + Summary
    │
    ├─ 4. FORENSIC SUMMARY: generateForensicSummary(signals, scored)
    │     ├─ Statute citations
    │     ├─ Questions to ask contractor
    │     ├─ Positive findings (for good quotes)
    │     └─ Risk level + headline
    │
    ├─ 5. IDENTITY EXTRACTION: extractIdentity(signals)
    │     ├─ contractorName
    │     ├─ licenseNumber
    │     └─ noaNumbers[]
    │
    ├─ 6. PERSIST: Insert into quote_analyses table
    │     (analysis_json, image_hash, pillar scores, warnings_count, etc.)
    │
    └─ 7. Return full responsePayload to frontend
         (overallScore, finalGrade, pillar scores, warnings,
          missingItems, summary, forensic, extractedIdentity)

    ▼
[Frontend renders Results Dashboard]
    │
    ▼
[orchestrate-quote-analysis]  ─── Called after signup flow completes
    │  Validates JWT, derives account_id
    │  Reads analysis_json from quote_analyses
    │  Sets analyzed_at (atomic, idempotent)
    │  Fires application_submitted event to wm_event_log
    │  Logs to wm_events for lead scoring
    │  Returns grade + pillar_scores + pixel_value
    │
    ▼
[DB trigger: fn_auto_dispatch_call_on_quote_analyzed]
    │  If phone verified → inserts into pending_calls
    │
    ▼
[call-dispatcher (cron)]
    │  Claims pending_calls → POSTs to PhoneCall.bot webhook
    │  PhoneCall.bot agent makes the call using its own prompt
```

### Key Insight: No Data Transformation Between Steps
The AI returns raw `ExtractionSignals`. These are **never sent back to AI for cleaning**. The transformation is entirely deterministic:
- `scoring.ts` → pillar scores, hard caps, curve, grade
- `forensic.ts` → statute citations, questions, positives
- Both consume the same `ExtractionSignals` interface

---

## 4. The Complete Canonical Rubric (All Fields)

This is the union of every field needed by both the UI dashboard AND the phone agent (via `pending_calls.payload`).

### Layer 1: AI Extraction Output (ExtractionSignals — 37 fields)

**Document Validity:**
- `isValidQuote: boolean`
- `validityReason: string`

**Price & Openings:**
- `totalPriceFound: boolean`
- `totalPriceValue: number | null`
- `openingCountEstimate: number | null`

**Safety Signals:**
- `hasComplianceKeyword: boolean`
- `hasComplianceIdentifier: boolean`
- `hasNOANumber: boolean`
- `noaNumberValue: string | null`
- `hasLaminatedMention: boolean`
- `hasGlassBuildDetail: boolean`
- `hasTemperedOnlyRisk: boolean`
- `hasNonImpactLanguage: boolean`

**Contractor Identity:**
- `licenseNumberPresent: boolean`
- `licenseNumberValue: string | null`
- `hasOwnerBuilderLanguage: boolean`
- `contractorNameExtracted: string | null`

**Scope:**
- `hasPermitMention: boolean`
- `hasDemoInstallDetail: boolean`
- `hasSpecificMaterials: boolean`
- `hasWallRepairMention: boolean`
- `hasFinishDetail: boolean`
- `hasCleanupMention: boolean`
- `hasBrandClarity: boolean`
- `hasDetailedScope: boolean`
- `hasSubjectToChange: boolean`
- `hasRepairsExcluded: boolean`
- `hasStandardInstallation: boolean`

**Fine Print:**
- `depositPercentage: number | null`
- `hasFinalPaymentTrap: boolean`
- `hasSafePaymentTerms: boolean`
- `hasPaymentBeforeCompletion: boolean`
- `hasContractTraps: boolean`
- `contractTrapsList: string[]`
- `hasManagerDiscount: boolean`

**Warranty:**
- `hasWarrantyMention: boolean`
- `hasLaborWarranty: boolean`
- `warrantyDurationYears: number | null`
- `hasLifetimeWarranty: boolean`
- `hasTransferableWarranty: boolean`

**Premium:**
- `hasPremiumIndicators: boolean`

### Layer 2: Deterministic Scoring Output (ScoredResult)

- `overallScore: number` (0-100, curved)
- `finalGrade: string` (A+ through F, 13 brackets)
- `safetyScore: number` (weight 30%)
- `scopeScore: number` (weight 25%)
- `priceScore: number` (weight 20%)
- `finePrintScore: number` (weight 15%)
- `warrantyScore: number` (weight 10%)
- `pricePerOpening: string`
- `warnings: string[]` (max 6)
- `missingItems: string[]` (max 6)
- `summary: string`
- `hardCap: { applied, ceiling, reason, statute }`

### Layer 3: Forensic Summary Output

- `headline: string`
- `riskLevel: 'critical' | 'high' | 'moderate' | 'acceptable'`
- `statuteCitations: string[]` (max 4)
- `questionsToAsk: string[]` (max 5)
- `positiveFindings: string[]` (max 5)
- `hardCapApplied: boolean`
- `hardCapReason: string | null`
- `hardCapStatute: string | null`

### Layer 4: Extracted Identity

- `contractorName: string | null`
- `licenseNumber: string | null`
- `noaNumbers: string[]`

### Layer 5: Phone Agent Context (what reaches PhoneCall.bot via pending_calls)

The DB trigger `fn_auto_dispatch_call_on_quote_analyzed` injects into `pending_calls.payload`:
- `quote_analysis_id`
- `overall_score` (integer)
- `grade` (string from analysis_json.finalGrade)
- `phone` (from accounts table)
- `is_vault_account: true`
- `source: 'signup'`

The `call-dispatcher` then forwards to PhoneCall.bot:
- `agent_id` (from call_agents table)
- `to` (phone_e164)
- `first_message` (interpolated from call_agents.first_message_template)
- `metadata`: `{ call_request_id, source_tool, lead_id, email, first_name, grade }`

**The phone agent does NOT receive the full extraction signals, warnings, or forensic summary.** It only gets grade + overall_score + basic lead info.

---

## 5. Drift Risk: wm-analyze-quote vs quote-scanner

The `wm-analyze-quote` function inlines copies of:
- `ExtractionSignalsJsonSchema` (37 fields)
- `EXTRACTION_RUBRIC` (compressed version)
- `scoreFromSignals()` (full scoring engine)
- `generateForensicSummary()` (forensic logic)
- `extractIdentity()`
- `calculateLetterGrade()`
- `applyHardCaps()`
- `applyCurve()`

These are **copy-pasted** from `quote-scanner/*.ts` with a comment "keep in sync." This is a drift risk. Any change to the canonical files must be manually mirrored.

---

## Summary for Decoupling

If you're extracting the "scanner brain" into a standalone app, the complete package is:

1. **EXTRACTION_RUBRIC** — the AI system prompt (canonical in `quote-scanner/rubric.ts`)
2. **ExtractionSignalsJsonSchema** — the JSON schema forcing structured output (canonical in `quote-scanner/schema.ts`)
3. **ExtractionSignals** TypeScript interface — 37 fields (canonical in `quote-scanner/schema.ts`)
4. **scoreFromSignals()** — deterministic scoring with hard caps + curve (canonical in `quote-scanner/scoring.ts`)
5. **generateForensicSummary()** + **extractIdentity()** — post-scoring enrichment (canonical in `quote-scanner/forensic.ts`)
6. **calculateLetterGrade()** — grade brackets (canonical in `quote-scanner/scoring.ts`)
7. **sanitizeForPrompt()** — injection prevention (canonical in `quote-scanner/schema.ts`)
8. **USER_PROMPT_TEMPLATE()** — user message builder (canonical in `quote-scanner/rubric.ts`)

The `analyze-consultation-quote` rubric is a **completely separate system** (Sales Intelligence, schema v2, tool calling) and should NOT be merged into the scanner brain.

