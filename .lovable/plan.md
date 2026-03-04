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

## 2. Multiple Versions

**THREE distinct rubric families:**

### Family A: Consumer Scanner Rubric (EXTRACTION_RUBRIC)
- **Canonical source:** `quote-scanner/rubric.ts`
- **Inlined copy:** `wm-analyze-quote/index.ts` (compressed but semantically identical)
- **Output:** `ExtractionSignals` JSON (37 fields) → `scoreFromSignals()` → letter grade, pillar scores, warnings, missing items
- **Version:** `wm_rubric_v3.0`

### Family B: Sales Intelligence Rubric (analyze-consultation-quote)
- **Location:** `analyze-consultation-quote/index.ts` (self-contained)
- **Output:** Schema v2 JSON — `project_overview`, `itemized_openings[]`, `installation_scope`, `warranty`, `detected_markup_level`, `red_flags`, `sales_angle`
- **Model:** `google/gemini-2.5-flash` (hardcoded)

### Family C: Support Prompts (not extraction)
- `expert-chat`, `roleplay-chat`, `slide-over-chat`, `generate-quote`

---

## 3. Orchestration Flow

```
USER → upload-quote → quote-scanner (dedup → AI extraction → scoring → forensic → persist → return)
     → Frontend renders Results Dashboard
     → orchestrate-quote-analysis (after signup)
     → DB trigger → pending_calls → call-dispatcher → PhoneCall.bot
```

Key: No AI-based data cleaning. All transformation is deterministic via `scoring.ts` + `forensic.ts`.

---

## 4. Canonical Scanner Brain (Files to Decouple)

1. `quote-scanner/rubric.ts` — EXTRACTION_RUBRIC + USER_PROMPT_TEMPLATE
2. `quote-scanner/schema.ts` — ExtractionSignals interface + JSON schema + sanitizeForPrompt
3. `quote-scanner/scoring.ts` — scoreFromSignals + calculateLetterGrade + applyHardCaps + applyCurve
4. `quote-scanner/forensic.ts` — generateForensicSummary + extractIdentity

---

## 5. Drift Risk

`wm-analyze-quote/index.ts` inlines copies of all canonical logic. Any change to `quote-scanner/*.ts` must be manually mirrored.

---

## 6. Phone Agent Gap

PhoneCall.bot only receives `grade` + `overall_score` + basic lead info. It does NOT get warnings, forensic summary, or extraction signals.
