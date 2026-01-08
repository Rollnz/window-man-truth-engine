-- Reconcile wm_sessions schema conflicts between migrations
-- Purpose: Ensure all required columns exist regardless of which migration ran first
-- Context: Jan 2026 and Feb 2026 migrations created different schemas

-- Add anonymous_id if it doesn't exist (required by Jan 2026 schema, missing in Feb 2026)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_sessions'
      AND column_name = 'anonymous_id'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD COLUMN anonymous_id TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT;

    -- Add index for anonymous_id lookups
    CREATE INDEX IF NOT EXISTS idx_wm_sessions_anonymous_id
      ON public.wm_sessions(anonymous_id);
  END IF;
END$$;

-- Add last_seen_at if it doesn't exist (required by Feb 2026 schema, missing in Jan 2026)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_sessions'
      AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD COLUMN last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END$$;

-- Add landing_page if it doesn't exist (required by Jan 2026 schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_sessions'
      AND column_name = 'landing_page'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD COLUMN landing_page TEXT;
  END IF;
END$$;

-- Add entry_point if it doesn't exist (required by Feb 2026 schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_sessions'
      AND column_name = 'entry_point'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD COLUMN entry_point TEXT;
  END IF;
END$$;

-- Add device_type if it doesn't exist (required by Feb 2026 schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_sessions'
      AND column_name = 'device_type'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD COLUMN device_type TEXT;
  END IF;
END$$;

-- Add ip_hash if it doesn't exist (in both schemas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_sessions'
      AND column_name = 'ip_hash'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD COLUMN ip_hash TEXT;
  END IF;
END$$;

-- Add geo_zip if it doesn't exist (required by Feb 2026 schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_sessions'
      AND column_name = 'geo_zip'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD COLUMN geo_zip TEXT;
  END IF;
END$$;

-- Add gclid, fbclid, msclkid if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_sessions'
      AND column_name = 'gclid'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD COLUMN gclid TEXT;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_sessions'
      AND column_name = 'fbclid'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD COLUMN fbclid TEXT;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_sessions'
      AND column_name = 'msclkid'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD COLUMN msclkid TEXT;
  END IF;
END$$;

-- Comment on critical columns
COMMENT ON COLUMN public.wm_sessions.anonymous_id IS
  'Client-generated or server-generated UUID for tracking anonymous users before lead conversion';

COMMENT ON COLUMN public.wm_sessions.landing_page IS
  'First page visited in this session, typically matches entry_point';

COMMENT ON COLUMN public.wm_sessions.last_seen_at IS
  'Last activity timestamp for this session, updated on each request';
