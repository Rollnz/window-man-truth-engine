-- Sprint 03 — Versioned Scanner Persistence & Cache Safety (Phase A)
-- Forward-only, idempotent, non-destructive. Preserves historical rows,
-- RLS, policies, grants, triggers, and the pending-call auto-dispatch
-- trigger. Does NOT touch analyzed_at.

BEGIN;

-- 1. Add version columns (idempotent). Historical rows backfilled via
--    DEFAULT as 'legacy-unversioned' to preserve epistemic honesty.
ALTER TABLE public.quote_analyses
  ADD COLUMN IF NOT EXISTS brain_version TEXT NOT NULL DEFAULT 'legacy-unversioned';

ALTER TABLE public.quote_analyses
  ADD COLUMN IF NOT EXISTS analysis_schema_version TEXT NOT NULL DEFAULT 'legacy-unversioned';

COMMENT ON COLUMN public.quote_analyses.brain_version IS
  'Value of scanner-brain BRAIN_VERSION at persistence time. Rows created before Sprint 03 are backfilled as ''legacy-unversioned''.';

COMMENT ON COLUMN public.quote_analyses.analysis_schema_version IS
  'Value of scanner-brain ANALYSIS_SCHEMA_VERSION at persistence time (identifies extraction/response shape). Rows created before Sprint 03 are backfilled as ''legacy-unversioned''.';

-- 2. Replace image-only uniqueness with version-aware uniqueness so the
--    same file can coexist across scanner generations.
--    Old: UNIQUE (image_hash)
--    New: UNIQUE (image_hash, brain_version, analysis_schema_version)
ALTER TABLE public.quote_analyses
  DROP CONSTRAINT IF EXISTS uq_quote_analyses_hash;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_quote_analyses_hash_brain_schema'
      AND conrelid = 'public.quote_analyses'::regclass
  ) THEN
    ALTER TABLE public.quote_analyses
      ADD CONSTRAINT uq_quote_analyses_hash_brain_schema
      UNIQUE (image_hash, brain_version, analysis_schema_version);
  END IF;
END $$;

-- 3. Lookup index: the composite UNIQUE constraint above already backs a
--    matching index. No additional index created to avoid redundancy.

-- 4. Historical rows preserved untouched (no UPDATE issued). analyzed_at,
--    scores, and analysis_json remain byte-identical; the legacy
--    auto-dispatch trigger on quote_analyses is NOT fired by this migration.

COMMIT;