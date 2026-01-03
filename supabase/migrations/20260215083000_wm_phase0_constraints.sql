-- Ensure lead_id columns reference public.leads(id) with ON DELETE SET NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wm_sessions_lead_id_fkey'
  ) THEN
    ALTER TABLE public.wm_sessions
      ADD CONSTRAINT wm_sessions_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wm_events_lead_id_fkey'
  ) THEN
    ALTER TABLE public.wm_events
      ADD CONSTRAINT wm_events_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wm_quotes_lead_id_fkey'
  ) THEN
    ALTER TABLE public.wm_quotes
      ADD CONSTRAINT wm_quotes_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wm_files_lead_id_fkey'
  ) THEN
    ALTER TABLE public.wm_files
      ADD CONSTRAINT wm_files_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Add CHECK constraints for controlled enums
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wm_files_kind_check'
  ) THEN
    ALTER TABLE public.wm_files
      ADD CONSTRAINT wm_files_kind_check
      CHECK (kind IN ('quote_upload','ocr_text','analysis_json','quote_autopsy_pdf','other'));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wm_quotes_status_check'
  ) THEN
    ALTER TABLE public.wm_quotes
      ADD CONSTRAINT wm_quotes_status_check
      CHECK (status IN ('open','in_review','closed'));
  END IF;
END$$;
