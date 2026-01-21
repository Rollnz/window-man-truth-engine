-- =============================================================
-- Leads RLS Hardening + Admin Read Policy
-- =============================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop old policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own leads by user_id" ON public.leads;
DROP POLICY IF EXISTS "Users can select own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can select leads" ON public.leads;
DROP POLICY IF EXISTS "Allow anonymous insert on leads" ON public.leads;

-- 1) User self-read (Vault / claimed leads only)
CREATE POLICY "Users can select own leads"
ON public.leads
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- 2) Admin read (direct querying without service role)
CREATE POLICY "Admins can select leads"
ON public.leads
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'admin')
);

-- 3) Preserve anonymous lead capture
CREATE POLICY "Allow anonymous insert on leads"
ON public.leads
FOR INSERT
WITH CHECK (true);