-- Add has_password column to track if user has set a password
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_password boolean NOT NULL DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_has_password ON public.profiles(has_password) WHERE has_password = false;