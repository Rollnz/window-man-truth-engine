# Port the Master Control Room (`/debug/scoring`) to another project

## What powers this route today

The route is intentionally thin: one page file plus the shared scanner-brain engine. Verified in this codebase:

- `src/App.tsx` line 69 lazy-imports `./pages/debug/ScoringPlayground`, line 199 registers `/debug/scoring`.
- `src/pages/debug/ScoringPlayground.tsx` (667 lines) — the whole UI: presets, levers/toggles column, Math X-Ray visualizer, pillar-weight sliders, JSON import/export. Subcomponents, `DEFAULT_SIGNALS`, the 5 presets, and the local curve mirror all live inside this single file.
- Engine (pure, no network, no DB): `supabase/functions/_shared/scanner-brain/` — `index.ts` (barrel + version constants), `scoring.ts` (421 lines: `scoreFromSignals`, `calculateLetterGrade`, `generateSafePreview`, hard caps, `PillarWeights`, `DEFAULT_WEIGHTS`), `schema.ts` (182 lines: `ExtractionSignals`, `AnalysisData`, JSON schema, sanitizer), `forensic.ts` (187 lines: `generateForensicSummary`, `extractIdentity`), `rubric.ts` (prompt text, imported only via the barrel).
- Local helper: `src/utils/clipboard.ts`.
- UI deps: shadcn `card, label, switch, slider, input, badge, separator, button, scroll-area, textarea, accordion` (Radix: `dialog`-free — `switch`, `slider`, `separator`, `scroll-area`, `accordion`, `label`), `lucide-react` icons (Shield, FileText, DollarSign, AlertTriangle, Award, RotateCcw, Copy, Upload, Code, Beaker, Eye), `sonner` for toasts, `tailwindcss-animate` for the accordion keyframes.

The only thing that makes it non-portable is the deep relative import `../../../supabase/functions/_shared/scanner-brain/*` and the `.ts` extension style used for Deno.

## Deliverable

A self-contained port bundle written to `/mnt/documents/master-control-room-port/`, plus the code inlined in chat file-by-file with target paths, structured for a plain Vite + React + Tailwind + shadcn project (no Supabase, no edge functions):

```text
src/lib/scoring/types.ts        <- ExtractionSignals, AnalysisData, PillarWeights,
                                   ScoredResult, HardCapResult, SafePreview
src/lib/scoring/engine.ts       <- scoreFromSignals, calculateLetterGrade,
                                   generateSafePreview, hard caps, curve, warnings,
                                   unit economics, DEFAULT_WEIGHTS
src/lib/scoring/forensic.ts     <- generateForensicSummary, extractIdentity
src/lib/scoring/presets.ts      <- DEFAULT_SIGNALS + Perfect / Average /
                                   No License / Scam / Not a Quote
src/lib/scoring/index.ts        <- barrel + BRAIN_VERSION, ANALYSIS_SCHEMA_VERSION
src/utils/clipboard.ts          <- copied as-is
src/pages/debug/ScoringPlayground.tsx  <- page, imports only from @/lib/scoring
README.md                       <- deps to install, shadcn components to add,
                                   route snippet, Tailwind/token notes
```

Transformations applied: strip Deno `.ts` import extensions, drop the AI-prompt `rubric.ts` and JSON-schema export (unused by the UI, avoids dead weight), split the presets and `DEFAULT_SIGNALS` out of the page into `presets.ts`, and rewrite all imports to `@/lib/scoring`.

## Notes

- Nothing in this route calls an edge function, Supabase, or `fetch` — the engine is already deterministic and pure, so the port stays behaviourally identical.
- This project keeps its current files untouched; the port is emitted as a separate bundle for copying into the target project.
- The page uses semantic Tailwind tokens from this project's Command Center Noir theme; the README will list the tokens the target project needs (or the hex fallbacks) so it renders identically.
