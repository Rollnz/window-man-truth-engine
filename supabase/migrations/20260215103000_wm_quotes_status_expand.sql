-- Broaden wm_quotes.status allowed values for Phase 1 pipeline states
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find existing check constraint on wm_quotes.status if it exists
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.wm_quotes'::regclass
    AND contype = 'c'
    AND conname LIKE 'wm_quotes_status_check%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.wm_quotes DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE public.wm_quotes
    ADD CONSTRAINT wm_quotes_status_check
    CHECK (status IN ('open','analyzing','complete','archived','error','in_review','closed'));
END$$;
