-- Fix: Deny direct anonymous inserts to consultations table
-- The save-lead edge function uses service_role_key which bypasses RLS,
-- so legitimate submissions still work while blocking direct database abuse

-- Drop the permissive anonymous insert policy
DROP POLICY IF EXISTS "Allow anonymous insert on consultations" ON public.consultations;

-- Create a restrictive policy that denies all public inserts
CREATE POLICY "Deny public insert on consultations" 
ON public.consultations 
FOR INSERT 
WITH CHECK (false);