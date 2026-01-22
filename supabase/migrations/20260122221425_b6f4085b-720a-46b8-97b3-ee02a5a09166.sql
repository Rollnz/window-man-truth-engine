-- Phase 3: Add dedicated hash columns for identity matching
-- ═══════════════════════════════════════════════════════════════════════════
-- Step 1: Add columns (instant operation)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE wm_event_log 
ADD COLUMN IF NOT EXISTS email_sha256 TEXT,
ADD COLUMN IF NOT EXISTS phone_sha256 TEXT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 2: Temporarily disable immutability trigger for backfill
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE wm_event_log DISABLE TRIGGER trg_reject_update_delete;

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 3: Backfill from existing JSONB data
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE wm_event_log
SET 
  email_sha256 = COALESCE(
    user_data->>'email_sha256',
    user_data->>'sha256_email_address',
    user_data->>'em'
  ),
  phone_sha256 = COALESCE(
    user_data->>'phone_sha256',
    user_data->>'sha256_phone_number',
    user_data->>'ph'
  )
WHERE user_data IS NOT NULL
  AND (email_sha256 IS NULL OR phone_sha256 IS NULL);

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 4: Re-enable immutability trigger
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE wm_event_log ENABLE TRIGGER trg_reject_update_delete;

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 5: Create partial indexes for fast identity lookups
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_wm_event_log_email_sha256 
  ON wm_event_log (email_sha256) WHERE email_sha256 IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wm_event_log_phone_sha256 
  ON wm_event_log (phone_sha256) WHERE phone_sha256 IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 6: Create composite funnel indexes for event timeline queries
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_wm_event_log_email_identity_funnel
  ON wm_event_log (email_sha256, event_time DESC, event_name)
  WHERE email_sha256 IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wm_event_log_phone_identity_funnel
  ON wm_event_log (phone_sha256, event_time DESC, event_name)
  WHERE phone_sha256 IS NOT NULL;