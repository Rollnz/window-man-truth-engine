# Adapter Readiness Report — Sprint 07B

Sprint 07B verified benchmark adapters via static inspection and mock execution only. **Zero live provider calls were made.**

## Scanner vNext — `READY_FOR_CONTROLLED_EXECUTION`
- Adapter version: `vnext-adapter-v1.0.0`
- Pinned provider: `lovable-ai-gateway`
- Pinned model: `google/gemini-3-flash-preview`
- Wraps `runFourPassOrchestration` via dependency injection.
- Model is enforced at benchmark-context construction; `assertVNextModelPinned` throws `VNextModelDriftError` on drift.
- Captures raw pass outputs, canonical merge result, brain version, analysis schema version, and prompt versions on every run manifest.
- No production writes.

## Brain 3 — `SAFE_WRAPPER_REQUIRED`
- Adapter version: `brain3-adapter-v0.2.0-wrapper-required`
- Known side effects in current shipping code path:
  - `INSERT`/`UPSERT` into `public.quote_analyses` (versioned cache).
  - Updates `ai_pre_analysis` on `public.quote_files`.
  - Emits `wm_events` / GTM tracking calls.
  - Uses live Lovable AI Gateway credentials.
- Benchmark invocation MUST route through a benchmark-only wrapper that:
  1. Substitutes an in-memory Supabase client that no-ops writes.
  2. Disables tracking sinks at the boundary.
  3. Forces cache reads to MISS so extraction (not a cached row) is measured.
  4. Fails closed if any known side-effect path is reached without an approved wrapper token (`guardBrain3Invocation`).
- Fairness law: do NOT modify Brain 3 prompts, schema, or scoring to make it "benchmark-friendly." Any adjustment must be published as a distinct adapter version.

## WM MVP — `REFERENCE_RUNTIME_NOT_AVAILABLE`
- Adapter version: `wmmvp-adapter-v0.1.0-runtime-unavailable`
- Donor repo (`Mongoloyd/wm-mvp @ forensic_report_v2`) is NOT vendored in this project. No executable WM MVP runtime is present.
- Comparison mode: **`PROMPT_SCHEMA_REFERENCE_ONLY`** — architectural reference only.
- **Excluded from the runtime accuracy leaderboard.** `assertWmMvpRuntimeClaim` prevents static-only mode from masquerading as runtime-ready.

## Sprint 07C eligibility
| System   | Runtime leaderboard | Blocker                                                     |
|----------|---------------------|-------------------------------------------------------------|
| vNext    | ✅ eligible         | None                                                        |
| Brain 3  | ✅ eligible after wrapper implementation | Benchmark-only side-effect wrapper must be built |
| WM MVP   | ❌ not eligible     | Runtime not available; static reference only                |
