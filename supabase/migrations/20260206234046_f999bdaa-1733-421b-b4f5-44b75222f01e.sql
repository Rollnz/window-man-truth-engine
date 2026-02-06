-- Add session_data column to profiles table for cross-device session sync
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}';

-- Add timestamp for tracking when session was last synced
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS session_sync_at TIMESTAMPTZ;

-- Index for efficient sync checks
CREATE INDEX IF NOT EXISTS idx_profiles_session_sync 
ON public.profiles(user_id, session_sync_at);

COMMENT ON COLUMN public.profiles.session_data IS 
'Synced localStorage session data for cross-device continuity. Uses "existing wins" merge strategy to prevent data loss.';

COMMENT ON COLUMN public.profiles.session_sync_at IS 
'Timestamp of last successful session data sync from client.';